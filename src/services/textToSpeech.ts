import { Capacitor } from '@capacitor/core'
import { TextToSpeech, QueueStrategy } from '@capacitor-community/text-to-speech'
import type { AppSettings, VoicePitch, VoiceSpeed } from '../types'
import { normalizeSpeechText, TEST_VOICE_PHRASE } from '../utils/speechText'

export interface VoiceOption {
  id: string
  name: string
  lang: string
}

export type TtsStatus = 'idle' | 'speaking' | 'paused' | 'stopped'

export interface TtsState {
  isSpeaking: boolean
  isPaused: boolean
  status: TtsStatus
  voiceAvailable: boolean
  selectedVoice: VoiceOption | null
  language: string
}

type StateListener = (state: TtsState) => void

const SPEED_RATE: Record<VoiceSpeed, number> = {
  slow: 0.85,
  normal: 1.0,
  fast: 1.15,
}

const PITCH_VALUE: Record<VoicePitch, number> = {
  deep: 0.8,
  normal: 0.9,
}

const ENGLISH_LANG_PRIORITY = ['en-us', 'en-gb', 'en-ca', 'en-au']
const SPEECH_LANG = 'en-US'
const SESSION_SETTLE_MS = 150
const DEEP_VOICE_HINTS = ['david', 'mark', 'james', 'daniel', 'aaron', 'guy', 'fred', 'male', 'low', 'google uk english male']

function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.log('[QuizNova TTS]', ...args)
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

function normalizeLang(lang: string) {
  return lang.trim().replace(/_/g, '-').toLowerCase()
}

function isEnglishLang(lang: string) {
  return normalizeLang(lang).startsWith('en')
}

function englishLangRank(lang: string) {
  const norm = normalizeLang(lang)
  const idx = ENGLISH_LANG_PRIORITY.indexOf(norm)
  if (idx >= 0) return idx
  if (norm.startsWith('en')) return ENGLISH_LANG_PRIORITY.length
  return 999
}

function isNativeAndroid() {
  return Capacitor.getPlatform() === 'android'
}

export function browserPauseSupported() {
  return !Capacitor.isNativePlatform() && typeof window !== 'undefined' && 'speechSynthesis' in window
}

class TextToSpeechService {
  private sessionToken = 0
  private isSpeaking = false
  private isPaused = false
  private status: TtsStatus = 'idle'
  private currentText = ''
  private listeners = new Set<StateListener>()
  private nativeVoices: Array<{ name: string; lang: string; voiceURI: string; default?: boolean }> = []
  private supportedLanguages: string[] = []
  private selectedVoice: VoiceOption | null = null
  private language = SPEECH_LANG

  subscribe(listener: StateListener) {
    this.listeners.add(listener)
    listener(this.getState())
    return () => {
      this.listeners.delete(listener)
    }
  }

