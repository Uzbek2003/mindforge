import { describe, expect, it } from 'vitest'
import {
  getPersonaProsodyDefaults,
  getVoicePersonaMeta,
  normalizeVoicePersona,
  VOICE_PERSONA_OPTIONS,
} from './voicePersona'

describe('voicePersona', () => {
  it('exposes Night Guardian, The President, and System Default', () => {
    expect(VOICE_PERSONA_OPTIONS.map((option) => option.id)).toEqual([
      'night-guardian',
      'president',
      'system',
    ])
  })

  it('normalizes unknown values to Night Guardian', () => {
    expect(normalizeVoicePersona(undefined)).toBe('night-guardian')
    expect(normalizeVoicePersona('legacy')).toBe('night-guardian')
    expect(normalizeVoicePersona('president')).toBe('president')
  })

  it('returns recommended prosody defaults per persona', () => {
    expect(getPersonaProsodyDefaults('president')).toEqual({
      voiceSpeed: 'fast',
      voicePitch: 'normal',
    })
    expect(getPersonaProsodyDefaults('night-guardian')).toEqual({
      voiceSpeed: 'slow',
      voicePitch: 'low',
    })
    expect(getPersonaProsodyDefaults('system')).toEqual({
      voiceSpeed: 'normal',
      voicePitch: 'normal',
    })
  })

  it('keeps The President clearly fictional in copy', () => {
    const meta = getVoicePersonaMeta('president')
    expect(meta.label).toBe('The President')
    expect(meta.description.toLowerCase()).toContain('fictional')
    expect(meta.description.toLowerCase()).not.toMatch(/trump|obama|biden|real president/)
  })
})
