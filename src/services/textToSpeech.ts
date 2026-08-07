import { Capacitor } from '@capacitor/core'
import { TextToSpeech, QueueStrategy, type TTSOptions } from '@capacitor-community/text-to-speech'
import type { AppSettings, VoicePitch, VoiceSpeed } from '../types'
import { normalizeSpeechText, TEST_VOICE_PHRASE } from '../utils/speechText'
import { isDirectNativeTestRunning } from './directNativeTtsTest'

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
  voiceUnavailable: boolean
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

const ENGLISH_LANG_PRIORITY = ['en', 'en-us', 'en-gb', 'en-ca', 'en-au']
const NATIVE_LOCALES = ['en', 'en-US'] as const
const SESSION_SETTLE_MS = 150
const DEFAULT_SYSTEM_VOICE: VoiceOption = {
  id: '',
  name: 'System default (English)',
  lang: 'en',
}

function devLog(...args: unknown[]) {
  if (import.meta.env.DEV) {
    console.log('[QuizNova TTS]', ...args)
  }
}

function delay(ms: number) {
  return new Promise<void>((resolve) => window.setTimeout(resolve, ms))
}

export function normalizeLang(lang: string) {
  return lang.trim().replace(/_/g, '-').toLowerCase()
}

export function isEnglishLang(lang: string) {
  const norm = normalizeLang(lang)
  return norm === 'en' || norm.startsWith('en-')
}

function englishLangRank(lang: string) {
  const norm = normalizeLang(lang)
  const idx = ENGLISH_LANG_PRIORITY.indexOf(norm)
  if (idx >= 0) return idx
  if (norm.startsWith('en')) return ENGLISH_LANG_PRIORITY.length
  return 999
}

export function isAndroidNative() {
  return Capacitor.getPlatform() === 'android'
}

export function isNativeTtsPath() {
  return Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios'
}

export function browserPauseSupported() {
  return !isNativeTtsPath() && typeof window !== 'undefined' && 'speechSynthesis' in window
}

