import type { VoicePersona } from '../types'
import { isEnglishLang, normalizeLang } from './speechLang'

/**
 * Catalog entry used for persona voice heuristics.
 * Technical IDs only — never celebrity or real-person names.
 */
export interface CatalogVoice {
  id: string
  name: string
  lang: string
  voiceURI?: string
  localService?: boolean
  default?: boolean
}

/** Android/network TTS technical tokens that tend to sound clearer / more energetic. */
const PRESIDENT_TECHNICAL_TOKENS = [
  'en-us-x-sfg',
  'en-us-x-iom',
  'en-us-x-tpd',
  'en-us-x-tpf',
  'en-us-language',
]

/** Tokens that lean calmer / mentor-like (often British or softer variants). */
const GUARDIAN_TECHNICAL_TOKENS = [
  'en-gb',
  'en-gb-x-',
  'en-gb-language',
  'en-gb-x-gba',
  'en-gb-x-gbb',
]

function haystack(voice: CatalogVoice): string {
  return `${voice.name} ${voice.voiceURI ?? ''} ${voice.id} ${voice.lang}`.toLowerCase()
}

function hasAnyToken(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token))
}

function localeBonus(lang: string, preferred: string[]): number {
  const norm = normalizeLang(lang)
  const idx = preferred.indexOf(norm)
  if (idx >= 0) return 40 - idx * 5
  if (preferred.some((locale) => norm.startsWith(locale.split('-')[0]))) return 10
  return 0
}

/**
 * Higher score = better match for the persona’s preferred system voice.
 * Returns 0 for non-English voices.
 */
export function scoreVoiceForPersona(persona: VoicePersona, voice: CatalogVoice): number {
  if (!isEnglishLang(voice.lang)) return 0

  const text = haystack(voice)
  let score = 1

  if (voice.localService) score += 8
  if (voice.default) score += 6

  if (persona === 'system') {
    // Prefer the engine’s default English voice lightly; otherwise leave selection to the caller.
    score += localeBonus(voice.lang, ['en-us', 'en', 'en-gb'])
    return score
  }

  if (persona === 'president') {
    score += localeBonus(voice.lang, ['en-us', 'en', 'en-ca', 'en-au', 'en-gb'])
    if (hasAnyToken(text, PRESIDENT_TECHNICAL_TOKENS)) score += 50
    // Prefer clear US English product voices without targeting any real person.
    if (/\bus english\b/.test(text) || /\ben-us\b/.test(text)) score += 12
    if (/\bnetwork\b/.test(text)) score += 4
    if (/\blocal\b/.test(text)) score += 4
    // Mild preference for typically clearer male/neutral coach-style system labels.
    if (/\b(mark|david|james|alex|daniel)\b/.test(text)) score += 10
    return score
  }

  // Night Guardian — calmer mentor: lean British / softer English variants.
  score += localeBonus(voice.lang, ['en-gb', 'en-au', 'en', 'en-us'])
  if (hasAnyToken(text, GUARDIAN_TECHNICAL_TOKENS)) score += 50
  if (/\bgreat britain\b|\bbritish\b|\buk english\b/.test(text)) score += 16
  if (/\b(serena|susan|karen|moira|fiona|samantha)\b/.test(text)) score += 8
  return score
}

/**
 * Resolve which catalog voice id to use.
 * 1) Locked manual voiceId always wins when still present in the catalog
 * 2) Else best persona heuristic match
 * 3) Else null → engine native default (safe fallback)
 */
export function resolveVoiceIdForPersona(
  persona: VoicePersona,
  voices: CatalogVoice[],
  lockedVoiceId: string | null | undefined,
): string | null {
  const english = voices.filter((voice) => isEnglishLang(voice.lang))

  if (lockedVoiceId != null && lockedVoiceId !== '') {
    const locked = english.find((voice) => voice.id === lockedVoiceId)
    if (locked) return locked.id
  }

  if (persona === 'system' || english.length === 0) return null

  let best: CatalogVoice | null = null
  let bestScore = -1
  for (const voice of english) {
    const score = scoreVoiceForPersona(persona, voice)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }

  // Require a meaningful preference signal beyond the base English score.
  if (!best || bestScore < 15) return null
  return best.id
}
