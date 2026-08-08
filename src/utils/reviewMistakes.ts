import { getPuzzleById } from '../data'
import type { ReviewMistakeItem, SessionAnswer, SessionResult } from '../types'

export function getSessionAnswers(result: SessionResult): SessionAnswer[] {
  if (Array.isArray(result.sessionAnswers) && result.sessionAnswers.length > 0) {
    return result.sessionAnswers
  }

  // Backward-compatible fallback when only wrong IDs exist.
  return result.wrongPuzzleIds.map((puzzleId) => ({
    puzzleId,
    selectedIndex: null,
    correct: false,
  }))
}

/** Build review cards for incorrect answers only. Perfect sessions return []. */
export function buildReviewMistakeItems(result: SessionResult): ReviewMistakeItem[] {
  const answers = getSessionAnswers(result).filter((answer) => !answer.correct)
  const items: ReviewMistakeItem[] = []

  for (const answer of answers) {
    const puzzle = getPuzzleById(answer.puzzleId)
    if (!puzzle) continue

    const userAnswerLabel =
      answer.timedOut || answer.selectedIndex == null
        ? 'No answer (timed out)'
        : puzzle.options[answer.selectedIndex] ?? 'Unknown answer'

    items.push({
      puzzleId: puzzle.id,
      question: puzzle.question,
      options: puzzle.options,
      selectedIndex: answer.selectedIndex,
      correctIndex: puzzle.correctIndex,
      userAnswerLabel,
      correctAnswerLabel: puzzle.options[puzzle.correctIndex],
      hint: puzzle.hint,
      explanation: puzzle.explanation,
      category: puzzle.category,
      difficulty: puzzle.difficulty,
      timedOut: answer.timedOut,
    })
  }

  return items
}

export function clampReviewIndex(index: number, total: number): number {
  if (total <= 0) return 0
  if (index < 0) return 0
  if (index >= total) return total - 1
  return index
}

export function nextReviewIndex(index: number, total: number): number {
  if (total <= 0) return 0
  return clampReviewIndex(index + 1, total)
}

export function previousReviewIndex(index: number, total: number): number {
  if (total <= 0) return 0
  return clampReviewIndex(index - 1, total)
}

export function hasMistakesToReview(result: SessionResult): boolean {
  return buildReviewMistakeItems(result).length > 0
}
