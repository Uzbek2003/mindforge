import { describe, expect, it } from 'vitest'
import { buildSessionQueue, formatSessionDifficultyLabel } from './session'

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
