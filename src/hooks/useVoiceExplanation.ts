import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../types'
import { textToSpeechService, type TtsState } from '../services/textToSpeech'

export function useVoiceExplanation(settings: AppSettings) {
  const [ttsState, setTtsState] = useState<TtsState>(textToSpeechService.getState())

  useEffect(() => textToSpeechService.subscribe(setTtsState), [])

  useEffect(() => {
    if (!settings.voiceExplanationsEnabled || !settings.soundEnabled) {
      void textToSpeechService.stop()
    }
  }, [settings.voiceExplanationsEnabled, settings.soundEnabled])

  useEffect(() => {
    void textToSpeechService.stop()
  }, [settings.voiceId, settings.voiceSpeed, settings.voicePitch, settings.voiceVolume])

  const play = useCallback(
    (text: string) => {
      if (!settings.voiceExplanationsEnabled || !settings.soundEnabled) return
      void textToSpeechService.speak(text, settings)
    },
    [settings],
  )

  const pause = useCallback(() => {
    void textToSpeechService.pause()
  }, [])

  const resume = useCallback(() => {
    void textToSpeechService.resume(settings)
  }, [settings])

  const replay = useCallback(
    (text: string) => {
      if (!settings.voiceExplanationsEnabled || !settings.soundEnabled) return
      void textToSpeechService.replay(text, settings)
    },
    [settings],
  )

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
