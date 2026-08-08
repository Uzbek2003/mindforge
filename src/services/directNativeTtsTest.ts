import { TextToSpeech, type TTSOptions } from '@capacitor-community/text-to-speech'
import type { AppSettings } from '../types'
import { formatError } from '../utils/errors'
import { isNativeTtsPath } from '../utils/platform'
import { buildNativeTtsOptions } from './ttsOptions'

/** Base phrase for the manual native plugin test. Rate/pitch/volume come from Settings. */
export const DIRECT_TTS_TEST_BASE = {
  text: 'Hello. This is the QuizNova native voice test.',
  lang: 'en',
  volume: 1.0,
} as const

const TEST_TIMEOUT_MS = 10_000

export interface DirectTtsTestResult {
  success: boolean
  error: string | null
  timedOut: boolean
}

let directTestRunning = false

export function isDirectNativeTestRunning() {
  return directTestRunning
}

export function buildDirectNativeSpeakOptions(
  settings: Pick<AppSettings, 'voiceSpeed' | 'voicePitch' | 'voiceVolume'>,
): TTSOptions {
  return buildNativeTtsOptions({
    text: DIRECT_TTS_TEST_BASE.text,
    lang: DIRECT_TTS_TEST_BASE.lang,
    settings,
  })
}

function describeError(error: unknown): string {
  return formatError(error, { includeStack: true, pretty: true })
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
  const result: DirectTtsTestResult = {
    success: false,
    error: null,
    timedOut: false,
  }

  if (!isNativeTtsPath()) {
    result.error = 'Native TTS test requires Capacitor.getPlatform() === "android" or "ios".'
    return result
  }

  const speakOptions = buildDirectNativeSpeakOptions(settings)

  try {
    await withTimeout(
      TextToSpeech.speak(speakOptions),
      TEST_TIMEOUT_MS,
      `Native TTS timed out after ${TEST_TIMEOUT_MS / 1000} seconds`,
    )
    result.success = true
  } catch (error) {
    const message = describeError(error)
    console.error('Native TTS failed', error)
    result.error = message
    result.timedOut = message.includes('timed out')
  }

  return result
}

/**
 * Starts a native TTS test without blocking the caller.
 * Uses the current Settings speed/pitch/volume.
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
      onComplete({
        success: false,
        error: describeError(error),
        timedOut: false,
      })
    })
    .finally(() => {
      directTestRunning = false
    })

  return true
}

/** Manual stop only — fire-and-forget, never awaited by lifecycle code. */
export function requestDirectNativeTtsStop(): void {
  if (!isNativeTtsPath()) return
  void TextToSpeech.stop().catch((error) => {
    console.error('Native TTS stop failed', error)
  })
}
