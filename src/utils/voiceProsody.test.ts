import { describe, expect, it } from 'vitest'
import {
  PITCH_VALUE,
  SPEED_RATE,
  normalizeVoicePitch,
  resolveSpeechPitch,
  resolveSpeechRate,
  resolveSpeechVolume,
} from './voiceProsody'

describe('normalizeVoicePitch', () => {
  it('keeps known pitch values', () => {
    expect(normalizeVoicePitch('high')).toBe('high')
    expect(normalizeVoicePitch('normal')).toBe('normal')
    expect(normalizeVoicePitch('low')).toBe('low')
  })

  it('maps the legacy "deep" value and unknown input to low', () => {
    expect(normalizeVoicePitch('deep')).toBe('low')
    expect(normalizeVoicePitch('whatever')).toBe('low')
    expect(normalizeVoicePitch(null)).toBe('low')
    expect(normalizeVoicePitch(undefined)).toBe('low')
  })
})

describe('resolveSpeechRate', () => {
  it('returns a distinct Android-safe rate per speed', () => {
    expect(resolveSpeechRate('slow')).toBe(SPEED_RATE.slow)
    expect(resolveSpeechRate('normal')).toBe(1)
    expect(resolveSpeechRate('fast')).toBe(SPEED_RATE.fast)
    expect(new Set(Object.values(SPEED_RATE)).size).toBe(3)
  })

  it('keeps every rate inside the common 0.5–2.0 engine band', () => {
    for (const rate of Object.values(SPEED_RATE)) {
      expect(rate).toBeGreaterThanOrEqual(0.5)
      expect(rate).toBeLessThanOrEqual(2)
    }
  })
})

describe('resolveSpeechPitch', () => {
  it('resolves normalized pitches to engine values', () => {
    expect(resolveSpeechPitch('low')).toBe(PITCH_VALUE.low)
    expect(resolveSpeechPitch('normal')).toBe(1)
    expect(resolveSpeechPitch('high')).toBe(PITCH_VALUE.high)
  })

  it('falls back to low for legacy and unknown stored values', () => {
    expect(resolveSpeechPitch('deep')).toBe(PITCH_VALUE.low)
    expect(resolveSpeechPitch('bogus')).toBe(PITCH_VALUE.low)
  })
})

describe('resolveSpeechVolume', () => {
  it('clamps to the 0–1 range', () => {
    expect(resolveSpeechVolume(-1)).toBe(0)
    expect(resolveSpeechVolume(0)).toBe(0)
    expect(resolveSpeechVolume(1)).toBe(1)
    expect(resolveSpeechVolume(4)).toBe(1)
  })

  it('rounds in-range values to two decimals', () => {
    expect(resolveSpeechVolume(0.5)).toBe(0.5)
    expect(resolveSpeechVolume(0.123456)).toBe(0.12)
    expect(resolveSpeechVolume(0.129)).toBe(0.13)
  })

  it('defaults to full volume for non-finite input', () => {
    expect(resolveSpeechVolume(Number.NaN)).toBe(1)
    expect(resolveSpeechVolume(Number.POSITIVE_INFINITY)).toBe(1)
  })
})
