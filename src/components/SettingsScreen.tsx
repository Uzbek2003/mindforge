import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { APP_VERSION, SUPPORT_EMAIL } from '../constants'
import type { AppSettings } from '../types'
import {
  DIRECT_TTS_TEST_OPTIONS,
  runDirectNativeTtsTest,
  stopDirectNativeTtsTest,
  type DirectTtsTestResult,
} from '../services/directNativeTtsTest'
import { getVoices, textToSpeechService, type VoiceOption } from '../services/textToSpeech'
import { TEST_VOICE_PHRASE } from '../utils/speechText'
import { Header } from './UI'

interface SettingsScreenProps {
  settings: AppSettings
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  onResetProgress: () => void
  onExportProgress: () => void
  onImportProgress: () => Promise<'success' | 'cancelled' | 'error'>
  onOpenLegal: (page: 'privacy' | 'terms' | 'about' | 'contact') => void
  onBack: () => void
}

export function SettingsScreen({
  settings,
  onUpdate,
  onResetProgress,
  onExportProgress,
  onImportProgress,
  onOpenLegal,
  onBack,
}: SettingsScreenProps) {
  const [voices, setVoices] = useState<VoiceOption[]>([])
  const [testing, setTesting] = useState(false)
  const [directTesting, setDirectTesting] = useState(false)
  const [directTestResult, setDirectTestResult] = useState<DirectTtsTestResult | null>(null)
  const [voiceUnavailable, setVoiceUnavailable] = useState(false)

  useEffect(() => {
    void getVoices().then(setVoices)
  }, [])

  useEffect(() => {
    void textToSpeechService.initializeCatalog(settings)
  }, [settings.voiceId, settings.voiceSpeed, settings.voicePitch, settings.voiceVolume])

  useEffect(() => {
    return textToSpeechService.subscribe((state) => {
      setVoiceUnavailable(state.voiceUnavailable)
    })
  }, [])

  const selectedVoice =
    voices.find((voice) => voice.id === settings.voiceId) ??
    (settings.voiceId == null
      ? { id: '', name: 'System default (English)', lang: 'en-US' }
      : null)

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

  const handleDirectTtsTest = async () => {
    setDirectTesting(true)
    setDirectTestResult(null)
    try {
      const result = await runDirectNativeTtsTest()
      setDirectTestResult(result)
    } finally {
      setDirectTesting(false)
    }
  }

  const handleDirectTtsStop = async () => {
    try {
      await stopDirectNativeTtsTest()
      setDirectTestResult((prev) =>
        prev
          ? { ...prev, log: [...prev.log, 'Native TTS stop requested'] }
          : prev,
      )
    } catch (error) {
      setDirectTestResult((prev) =>
        prev
          ? {
              ...prev,
              log: [...prev.log, `Native TTS stop failed: ${error instanceof Error ? error.message : String(error)}`],
            }
          : prev,
      )
    }
  }

  const isNativePlatform = Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios'

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
        <h3>Night Guardian voice</h3>
        <p className="setting-description">
          Optional spoken explanations with a deep, calm mentor-style voice. Written explanations always stay visible.
        </p>

        {voiceUnavailable && (
          <p className="setting-warning" role="alert">
            Voice unavailable. Open Android Settings → Language and input → Text-to-speech output, then install or update Google Speech Services with an English voice.
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
          <span>Auto-play explanations</span>
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
          />
        </label>
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
            No individual voices listed — the app will use your device&apos;s default English speech engine.
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
            value={settings.voicePitch}
            onChange={(e) => onUpdate('voicePitch', e.target.value as AppSettings['voicePitch'])}
            disabled={!settings.voiceExplanationsEnabled}
            aria-label="Voice pitch"
          >
            <option value="deep">Deep</option>
            <option value="normal">Normal</option>
          </select>
        </label>
        <label className="setting-row setting-range">
          <span>Volume</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={settings.voiceVolume}
            onChange={(e) => onUpdate('voiceVolume', Number(e.target.value))}
            disabled={!settings.voiceExplanationsEnabled || !settings.soundEnabled}
            aria-label="Voice volume"
          />
          <span className="range-value">{Math.round(settings.voiceVolume * 100)}%</span>
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
        <p className="setting-meta setting-test-phrase">{TEST_VOICE_PHRASE}</p>

        {isNativePlatform && (
          <>
            <h4 className="setting-subheading">Direct TTS Test (native plugin)</h4>
            <p className="setting-description">
              Bypasses detection and calls <code>TextToSpeech.speak()</code> directly. Plugin v8.0.2 uses{' '}
              <code>lang</code>, <code>rate</code>, <code>pitch</code>, <code>volume</code> — not locale or speechRate.
            </p>
            <button
              type="button"
              className="btn btn-primary setting-btn"
              onClick={handleDirectTtsTest}
              disabled={directTesting}
              aria-label="Run direct native TTS test"
            >
              {directTesting ? 'Running direct test…' : 'Direct TTS Test'}
            </button>
            <button
              type="button"
              className="btn btn-ghost setting-btn"
              onClick={handleDirectTtsStop}
              aria-label="Stop direct native TTS test"
            >
              Stop direct test
            </button>
            <p className="setting-meta">
              Test phrase: {DIRECT_TTS_TEST_OPTIONS.text}
            </p>
            <p className="setting-meta">
              Options: {JSON.stringify(DIRECT_TTS_TEST_OPTIONS)}
            </p>
            {import.meta.env.DEV && directTestResult && (
              <div className="tts-debug-panel" role="log" aria-label="Direct TTS debug output">
                <strong>Debug panel</strong>
                <p>Platform: {directTestResult.platform}</p>
                <p>isNativePlatform: {String(directTestResult.isNativePlatform)}</p>
                <p>Path: {directTestResult.path}</p>
                <p>Success: {String(directTestResult.success)}</p>
                {directTestResult.error && (
                  <pre className="tts-debug-error">{directTestResult.error}</pre>
                )}
                <pre className="tts-debug-log">{directTestResult.log.join('\n')}</pre>
              </div>
            )}
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