function formatError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`
  try {
    return JSON.stringify(error)
  } catch {
    return String(error)
  }
}

class TextToSpeechService {
  private sessionToken = 0
  private isSpeaking = false
  private isPaused = false
  private status: TtsStatus = 'idle'
  private voiceUnavailable = false
  private currentText = ''
  private listeners = new Set<StateListener>()
  private nativeVoices: Array<{ name: string; lang: string; voiceURI: string; default?: boolean }> = []
  private supportedLanguages: string[] = []
  private selectedVoice: VoiceOption | null = null
  private language = 'en'
  private onClearVoiceId: (() => void) | null = null

  setVoiceIdClearHandler(handler: () => void) {
    this.onClearVoiceId = handler
  }

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
      voiceUnavailable: this.voiceUnavailable,
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

  private notify() {
    for (const listener of this.listeners) {
      listener(this.getState())
    }
  }

  private setState(partial: Partial<Pick<TtsState, 'isSpeaking' | 'isPaused' | 'status' | 'voiceUnavailable'>>) {
    if (partial.isSpeaking !== undefined) this.isSpeaking = partial.isSpeaking
    if (partial.isPaused !== undefined) this.isPaused = partial.isPaused
    if (partial.status !== undefined) this.status = partial.status
    if (partial.voiceUnavailable !== undefined) this.voiceUnavailable = partial.voiceUnavailable
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

  private resolveExplicitNativeVoiceIndex(settings: AppSettings): number | undefined {
    if (settings.voiceId == null || settings.voiceId === '') return undefined

    const selectedIndex = Number(settings.voiceId)
    if (Number.isNaN(selectedIndex)) return undefined

    const voice = this.nativeVoices[selectedIndex]
    if (!voice || !isEnglishLang(voice.lang)) return undefined

    return selectedIndex
  }

  private clearInvalidStoredVoice(settings: AppSettings) {
    if (settings.voiceId == null || settings.voiceId === '') return
    if (!isNativeTtsPath()) return
    if (this.nativeVoices.length === 0) return

    if (this.resolveExplicitNativeVoiceIndex(settings) === undefined) {
      devLog('clearing invalid stored voice', settings.voiceId)
      this.onClearVoiceId?.()
    }
  }

  private pickBrowserVoice(settings: AppSettings): SpeechSynthesisVoice | undefined {
    if (!settings.voiceId) return undefined

    const voices = typeof window !== 'undefined' ? window.speechSynthesis.getVoices() : []
    const english = voices.filter((voice) => isEnglishLang(voice.lang))

    return english.find(
      (voice) =>
        voice.voiceURI === settings.voiceId ||
        voice.name === settings.voiceId ||
        String(voices.indexOf(voice)) === settings.voiceId,
    )
  }

  private updateSelectedVoice(settings: AppSettings) {
    if (isNativeTtsPath()) {
      const index = this.resolveExplicitNativeVoiceIndex(settings)
      if (index == null) {
        this.selectedVoice = DEFAULT_SYSTEM_VOICE
        this.language = 'en'
        return
      }
      const voice = this.nativeVoices[index]
      this.selectedVoice = {
        id: String(index),
        name: voice.name,
        lang: voice.lang.replace(/_/g, '-'),
      }
      this.language = voice.lang.replace(/_/g, '-')
      return
    }

    const voice = this.pickBrowserVoice(settings)
    if (!voice) {
      this.selectedVoice = DEFAULT_SYSTEM_VOICE
      this.language = 'en'
      return
    }
    this.selectedVoice = {
      id: voice.voiceURI || voice.name,
      name: voice.name,
      lang: voice.lang,
    }
    this.language = voice.lang
  }

  async initializeCatalog(settings: AppSettings) {
    if (isNativeTtsPath()) {
      try {
        const [langs, voices] = await Promise.all([
          TextToSpeech.getSupportedLanguages(),
          TextToSpeech.getSupportedVoices(),
        ])
        this.supportedLanguages = langs.languages
        this.nativeVoices = voices.voices
        devLog('detected languages', this.supportedLanguages)
        devLog('detected voices', this.nativeVoices)
      } catch (error) {
        devLog('voice catalog error (continuing anyway)', error)
      }
    } else if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.getVoices()
      await delay(250)
      devLog('detected voices', window.speechSynthesis.getVoices())
    }

    this.clearInvalidStoredVoice(settings)
    this.updateSelectedVoice(settings)
    this.notify()
  }

  async getVoices(): Promise<VoiceOption[]> {
    if (isNativeTtsPath()) {
      try {
        const result = await TextToSpeech.getSupportedVoices()
        this.nativeVoices = result.voices
        return result.voices
          .map((voice, index) => ({ voice, index }))
          .filter(({ voice }) => isEnglishLang(voice.lang))
          .sort((a, b) => englishLangRank(a.voice.lang) - englishLangRank(b.voice.lang))
          .map(({ voice, index }) => ({
            id: String(index),
            name: voice.name,
            lang: voice.lang.replace(/_/g, '-'),
          }))
      } catch (error) {
        devLog('getVoices error', error)
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

  private buildNativeSpeakOptions(
    text: string,
    lang: string,
    settings: AppSettings,
    explicitVoice?: number,
  ): TTSOptions {
    const options: TTSOptions = {
      text,
      lang,
      rate: this.resolveRate(settings),
      pitch: this.resolvePitch(settings),
      volume: settings.voiceVolume,
      queueStrategy: QueueStrategy.Flush,
    }

    if (explicitVoice !== undefined) {
      options.voice = explicitVoice
    }

    if (Capacitor.getPlatform() === 'ios') {
      options.category = 'ambient'
    }

    return options
  }

  private async nativeSpeak(text: string, settings: AppSettings, token: number): Promise<void> {
    const explicitVoice = this.resolveExplicitNativeVoiceIndex(settings)

    if (settings.voiceId != null && settings.voiceId !== '' && explicitVoice === undefined && this.nativeVoices.length > 0) {
      this.onClearVoiceId?.()
      this.updateSelectedVoice({ ...settings, voiceId: null })
    }

    devLog('platform', Capacitor.getPlatform(), 'isNative', Capacitor.isNativePlatform())
    devLog('selected voice', this.selectedVoice)

    let lastError: unknown = null

    for (const lang of NATIVE_LOCALES) {
      const speakParams = this.buildNativeSpeakOptions(text, lang, settings, explicitVoice)
      devLog('speak params', speakParams)

      try {
        await TextToSpeech.speak(speakParams)
        if (token !== this.sessionToken) return
        this.language = lang
        this.setState({ voiceUnavailable: false })
        devLog('native speak completed', { lang, sessionToken: token })
        return
      } catch (error) {
        lastError = error
        devLog('native speak error', { lang, error: formatError(error) })
        if (lang === NATIVE_LOCALES[NATIVE_LOCALES.length - 1]) {
          if (token === this.sessionToken) {
            this.setState({ voiceUnavailable: true })
          }
          throw error
        }
      }
    }

    if (lastError) throw lastError
  }

  private async hardStop(): Promise<void> {
    if (isDirectNativeTestRunning()) return

    if (isNativeTtsPath()) {
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
    if (isDirectNativeTestRunning()) return

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

    const token = await this.beginSession()
    if (token !== this.sessionToken) return

    const normalized = normalizeSpeechText(text)
    this.currentText = normalized
    this.updateSelectedVoice(settings)
    this.setState({ isSpeaking: true, isPaused: false, status: 'speaking' })

    try {
      if (isNativeTtsPath()) {
        await this.nativeSpeak(normalized, settings, token)
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        const rate = this.resolveRate(settings)
        const pitch = this.resolvePitch(settings)
        const volume = settings.voiceVolume
        const voice = this.pickBrowserVoice(settings)

        devLog('browser speak params', { lang: 'en', rate, pitch, volume, voice: voice?.name })

        await new Promise<void>((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(normalized)
          utterance.lang = 'en'
          utterance.rate = rate
          utterance.pitch = pitch
          utterance.volume = volume
          if (voice) utterance.voice = voice

          utterance.onend = () => {
            if (token === this.sessionToken) {
              this.setState({ voiceUnavailable: false })
              devLog('browser speak completed', { sessionToken: token })
            }
            resolve()
          }
          utterance.onerror = (event) => {
            const errorType = typeof event.error === 'string' ? event.error : ''
            // Normal when stop()/cancel() interrupts the current utterance.
            if (errorType === 'interrupted' || errorType === 'canceled') {
              devLog('browser speak interrupted', errorType)
              resolve()
              return
            }
            // Auto-play without a fresh user gesture often fails on web; keep voice usable.
            if (errorType === 'not-allowed') {
              devLog('browser speak not-allowed (needs user gesture)', { sessionToken: token })
              resolve()
              return
            }
            devLog('browser speak error', errorType || formatError(event))
            if (
              token === this.sessionToken &&
              (errorType === 'synthesis-unavailable' ||
                errorType === 'language-unavailable' ||
                errorType === 'voice-unavailable')
            ) {
              this.setState({ voiceUnavailable: true })
            }
            reject(new Error(errorType || 'browser-speech-error'))
          }

          window.speechSynthesis.speak(utterance)
        })
      } else {
        this.setState({ voiceUnavailable: true })
      }
    } catch (error) {
      const message = formatError(error)
      devLog('speak failed', message)
      // Avoid sticky unavailable state for transient web/autoplay failures.
      if (
        token === this.sessionToken &&
        !isNativeTtsPath() &&
        /not-allowed|interrupted|canceled/i.test(message)
      ) {
        /* keep voiceAvailable for transient web autoplay blocks */
      } else if (
        token === this.sessionToken &&
        isNativeTtsPath() &&
        !/interrupted|canceled/i.test(message)
      ) {
        this.setState({ voiceUnavailable: true })
      }
    } finally {
      if (token === this.sessionToken) {
        this.setState({ isSpeaking: false, isPaused: false, status: 'idle' })
      }
    }
  }

  async replay(text: string, settings: AppSettings): Promise<void> {
    devLog('replay requested')
    await this.stop()
    await delay(SESSION_SETTLE_MS)
    if (!this.canSpeak(settings)) return
    await this.speak(text, settings)
  }

  async pause(): Promise<void> {
    if (!this.isSpeaking || this.isPaused || isAndroidNative()) return

    if (typeof window !== 'undefined' && window.speechSynthesis?.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause()
      this.setState({ isSpeaking: false, isPaused: true, status: 'paused' })
      devLog('browser paused')
    }
  }

  async resume(settings: AppSettings): Promise<void> {
    if (!this.isPaused) return

    if (isAndroidNative()) {
      await this.replay(this.currentText, settings)
      return
    }

    if (typeof window !== 'undefined' && window.speechSynthesis?.paused) {
      window.speechSynthesis.resume()
      this.setState({ isSpeaking: true, isPaused: false, status: 'speaking' })
      return
    }

    if (this.currentText) {
      await this.replay(this.currentText, settings)
    }
  }

  async testVoice(settings: AppSettings): Promise<void> {
    if (!settings.soundEnabled || settings.voiceVolume <= 0) return
    // Allow the Settings "Test voice" button even if the main toggle was just flipped on.
    await this.speak(TEST_VOICE_PHRASE, { ...settings, voiceExplanationsEnabled: true })
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
