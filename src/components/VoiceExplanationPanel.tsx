import { Capacitor } from '@capacitor/core'
import type { AppSettings } from '../types'
import { browserPauseSupported } from '../services/textToSpeech'
import type { TtsStatus } from '../services/textToSpeech'

interface VoiceExplanationPanelProps {
  settings: AppSettings
  isSpeaking: boolean
  isPaused: boolean
  status: TtsStatus
  voiceAvailable: boolean
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
  voiceAvailable,
  onPlay,
  onPause,
  onResume,
  onReplay,
  onStop,
}: VoiceExplanationPanelProps) {
  const voiceDisabled = !settings.voiceExplanationsEnabled || !settings.soundEnabled
  const showBrowserPause = browserPauseSupported()
  const isAndroid = Capacitor.getPlatform() === 'android'

  const statusMessage = (() => {
    if (voiceDisabled) return 'Voice explanations are off. Enable sound and voice explanations in Settings to listen.'
    if (!voiceAvailable) return 'Install an English voice. Open Android Settings, then Language and input, Text-to-speech output, and install or update Google Speech Services with an English United States voice.'
    if (isSpeaking) return 'Speaking…'
    if (status === 'stopped') return 'Stopped.'
    if (isPaused) return 'Paused.'
    return null
  })()

  return (
    <section className="voice-panel" aria-label="Night Guardian voice explanation controls">
      <div className="voice-panel-header">
        <span className={`speaker-icon ${isSpeaking ? 'speaker-active' : ''}`} aria-hidden="true">
          🔊
        </span>
        <div>
          <strong>Night Guardian</strong>
          <p className="voice-panel-subtitle">Deep mentor-style spoken explanations</p>
        </div>
      </div>

      {statusMessage && (
        <p className="voice-panel-note" role="status" aria-live="polite">
          {statusMessage}
        </p>
      )}

      {!voiceAvailable && !voiceDisabled && (
        <p className="voice-panel-warning" role="alert">
          Voice unavailable. Install an English voice pack to hear explanations.
        </p>
      )}

      <div className="voice-controls">
        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={isPaused ? onResume : onPlay}
          disabled={voiceDisabled || !voiceAvailable || isSpeaking}
          aria-label={isPaused ? 'Resume explanation' : 'Play explanation'}
        >
          {isPaused && showBrowserPause ? 'Resume' : 'Play explanation'}
        </button>

        {showBrowserPause && (
          <button
            type="button"
            className="btn btn-ghost voice-btn"
            onClick={onPause}
            disabled={voiceDisabled || !voiceAvailable || !isSpeaking}
            aria-label="Pause explanation"
          >
            Pause
          </button>
        )}

        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onStop}
          disabled={voiceDisabled || !voiceAvailable || (!isSpeaking && !isPaused)}
          aria-label="Stop explanation"
        >
          Stop
        </button>

        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onReplay}
          disabled={voiceDisabled || !voiceAvailable}
          aria-label="Replay explanation from beginning"
        >
          Replay from beginning
        </button>
      </div>

      {isAndroid && !voiceDisabled && voiceAvailable && (
        <p className="voice-panel-hint">Pause is not available on Android. Use Stop, then Play or Replay.</p>
      )}
    </section>
  )
}
