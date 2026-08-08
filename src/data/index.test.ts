import { describe, expect, it } from 'vitest'
import type { Category, Difficulty } from '../types'
import {
  ALL_PUZZLES,
  countByCategory,
  countByDifficulty,
  getPuzzleById,
  getPuzzles,
} from './index'

const CATEGORIES: Category[] = ['math', 'science', 'history', 'computer-science']
const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']

describe('getPuzzles', () => {
  it('returns the whole bank without filters', () => {
    expect(getPuzzles()).toHaveLength(ALL_PUZZLES.length)
    expect(getPuzzles({})).toHaveLength(ALL_PUZZLES.length)
  })

  it('treats the "all" category as no category filter', () => {
    expect(getPuzzles({ category: 'all' })).toHaveLength(ALL_PUZZLES.length)
  })

  it('filters by category', () => {
    for (const category of CATEGORIES) {
      const puzzles = getPuzzles({ category })
      expect(puzzles.length).toBeGreaterThan(0)
      expect(puzzles.every((p) => p.category === category)).toBe(true)
    }
  })

  it('filters by difficulty', () => {
    for (const difficulty of DIFFICULTIES) {
      const puzzles = getPuzzles({ difficulty })
      expect(puzzles.length).toBeGreaterThan(0)
      expect(puzzles.every((p) => p.difficulty === difficulty)).toBe(true)
    }
  })

  it('combines category and difficulty filters', () => {
    const puzzles = getPuzzles({ category: 'math', difficulty: 'easy' })
    expect(puzzles.length).toBeGreaterThan(0)
    expect(puzzles.every((p) => p.category === 'math' && p.difficulty === 'easy')).toBe(true)
  })
})

describe('getPuzzleById', () => {
  it('finds an existing puzzle', () => {
    const target = ALL_PUZZLES[5]
    expect(getPuzzleById(target.id)).toBe(target)
  })

  it('returns undefined for an unknown id', () => {
    expect(getPuzzleById(-1)).toBeUndefined()
  })
})

describe('counts', () => {
  it('counts per difficulty and sums to the full bank', () => {
    const total = DIFFICULTIES.reduce((sum, d) => sum + countByDifficulty(d), 0)
    expect(total).toBe(ALL_PUZZLES.length)
  })

  it('counts per category and sums to the full bank', () => {
    const total = CATEGORIES.reduce((sum, c) => sum + countByCategory(c), 0)
    expect(total).toBe(ALL_PUZZLES.length)
  })

  it('agrees with getPuzzles for the same filter', () => {
    expect(countByCategory('science')).toBe(getPuzzles({ category: 'science' }).length)
    expect(countByDifficulty('hard')).toBe(getPuzzles({ difficulty: 'hard' }).length)
  })
})
