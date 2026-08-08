import { useState } from 'react'
import type { Category, Difficulty, LastSession, SessionMode } from '../types'
import { ALL_PUZZLES, getPuzzles } from '../data'
import { SESSION_MODE_CONFIG, UNLOCK_THRESHOLDS, DIFFICULTY_LABELS } from '../types'
import { MIXED_ADVENTURE, WORLDS, getWorldByCategory } from '../config/worlds'
import { getUnsolvedPuzzles } from '../utils/session'
import { countCompleted } from '../utils/progress'
import { DifficultyCard, Header, ProgressRing } from './UI'
import { WorldCard } from './WorldCard'

interface HomeScreenProps {
  completedIds: number[]
  totalCompleted: number
  totalPuzzles: number
  correctCount: number
  bestStreak: number
  easyCompleted: number
  mediumCompleted: number
  lastSession: LastSession | null
  isDifficultyUnlocked: (d: Difficulty) => boolean
  onStart: (config: {
    category: Category | 'all'
    difficulty: Difficulty
    mode: SessionMode
    resume?: boolean
    retryIds?: number[]
  }) => void
  onOpenSettings: () => void
}

const PLAY_MODES: SessionMode[] = ['quick', 'standard', 'challenge', 'full', 'endless']

export function HomeScreen({
  completedIds,
  totalCompleted,
  totalPuzzles,
  correctCount,
  bestStreak,
  easyCompleted,
  mediumCompleted,
  lastSession,
  isDifficultyUnlocked,
  onStart,
  onOpenSettings,
}: HomeScreenProps) {
  const [category, setCategory] = useState<Category | 'all'>(WORLDS[0].category)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [mode, setMode] = useState<SessionMode>('standard')

  const selectedWorld =
    category === 'all' ? MIXED_ADVENTURE : getWorldByCategory(category)

  const unsolvedCount =
    mode === 'daily'
      ? 5
      : getUnsolvedPuzzles(category, difficulty, completedIds, mode).length

  const totalInSelection = getPuzzles({ category, difficulty }).length

  const canStart =
    (mode === 'daily' || isDifficultyUnlocked(difficulty)) &&
    (mode === 'daily' || unsolvedCount > 0)

  const startRegular = () => {
    onStart({ category, difficulty, mode })
  }

  const startDaily = () => {
    onStart({ category: 'all', difficulty: 'easy', mode: 'daily' })
  }

  return (
    <div className="screen home-screen">
      <Header onSettings={onOpenSettings} />

      <section className="home-hero">
        <p className="home-eyebrow">Your learning journey</p>
        <h2 className="home-title">Explore the worlds of QuizNova</h2>
        <p className="home-subtitle">
          Premium educational adventures across math, science, history, and coding — free, ad-free,
          and ready offline.
        </p>
        <div className="home-stats">
          <ProgressRing value={totalCompleted} max={totalPuzzles} label="completed" />
          <div className="home-stat-cards">
            <div className="home-stat-card">
              <span className="home-stat-value">{correctCount}</span>
              <span className="home-stat-label">Correct answers</span>
            </div>
            <div className="home-stat-card">
              <span className="home-stat-value">{bestStreak}</span>
              <span className="home-stat-label">Best streak</span>
            </div>
          </div>
        </div>
      </section>

      <button type="button" className="daily-banner" onClick={startDaily}>
        <span className="daily-banner-icon" aria-hidden="true">
          ☀
        </span>
        <span className="daily-banner-text">
          <strong>Daily Challenge</strong>
          <span>Five fresh puzzles across every world — resets each day</span>
        </span>
        <span className="daily-banner-cta">Play</span>
      </button>

      {lastSession && (
        <section className="panel continue-panel">
          <h3>Continue your quest</h3>
          <p className="panel-hint">
            Pick up at question {lastSession.index + 1} of {lastSession.puzzleIds.length}.
          </p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onStart({ ...lastSession, resume: true })}
          >
            Continue session
          </button>
        </section>
      )}

      <section className="world-map-section">
        <div className="section-heading">
          <h3>Choose a world</h3>
          <p className="section-subtitle">Each world has its own questions and difficulty paths.</p>
        </div>

        <div className="world-map-grid">
          <WorldCard
            world={MIXED_ADVENTURE}
            completed={countCompleted(completedIds)}
            total={ALL_PUZZLES.length}
            selected={category === 'all'}
            onSelect={() => setCategory('all')}
          />
          {WORLDS.map((world) => {
            const total = getPuzzles({ category: world.category }).length
            const completed = countCompleted(completedIds, { category: world.category })
            return (
              <WorldCard
                key={world.id}
                world={world}
                completed={completed}
                total={total}
                selected={category === world.category}
                onSelect={() => setCategory(world.category)}
              />
            )
          })}
        </div>
      </section>

      {mode !== 'daily' && (
        <section className="panel launch-panel">
          <div className="launch-panel-header">
            <span className="launch-world-icon" aria-hidden="true">
              {selectedWorld.icon}
            </span>
            <div>
              <h3>Enter {selectedWorld.shortName}</h3>
              <p className="panel-hint">Select difficulty and session length, then launch.</p>
            </div>
          </div>

          <h4 className="launch-subheading">Difficulty</h4>
          <p className="panel-hint launch-unlock-hint">
            Easy is open from the start. Complete {UNLOCK_THRESHOLDS.medium} easy puzzles to unlock
            Medium, then {UNLOCK_THRESHOLDS.hard} medium for Hard.
          </p>
          <div className="difficulty-grid">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const total = getPuzzles({ category, difficulty: d }).length
              const completed = countCompleted(completedIds, { category, difficulty: d })
              const unlocked = isDifficultyUnlocked(d)
              let unlockHint = 'Locked'
              if (d === 'medium' && !unlocked) {
                unlockHint = `${Math.max(0, UNLOCK_THRESHOLDS.medium - easyCompleted)} easy left`
              }
              if (d === 'hard' && !unlocked) {
                unlockHint = `${Math.max(0, UNLOCK_THRESHOLDS.hard - mediumCompleted)} medium left`
              }
              return (
                <DifficultyCard
                  key={d}
                  difficulty={d}
                  count={total}
                  completed={completed}
                  unlocked={unlocked}
                  selected={difficulty === d}
                  unlockHint={unlockHint}
                  onSelect={() => setDifficulty(d)}
                />
              )
            })}
          </div>

          <h4 className="launch-subheading">Session length</h4>
          <div className="mode-grid">
            {PLAY_MODES.map((m) => (
              <button
                key={m}
                type="button"
                className={`mode-card ${mode === m ? 'selected' : ''}`}
                onClick={() => setMode(m)}
                aria-pressed={mode === m}
              >
                <span className="mode-label">{SESSION_MODE_CONFIG[m].label}</span>
                <span className="mode-desc">{SESSION_MODE_CONFIG[m].description}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="action-row">
        <button
          type="button"
          className="btn btn-primary btn-large btn-launch"
          disabled={!canStart}
          onClick={startRegular}
        >
          {!canStart
            ? unsolvedCount === 0
              ? 'World complete for this difficulty'
              : 'Unlock a higher difficulty to continue'
            : `Launch ${selectedWorld.shortName}`}
        </button>
        {unsolvedCount > 0 && unsolvedCount < totalInSelection && (
          <p className="panel-hint start-hint">
            {unsolvedCount} new {DIFFICULTY_LABELS[difficulty].toLowerCase()} question
            {unsolvedCount === 1 ? '' : 's'} remaining — no repeats until the pool is cleared.
          </p>
        )}
      </div>

      <footer className="footer">
        <p>100% free · No ads · Built for curious learners everywhere</p>
      </footer>
    </div>
  )
}
