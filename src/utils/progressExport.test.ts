import { describe, expect, it } from 'vitest'
import { parseProgressExport } from './progressExport'

describe('progress export compatibility', () => {
  it('accepts a QuizNova-era export payload without brand fields', () => {
    const legacyExport = {
      version: 1,
      exportedAt: '2026-08-01T00:00:00.000Z',
      progress: {
        completed: [1, 2, 3],
        correctCount: 3,
        streak: 2,
        bestStreak: 3,
      },
      reportedQuestions: [11],
    }

    const parsed = parseProgressExport(legacyExport)
    expect(parsed).not.toBeNull()
    expect(parsed?.progress.completed).toEqual([1, 2, 3])
    expect(parsed?.progress.correctCount).toBe(3)
    expect(parsed?.reportedQuestions).toEqual([11])
  })

  it('accepts a MindForge export payload', () => {
    const parsed = parseProgressExport({
      version: 1,
      progress: { completed: [5], correctCount: 1, streak: 1, bestStreak: 1 },
    })
    expect(parsed?.progress.completed).toEqual([5])
  })

  it('rejects invalid payloads', () => {
    expect(parseProgressExport(null)).toBeNull()
    expect(parseProgressExport({})).toBeNull()
    expect(parseProgressExport({ progress: {} })).toBeNull()
    expect(parseProgressExport({ progress: { completed: 'nope' } })).toBeNull()
  })
})
