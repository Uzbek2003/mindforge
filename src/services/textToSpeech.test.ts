import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppSettings } from '../types'
import { TEST_VOICE_PHRASE } from '../utils/speechText'

let platform = 'web'
const nativeVoices = {
  voices: [
    { name: 'Deutsch', lang: 'de-DE', voiceURI: 'de' },
    { name: 'British', lang: 'en-GB', voiceURI: 'en-gb' },
    { name: 'American', lang: 'en_US', voiceURI: 'en-us' },
    { name: 'Plain English', lang: 'en', voiceURI: 'en' },
  ],
}

const nativeSpeak = vi.fn(async () => {})
const nativeStop = vi.fn(async () => {})
const getSupportedVoices = vi.fn(async () => nativeVoices)
const getSupportedLanguages = vi.fn(async () => ({ languages: ['en-US', 'de-DE'] }))

vi.mock('@capacitor/core', () => ({
  Capacitor: {
    getPlatform: () => platform,
    isNativePlatform: () => platform !== 'web',
  },
}))

vi.mock('@capacitor-community/text-to-speech', () => ({
  TextToSpeech: {
    speak: (options: unknown) => nativeSpeak(options as never),
    stop: () => nativeStop(),
    getSupportedVoices: () => getSupportedVoices(),
    getSupportedLanguages: () => getSupportedLanguages(),
  },
  QueueStrategy: { Add: 0, Flush: 1 },
}))

interface FakeUtterance {
  text: string
  lang: string
  rate: number
  pitch: number
  volume: number
  voice: unknown
  onend: (() => void) | null
  onerror: ((event: { error: string }) => void) | null
}

const spokenUtterances: FakeUtterance[] = []
let utteranceOutcome: 'end' | { error: string } = 'end'
const cancel = vi.fn()

class FakeUtteranceImpl implements FakeUtterance {
  lang = ''
  rate = 1
  pitch = 1
  volume = 1
  voice: unknown = null
  onend: (() => void) | null = null
  onerror: ((event: { error: string }) => void) | null = null
  constructor(public text: string) {}
}

const browserVoices = [
  { name: 'German', lang: 'de-DE', voiceURI: 'german' },
  { name: 'Aussie', lang: 'en-AU', voiceURI: 'aussie' },
  { name: 'US English', lang: 'en-US', voiceURI: 'us' },
]

vi.stubGlobal('window', {
  speechSynthesis: {
    speaking: false,
    paused: false,
    getVoices: () => browserVoices,
    speak: (utterance: FakeUtterance) => {
      spokenUtterances.push(utterance)
      queueMicrotask(() => {
        if (utteranceOutcome === 'end') utterance.onend?.()
        else utterance.onerror?.(utteranceOutcome)
      })
    },
    cancel,
    pause: vi.fn(),
    resume: vi.fn(),
  },
  setTimeout: (callback: () => void) => {
    callback()
    return 0
  },
})
vi.stubGlobal('SpeechSynthesisUtterance', FakeUtteranceImpl)

const {
  browserPauseSupported,
  isAndroidNative,
  isEnglishLang,
  isNativeTtsPath,
  normalizeLang,
  textToSpeechService,
} = await import('./textToSpeech')

const settings: AppSettings = {
  soundEnabled: true,
  vibrationEnabled: true,
  textSize: 'normal',
  reduceAnimations: false,
  voiceExplanationsEnabled: true,
  voiceAutoPlay: false,
  voiceId: null,
  voiceSpeed: 'normal',
  voicePitch: 'normal',
  voiceVolume: 1,
  stopSpeechOnLeave: true,
}

beforeEach(() => {
  platform = 'web'
  utteranceOutcome = 'end'
  spokenUtterances.length = 0
  vi.clearAllMocks()
  getSupportedVoices.mockResolvedValue(nativeVoices)
  getSupportedLanguages.mockResolvedValue({ languages: ['en-US', 'de-DE'] })
})

describe('language helpers', () => {
  it('normalizes locale separators and casing', () => {
    expect(normalizeLang(' en_US ')).toBe('en-us')
    expect(normalizeLang('EN-GB')).toBe('en-gb')
  })

  it('recognizes English variants only', () => {
    expect(isEnglishLang('en')).toBe(true)
    expect(isEnglishLang('en_US')).toBe(true)
    expect(isEnglishLang('EN-GB')).toBe(true)
    expect(isEnglishLang('de-DE')).toBe(false)
    expect(isEnglishLang('eng')).toBe(false)
  })
})

