import type { SessionResult } from '../types'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, SESSION_MODE_CONFIG } from '../types'
import { formatDuration } from '../utils/session'
import { hasMistakesToReview } from '../utils/reviewMistakes'
import { Header } from './UI'

interface ResultsScreenProps {
  result: SessionResult
  onHome: () => void
  onPlayAgain: () => void
  onRetryWrong: () => void
  onReviewMistakes: () => void
  onShare: () => void
}

export function ResultsScreen({
  result,
  onHome,
  onPlayAgain,
  onRetryWrong,
  onReviewMistakes,
  onShare,
}: ResultsScreenProps) {
  const modeLabel = SESSION_MODE_CONFIG[result.mode].label
  const showReview = hasMistakesToReview(result)

  return (
    <div className="screen results-screen">
      <Header onHome={onHome} showHome homeLabel="Home" />

      <section className="results-hero panel">
        <h2>Session complete</h2>
        <p className="results-subtitle">
          {result.category === 'all' ? 'Mixed topics' : CATEGORY_LABELS[result.category]} ·{' '}
          {DIFFICULTY_LABELS[result.difficulty]} · {modeLabel}
        </p>

        <div className="results-grid">
          <div className="result-stat">
            <span className="result-value result-correct">{result.correct}</span>
            <span className="result-label">Correct</span>
          </div>
          <div className="result-stat">
            <span className="result-value result-wrong">{result.incorrect}</span>
            <span className="result-label">Incorrect</span>
          </div>
          <div className="result-stat">
            <span className="result-value">{result.accuracy}%</span>
            <span className="result-label">Accuracy</span>
          </div>
          <div className="result-stat">
            <span className="result-value">{result.bestStreakInSession}</span>
            <span className="result-label">Best streak</span>
          </div>
          <div className="result-stat result-stat-wide">
            <span className="result-value">{formatDuration(result.timeMs)}</span>
            <span className="result-label">Time taken</span>
          </div>
        </div>

        {!showReview && (
          <p className="results-perfect" role="status">
            Perfect session — no mistakes to review!
          </p>
        )}
      </section>

      <div className="action-row">
        <button type="button" className="btn btn-primary btn-large" onClick={onPlayAgain}>
          Play again
        </button>
        {showReview && (
          <button
            type="button"
            className="btn btn-primary review-mistakes-btn"
            onClick={onReviewMistakes}
          >
            Review Mistakes ({result.incorrect})
          </button>
        )}
        {result.wrongPuzzleIds.length > 0 && (
          <button type="button" className="btn btn-ghost" onClick={onRetryWrong}>
            Retry incorrect ({result.wrongPuzzleIds.length})
          </button>
        )}
        <button type="button" className="btn btn-ghost" onClick={onShare}>
          Share score
        </button>
        <button type="button" className="btn btn-ghost" onClick={onHome}>
          Return home
        </button>
      </div>
    </div>
  )
}
