import { describe, expect, it } from 'vitest'
import {
  MAX_STORED_IDS,
  parseJsonObject,
  sanitizeLastSession,
  sanitizeProgress,
  sanitizeReportedQuestions,
  sanitizeSettings,
} from './validation'
import { DEFAULT_SETTINGS } from '../types'

describe('parseJsonObject', () => {
  it('rejects non-object payloads and invalid JSON', () => {
    expect(parseJsonObject('[]')).toBeNull()
    expect(parseJsonObject('"str"')).toBeNull()
    expect(parseJsonObject('null')).toBeNull()
    expect(parseJsonObject('{oops')).toBeNull()
  })

  it('strips prototype-polluting keys at any depth', () => {
    const parsed = parseJsonObject('{"__proto__":{"polluted":true},"a":{"constructor":1,"b":2}}')
    expect(parsed).not.toBeNull()
    expect(Object.prototype.hasOwnProperty.call(parsed!, '__proto__')).toBe(false)
    expect((parsed!.a as Record<string, unknown>)).toEqual({ b: 2 })
    expect(({} as Record<string, unknown>).polluted).toBeUndefined()
  })
})

describe('sanitizeProgress', () => {
  it('drops invalid ids, duplicates, and out-of-range counters', () => {
    const progress = sanitizeProgress({
      completed: [1, 1, -3, 2.5, '4', null, 7],
      correctCount: 999,
      streak: -5,
      bestStreak: 'nope',
    })
    expect(progress).toEqual({ completed: [1, 7], correctCount: 2, streak: 0, bestStreak: 0 })
  })

  it('caps stored ids and falls back to defaults for junk input', () => {
    const huge = Array.from({ length: MAX_STORED_IDS + 50 }, (_, i) => i)
    expect(sanitizeProgress({ completed: huge }).completed).toHaveLength(MAX_STORED_IDS)
    expect(sanitizeProgress(null)).toEqual({
      completed: [],
      correctCount: 0,
      streak: 0,
      bestStreak: 0,
    })
  })

  it('keeps bestStreak at least as high as streak', () => {
    expect(sanitizeProgress({ completed: [], streak: 9, bestStreak: 2 }).bestStreak).toBe(9)
  })
})

describe('sanitizeLastSession', () => {
  it('returns null when there are no usable puzzle ids', () => {
    expect(sanitizeLastSession({ puzzleIds: ['a', -1] })).toBeNull()
    expect(sanitizeLastSession('nope')).toBeNull()
  })

  it('clamps the index and normalizes unknown enum values', () => {
    const session = sanitizeLastSession({
      category: 'hacking',
      difficulty: 'impossible',
      mode: 'cheat',
      puzzleIds: [1, 2, 3],
      index: 99,
      sessionAnswers: [
        { puzzleId: 1, selectedIndex: 42, correct: 'yes' },
        { puzzleId: 'x', selectedIndex: 0 },
      ],
      startedAt: 'now',
    })
    expect(session).not.toBeNull()
    expect(session!.category).toBe('math')
    expect(session!.difficulty).toBe('easy')
    expect(session!.mode).toBe('standard')
    expect(session!.index).toBe(2)
    expect(session!.sessionAnswers).toEqual([
      { puzzleId: 1, selectedIndex: null, correct: false, timedOut: false },
    ])
  })
})

describe('sanitizeSettings', () => {
  it('falls back to defaults for unknown values and clamps volume', () => {
    const settings = sanitizeSettings({
      soundEnabled: 'yes',
      textSize: 'gigantic',
      voiceSpeed: 'hyper',
      voiceVolume: 42,
      voiceId: 12,
    })
    expect(settings.soundEnabled).toBe(DEFAULT_SETTINGS.soundEnabled)
    expect(settings.textSize).toBe('normal')
    expect(settings.voiceSpeed).toBe('normal')
    expect(settings.voiceVolume).toBe(1)
    expect(settings.voiceId).toBeNull()
  })

  it('normalizes the legacy "deep" pitch value', () => {
    expect(sanitizeSettings({ voicePitch: 'deep' }).voicePitch).toBe('low')
  })
})

describe('sanitizeReportedQuestions', () => {
  it('keeps only unique non-negative integers', () => {
    expect(sanitizeReportedQuestions([3, 3, 'x', -1, 4])).toEqual([3, 4])
    expect(sanitizeReportedQuestions('nope')).toEqual([])
  })
})
