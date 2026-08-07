import { Capacitor } from '@capacitor/core'
import { TextToSpeech, type TTSOptions } from '@capacitor-community/text-to-speech'
import type { AppSettings } from '../types'
import {
  logProsodyDiagnostics,
  normalizeVoicePitch,
  resolveSpeechPitch,
  resolveSpeechRate,
  resolveSpeechVolume,
} from '../utils/voiceProsody'

/** Base phrase/options for the manual native plugin test. Rate/pitch come from Settings. */
export const DIRECT_TTS_TEST_BASE = {
  text: 'Hello. This is the QuizNova native voice test.',
  lang: 'en',
  volume: 1.0,
} as const

/** @deprecated Prefer buildDirectNativeSpeakOptions(settings). Kept for Settings debug display fallback. */
export const DIRECT_TTS_TEST_OPTIONS: TTSOptions = {
  text: DIRECT_TTS_TEST_BASE.text,
  lang: DIRECT_TTS_TEST_BASE.lang,
  rate: 1.0,
  pitch: 1.0,
  volume: DIRECT_TTS_TEST_BASE.volume,
}

const TEST_TIMEOUT_MS = 10_000

export interface DirectTtsTestResult {
  platform: string
  isNativePlatform: boolean
  path: 'android-native' | 'ios-native' | 'browser' | 'unsupported'
  speakOptions: TTSOptions
  uiSpeed: string
  uiPitch: string
  uiVolume: number
  numericRate: number
  numericPitch: number
  numericVolume: number
  success: boolean
  error: string | null
  timedOut: boolean
  log: string[]
}

let directTestRunning = false

export function isDirectNativeTestRunning() {
  return directTestRunning
}

export function buildDirectNativeSpeakOptions(
  settings: Pick<AppSettings, 'voiceSpeed' | 'voicePitch' | 'voiceVolume'>,
): TTSOptions {
  const rate = resolveSpeechRate(settings.voiceSpeed)
  const pitch = resolveSpeechPitch(settings.voicePitch)
  const volume = resolveSpeechVolume(settings.voiceVolume)
  const options: TTSOptions = {
    text: DIRECT_TTS_TEST_BASE.text,
    lang: DIRECT_TTS_TEST_BASE.lang,
    rate,
    pitch,
    volume,
  }
  if (Capacitor.getPlatform() === 'ios') {
    options.category = 'ambient'
  }
  return options
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}${error.stack ? `\n${error.stack}` : ''}`
  }
  try {
    return JSON.stringify(error, null, 2)
  } catch {
    return String(error)
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(message)), ms)
    }),
  ])
}

async function executeDirectNativeTtsTest(
  settings: Pick<AppSettings, 'voiceSpeed' | 'voicePitch' | 'voiceVolume'>,
): Promise<DirectTtsTestResult> {
  const log: string[] = []
  const platform = Capacitor.getPlatform()
  const isNativePlatform = Capacitor.isNativePlatform()

  log.push(`Capacitor.getPlatform() = ${platform}`)
  log.push(`Capacitor.isNativePlatform() = ${isNativePlatform}`)

  const speakOptions = buildDirectNativeSpeakOptions(settings)
  const uiSpeed = settings.voiceSpeed
  const uiPitch = normalizeVoicePitch(settings.voicePitch)
  const uiVolume = resolveSpeechVolume(settings.voiceVolume)
  const numericRate = speakOptions.rate ?? 1
  const numericPitch = speakOptions.pitch ?? 1
  const numericVolume = speakOptions.volume ?? 1

  log.push(`UI speed=${uiSpeed} → numeric rate=${numericRate}`)
  log.push(`UI pitch=${uiPitch} → numeric pitch=${numericPitch}`)
  log.push(`UI volume=${uiVolume} → numeric volume=${numericVolume}`)

  logProsodyDiagnostics(
    'native-tts-test',
    {
      voiceSpeed: settings.voiceSpeed,
      voicePitch: settings.voicePitch,
      voiceVolume: settings.voiceVolume,
    },
    { rate: numericRate, pitch: numericPitch, volume: numericVolume },
    { platform, text: speakOptions.text },
  )

  let path: DirectTtsTestResult['path'] = 'unsupported'
  if (platform === 'android') path = 'android-native'
  else if (platform === 'ios') path = 'ios-native'
  else path = 'browser'

  const result: DirectTtsTestResult = {
    platform,
    isNativePlatform,
    path,
    speakOptions,
    uiSpeed,
    uiPitch,
    uiVolume,
    numericRate,
    numericPitch,
    numericVolume,
    success: false,
    error: null,
    timedOut: false,
    log,
  }

  if (platform !== 'android' && platform !== 'ios') {
    result.error = 'Native TTS test requires Capacitor.getPlatform() === "android" or "ios".'
    log.push(result.error)
    return result
  }

  log.push(`Calling TextToSpeech.speak(${JSON.stringify(speakOptions)})`)
  devConsole('Native TTS starting', { platform, speakOptions, uiSpeed, uiPitch })

  try {
    await withTimeout(
      TextToSpeech.speak(speakOptions),
      TEST_TIMEOUT_MS,
      `Native TTS timed out after ${TEST_TIMEOUT_MS / 1000} seconds`,
    )
    log.push('Native TTS completed')
    devConsole('Native TTS completed')
    result.success = true
  } catch (error) {
    const message = formatError(error)
    console.error('Native TTS failed', error)
    log.push(`Native TTS failed: ${message}`)
    result.error = message
    result.timedOut = message.includes('timed out')
  }

  return result
}

/**
 * Starts a native TTS test without blocking the caller.
 * Uses the current Settings speed/pitch/volume so Android QA can hear differences.
 * Returns false if a test is already running.
 */
export function startDirectNativeTtsTest(
  onComplete: (result: DirectTtsTestResult) => void,
  settings: Pick<AppSettings, 'voiceSpeed' | 'voicePitch' | 'voiceVolume'>,
): boolean {
  if (directTestRunning) return false

  directTestRunning = true

  void executeDirectNativeTtsTest(settings)
    .then(onComplete)
    .catch((error) => {
      const speakOptions = buildDirectNativeSpeakOptions(settings)
      onComplete({
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
        path: 'unsupported',
        speakOptions,
        uiSpeed: settings.voiceSpeed,
        uiPitch: normalizeVoicePitch(settings.voicePitch),
        uiVolume: resolveSpeechVolume(settings.voiceVolume),
        numericRate: speakOptions.rate ?? 1,
        numericPitch: speakOptions.pitch ?? 1,
        numericVolume: speakOptions.volume ?? 1,
        success: false,
        error: formatError(error),
        timedOut: false,
        log: [`Unhandled test error: ${formatError(error)}`],
      })
    })
    .finally(() => {
      directTestRunning = false
    })

  return true
}

/** Manual stop only — fire-and-forget, never awaited by lifecycle code. */
export function requestDirectNativeTtsStop(): void {
  if (Capacitor.getPlatform() !== 'android' && Capacitor.getPlatform() !== 'ios') return
  void TextToSpeech.stop().catch((error) => {
    console.error('Native TTS stop failed', error)
  })
}

function devConsole(message: string, detail?: unknown) {
  // Always log during temporary Android prosody diagnostics.
  console.log('[QuizNova Direct TTS]', message, detail ?? '')
}
