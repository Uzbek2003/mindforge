import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings } from '../types'
import { textToSpeechService, type TtsState } from '../services/textToSpeech'

/**
 * Stable voice controls for persona-aware TTS (Night Guardian / The President / System).
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
      void textToSpeechService.stop()
    }
  }, [settings.voiceExplanationsEnabled, settings.soundEnabled])

  useEffect(() => {
    void textToSpeechService.stop()
  }, [
    settings.voicePersona,
    settings.voiceId,
    settings.voiceSpeed,
    settings.voicePitch,
    settings.voiceVolume,
  ])

  const play = useCallback((text: string) => {
    const current = settingsRef.current
    if (!current.voiceExplanationsEnabled || !current.soundEnabled) return
    void textToSpeechService.speak(text, current)
  }, [])

  const pause = useCallback(() => {
    void textToSpeechService.pause()
  }, [])

  const resume = useCallback(() => {
    void textToSpeechService.resume(settingsRef.current)
  }, [])

  const replay = useCallback((text: string) => {
    const current = settingsRef.current
    if (!current.voiceExplanationsEnabled || !current.soundEnabled) return
    void textToSpeechService.replay(text, current)
  }, [])

  const stop = useCallback(() => {
    void textToSpeechService.stop()
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
