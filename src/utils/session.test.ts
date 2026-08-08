import { describe, expect, it } from 'vitest'
import { ALL_PUZZLES, getPuzzles } from '../data'
import {
  buildEndlessExtension,
  buildSessionQueue,
  calcSessionStreak,
  formatDuration,
  formatSessionDifficultyLabel,
  getUnsolvedPuzzles,
} from './session'

describe('Daily Challenge difficulty labeling', () => {
  it('ignores the Home difficulty argument when building the daily queue', () => {
    const asEasy = buildSessionQueue({
      category: 'all',
      difficulty: 'easy',
      mode: 'daily',
      completedIds: [],
    })
    const asHard = buildSessionQueue({
      category: 'all',
      difficulty: 'hard',
      mode: 'daily',
      completedIds: [],
    })

    expect(asEasy).toHaveLength(5)
    expect(asEasy.map((puzzle) => puzzle.id)).toEqual(asHard.map((puzzle) => puzzle.id))
  })

  it('labels Daily Challenge sessions as Mixed, not Easy', () => {
    // Regression: Results showed "Easy · Daily Challenge" while review cards showed Medium.
    expect(formatSessionDifficultyLabel('daily', 'easy')).toBe('Mixed')
    expect(formatSessionDifficultyLabel('daily', 'medium')).toBe('Mixed')
    expect(formatSessionDifficultyLabel('quick', 'easy')).toBe('Easy')
    expect(formatSessionDifficultyLabel('standard', 'medium')).toBe('Medium')
  })
})

describe('getUnsolvedPuzzles', () => {
  it('excludes already completed puzzles', () => {
    const all = getUnsolvedPuzzles('math', 'easy', [])
    const completedId = all[0].id
    const remaining = getUnsolvedPuzzles('math', 'easy', [completedId])
    expect(remaining).toHaveLength(all.length - 1)
    expect(remaining.some((p) => p.id === completedId)).toBe(false)
  })

  it('filters by category and difficulty for standard sessions', () => {
    const puzzles = getUnsolvedPuzzles('science', 'medium', [])
    expect(puzzles.length).toBeGreaterThan(0)
    expect(puzzles.every((p) => p.category === 'science' && p.difficulty === 'medium')).toBe(true)
  })

  it('drops the category filter when playing all worlds', () => {
    const puzzles = getUnsolvedPuzzles('all', 'hard', [])
    expect(puzzles).toHaveLength(getPuzzles({ difficulty: 'hard' }).length)
  })

  it('ignores both filters in endless mode', () => {
    const puzzles = getUnsolvedPuzzles('math', 'hard', [], 'endless')
    expect(puzzles).toHaveLength(ALL_PUZZLES.length)
  })
})

describe('buildSessionQueue', () => {
  const base = { category: 'all', difficulty: 'easy', completedIds: [] } as const

  it('limits the queue by mode', () => {
    expect(buildSessionQueue({ ...base, mode: 'quick' })).toHaveLength(5)
    expect(buildSessionQueue({ ...base, mode: 'standard' })).toHaveLength(10)
    expect(buildSessionQueue({ ...base, mode: 'challenge' })).toHaveLength(20)
    expect(buildSessionQueue({ ...base, mode: 'endless' })).toHaveLength(10)
  })

  it('returns every unsolved puzzle in full mode', () => {
    const queue = buildSessionQueue({ ...base, mode: 'full' })
    expect(queue).toHaveLength(getUnsolvedPuzzles('all', 'easy', []).length)
  })

  it('never exceeds the number of available puzzles', () => {
    const easy = getUnsolvedPuzzles('math', 'easy', [])
    const completedIds = easy.slice(0, easy.length - 1).map((p) => p.id)
    const queue = buildSessionQueue({
      category: 'math',
      difficulty: 'easy',
      mode: 'challenge',
      completedIds,
    })
    expect(queue).toHaveLength(1)
  })

  it('returns an empty queue when everything is solved', () => {
    const completedIds = ALL_PUZZLES.map((p) => p.id)
    expect(buildSessionQueue({ ...base, mode: 'standard', completedIds })).toEqual([])
  })

  it('replays exactly the retry puzzles, ignoring mode and completion', () => {
    const retryIds = [ALL_PUZZLES[3].id, ALL_PUZZLES[1].id]
    const queue = buildSessionQueue({
      category: 'math',
      difficulty: 'hard',
      mode: 'quick',
      completedIds: retryIds,
      retryIds,
    })
    expect(queue.map((p) => p.id).sort()).toEqual([...retryIds].sort())
  })

  it('draws a mixed-difficulty daily set from the whole bank', () => {
    const queue = buildSessionQueue({ ...base, mode: 'daily' })
    expect(queue).toHaveLength(5)
    expect(new Set(queue.map((p) => p.id)).size).toBe(5)
  })

  it('only returns unsolved puzzles', () => {
    const completedIds = getUnsolvedPuzzles('all', 'easy', [])
      .slice(0, 3)
      .map((p) => p.id)
    const queue = buildSessionQueue({ ...base, mode: 'standard', completedIds })
    expect(queue.some((p) => completedIds.includes(p.id))).toBe(false)
  })
})

describe('buildEndlessExtension', () => {
  it('returns up to ten unseen, uncompleted puzzles', () => {
    const seenIds = new Set(ALL_PUZZLES.slice(0, 5).map((p) => p.id))
    const completedIds = ALL_PUZZLES.slice(5, 10).map((p) => p.id)
    const batch = buildEndlessExtension(seenIds, completedIds)
    expect(batch).toHaveLength(10)
    expect(batch.some((p) => seenIds.has(p.id) || completedIds.includes(p.id))).toBe(false)
  })

  it('returns an empty batch once nothing fresh remains', () => {
    const seenIds = new Set(ALL_PUZZLES.map((p) => p.id))
    expect(buildEndlessExtension(seenIds, [])).toEqual([])
  })
})

describe('formatDuration', () => {
  it('formats minutes and zero-padded seconds', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(5_000)).toBe('0:05')
    expect(formatDuration(65_000)).toBe('1:05')
    expect(formatDuration(600_000)).toBe('10:00')
  })

  it('floors partial seconds and clamps negatives', () => {
    expect(formatDuration(1_999)).toBe('0:01')
    expect(formatDuration(-5_000)).toBe('0:00')
  })
})

describe('calcSessionStreak', () => {
  it('returns the longest run of correct answers', () => {
    expect(calcSessionStreak([true, true, false, true, true, true])).toBe(3)
  })

  it('handles all-correct, all-wrong, and empty sessions', () => {
    expect(calcSessionStreak([true, true, true])).toBe(3)
    expect(calcSessionStreak([false, false])).toBe(0)
    expect(calcSessionStreak([])).toBe(0)
  })
})