  getState(): TtsState {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
      status: this.status,
      voiceAvailable: this.hasEnglishVoice(),
      selectedVoice: this.selectedVoice,
      language: this.language,
    }
  }

  getIsSpeaking() {
    return this.isSpeaking
  }

  getIsPaused() {
    return this.isPaused
  }

  getStatus() {
    return this.status
  }

  hasEnglishVoice() {
    if (Capacitor.isNativePlatform()) {
      return this.nativeVoices.some((voice) => isEnglishLang(voice.lang))
    }
    if (typeof window === 'undefined' || !window.speechSynthesis) return false
    return window.speechSynthesis.getVoices().some((voice) => isEnglishLang(voice.lang))
  }

  private notify() {
    const state = this.getState()
    for (const listener of this.listeners) {
      listener(state)
    }
  }

  private setState(partial: Partial<Pick<TtsState, 'isSpeaking' | 'isPaused' | 'status'>>) {
    if (partial.isSpeaking !== undefined) this.isSpeaking = partial.isSpeaking
    if (partial.isPaused !== undefined) this.isPaused = partial.isPaused
    if (partial.status !== undefined) this.status = partial.status
    this.notify()
  }

  private canSpeak(settings: AppSettings) {
    return (
      settings.soundEnabled &&
      settings.voiceExplanationsEnabled &&
      settings.voiceVolume > 0 &&
      this.hasEnglishVoice()
    )
  }

  private resolveRate(settings: AppSettings) {
    return SPEED_RATE[settings.voiceSpeed]
  }

  private resolvePitch(settings: AppSettings) {
    return PITCH_VALUE[settings.voicePitch]
  }

  private rankEnglishVoice(index: number, voice: { name: string; lang: string }) {
    const langRank = englishLangRank(voice.lang)
    const deepBonus = DEEP_VOICE_HINTS.some((hint) => voice.name.toLowerCase().includes(hint)) ? 0 : 1
    return langRank * 10 + deepBonus + index * 0.001
  }

  private pickBestEnglishNativeIndex(settings: AppSettings): number | undefined {
    const english = this.nativeVoices
      .map((voice, index) => ({ voice, index }))
      .filter(({ voice }) => isEnglishLang(voice.lang))
      .sort((a, b) => this.rankEnglishVoice(a.index, a.voice) - this.rankEnglishVoice(b.index, b.voice))

    if (english.length === 0) return undefined

    if (settings.voiceId != null) {
      const selectedIndex = Number(settings.voiceId)
      if (!Number.isNaN(selectedIndex) && this.nativeVoices[selectedIndex] && isEnglishLang(this.nativeVoices[selectedIndex].lang)) {
        return selectedIndex
      }
    }

    return english[0]?.index
  }

  private pickBrowserVoice(settings: AppSettings): SpeechSynthesisVoice | undefined {
    const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []
    const english = voices.filter((voice) => isEnglishLang(voice.lang))

    if (settings.voiceId) {
      const selected = english.find(
        (voice) => voice.voiceURI === settings.voiceId || voice.name === settings.voiceId || String(voices.indexOf(voice)) === settings.voiceId,
      )
      if (selected) return selected
    }

    const sorted = [...english].sort(
      (a, b) => this.rankEnglishVoice(voices.indexOf(a), a) - this.rankEnglishVoice(voices.indexOf(b), b),
    )
    return sorted[0]
  }

  private updateSelectedVoice(settings: AppSettings) {
    if (Capacitor.isNativePlatform()) {
      const index = this.pickBestEnglishNativeIndex(settings)
      if (index == null) {
        this.selectedVoice = null
        this.language = SPEECH_LANG
        return
      }
      const voice = this.nativeVoices[index]
      this.selectedVoice = { id: String(index), name: voice.name, lang: voice.lang }
      this.language = normalizeLang(voice.lang) === 'en-us' ? SPEECH_LANG : voice.lang.replace('_', '-')
      return
    }

    const voice = this.pickBrowserVoice(settings)
    if (!voice) {
      this.selectedVoice = null
      this.language = SPEECH_LANG
      return
    }
    this.selectedVoice = {
      id: voice.voiceURI || voice.name,
      name: voice.name,
      lang: voice.lang,
    }
    this.language = voice.lang
  }

  private async ensureVoiceCatalog(settings: AppSettings) {
    if (Capacitor.isNativePlatform()) {
      try {
        const [langs, voices] = await Promise.all([
          TextToSpeech.getSupportedLanguages(),
          TextToSpeech.getSupportedVoices(),
        ])
        this.supportedLanguages = langs.languages
        this.nativeVoices = voices.voices
        devLog('platform', Capacitor.getPlatform(), 'languages', this.supportedLanguages, 'voices', this.nativeVoices)
      } catch (error) {
        devLog('voice catalog error', error)
      }
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
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

    this.updateSelectedVoice(settings)
    this.notify()
  }

  async getVoices(): Promise<VoiceOption[]> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await TextToSpeech.getSupportedVoices()
        this.nativeVoices = result.voices
        return result.voices
          .map((voice, index) => ({ voice, index }))
          .filter(({ voice }) => isEnglishLang(voice.lang))
          .sort((a, b) => this.rankEnglishVoice(a.index, a.voice) - this.rankEnglishVoice(b.index, b.voice))
          .map(({ voice, index }) => ({
            id: String(index),
            name: voice.name,
            lang: voice.lang.replace('_', '-'),
          }))
      } catch {
        return []
      }
    }

    const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []
    return voices
      .filter((voice) => isEnglishLang(voice.lang))
      .sort((a, b) => englishLangRank(a.lang) - englishLangRank(b.lang))
      .map((voice) => ({
        id: voice.voiceURI || voice.name,
        name: voice.name,
        lang: voice.lang,
      }))
  }

  private async hardStop(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop()
      } catch (error) {
        devLog('native stop error', error)
      }
    }

    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }

  async stop(): Promise<void> {
    this.sessionToken += 1
    devLog('stop requested', { sessionToken: this.sessionToken })

    try {
      await this.hardStop()
    } catch (error) {
      devLog('stop threw', error)
    }

    this.currentText = ''
    this.setState({ isSpeaking: false, isPaused: false, status: 'stopped' })
  }

  private async beginSession(): Promise<number> {
    await this.hardStop()
    this.sessionToken += 1
    const token = this.sessionToken
    devLog('session begin', { sessionToken: token })
    await delay(SESSION_SETTLE_MS)
    return token
  }

  async speak(text: string, settings: AppSettings): Promise<void> {
    if (!text.trim() || !this.canSpeak(settings)) {
      devLog('speak skipped', { empty: !text.trim(), canSpeak: this.canSpeak(settings) })
      return
    }

    await this.ensureVoiceCatalog(settings)

    const token = await this.beginSession()
    if (token !== this.sessionToken) return

    const normalized = normalizeSpeechText(text)
    this.currentText = normalized

    const rate = this.resolveRate(settings)
    const pitch = this.resolvePitch(settings)
    const volume = settings.voiceVolume

    this.updateSelectedVoice(settings)
    this.setState({ isSpeaking: true, isPaused: false, status: 'speaking' })

    devLog('speak started', {
      sessionToken: token,
      platform: Capacitor.getPlatform(),
      language: this.language,
      voice: this.selectedVoice,
      rate,
      pitch,
      volume,
    })

    if (Capacitor.isNativePlatform()) {
      const voiceIndex = this.pickBestEnglishNativeIndex(settings)
      if (voiceIndex == null) {
        this.setState({ isSpeaking: false, isPaused: false, status: 'idle' })
        return
      }

      try {
        await TextToSpeech.speak({
          text: normalized,
          lang: SPEECH_LANG,
          rate,
          pitch,
          volume,
          voice: voiceIndex,
          queueStrategy: QueueStrategy.Flush,
        })
      } catch (error) {
        devLog('native speak error', error)
      } finally {
        if (token === this.sessionToken) {
          devLog('speak completed', { sessionToken: token })
          this.setState({ isSpeaking: false, isPaused: false, status: 'idle' })
        }
      }
      return
    }

    if (typeof window === 'undefined' || !window.speechSynthesis) {
      this.setState({ isSpeaking: false, isPaused: false, status: 'idle' })
      return
    }

    await new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(normalized)
      utterance.lang = SPEECH_LANG
      utterance.rate = rate
      utterance.pitch = pitch
      utterance.volume = volume
      const voice = this.pickBrowserVoice(settings)
      if (voice) utterance.voice = voice

      utterance.onend = () => {
        if (token === this.sessionToken) {
          devLog('speak completed', { sessionToken: token })
          this.setState({ isSpeaking: false, isPaused: false, status: 'idle' })
        }
        resolve()
      }
      utterance.onerror = () => {
        if (token === this.sessionToken) {
          this.setState({ isSpeaking: false, isPaused: false, status: 'idle' })
        }
        resolve()
      }

      window.speechSynthesis.speak(utterance)
    })
  }

  async replay(text: string, settings: AppSettings): Promise<void> {
    devLog('replay requested')
    await this.stop()
    await delay(SESSION_SETTLE_MS)
    if (!this.canSpeak(settings)) return
    await this.speak(text, settings)
  }

  async pause(): Promise<void> {
    if (!this.isSpeaking || this.isPaused) return

    if (isNativeAndroid()) {
      devLog('pause unavailable on Android')
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      this.setState({ isSpeaking: false, isPaused: true, status: 'paused' })
      devLog('browser paused')
    }
  }

  async resume(settings: AppSettings): Promise<void> {
    if (!this.isPaused) return

    if (isNativeAndroid()) {
      await this.replay(this.currentText, settings)
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume()
      this.setState({ isSpeaking: true, isPaused: false, status: 'speaking' })
      devLog('browser resumed')
      return
    }

    if (this.currentText) {
      await this.replay(this.currentText, settings)
    }
  }

  async initializeCatalog(settings: AppSettings) {
    await this.ensureVoiceCatalog(settings)
  }

  async testVoice(settings: AppSettings): Promise<void> {
    await this.speak(TEST_VOICE_PHRASE, settings)
  }
}

export const textToSpeechService = new TextToSpeechService()

export function getVoices() {
  return textToSpeechService.getVoices()
}

export async function preloadVoices(settings?: AppSettings) {
  if (settings) {
    await textToSpeechService.initializeCatalog(settings)
  } else if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.getVoices()
    await delay(250)
  }
  await textToSpeechService.getVoices()
}
