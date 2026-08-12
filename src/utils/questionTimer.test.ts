import { describe, expect, it } from 'vitest'
import {
  EXTENDED_TIME_MULTIPLIER,
  resolveQuestionTimeLimit,
  resolveRetryTimeLimit,
} from './questionTimer'
import { DIFFICULTY_TIME_LIMITS } from '../types'

describe('resolveQuestionTimeLimit', () => {
  it('preserves default difficulty timers when both options are off', () => {
    expect(resolveQuestionTimeLimit('easy', { untimedMode: false, extendedTime: false })).toBe(
      DIFFICULTY_TIME_LIMITS.easy,
    )
    expect(resolveQuestionTimeLimit('medium', { untimedMode: false, extendedTime: false })).toBe(
      DIFFICULTY_TIME_LIMITS.medium,
    )
    expect(resolveQuestionTimeLimit('hard', { untimedMode: false, extendedTime: false })).toBe(
      DIFFICULTY_TIME_LIMITS.hard,
    )
  })

  it('returns null for Untimed Mode and ignores Extended Time', () => {
    expect(resolveQuestionTimeLimit('easy', { untimedMode: true, extendedTime: false })).toBeNull()
    expect(resolveQuestionTimeLimit('hard', { untimedMode: true, extendedTime: true })).toBeNull()
  })

  it('applies the Extended Time multiplier when timed', () => {
    expect(resolveQuestionTimeLimit('easy', { untimedMode: false, extendedTime: true })).toBe(
      Math.round(DIFFICULTY_TIME_LIMITS.easy * EXTENDED_TIME_MULTIPLIER),
    )
    expect(resolveQuestionTimeLimit('medium', { untimedMode: false, extendedTime: true })).toBe(
      Math.round(DIFFICULTY_TIME_LIMITS.medium * EXTENDED_TIME_MULTIPLIER),
    )
    expect(resolveQuestionTimeLimit('hard', { untimedMode: false, extendedTime: true })).toBe(
      Math.round(DIFFICULTY_TIME_LIMITS.hard * EXTENDED_TIME_MULTIPLIER),
    )
  })
})

describe('resolveRetryTimeLimit', () => {
  it('returns null when the active limit is untimed', () => {
    expect(resolveRetryTimeLimit(null)).toBeNull()
  })

  it('uses 75% of the active limit with a 20s floor', () => {
    expect(resolveRetryTimeLimit(60)).toBe(45)
    expect(resolveRetryTimeLimit(40)).toBe(30)
    expect(resolveRetryTimeLimit(20)).toBe(20)
  })
})
