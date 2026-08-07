import type { VoicePersona, VoicePitch, VoiceSpeed } from '../types'

export interface PersonaVoiceCandidate {
  id: string
  name: string
  lang: string
  voiceURI?: string
  localService?: boolean
}

function normalizeLang(lang: string) {
  return lang.trim().replace(/_/g, '-').toLowerCase()
}

function isEnglishLang(lang: string) {
  const norm = normalizeLang(lang)
  return norm === 'en' || norm.startsWith('en-')
}

export const VOICE_PERSONA_OPTIONS: VoicePersona[] = ['system', 'night-guardian', 'president']

export const VOICE_PERSONA_LABELS: Record<VoicePersona, string> = {
  system: 'System Default',
  'night-guardian': 'Night Guardian',
  president: 'The President',
}

export const VOICE_PERSONA_DESCRIPTIONS: Record<VoicePersona, string> = {
  system: 'Neutral system narration with your device’s default English voice.',
  'night-guardian':
    'A calm fictional mentor. Optional spoken questions and explanations; written text always stays visible.',
  president:
    'An original fictional QuizNova character — bold, confident, and a little humorous. Not based on any real person.',
}

/** Recommended defaults applied when the user selects a persona. Manual controls still override afterward. */
export const VOICE_PERSONA_DEFAULTS: Record<
  VoicePersona,
  { voiceSpeed: VoiceSpeed; voicePitch: VoicePitch }
> = {
  system: { voiceSpeed: 'normal', voicePitch: 'normal' },
  'night-guardian': { voiceSpeed: 'slow', voicePitch: 'low' },
  president: { voiceSpeed: 'fast', voicePitch: 'normal' },
}

export const VOICE_PERSONA_PANEL_COPY: Record<
  VoicePersona,
  { title: string; subtitle: string; ariaLabel: string }
> = {
  system: {
    title: 'System voice',
    subtitle: 'Neutral spoken explanations',
    ariaLabel: 'System voice explanation controls',
  },
  'night-guardian': {
    title: 'Night Guardian',
    subtitle: 'Deep mentor-style spoken explanations',
    ariaLabel: 'Night Guardian voice explanation controls',
  },
  president: {
    title: 'The President',
    subtitle: 'Bold, energetic QuizNova coach (fictional character)',
    ariaLabel: 'The President voice explanation controls',
  },
}

export function normalizeVoicePersona(value: string | null | undefined): VoicePersona {
  if (value === 'system' || value === 'president' || value === 'night-guardian') return value
  // Legacy builds had Night Guardian branding without a stored persona.
  return 'night-guardian'
}

/**
 * Score English system voices for The President persona.
 * Uses locale / engine quality signals only — never celebrity or real-person names.
 */
export function scorePresidentVoice(voice: PersonaVoiceCandidate): number {
  if (!isEnglishLang(voice.lang)) return -1000

  let score = 0
  const lang = normalizeLang(voice.lang)
  const blob = `${voice.name} ${voice.voiceURI ?? ''} ${voice.id}`.toLowerCase()

  if (lang === 'en-us') score += 12
  else if (lang === 'en') score += 8
  else if (lang.startsWith('en-')) score += 4

  // Common Google TTS quality/locale IDs (technical, not personal names).
  if (/en-us-x-(sfg|iob|iom|tpd|tpf|tpc)/i.test(blob)) score += 10
  if (/english (united states|us)\b|en[-_ ]?us\b/i.test(blob)) score += 6
  if (/\b(neural|natural|enhanced|premium|wavenet)\b/i.test(blob)) score += 5
  if (voice.localService) score += 2

  // Soft / child-labeled voices fight the energetic coach vibe when tagged that way.
  if (/\b(child|kids?|soft|whisper)\b/i.test(blob)) score -= 8

  return score
}

/** Prefer a clear US-English system voice when one is available; otherwise null (safe fallback). */
export function pickPresidentPreferredVoice(
  voices: PersonaVoiceCandidate[],
): PersonaVoiceCandidate | null {
  const english = voices.filter((voice) => isEnglishLang(voice.lang))
  if (english.length === 0) return null

  let best: PersonaVoiceCandidate | null = null
  let bestScore = Number.NEGATIVE_INFINITY

  for (const voice of english) {
    const score = scorePresidentVoice(voice)
    if (score > bestScore) {
      best = voice
      bestScore = score
    }
  }

  // Require at least a basic English match; never force a bad non-English pick.
  if (!best || bestScore < 0) return null
  return best
}

export function pickNightGuardianPreferredVoice(
  voices: PersonaVoiceCandidate[],
): PersonaVoiceCandidate | null {
  const english = voices.filter((voice) => isEnglishLang(voice.lang))
  if (english.length === 0) return null

  const ranked = [...english].sort((a, b) => {
    const rank = (voice: PersonaVoiceCandidate) => {
      const lang = normalizeLang(voice.lang)
      if (lang === 'en-gb') return 0
      if (lang === 'en-us') return 1
      if (lang === 'en') return 2
      return 3
    }
    return rank(a) - rank(b)
  })

  return ranked[0] ?? null
}
