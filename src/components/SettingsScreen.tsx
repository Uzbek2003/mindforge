import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { APP_VERSION, SUPPORT_EMAIL } from '../constants'
import type { AppSettings, VoicePersona } from '../types'
import {
  isDirectNativeTestRunning,
  requestDirectNativeTtsStop,
  startDirectNativeTtsTest,
} from '../services/directNativeTtsTest'
import { getVoices, textToSpeechService, type VoiceOption } from '../services/textToSpeech'
import { getTestVoicePhrase } from '../utils/speechText'
import {
  VOICE_PERSONA_OPTIONS,
  getPersonaProsodyDefaults,
  getVoicePersonaMeta,
  normalizeVoicePersona,
} from '../utils/voicePersona'
import { normalizeVoicePitch, resolveSpeechVolume } from '../utils/voiceProsody'
import { Header } from './UI'

interface SettingsScreenProps {
  settings: AppSettings
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  onUpdateMany?: (partial: Partial<AppSettings>) => void
  onResetProgress: () => void
  onExportProgress: () => void
  onImportProgress: () => Promise<'success' | 'cancelled' | 'error'>
  onOpenLegal: (page: 'privacy' | 'terms' | 'about' | 'contact') => void
  onBack: () => void
}

export function SettingsScreen({
  settings,
  onUpdate,
  onUpdateMany,
  onResetProgress,
  onExportProgress,
  onImportProgress,
  onOpenLegal,
  onBack,
}: SettingsScreenProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [testing, setTesting] = useState(false)
  const [directTesting, setDirectTesting] = useState(false)
  const [voiceUnavailable, setVoiceUnavailable] = useState(false)

  const isNativePlatform = Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios'

  useEffect(() => {
    void getVoices().then(setVoices)
  }, [])

  useEffect(() => {
    void textToSpeechService.initializeCatalog(settings)
  }, [
    settings.voicePersona,
    settings.voiceId,
    settings.voiceSpeed,
    settings.voicePitch,
    settings.voiceVolume,
  ])

  useEffect(() => {
    return textToSpeechService.subscribe((state) => {
      setVoiceUnavailable(state.voiceUnavailable)
    })
  }, [])

  const persona = getVoicePersonaMeta(settings.voicePersona)
  const testPhrase = getTestVoicePhrase(settings.voicePersona)

  const selectedVoice =
    voices.find((voice) => voice.id === settings.voiceId) ??
    (settings.voiceId == null
      ? { id: '', name: 'System default (English)', lang: 'en-US' }
      : null)

  const handlePersonaChange = (nextPersona: VoicePersona) => {
    void textToSpeechService.stop()
    const defaults = getPersonaProsodyDefaults(nextPersona)
    const next = {
      voicePersona: nextPersona,
      voiceSpeed: defaults.voiceSpeed,
      voicePitch: defaults.voicePitch,
    } as const
    if (onUpdateMany) {
      onUpdateMany(next)
      return
    }
    onUpdate('voicePersona', next.voicePersona)
    onUpdate('voiceSpeed', next.voiceSpeed)
    onUpdate('voicePitch', next.voicePitch)
  }

  const handleVoiceChange = (voiceId: string | null) => {
    void textToSpeechService.stop()
    onUpdate('voiceId', voiceId)
  }

  const handleTestVoice = async () => {
    setTesting(true)
    try {
      await textToSpeechService.testVoice(settings)
    } finally {
      setTesting(false)
    }
  }

  const resolvedVolume = resolveSpeechVolume(settings.voiceVolume)

  const handleDirectTtsTest = () => {
    if (directTesting || isDirectNativeTestRunning()) return

    setDirectTesting(true)

    const started = startDirectNativeTtsTest(() => {
      setDirectTesting(false)
    }, settings)

    if (!started) {
      setDirectTesting(false)
    }
  }

  const handleDirectTtsStop = () => {
    requestDirectNativeTtsStop()
    setDirectTesting(false)
  }

  const handleReset = () => {
    if (
      window.confirm(
        'Reset all puzzle progress? This removes completed puzzles, streaks, and saved sessions. This cannot be undone.',
      )
    ) {
      onResetProgress()
    }
  }

  const handleImport = async () => {
    const result = await onImportProgress()
    if (result === 'success') window.alert('Progress imported successfully.')
    if (result === 'error') window.alert('Could not import that file. Please choose a valid QuizNova export.')
  }

  return (
    <div className="screen settings-screen">
      <Header onHome={onBack} showHome homeLabel="Back" />

      <section className="panel">
        <h3>Gameplay</h3>
        <label className="setting-row">
          <span>Sound effects</span>
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(e) => onUpdate('soundEnabled', e.target.checked)}
          />
        </label>
        <label className="setting-row">
          <span>Vibration (mobile)</span>
          <input
            type="checkbox"
            checked={settings.vibrationEnabled}
            onChange={(e) => onUpdate('vibrationEnabled', e.target.checked)}
          />
        </label>
        <label className="setting-row">
          <span>Large text</span>
          <input
            type="checkbox"
            checked={settings.textSize === 'large'}
            onChange={(e) => onUpdate('textSize', e.target.checked ? 'large' : 'normal')}
          />
        </label>
        <label className="setting-row">
          <span>Reduce animations</span>
          <input
            type="checkbox"
            checked={settings.reduceAnimations}
            onChange={(e) => onUpdate('reduceAnimations', e.target.checked)}
          />
        </label>
      </section>

      <section className="panel">
        <h3>Voice explanations</h3>
        <p className="setting-description">
          Optional spoken questions and explanations. Choose a QuizNova guide persona, or keep the
          system default. Written explanations always stay visible.
        </p>

        {voiceUnavailable && (
          <p className="setting-warning" role="alert">
            Voice unavailable. On Android, open Settings → Language and input → Text-to-speech
            output, then install or update Google Speech Services with an English voice. On web,
            check that your browser supports speech synthesis and an English voice is installed.
          </p>
        )}

        {selectedVoice && (
          <p className="setting-meta">
            Selected voice: <strong>{selectedVoice.name}</strong> ({selectedVoice.lang.replace('_', '-')})
          </p>
        )}

        <label className="setting-row">
          <span>Voice explanations</span>
          <input
            type="checkbox"
            checked={settings.voiceExplanationsEnabled}
            onChange={(e) => onUpdate('voiceExplanationsEnabled', e.target.checked)}
          />
        </label>
        <label className="setting-row">
          <span>Auto-play questions & explanations</span>
          <input
            type="checkbox"
            checked={settings.voiceAutoPlay}
            onChange={(e) => onUpdate('voiceAutoPlay', e.target.checked)}
            disabled={!settings.voiceExplanationsEnabled}
          />
        </label>
        <label className="setting-row">
          <span>Stop speech when leaving a question</span>
          <input
            type="checkbox"
            checked={settings.stopSpeechOnLeave}
            onChange={(e) => onUpdate('stopSpeechOnLeave', e.target.checked)}
            disabled={!settings.voiceExplanationsEnabled}
          />
        </label>
        <label className="setting-row setting-select">
          <span>Spoken guide</span>
          <select
            value={normalizeVoicePersona(settings.voicePersona)}
            onChange={(e) => handlePersonaChange(e.target.value as VoicePersona)}
            disabled={!settings.voiceExplanationsEnabled}
            aria-label="Select spoken guide persona"
          >
            {VOICE_PERSONA_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <p className="setting-meta">{persona.description}</p>
        <p className="setting-meta">
          Choosing a persona applies recommended speed and pitch. You can still override them below.
          Leave Voice on System default to let the persona prefer a clear system voice when available.
        </p>
        <label className="setting-row setting-select">
          <span>Voice (optional)</span>
          <select
            value={settings.voiceId ?? ''}
            onChange={(e) => handleVoiceChange(e.target.value || null)}
            disabled={!settings.voiceExplanationsEnabled}
            aria-label="Select voice"
          >
            <option value="">System default (English)</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
        {voices.length === 0 && (
          <p className="setting-meta">
            No individual voices listed — the app will use your device&apos;s default English speech
            engine.
          </p>
        )}
        <label className="setting-row setting-select">
          <span>Speaking speed</span>
          <select
            value={settings.voiceSpeed}
            onChange={(e) => onUpdate('voiceSpeed', e.target.value as AppSettings['voiceSpeed'])}
            disabled={!settings.voiceExplanationsEnabled}
            aria-label="Speaking speed"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>
        <label className="setting-row setting-select">
          <span>Pitch</span>
          <select
            value={normalizeVoicePitch(settings.voicePitch)}
            onChange={(e) => onUpdate('voicePitch', e.target.value as AppSettings['voicePitch'])}
            disabled={!settings.voiceExplanationsEnabled}
            aria-label="Voice pitch"
          >
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
          </select>
        </label>
        <label className="setting-row setting-range">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={resolvedVolume}
            onChange={(e) => onUpdate('voiceVolume', resolveSpeechVolume(Number(e.target.value)))}
            disabled={!settings.voiceExplanationsEnabled || !settings.soundEnabled}
            aria-label="Voice volume"
          />
          <span className="range-value">{Math.round(resolvedVolume * 100)}%</span>
        </label>
        <button
          type="button"
          className="btn btn-ghost setting-btn"
          onClick={handleTestVoice}
          disabled={!settings.voiceExplanationsEnabled || !settings.soundEnabled || testing}
          aria-label="Test selected voice"
        >
          {testing ? 'Testing voice…' : 'Test voice'}
        </button>
        <p className="setting-meta setting-test-phrase">{testPhrase}</p>

        {/* Developer-only QA controls — hidden from production Settings. */}
        {import.meta.env.DEV && isNativePlatform && (
          <>
            <h4 className="setting-subheading">Native TTS Test</h4>
            <p className="setting-description">
              Manual test only. Speaks a short phrase using your current speed, pitch, and volume
              settings.
            </p>
            <button
              type="button"
              className="btn btn-primary setting-btn"
              onClick={handleDirectTtsTest}
              disabled={directTesting || isDirectNativeTestRunning()}
              aria-label="Run native TTS test"
            >
              {directTesting ? 'Running native test…' : 'Native TTS Test'}
            </button>
            <button
              type="button"
              className="btn btn-ghost setting-btn"
              onClick={handleDirectTtsStop}
              disabled={!directTesting && !isDirectNativeTestRunning()}
              aria-label="Stop native TTS test"
            >
              Stop native test
            </button>
          </>
        )}
      </section>

      <section className="panel">
        <h3>Progress</h3>
        <button type="button" className="btn btn-ghost setting-btn" onClick={onExportProgress}>
          Export progress
        </button>
        <button type="button" className="btn btn-ghost setting-btn" onClick={handleImport}>
          Import progress
        </button>
        <button type="button" className="btn btn-danger setting-btn" onClick={handleReset}>
          Reset all progress
        </button>
      </section>

      <section className="panel">
        <h3>Legal & support</h3>
        <button type="button" className="btn btn-ghost setting-btn" onClick={() => onOpenLegal('privacy')}>
          Privacy Policy
        </button>
        <button type="button" className="btn btn-ghost setting-btn" onClick={() => onOpenLegal('terms')}>
          Terms of Use
        </button>
        <button type="button" className="btn btn-ghost setting-btn" onClick={() => onOpenLegal('about')}>
          About the App
        </button>
        <button type="button" className="btn btn-ghost setting-btn" onClick={() => onOpenLegal('contact')}>
          Contact & Support
        </button>
        <p className="setting-meta">
          Support: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p className="setting-meta">Version {APP_VERSION}</p>
      </section>
    </div>
  )
}
