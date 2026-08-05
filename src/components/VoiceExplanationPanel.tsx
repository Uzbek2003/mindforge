import type { AppSettings } from '../types'

interface VoiceExplanationPanelProps {
  settings: AppSettings
  isSpeaking: boolean
  isPaused: boolean
  onPlay: () => void
  onPause: () => void
  onReplay: () => void
  onStop: () => void
}

export function VoiceExplanationPanel({
  settings,
  isSpeaking,
  isPaused,
  onPlay,
  onPause,
  onReplay,
  onStop,
}: VoiceExplanationPanelProps) {
  const voiceDisabled = !settings.voiceExplanationsEnabled || !settings.soundEnabled

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

      {voiceDisabled && (
        <p className="voice-panel-note" role="note">
          Voice explanations are off. Enable sound and voice explanations in Settings to listen.
        </p>
      )}

      <div className="voice-controls">
        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onPlay}
          disabled={voiceDisabled || isSpeaking}
          aria-label="Play explanation"
        >
          Play explanation
        </button>
        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onPause}
          disabled={voiceDisabled || !isSpeaking}
          aria-label="Pause explanation"
        >
          Pause
        </button>
        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onReplay}
          disabled={voiceDisabled}
          aria-label="Replay explanation"
        >
          Replay
        </button>
        <button
          type="button"
          className="btn btn-ghost voice-btn"
          onClick={onStop}
          disabled={voiceDisabled || (!isSpeaking && !isPaused)}
          aria-label="Stop explanation"
        >
          Stop
        </button>
      </div>

      {isSpeaking && (
        <p className="voice-playing-label" role="status" aria-live="polite">
          Night Guardian is speaking…
        </p>
      )}
      {isPaused && !isSpeaking && (
        <p className="voice-playing-label" role="status" aria-live="polite">
          Explanation paused.
        </p>
      )}
    </section>
  )
}
