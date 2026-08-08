import type { Category, Difficulty, Puzzle, SessionMode } from '../types'
import { DIFFICULTY_LABELS } from '../types'
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

function puzzleFilters(
  category: Category | 'all',
  difficulty: Difficulty,
  mode: SessionMode,
) {
  if (mode === 'endless') return {}
  if (category === 'all') return { difficulty }
  return { category, difficulty }
}

/** Puzzles not yet attempted for the given category/difficulty. */
export function getUnsolvedPuzzles(
  category: Category | 'all',
  difficulty: Difficulty,
  completedIds: number[],
  mode: SessionMode = 'standard',
): Puzzle[] {
  const filters = puzzleFilters(category, difficulty, mode)
  return getPuzzles(filters).filter((p) => !completedIds.includes(p.id))
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
    // Daily Challenge is a mixed-difficulty set across all categories.
    // Session difficulty from Home is ignored here on purpose.
    return seededShuffle(ALL_PUZZLES, dailySeed()).slice(0, 5)
  }

  const unsolved = getUnsolvedPuzzles(category, difficulty, completedIds, mode)
  const shuffled = shuffle(unsolved)

  if (shuffled.length === 0) {
    return []
  }

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

/** Next batch for endless mode — only unattempted puzzles, no repeats. */
export function buildEndlessExtension(
  seenIds: Set<number>,
  completedIds: number[],
): Puzzle[] {
  const fresh = shuffle(
    ALL_PUZZLES.filter((p) => !seenIds.has(p.id) && !completedIds.includes(p.id)),
  )
  return fresh.slice(0, 10)
}

export function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Label for Results / game badges.
 * Daily Challenge draws from the full puzzle bank (any difficulty), so never show
 * the placeholder Home difficulty (currently "easy") as if it were the session level.
 */
export function formatSessionDifficultyLabel(
  mode: SessionMode,
  difficulty: Difficulty,
): string {
  if (mode === 'daily') return 'Mixed'
  return DIFFICULTY_LABELS[difficulty]
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
