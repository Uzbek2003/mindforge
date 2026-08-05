import { Capacitor } from '@capacitor/core'
import { TextToSpeech, type TTSOptions } from '@capacitor-community/text-to-speech'

/** Plugin v8.0.2 uses lang / rate / pitch / volume — not locale / speechRate / pitchRate. */
export const DIRECT_TTS_TEST_OPTIONS: TTSOptions = {
  text: 'Hello. This is the QuizNova native voice test.',
  lang: 'en',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
}

export interface DirectTtsTestResult {
  platform: string
  isNativePlatform: boolean
  path: 'android-native' | 'ios-native' | 'browser' | 'unsupported'
  speakOptions: TTSOptions
  success: boolean
  error: string | null
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

export async function runDirectNativeTtsTest(): Promise<DirectTtsTestResult> {
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
    log,
  }

  if (platform !== 'android' && platform !== 'ios') {
    result.error = 'Direct native test requires Capacitor.getPlatform() === "android" or "ios".'
    log.push(result.error)
    return result
  }

  directTestRunning = true
  try {
    log.push(`Calling TextToSpeech.speak(${JSON.stringify(speakOptions)})`)
    devConsole('Native TTS starting', { platform, speakOptions })
    await TextToSpeech.speak(speakOptions)
    log.push('Native TTS completed')
    devConsole('Native TTS completed')
    result.success = true
  } catch (error) {
    const message = formatError(error)
    console.error('Native TTS failed', error)
    log.push(`Native TTS failed: ${message}`)
    result.error = message
  } finally {
    directTestRunning = false
  }

  return result
}

export async function stopDirectNativeTtsTest(): Promise<void> {
  if (Capacitor.getPlatform() !== 'android' && Capacitor.getPlatform() !== 'ios') return
  try {
    await TextToSpeech.stop()
    devConsole('Native TTS stop completed')
  } catch (error) {
    console.error('Native TTS stop failed', error)
    throw error
  }
}

function devConsole(message: string, detail?: unknown) {
  if (import.meta.env.DEV) {
    console.log('[QuizNova Direct TTS]', message, detail ?? '')
  }
}
