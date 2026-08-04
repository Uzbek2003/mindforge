import { useState } from 'react'
import type { Category, Difficulty, LastSession, SessionMode } from '../types'
import { ALL_PUZZLES, getPuzzles } from '../data'
import { SESSION_MODE_CONFIG, UNLOCK_THRESHOLDS } from '../types'
import { CategoryCard, DifficultyCard, Header, ProgressRing } from './UI'

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

const CATEGORIES: (Category | 'all')[] = ['all', 'math', 'science', 'history', 'computer-science']
const CATEGORY_DISPLAY: Record<Category | 'all', { icon: string; label: string }> = {
  all: { icon: '✦', label: 'All Topics' },
  math: { icon: '∑', label: 'Math' },
  science: { icon: '⚗', label: 'Science' },
  history: { icon: '🏛', label: 'History' },
  'computer-science': { icon: '💻', label: 'Computer Science' },
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
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [mode, setMode] = useState<SessionMode>('standard')

  const countCompleted = (cat: Category | 'all', diff?: Difficulty) => {
    const puzzles =
      cat === 'all'
        ? diff
          ? getPuzzles({ difficulty: diff })
          : ALL_PUZZLES
        : diff
          ? getPuzzles({ category: cat, difficulty: diff })
          : getPuzzles({ category: cat })
    return puzzles.filter((p) => completedIds.includes(p.id)).length
  }

  const availableCount =
    category === 'all'
      ? getPuzzles({ difficulty }).length
      : getPuzzles({ category, difficulty }).length

  const canStart =
    (mode === 'daily' || isDifficultyUnlocked(difficulty)) && availableCount > 0

  const startRegular = () => {
    onStart({ category, difficulty, mode })
  }

  const startDaily = () => {
    onStart({ category: 'all', difficulty: 'easy', mode: 'daily' })
  }

  return (
    <div className="screen home-screen">
      <Header onSettings={onOpenSettings} />

      <section className="hero-panel">
        <div className="hero-text">
          <h2>Sharpen your mind</h2>
          <p>
            Educational puzzle and trivia across math, science, history, and computer science.
            Free, ad-free, and works offline on mobile.
          </p>
        </div>
        <div className="stats-row">
          <ProgressRing value={totalCompleted} max={totalPuzzles} label="completed" />
          <div className="stat-cards">
            <div className="stat-card">
              <span className="stat-value">{correctCount}</span>
              <span className="stat-label">Correct answers</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{bestStreak}</span>
              <span className="stat-label">Best streak</span>
            </div>
          </div>
        </div>
      </section>

      {lastSession && (
        <section className="panel continue-panel">
          <h3>Continue last session</h3>
          <p className="panel-hint">
            Resume where you left off — question {lastSession.index + 1} of{' '}
            {lastSession.puzzleIds.length}.
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

      <section className="panel">
        <h3>Daily challenge</h3>
        <p className="panel-hint">Five mixed puzzles that change every day.</p>
        <button type="button" className="btn btn-ghost" onClick={startDaily}>
          Play daily challenge
        </button>
      </section>

      <section className="panel">
        <h3>Session length</h3>
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

      <section className="panel">
        <h3>Choose a topic</h3>
        <div className="category-grid">
          {CATEGORIES.map((cat) => {
            const total =
              cat === 'all' ? ALL_PUZZLES.length : getPuzzles({ category: cat }).length
            const completed = countCompleted(cat)
            if (cat === 'all') {
              return (
                <button
                  key={cat}
                  type="button"
                  className={`category-card ${category === cat ? 'selected' : ''}`}
                  onClick={() => setCategory(cat)}
                  aria-pressed={category === cat}
                >
                  <span className="category-icon">{CATEGORY_DISPLAY.all.icon}</span>
                  <span className="category-name">{CATEGORY_DISPLAY.all.label}</span>
                  <span className="category-progress">
                    {completed}/{total}
                  </span>
                </button>
              )
            }
            return (
              <CategoryCard
                key={cat}
                category={cat}
                count={total}
                completed={completed}
                selected={category === cat}
                onSelect={() => setCategory(cat)}
              />
            )
          })}
        </div>
      </section>

      {mode !== 'daily' && (
        <section className="panel">
          <h3>Choose difficulty</h3>
          <p className="panel-hint">
            Easy is available from the start. Complete {UNLOCK_THRESHOLDS.medium} easy puzzles to
            unlock Medium, then {UNLOCK_THRESHOLDS.hard} medium puzzles for Hard.
          </p>
          <div className="difficulty-grid">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
              const total =
                category === 'all'
                  ? getPuzzles({ difficulty: d }).length
                  : getPuzzles({ category, difficulty: d }).length
              const completed = countCompleted(category, d)
              const unlocked = isDifficultyUnlocked(d)
              let unlockHint = 'Locked'
              if (d === 'medium' && !unlocked) {
                unlockHint = `Complete ${Math.max(0, UNLOCK_THRESHOLDS.medium - easyCompleted)} more easy`
              }
              if (d === 'hard' && !unlocked) {
                unlockHint = `Complete ${Math.max(0, UNLOCK_THRESHOLDS.hard - mediumCompleted)} more medium`
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
        </section>
      )}

      <div className="action-row">
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={!canStart}
          onClick={startRegular}
        >
          {canStart ? 'Start Playing' : 'Select an unlocked difficulty'}
        </button>
      </div>

      <footer className="footer">
        <p>100% free · No ads · Educational trivia for general audiences</p>
      </footer>
    </div>
  )
}
