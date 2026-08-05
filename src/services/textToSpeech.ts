import { Capacitor } from '@capacitor/core'
import { TextToSpeech } from '@capacitor-community/text-to-speech'
import type { AppSettings, VoicePitch, VoiceSpeed } from '../types'

export interface VoiceOption {
  id: string
  name: string
  lang: string
}

type SpeakingListener = (speaking: boolean) => void

const SPEED_RATE: Record<VoiceSpeed, number> = {
  slow: 0.78,
  normal: 0.9,
  fast: 1.02,
}

const PITCH_VALUE: Record<VoicePitch, number> = {
  deep: 0.72,
  normal: 1,
}

const DEEP_VOICE_HINTS = ['david', 'mark', 'james', 'daniel', 'aaron', 'guy', 'fred', 'male', 'low']

class TextToSpeechService {
  private speaking = false
  private paused = false
  private listeners = new Set<SpeakingListener>()
  private currentText = ''
  private nativeVoices: Array<{ name: string; lang: string; voiceURI: string }> = []

  subscribe(listener: SpeakingListener) {
    this.listeners.add(listener)
    listener(this.speaking)
    return () => {
      this.listeners.delete(listener)
    }
  }

  getIsSpeaking() {
    return this.speaking
  }

  getIsPaused() {
    return this.paused
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.speaking)
    }
  }

  private setSpeaking(value: boolean) {
    this.speaking = value
    if (!value) this.paused = false
    this.notify()
  }

  private canSpeak(settings: AppSettings) {
    return settings.soundEnabled && settings.voiceExplanationsEnabled && settings.voiceVolume > 0
  }

  private resolveRate(settings: AppSettings) {
    return SPEED_RATE[settings.voiceSpeed]
  }

  private resolvePitch(settings: AppSettings) {
    return PITCH_VALUE[settings.voicePitch]
  }

  private pickBrowserVoice(settings: AppSettings): SpeechSynthesisVoice | undefined {
    const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []
    if (settings.voiceId) {
      const selected = voices.find(
        (voice) => voice.voiceURI === settings.voiceId || voice.name === settings.voiceId,
      )
      if (selected) return selected
    }

    const english = voices.filter((voice) => voice.lang.startsWith('en'))
    const deep = english.find((voice) =>
      DEEP_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)),
    )
    return deep ?? english[0] ?? voices[0]
  }

  private resolveNativeVoiceIndex(settings: AppSettings): number | undefined {
    if (settings.voiceId != null) {
      const index = Number(settings.voiceId)
      if (!Number.isNaN(index) && this.nativeVoices[index]) return index
    }

    const deepIndex = this.nativeVoices.findIndex((voice) =>
      DEEP_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)),
    )
    if (deepIndex >= 0) return deepIndex
    const englishIndex = this.nativeVoices.findIndex((voice) => voice.lang.startsWith('en'))
    return englishIndex >= 0 ? englishIndex : 0
  }

  async getVoices(): Promise<VoiceOption[]> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await TextToSpeech.getSupportedVoices()
        this.nativeVoices = result.voices
        return result.voices.map((voice, index) => ({
          id: String(index),
          name: voice.name,
          lang: voice.lang,
        }))
      } catch {
        return []
      }
    }

    const voices =
      typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []
    return voices
      .filter((voice) => voice.lang.startsWith('en'))
      .map((voice) => ({
        id: voice.voiceURI || voice.name,
        name: voice.name,
        lang: voice.lang,
      }))
  }

  async speak(text: string, settings: AppSettings) {
    if (!text.trim() || !this.canSpeak(settings)) return

    await this.stop()

    this.currentText = text
    this.setSpeaking(true)

    if (Capacitor.isNativePlatform()) {
      try {
        const voiceIndex = this.resolveNativeVoiceIndex(settings)
        await TextToSpeech.speak({
          text,
          lang: 'en-US',
          rate: this.resolveRate(settings),
          pitch: this.resolvePitch(settings),
          volume: settings.voiceVolume,
          voice: voiceIndex,
          category: 'ambient',
        })
      } catch {
        /* graceful fallback */
      } finally {
        this.setSpeaking(false)
      }
      return
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.setSpeaking(false)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = this.resolveRate(settings)
    utterance.pitch = this.resolvePitch(settings)
    utterance.volume = settings.voiceVolume
    const voice = this.pickBrowserVoice(settings)
    if (voice) utterance.voice = voice

    utterance.onend = () => {
      this.setSpeaking(false)
    }
    utterance.onerror = () => {
      this.setSpeaking(false)
    }

    window.speechSynthesis.speak(utterance)
  }

  async pause() {
    if (!this.speaking || this.paused) return

    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop()
        this.paused = true
        this.speaking = false
        this.notify()
      } catch {
        /* noop */
      }
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis.speaking) {
      window.speechSynthesis.pause()
      this.paused = true
      this.speaking = false
      this.notify()
    }
  }

  async resume(settings: AppSettings) {
    if (!this.paused || !this.currentText) return

    if (Capacitor.isNativePlatform()) {
      this.paused = false
      await this.speak(this.currentText, settings)
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
      this.paused = false
      this.speaking = true
      this.notify()
      return
    }

    this.paused = false
    await this.speak(this.currentText, settings)
  }

  async stop() {
    this.paused = false
    this.currentText = ''

    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop()
      } catch {
        /* noop */
      }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }

    this.setSpeaking(false)
  }
}

export const textToSpeechService = new TextToSpeechService()

export function getVoices() {
  return textToSpeechService.getVoices()
}

export async function preloadVoices() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    await new Promise<void>((resolve) => {
      if (window.speechSynthesis.getVoices().length > 0) {
        resolve()
        return
      }
      window.speechSynthesis.onvoiceschanged = () => resolve()
      window.setTimeout(resolve, 250)
    })
  }
  await textToSpeechService.getVoices()
}
