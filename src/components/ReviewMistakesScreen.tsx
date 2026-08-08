import { useState } from 'react'
import type { ReviewMistakeItem } from '../types'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../types'
import { clampReviewIndex, nextReviewIndex, previousReviewIndex } from '../utils/reviewMistakes'
import { Header } from './UI'

interface ReviewMistakesScreenProps {
  items: ReviewMistakeItem[]
  onBack: () => void
  onHome: () => void
}

export function ReviewMistakesScreen({ items, onBack, onHome }: ReviewMistakesScreenProps) {
  const [index, setIndex] = useState(0)
  const total = items.length
  const safeIndex = clampReviewIndex(index, total)
  const item = total > 0 ? items[safeIndex] : null

  if (!item) {
    return (
      <div className="screen review-screen">
        <Header onHome={onHome} showHome homeLabel="Home" />
        <section className="panel review-panel">
          <h2>Review Mistakes</h2>
          <p className="review-empty">No incorrect answers in this session. Great work!</p>
          <div className="action-row">
            <button type="button" className="btn btn-primary" onClick={onBack}>
              Back to results
            </button>
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="screen review-screen">
      <Header onHome={onHome} showHome homeLabel="Home" />

      <section className="panel review-panel" aria-live="polite">
        <div className="review-top">
          <h2>Review Mistakes</h2>
          <p className="review-progress">
            Mistake {safeIndex + 1} of {total}
          </p>
        </div>

        <div className="review-meta">
          <span className="review-chip">{CATEGORY_LABELS[item.category]}</span>
          <span className="review-chip review-chip-difficulty">
            {DIFFICULTY_LABELS[item.difficulty]}
          </span>
        </div>

        <h3 className="review-question">{item.question}</h3>

        <div className="review-answers">
          <div className="review-answer-block review-answer-wrong">
            <span className="review-answer-label">Your answer</span>
            <p className="review-answer-value">{item.userAnswerLabel}</p>
          </div>
          <div className="review-answer-block review-answer-correct">
            <span className="review-answer-label">Correct answer</span>
            <p className="review-answer-value">{item.correctAnswerLabel}</p>
          </div>
        </div>

        <div className="review-detail">
          <h4>Hint</h4>
          <p>{item.hint}</p>
        </div>

        <div className="review-detail">
          <h4>Explanation</h4>
          <p>{item.explanation}</p>
        </div>
      </section>

      <div className="review-nav action-row">
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((current) => previousReviewIndex(current, total))}
          disabled={safeIndex <= 0}
          aria-label="Previous mistake"
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => setIndex((current) => nextReviewIndex(current, total))}
          disabled={safeIndex >= total - 1}
          aria-label="Next mistake"
        >
          Next
        </button>
        <button type="button" className="btn btn-primary" onClick={onBack}>
          Back to results
        </button>
      </div>
    </div>
  )
}
