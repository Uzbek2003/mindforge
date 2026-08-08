import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings } from '../types'
import { textToSpeechService, type TtsState } from '../services/textToSpeech'
import { fireAndForget } from '../utils/errors'

/**
 * Stable voice controls for Night Guardian TTS.
 * Callbacks are referentially stable so gameplay effects do not restart speech
 * every time speaking state changes.
 */
export function useVoiceExplanation(settings: AppSettings) {
  const [ttsState, setTtsState] = useState<TtsState>(textToSpeechService.getState())
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  useEffect(() => textToSpeechService.subscribe(setTtsState), [])

  useEffect(() => {
    if (!settings.voiceExplanationsEnabled || !settings.soundEnabled) {
      fireAndForget(textToSpeechService.stop(), 'stopping speech after disabling voice')
    }
  }, [settings.voiceExplanationsEnabled, settings.soundEnabled])

  useEffect(() => {
    fireAndForget(textToSpeechService.stop(), 'stopping speech after a voice setting change')
  }, [settings.voiceId, settings.voiceSpeed, settings.voicePitch, settings.voiceVolume])

  const play = useCallback((text: string) => {
    const current = settingsRef.current
    if (!current.voiceExplanationsEnabled || !current.soundEnabled) return
    fireAndForget(textToSpeechService.speak(text, current), 'speaking explanation')
  }, [])

  const pause = useCallback(() => {
    fireAndForget(textToSpeechService.pause(), 'pausing speech')
  }, [])

  const resume = useCallback(() => {
    fireAndForget(textToSpeechService.resume(settingsRef.current), 'resuming speech')
  }, [])

  const replay = useCallback((text: string) => {
    const current = settingsRef.current
    if (!current.voiceExplanationsEnabled || !current.soundEnabled) return
    fireAndForget(textToSpeechService.replay(text, current), 'replaying explanation')
  }, [])

  const stop = useCallback(() => {
    fireAndForget(textToSpeechService.stop(), 'stopping speech')
  }, [])

  return {
    isSpeaking: ttsState.isSpeaking,
    isPaused: ttsState.isPaused,
    status: ttsState.status,
    voiceUnavailable: ttsState.voiceUnavailable,
    selectedVoice: ttsState.selectedVoice,
    play,
    pause,
    resume,
    replay,
    stop,
  }
}
