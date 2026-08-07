import type { VoicePitch, VoiceSpeed } from '../types'

/**
 * Clearly distinguishable, Android-safe speech rates for setSpeechRate().
 * 1.0 is the engine default; keep extremes inside the common 0.5–2.0 band.
 */
export const SPEED_RATE: Record<VoiceSpeed, number> = {
  slow: 0.6,
  normal: 1.0,
  fast: 1.5,
}

/**
 * Clearly distinguishable, Android-safe pitch values for setPitch().
 * Legacy stored value "deep" maps to low.
 */
export const PITCH_VALUE: Record<'low' | 'normal' | 'high', number> = {
  low: 0.6,
  normal: 1.0,
  high: 1.5,
}

export type ProsodySource =
  | 'test-voice'
  | 'native-tts-test'
  | 'quiz-question'
  | 'quiz-explanation'
  | 'browser-speak'
  | 'native-speak'
  | 'unknown'

export function normalizeVoicePitch(pitch: string | null | undefined): VoicePitch {
  if (pitch === 'high') return 'high'
  if (pitch === 'normal') return 'normal'
  // Legacy "deep" and any unknown value → low
  return 'low'
}

export function resolveSpeechRate(speed: VoiceSpeed): number {
  return SPEED_RATE[speed] ?? SPEED_RATE.normal
}

export function resolveSpeechPitch(pitch: VoicePitch | string): number {
  const normalized = normalizeVoicePitch(pitch)
  return PITCH_VALUE[normalized]
}

/** Clamp Settings slider (0–1) to a finite float Android/web engines accept. */
export function resolveSpeechVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 1
  if (volume <= 0) return 0
  if (volume >= 1) return 1
  // Keep a plain number (avoid odd long-double stringification across the bridge).
  return Math.round(volume * 100) / 100
}

/** Temporary always-on diagnostics for physical Android QA (logcat / remote console). */
export function logProsodyDiagnostics(
  source: ProsodySource,
  ui: { voiceSpeed: VoiceSpeed; voicePitch: VoicePitch | string; voiceVolume?: number },
  numeric: { rate: number; pitch: number; volume: number },
  extra?: Record<string, unknown>,
) {
  const uiVolume =
    ui.voiceVolume === undefined ? numeric.volume : resolveSpeechVolume(ui.voiceVolume)
  const payload = {
    source,
    uiSpeed: ui.voiceSpeed,
    uiPitch: normalizeVoicePitch(ui.voicePitch),
    uiVolume,
    numericRate: numeric.rate,
    numericPitch: numeric.pitch,
    numericVolume: numeric.volume,
    ...extra,
  }
  console.log(
    `[QuizNova TTS DIAG] source=${source} uiSpeed=${payload.uiSpeed} → rate=${payload.numericRate} | uiPitch=${payload.uiPitch} → pitch=${payload.numericPitch} | uiVolume=${payload.uiVolume} → volume=${payload.numericVolume}`,
    payload,
  )
}
