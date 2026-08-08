import { APP_NAME } from '../constants'
import type { VoicePersona, VoicePitch, VoiceSpeed } from '../types'

export interface VoicePersonaMeta {
  id: VoicePersona
  label: string
  subtitle: string
  description: string
  recommendedSpeed: VoiceSpeed
  recommendedPitch: VoicePitch
}

export const VOICE_PERSONA_OPTIONS: VoicePersonaMeta[] = [
  {
    id: 'night-guardian',
    label: 'Night Guardian',
    subtitle: 'Deep mentor-style spoken explanations',
    description: `Calm mentor tone with slower, lower delivery. A ${APP_NAME} character guide.`,
    recommendedSpeed: 'slow',
    recommendedPitch: 'low',
  },
  {
    id: 'president',
    label: 'The President',
    subtitle: 'Bold, energetic quiz-coach explanations',
    description: `Confident, slightly humorous coach tone with faster, clear delivery. A fictional ${APP_NAME} character — not a real person.`,
    recommendedSpeed: 'fast',
    recommendedPitch: 'normal',
  },
  {
    id: 'system',
    label: 'System Default',
    subtitle: 'Neutral spoken explanations',
    description: "Plain delivery using your engine's default English voice behavior.",
    recommendedSpeed: 'normal',
    recommendedPitch: 'normal',
  },
]

export function normalizeVoicePersona(value: string | null | undefined): VoicePersona {
  if (value === 'system' || value === 'president' || value === 'night-guardian') return value
  return 'night-guardian'
}

export function getVoicePersonaMeta(persona: VoicePersona): VoicePersonaMeta {
  return (
    VOICE_PERSONA_OPTIONS.find((option) => option.id === persona) ?? VOICE_PERSONA_OPTIONS[0]
  )
}

export function getPersonaProsodyDefaults(persona: VoicePersona): {
  voiceSpeed: VoiceSpeed
  voicePitch: VoicePitch
} {
  const meta = getVoicePersonaMeta(persona)
  return {
    voiceSpeed: meta.recommendedSpeed,
    voicePitch: meta.recommendedPitch,
  }
}