describe('platform helpers', () => {
  it('detects the native TTS path per platform', () => {
    platform = 'web'
    expect(isNativeTtsPath()).toBe(false)
    expect(isAndroidNative()).toBe(false)
    expect(browserPauseSupported()).toBe(true)

    platform = 'android'
    expect(isNativeTtsPath()).toBe(true)
    expect(isAndroidNative()).toBe(true)
    expect(browserPauseSupported()).toBe(false)

    platform = 'ios'
    expect(isNativeTtsPath()).toBe(true)
    expect(isAndroidNative()).toBe(false)
    expect(browserPauseSupported()).toBe(false)
  })
})

describe('getVoices', () => {
  it('returns English browser voices ordered by locale priority', async () => {
    const voices = await textToSpeechService.getVoices()
    expect(voices.map((voice) => voice.name)).toEqual(['US English', 'Aussie'])
    expect(voices[0].id).toBe('us')
  })

  it('returns English native voices keyed by catalog index', async () => {
    platform = 'android'
    const voices = await textToSpeechService.getVoices()
    expect(voices.map((voice) => voice.name)).toEqual(['Plain English', 'American', 'British'])
    expect(voices.map((voice) => voice.id)).toEqual(['3', '2', '1'])
    expect(voices.every((voice) => voice.lang.includes('_'))).toBe(false)
  })

  it('returns no voices when the native catalog fails', async () => {
    platform = 'android'
    getSupportedVoices.mockRejectedValue(new Error('no engine'))
    expect(await textToSpeechService.getVoices()).toEqual([])
  })
})

describe('speak on the browser path', () => {
  it('skips empty text and muted settings', async () => {
    await textToSpeechService.speak('   ', settings)
    await textToSpeechService.speak('hello', { ...settings, soundEnabled: false })
    await textToSpeechService.speak('hello', { ...settings, voiceExplanationsEnabled: false })
    await textToSpeechService.speak('hello', { ...settings, voiceVolume: 0 })
    expect(spokenUtterances).toHaveLength(0)
  })

  it('speaks normalized text with the resolved prosody', async () => {
    await textToSpeechService.speak('2 + 2 is 4 🎉', {
      ...settings,
      voiceSpeed: 'fast',
      voicePitch: 'deep' as AppSettings['voicePitch'],
      voiceVolume: 0.456,
    })

    expect(spokenUtterances).toHaveLength(1)
    expect(spokenUtterances[0].text).toBe('2 plus 2 is 4.')
    expect(spokenUtterances[0].rate).toBe(1.5)
    expect(spokenUtterances[0].pitch).toBe(0.6)
    expect(spokenUtterances[0].volume).toBe(0.46)
    expect(spokenUtterances[0].lang).toBe('en')
  })

  it('reports speaking then idle to subscribers', async () => {
    const statuses: string[] = []
    const unsubscribe = textToSpeechService.subscribe((state) => statuses.push(state.status))

    await textToSpeechService.speak('hello there', settings)
    unsubscribe()

    expect(statuses).toContain('speaking')
    expect(statuses[statuses.length - 1]).toBe('idle')
    expect(textToSpeechService.getIsSpeaking()).toBe(false)
    expect(textToSpeechService.getStatus()).toBe('idle')
  })

  it('keeps the voice usable after an autoplay block', async () => {
    utteranceOutcome = { error: 'not-allowed' }
    await textToSpeechService.speak('hello there', settings)
    expect(textToSpeechService.getState().voiceUnavailable).toBe(false)
  })

  it('flags the voice unavailable when synthesis is missing', async () => {
    utteranceOutcome = { error: 'synthesis-unavailable' }
    await textToSpeechService.speak('hello there', settings)
    expect(textToSpeechService.getState().voiceUnavailable).toBe(true)

    utteranceOutcome = 'end'
    await textToSpeechService.speak('hello again', settings)
    expect(textToSpeechService.getState().voiceUnavailable).toBe(false)
  })

  it('selects a stored browser voice by URI', async () => {
    await textToSpeechService.speak('hello', { ...settings, voiceId: 'aussie' })
    expect(spokenUtterances[0].voice).toMatchObject({ name: 'Aussie' })
    expect(textToSpeechService.getState().selectedVoice).toMatchObject({ id: 'aussie' })
  })

  it('falls back to the system voice for an unknown stored voice', async () => {
    await textToSpeechService.speak('hello', { ...settings, voiceId: 'ghost-voice' })
    expect(spokenUtterances[0].voice).toBeNull()
    expect(textToSpeechService.getState().selectedVoice).toMatchObject({ id: '', lang: 'en' })
  })
})

