import { useEffect, useState } from 'react'
import { APP_VERSION, SUPPORT_EMAIL } from '../constants'
import type { AppSettings } from '../types'
import {
  isDirectNativeTestRunning,
  requestDirectNativeTtsStop,
  startDirectNativeTtsTest,
} from '../services/directNativeTtsTest'
import { getVoices, textToSpeechService, type VoiceOption } from '../services/textToSpeech'
import { TEST_VOICE_PHRASE } from '../utils/speechText'
import { normalizeVoicePitch, resolveSpeechVolume } from '../utils/voiceProsody'
import { formatLangTag } from '../utils/lang'
import { LEGAL_SCREENS, LEGAL_SCREEN_TITLES, type LegalScreen } from '../utils/routes'
import { isNativeTtsPath } from '../utils/platform'
import { Header, SelectRow, ToggleRow } from './UI'

interface SettingsScreenProps {
  settings: AppSettings
  onUpdate: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  onResetProgress: () => void
  onExportProgress: () => void
  onImportProgress: () => Promise<'success' | 'cancelled' | 'error'>
  onOpenLegal: (page: LegalScreen) => void
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
  const [voiceUnavailable, setVoiceUnavailable] = useState(false)

  const isNativePlatform = isNativeTtsPath()

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
        <ToggleRow
          label="Sound effects"
          checked={settings.soundEnabled}
          onChange={(checked) => onUpdate('soundEnabled', checked)}
        />
        <ToggleRow
          label="Vibration (mobile)"
          checked={settings.vibrationEnabled}
          onChange={(checked) => onUpdate('vibrationEnabled', checked)}
        />
        <ToggleRow
          label="Large text"
          checked={settings.textSize === 'large'}
          onChange={(checked) => onUpdate('textSize', checked ? 'large' : 'normal')}
        />
        <ToggleRow
          label="Reduce animations"
          checked={settings.reduceAnimations}
          onChange={(checked) => onUpdate('reduceAnimations', checked)}
        />
      </section>

      <section className="panel">
        <h3>Night Guardian voice</h3>
        <p className="setting-description">
          Optional spoken questions and explanations with a deep, calm mentor-style voice. Written
          explanations always stay visible.
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
            Selected voice: <strong>{selectedVoice.name}</strong> ({formatLangTag(selectedVoice.lang)})
          </p>
        )}

        <ToggleRow
          label="Voice explanations"
          checked={settings.voiceExplanationsEnabled}
          onChange={(checked) => onUpdate('voiceExplanationsEnabled', checked)}
        />
        <ToggleRow
          label="Auto-play questions & explanations"
          checked={settings.voiceAutoPlay}
          onChange={(checked) => onUpdate('voiceAutoPlay', checked)}
          disabled={!settings.voiceExplanationsEnabled}
        />
        <ToggleRow
          label="Stop speech when leaving a question"
          checked={settings.stopSpeechOnLeave}
          onChange={(checked) => onUpdate('stopSpeechOnLeave', checked)}
          disabled={!settings.voiceExplanationsEnabled}
        />
        <SelectRow
          label="Voice (optional)"
          value={settings.voiceId ?? ''}
          onChange={(value) => handleVoiceChange(value || null)}
          ariaLabel="Select voice"
          disabled={!settings.voiceExplanationsEnabled}
        >
          <option value="">System default (English)</option>
          {voices.map((voice) => (
            <option key={voice.id} value={voice.id}>
              {voice.name} ({voice.lang})
            </option>
          ))}
        </SelectRow>
        {voices.length === 0 && (
          <p className="setting-meta">
            No individual voices listed — the app will use your device&apos;s default English speech
            engine.
          </p>
        )}
        <SelectRow
          label="Speaking speed"
          value={settings.voiceSpeed}
          onChange={(value) => onUpdate('voiceSpeed', value as AppSettings['voiceSpeed'])}
          ariaLabel="Speaking speed"
          disabled={!settings.voiceExplanationsEnabled}
        >
          <option value="slow">Slow</option>
          <option value="normal">Normal</option>
          <option value="fast">Fast</option>
        </SelectRow>
        <SelectRow
          label="Pitch"
          value={normalizeVoicePitch(settings.voicePitch)}
          onChange={(value) => onUpdate('voicePitch', value as AppSettings['voicePitch'])}
          ariaLabel="Voice pitch"
          disabled={!settings.voiceExplanationsEnabled}
        >
          <option value="low">Low</option>
          <option value="normal">Normal</option>
          <option value="high">High</option>
        </SelectRow>
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
        <p className="setting-meta setting-test-phrase">{TEST_VOICE_PHRASE}</p>

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
        {LEGAL_SCREENS.map((page) => (
          <button
            key={page}
            type="button"
            className="btn btn-ghost setting-btn"
            onClick={() => onOpenLegal(page)}
          >
            {LEGAL_SCREEN_TITLES[page]}
          </button>
        ))}
        <p className="setting-meta">
          Support: <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
        <p className="setting-meta">Version {APP_VERSION}</p>
      </section>
    </div>
  )
}
