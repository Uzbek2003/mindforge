import { Capacitor } from '@capacitor/core'
import { TextToSpeech, type TTSOptions } from '@capacitor-community/text-to-speech'

/** Plugin v8.0.2 uses lang / rate / pitch / volume. */
export const DIRECT_TTS_TEST_OPTIONS: TTSOptions = {
  text: 'Hello. This is the QuizNova native voice test.',
  lang: 'en',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}

const TEST_TIMEOUT_MS = 10_000

export interface DirectTtsTestResult {
  platform: string
  isNativePlatform: boolean
  path: 'android-native' | 'ios-native' | 'browser' | 'unsupported'
  speakOptions: TTSOptions
  success: boolean
  error: string | null
  timedOut: boolean
  log: string[]
}

let directTestRunning = false

export function isDirectNativeTestRunning() {
  return directTestRunning
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

async function executeDirectNativeTtsTest(): Promise<DirectTtsTestResult> {
  const log: string[] = []
  const platform = Capacitor.getPlatform()
  const isNativePlatform = Capacitor.isNativePlatform()

  log.push(`Capacitor.getPlatform() = ${platform}`)
  log.push(`Capacitor.isNativePlatform() = ${isNativePlatform}`)

  const speakOptions: TTSOptions = { ...DIRECT_TTS_TEST_OPTIONS }
  if (platform === 'ios') {
    speakOptions.category = 'ambient'
  }

  let path: DirectTtsTestResult['path'] = 'unsupported'
  if (platform === 'android') path = 'android-native'
  else if (platform === 'ios') path = 'ios-native'
  else path = 'browser'

  const result: DirectTtsTestResult = {
    platform,
    isNativePlatform,
    path,
    speakOptions,
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
  devConsole('Native TTS starting', { platform, speakOptions })

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
 * Returns false if a test is already running.
 */
export function startDirectNativeTtsTest(onComplete: (result: DirectTtsTestResult) => void): boolean {
  if (directTestRunning) return false

  directTestRunning = true

  void executeDirectNativeTtsTest()
    .then(onComplete)
    .catch((error) => {
      onComplete({
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
        path: 'unsupported',
        speakOptions: { ...DIRECT_TTS_TEST_OPTIONS },
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
  if (import.meta.env.DEV) {
    console.log('[QuizNova Direct TTS]', message, detail ?? '')
  }
}
