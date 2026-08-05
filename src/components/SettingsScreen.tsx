import { useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { APP_VERSION, SUPPORT_EMAIL } from '../constants'
import type { AppSettings } from '../types'
import {
  DIRECT_TTS_TEST_OPTIONS,
  isDirectNativeTestRunning,
  requestDirectNativeTtsStop,
  startDirectNativeTtsTest,
  type DirectTtsTestResult,
} from '../services/directNativeTtsTest'
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
  const [directTesting, setDirectTesting] = useState(false)
  const [directTestResult, setDirectTestResult] = useState<DirectTtsTestResult | null>(null)

  const isNativePlatform = Capacitor.getPlatform() === 'android' || Capacitor.getPlatform() === 'ios'

  const handleDirectTtsTest = () => {
    if (directTesting || isDirectNativeTestRunning()) return

    setDirectTesting(true)
    setDirectTestResult(null)

    const started = startDirectNativeTtsTest((result) => {
      setDirectTestResult(result)
      setDirectTesting(false)
    })

    if (!started) {
      setDirectTesting(false)
    }
  }

  const handleDirectTtsStop = () => {
    requestDirectNativeTtsStop()
    setDirectTestResult((prev) =>
      prev ? { ...prev, log: [...prev.log, 'Native TTS stop requested manually'] } : prev,
    )
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
        <h3>Night Guardian voice</h3>
        <p className="setting-description">
          Automatic spoken explanations are temporarily disabled while native TTS is being fixed. Written explanations
          always remain visible during gameplay.
        </p>

        <label className="setting-row">
          <span>Voice explanations</span>
          <input
            type="checkbox"
            checked={settings.voiceExplanationsEnabled}
            onChange={(e) => onUpdate('voiceExplanationsEnabled', e.target.checked)}
            disabled
            aria-describedby="voice-disabled-note"
          />
        </label>
        <label className="setting-row">
          <span>Auto-play explanations</span>
          <input
            type="checkbox"
            checked={settings.voiceAutoPlay}
            onChange={(e) => onUpdate('voiceAutoPlay', e.target.checked)}
            disabled
            aria-describedby="voice-disabled-note"
          />
        </label>
        <p id="voice-disabled-note" className="setting-meta">
          Voice toggles are off by default and disabled until native TTS is restored.
        </p>

        {isNativePlatform && (
          <>
            <h4 className="setting-subheading">Native TTS Test</h4>
            <p className="setting-description">
              Manual test only. Calls <code>TextToSpeech.speak()</code> once with no automatic retries or discovery.
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
            <p className="setting-meta">Phrase: {DIRECT_TTS_TEST_OPTIONS.text}</p>
            <p className="setting-meta">Options: {JSON.stringify(DIRECT_TTS_TEST_OPTIONS)}</p>
            {import.meta.env.DEV && directTestResult && (
              <div className="tts-debug-panel" role="log" aria-label="Native TTS debug output">
                <strong>Debug panel</strong>
                <p>Platform: {directTestResult.platform}</p>
                <p>isNativePlatform: {String(directTestResult.isNativePlatform)}</p>
                <p>Path: {directTestResult.path}</p>
                <p>Success: {String(directTestResult.success)}</p>
                <p>Timed out: {String(directTestResult.timedOut)}</p>
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
