import type { AppSettings } from '../types'

type VoiceGate = Pick<
  AppSettings,
  'soundEnabled' | 'voiceExplanationsEnabled' | 'voiceAutoPlay' | 'voiceVolume'
>

/** Voice output is allowed at all (sound on and voice explanations enabled). */
export function isVoiceEnabled(settings: Pick<VoiceGate, 'soundEnabled' | 'voiceExplanationsEnabled'>): boolean {
  return settings.soundEnabled && settings.voiceExplanationsEnabled
}

/** Voice output is allowed and audible. */
export function canSpeak(settings: VoiceGate): boolean {
  return isVoiceEnabled(settings) && settings.voiceVolume > 0
}

/** Questions and explanations should start speaking on their own. */
export function shouldAutoPlayVoice(settings: VoiceGate): boolean {
  return settings.voiceAutoPlay && isVoiceEnabled(settings)
}
