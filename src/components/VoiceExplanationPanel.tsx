import { Capacitor } from '@capacitor/core'
import type { AppSettings } from '../types'
import { browserPauseSupported } from '../services/textToSpeech'
import type { TtsStatus } from '../services/textToSpeech'
import { getVoicePersonaMeta } from '../utils/voicePersona'

interface VoiceExplanationPanelProps {
  settings: AppSettings
  isSpeaking: boolean
  isPaused: boolean
  status: TtsStatus
  voiceUnavailable: boolean
  onPlay: () => void
  onPause: () => void
  onResume: () => void
  onReplay: () => void
  onStop: () => void
}

export function VoiceExplanationPanel({
  settings,
  isSpeaking,
  isPaused,
  status,
  voiceUnavailable,
  onPlay,
  onPause,
  onResume,
  onReplay,
  onStop,
}: VoiceExplanationPanelProps) {
  const voiceDisabled = !settings.voiceExplanationsEnabled || !settings.soundEnabled
  const showBrowserPause = browserPauseSupported()
  const isAndroid = Capacitor.getPlatform() === 'android'
  const persona = getVoicePersonaMeta(settings.voicePersona)

  const statusMessage = (() => {
    if (voiceDisabled) {
      return 'Voice explanations are off. Enable sound and voice explanations in Settings to listen.'
    }
    if (voiceUnavailable) {
      return 'Voice unavailable. Install or update Google Speech Services with an English voice, then tap Test voice in Settings.'
    }
    if (isSpeaking) return 'Speaking…'
    if (status === 'stopped') return 'Stopped.'
    if (isPaused) return 'Paused.'
    return null
  })()

  return (
    <section className="voice-panel" aria-label={`${persona.label} voice explanation controls`}>
      <div className="voice-panel-header">
        <span className={`speaker-icon ${isSpeaking ? 'speaker-active' : ''}`} aria-hidden="true">
          🔊
        </span>
        <div>
          <strong>{persona.label}</strong>
          <p className="voice-panel-subtitle">{persona.subtitle}</p>
        </div>
      </div>

      {statusMessage && (
        <p className={`voice-panel-note ${voiceUnavailable ? 'voice-panel-warning' : ''}`} role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}

      <div className="voice-controls">
        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={isPaused ? onResume : onPlay}
          disabled={voiceDisabled || isSpeaking}
          aria-label={isPaused ? 'Resume explanation' : 'Play explanation'}
        >
          {isPaused && showBrowserPause ? 'Resume' : 'Play explanation'}
        </button>

        {showBrowserPause && (
          <button
            type="button"
            className="btn btn-ghost voice-btn"
            onClick={onPause}
            disabled={voiceDisabled || !isSpeaking}
            aria-label="Pause explanation"
          >
            Pause
          </button>
        )}

        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onStop}
          disabled={voiceDisabled || (!isSpeaking && !isPaused)}
          aria-label="Stop explanation"
        >
          Stop
        </button>

        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onReplay}
          disabled={voiceDisabled}
          aria-label="Replay explanation from beginning"
        >
          Replay from beginning
        </button>
      </div>

      {isAndroid && !voiceDisabled && !voiceUnavailable && (
        <p className="voice-panel-hint">Pause is not available on Android. Use Stop, then Play or Replay.</p>
      )}
    </section>
  )
}