describe('speak on the native path', () => {
  it('sends flush-queued options and records the spoken locale', async () => {
    platform = 'android'
    await textToSpeechService.speak('hello native', settings)

    expect(nativeSpeak).toHaveBeenCalledTimes(1)
    expect(nativeSpeak.mock.calls[0][0]).toMatchObject({
      text: 'hello native.',
      lang: 'en',
      rate: 1,
      pitch: 1,
      volume: 1,
      queueStrategy: 1,
    })
    expect(textToSpeechService.getState().voiceUnavailable).toBe(false)
  })

  it('retries the next locale before giving up', async () => {
    platform = 'android'
    nativeSpeak.mockRejectedValueOnce(new Error('en unsupported'))
    await textToSpeechService.speak('hello native', settings)

    expect(nativeSpeak).toHaveBeenCalledTimes(2)
    expect(nativeSpeak.mock.calls[1][0]).toMatchObject({ lang: 'en-US' })
    expect(textToSpeechService.getState().voiceUnavailable).toBe(false)
  })

  it('flags the voice unavailable when every locale fails', async () => {
    platform = 'android'
    nativeSpeak.mockRejectedValue(new Error('no engine'))
    await textToSpeechService.speak('hello native', settings)

    expect(nativeSpeak).toHaveBeenCalledTimes(2)
    expect(textToSpeechService.getState().voiceUnavailable).toBe(true)
  })

  it('adds the ambient audio category on iOS', async () => {
    platform = 'ios'
    await textToSpeechService.speak('hello native', settings)
    expect(nativeSpeak.mock.calls[0][0]).toMatchObject({ category: 'ambient' })
  })

  it('clears a stored voice that the engine no longer offers', async () => {
    platform = 'android'
    const clearVoiceId = vi.fn()
    textToSpeechService.setVoiceIdClearHandler(clearVoiceId)

    await textToSpeechService.initializeCatalog({ ...settings, voiceId: '0' })
    expect(clearVoiceId).toHaveBeenCalled()
    expect(textToSpeechService.getState().selectedVoice).toMatchObject({ id: '', lang: 'en' })

    clearVoiceId.mockClear()
    await textToSpeechService.initializeCatalog({ ...settings, voiceId: '1' })
    expect(clearVoiceId).not.toHaveBeenCalled()
    expect(textToSpeechService.getState().selectedVoice).toMatchObject({
      id: '1',
      name: 'British',
      lang: 'en-GB',
    })
    textToSpeechService.setVoiceIdClearHandler(() => {})
  })

  it('passes a valid stored voice index through to the engine', async () => {
    platform = 'android'
    await textToSpeechService.initializeCatalog({ ...settings, voiceId: '2' })
    await textToSpeechService.speak('hello native', { ...settings, voiceId: '2' })
    expect(nativeSpeak.mock.calls[0][0]).toMatchObject({ voice: 2 })
  })
})

describe('stop and testVoice', () => {
  it('cancels playback and reports the stopped status', async () => {
    await textToSpeechService.stop()
    expect(cancel).toHaveBeenCalled()
    expect(textToSpeechService.getStatus()).toBe('stopped')
    expect(textToSpeechService.getIsSpeaking()).toBe(false)
    expect(textToSpeechService.getIsPaused()).toBe(false)
  })

  it('speaks the preview phrase even when explanations are toggled off', async () => {
    await textToSpeechService.testVoice({ ...settings, voiceExplanationsEnabled: false })
    expect(spokenUtterances).toHaveLength(1)
    expect(spokenUtterances[0].text).toBe(TEST_VOICE_PHRASE)
  })

  it('stays silent when sound is off or the volume is zero', async () => {
    await textToSpeechService.testVoice({ ...settings, soundEnabled: false })
    await textToSpeechService.testVoice({ ...settings, voiceVolume: 0 })
    expect(spokenUtterances).toHaveLength(0)
  })
})
