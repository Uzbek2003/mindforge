import { useState } from 'react'
import type { Category, Difficulty } from '../types'
import { ALL_PUZZLES, getPuzzles } from '../data'
import { UNLOCK_THRESHOLDS } from '../types'
import { CategoryCard, DifficultyCard, Header, ProgressRing } from './UI'

interface HomeScreenProps {
  completedIds: number[]
  totalCompleted: number
  totalPuzzles: number
  correctCount: number
  bestStreak: number
  easyCompleted: number
  mediumCompleted: number
  isDifficultyUnlocked: (d: Difficulty) => boolean
  onStart: (category: Category | 'all', difficulty: Difficulty) => void
  onReset: () => void
}

const CATEGORIES: (Category | 'all')[] = ['all', 'math', 'science', 'history', 'computer-science']
const CATEGORY_DISPLAY: Record<Category | 'all', { icon: string; label: string }> = {
  all: { icon: '✦', label: 'All Topics' },
  math: { icon: '∑', label: 'Math' },
  science: { icon: '⚗', label: 'Science' },
  history: { icon: '🏛', label: 'History' },
  'computer-science': { icon: '💻', label: 'Computer Science' },
}

export function HomeScreen({
  completedIds,
  totalCompleted,
  totalPuzzles,
  correctCount,
  bestStreak,
  easyCompleted,
  mediumCompleted,
  isDifficultyUnlocked,
  onStart,
  onReset,
}: HomeScreenProps) {
  const [category, setCategory] = useState<Category | 'all'>('all')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')

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

  const canStart = isDifficultyUnlocked(difficulty) && availableCount > 0

  return (
    <div className="screen home-screen">
      <Header />

      <section className="hero-panel">
        <div className="hero-text">
          <h2>Sharpen your mind</h2>
          <p>
            100 free puzzles across math, science, history, and computer science.
            Start easy, unlock harder modes — completely ad-free.
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

      <section className="panel">
        <h3>Choose difficulty</h3>
        <p className="panel-hint">
          Easy is free from the start. Complete {UNLOCK_THRESHOLDS.medium} easy puzzles to unlock
          Medium, then {UNLOCK_THRESHOLDS.hard} medium puzzles for Hard.
        </p>
        <div className="difficulty-grid">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => {
            const total =
              category === 'all'
                ? getPuzzles({ difficulty: d }).length
                : getPuzzles({ category, difficulty: d }).length
            const completed = countCompleted(category, d)
            const unlocked = isDifficultyUnlocked(d)
            let unlockHint = ''
            if (d === 'medium') {
              unlockHint = `Complete ${UNLOCK_THRESHOLDS.medium - easyCompleted} more easy`
            }
            if (d === 'hard') {
              unlockHint = `Complete ${UNLOCK_THRESHOLDS.hard - mediumCompleted} more medium`
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

      <div className="action-row">
        <button
          type="button"
          className="btn btn-primary btn-large"
          disabled={!canStart}
          onClick={() => onStart(category, difficulty)}
        >
          {canStart ? 'Start Playing' : 'Select an unlocked difficulty'}
        </button>
        {totalCompleted > 0 && (
          <button type="button" className="btn btn-ghost" onClick={onReset}>
            Reset progress
          </button>
        )}
      </div>

      <footer className="footer">
        <p>100% free · No ads · Built for ages 7 to 35</p>
      </footer>
    </div>
  )
}
