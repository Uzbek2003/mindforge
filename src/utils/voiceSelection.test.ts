import { describe, expect, it } from 'vitest'
import { resolveVoiceIdForPersona, scoreVoiceForPersona, type CatalogVoice } from './voiceSelection'

const voices: CatalogVoice[] = [
  {
    id: '0',
    name: 'Google UK English Female',
    lang: 'en-GB',
    voiceURI: 'en-gb-x-gba-local',
    localService: true,
  },
  {
    id: '1',
    name: 'Google US English',
    lang: 'en-US',
    voiceURI: 'en-us-x-sfg-local',
    localService: true,
    default: true,
  },
  {
    id: '2',
    name: 'Español',
    lang: 'es-ES',
    voiceURI: 'es-es-x-dummy',
  },
]

describe('voiceSelection', () => {
  it('always prefers a locked English voice when present', () => {
    expect(resolveVoiceIdForPersona('president', voices, '0')).toBe('0')
  })

  it('falls back safely when a locked voice is missing', () => {
    expect(resolveVoiceIdForPersona('president', voices, '999')).toBe('1')
  })

  it('leaves System Default to the engine when unlocked', () => {
    expect(resolveVoiceIdForPersona('system', voices, null)).toBeNull()
  })

  it('prefers a clear energetic US technical voice for The President', () => {
    expect(resolveVoiceIdForPersona('president', voices, null)).toBe('1')
    expect(scoreVoiceForPersona('president', voices[1])).toBeGreaterThan(
      scoreVoiceForPersona('president', voices[0]),
    )
  })

  it('prefers a calmer British-leaning voice for Night Guardian', () => {
    expect(resolveVoiceIdForPersona('night-guardian', voices, null)).toBe('0')
  })

  it('returns null when no English voices exist', () => {
    expect(resolveVoiceIdForPersona('president', [voices[2]], null)).toBeNull()
  })
})
