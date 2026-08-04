import type { Category, Difficulty, Puzzle, SessionMode } from '../types'
import { ALL_PUZZLES, getPuzzles } from '../data'

function shuffle<T>(items: T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5)
}

function seededShuffle<T>(items: T[], seed: number): T[] {
  let value = seed
  const random = () => {
    value = (value * 1664525 + 1013904223) % 4294967296
    return value / 4294967296
  }
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function dailySeed(): number {
  const now = new Date()
  return now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate()
}

export function buildSessionQueue(options: {
  category: Category | 'all'
  difficulty: Difficulty
  mode: SessionMode
  completedIds: number[]
  retryIds?: number[]
}): Puzzle[] {
  const { category, difficulty, mode, completedIds, retryIds } = options

  if (retryIds && retryIds.length > 0) {
    const retrySet = new Set(retryIds)
    return ALL_PUZZLES.filter((p) => retrySet.has(p.id))
  }

  if (mode === 'daily') {
    const pool = shuffle(ALL_PUZZLES)
    return seededShuffle(pool, dailySeed()).slice(0, 5)
  }

  const filters =
    mode === 'endless'
      ? {}
      : category === 'all'
        ? { difficulty }
        : { category, difficulty }

  const all = getPuzzles(filters)
  const unsolved = all.filter((p) => !completedIds.includes(p.id))
  const pool = unsolved.length > 0 ? unsolved : all
  const shuffled = shuffle(pool)

  if (mode === 'endless') {
    return shuffled.slice(0, 10)
  }

  const modeCounts: Partial<Record<SessionMode, number | null>> = {
    quick: 5,
    standard: 10,
    challenge: 20,
    full: null,
  }

  const limit = modeCounts[mode]
  if (limit == null) return shuffled
  return shuffled.slice(0, Math.min(limit, shuffled.length))
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

export function calcSessionStreak(answers: boolean[]): number {
  let best = 0
  let current = 0
  for (const correct of answers) {
    if (correct) {
      current += 1
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}
