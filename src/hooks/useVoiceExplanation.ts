import { useCallback, useEffect, useState } from 'react'
import type { AppSettings } from '../types'
import { textToSpeechService } from '../services/textToSpeech'

export function useVoiceExplanation(settings: AppSettings) {
  const [isSpeaking, setIsSpeaking] = useState(textToSpeechService.getIsSpeaking())
  const [isPaused, setIsPaused] = useState(textToSpeechService.getIsPaused())

  useEffect(() => {
    return textToSpeechService.subscribe((speaking) => {
      setIsSpeaking(speaking)
      setIsPaused(textToSpeechService.getIsPaused())
    })
  }, [])

  const play = useCallback(
    (text: string) => {
      if (!settings.voiceExplanationsEnabled || !settings.soundEnabled) return
      void textToSpeechService.speak(text, settings)
    },
    [settings],
  )

  const pause = useCallback(() => {
    void textToSpeechService.pause()
    setIsPaused(true)
    setIsSpeaking(false)
  }, [])

  const resume = useCallback(() => {
    void textToSpeechService.resume(settings)
    setIsPaused(false)
  }, [settings])

  const replay = useCallback(
    (text: string) => {
      void textToSpeechService.stop()
      play(text)
    },
    [play],
  )

  const stop = useCallback(() => {
    void textToSpeechService.stop()
  }, [])

  return {
    isSpeaking,
    isPaused,
    play,
    pause,
    resume,
    replay,
    stop,
  }
}
