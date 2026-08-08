import type { QueueStrategy, TTSOptions } from '@capacitor-community/text-to-speech'
import type { AppSettings } from '../types'
import { isIosNative } from '../utils/platform'
import { resolveSpeechPitch, resolveSpeechRate, resolveSpeechVolume } from '../utils/voiceProsody'

type ProsodySettings = Pick<AppSettings, 'voiceSpeed' | 'voicePitch' | 'voiceVolume'>

/** Native plugin speak options with Settings prosody applied. */
export function buildNativeTtsOptions(params: {
  text: string
  lang: string
  settings: ProsodySettings
  voice?: number
  queueStrategy?: QueueStrategy
}): TTSOptions {
  const { text, lang, settings, voice, queueStrategy } = params

  const options: TTSOptions = {
    text,
    lang,
    rate: resolveSpeechRate(settings.voiceSpeed),
    pitch: resolveSpeechPitch(settings.voicePitch),
    volume: resolveSpeechVolume(settings.voiceVolume),
  }

  if (queueStrategy !== undefined) options.queueStrategy = queueStrategy
  if (voice !== undefined) options.voice = voice
  if (isIosNative()) options.category = 'ambient'

  return options
}
