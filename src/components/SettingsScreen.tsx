import { useEffect, useState } from 'react'
import { APP_VERSION, SUPPORT_EMAIL } from '../constants'
import type { AppSettings } from '../types'
import { getVoices, type VoiceOption } from '../services/textToSpeech'
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

  useEffect(() => {
    void getVoices().then(setVoices)
  }, [])

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
          <span>Voice</span>
          <select
            value={settings.voiceId ?? ''}
            onChange={(e) => onUpdate('voiceId', e.target.value || null)}
            disabled={!settings.voiceExplanationsEnabled || voices.length === 0}
            aria-label="Select voice"
          >
            <option value="">Best available English voice</option>
            {voices.map((voice) => (
              <option key={voice.id} value={voice.id}>
                {voice.name} ({voice.lang})
              </option>
            ))}
          </select>
        </label>
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
