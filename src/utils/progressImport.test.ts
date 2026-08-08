import { describe, expect, it } from 'vitest'
import { parseProgressExport } from './progressImport'

const validExport = JSON.stringify({
  version: 1,
  progress: { completed: [1, 2, 2], correctCount: 2, streak: 1, bestStreak: 3 },
  reportedQuestions: [7],
})

describe('parseProgressExport', () => {
  it('accepts a valid export and de-duplicates ids', () => {
    const result = parseProgressExport(validExport)
    expect(result).toEqual({
      ok: true,
      value: {
        progress: { completed: [1, 2], correctCount: 2, streak: 1, bestStreak: 3 },
        reportedQuestions: [7],
      },
    })
  })

  it('defaults missing counters instead of importing NaN', () => {
    const result = parseProgressExport(JSON.stringify({ progress: { completed: [] } }))
    expect(result).toEqual({
      ok: true,
      value: {
        progress: { completed: [], correctCount: 0, streak: 0, bestStreak: 0 },
        reportedQuestions: [],
      },
    })
  })

  it.each([
    ['not json at all', 'not valid JSON'],
    [JSON.stringify(null), 'progress object'],
    [JSON.stringify({}), 'missing the "progress" object'],
    // Regression: a truthy non-array "completed" used to be imported as-is.
    [JSON.stringify({ progress: { completed: 'all' } }), 'array of puzzle ids'],
    [JSON.stringify({ progress: { completed: [1] }, reportedQuestions: 'nope' }), '"reportedQuestions"'],
  ])('rejects invalid input with a reason (%#)', (input, expectedReason) => {
    const result = parseProgressExport(input)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.reason).toContain(expectedReason)
  })
})
