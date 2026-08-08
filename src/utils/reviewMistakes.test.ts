import { describe, expect, it } from 'vitest'
import { ALL_PUZZLES } from '../data'
import type { LastSession, SessionAnswer, SessionResult } from '../types'
import {
  buildReviewMistakeItems,
  clampReviewIndex,
  getSessionAnswers,
  hasMistakesToReview,
  nextReviewIndex,
  previousReviewIndex,
} from './reviewMistakes'

function makeResult(overrides: Partial<SessionResult> = {}): SessionResult {
  return {
    correct: 0,
    incorrect: 0,
    total: 0,
    accuracy: 0,
    bestStreakInSession: 0,
    timeMs: 1000,
    wrongPuzzleIds: [],
    sessionAnswers: [],
    category: 'math',
    difficulty: 'easy',
    mode: 'quick',
    ...overrides,
  }
}

describe('review mistakes', () => {
  it('returns zero items for a perfect session', () => {
    const puzzle = ALL_PUZZLES[0]
    const answers: SessionAnswer[] = [
      { puzzleId: puzzle.id, selectedIndex: puzzle.correctIndex, correct: true },
    ]
    const result = makeResult({
      correct: 1,
      incorrect: 0,
      total: 1,
      accuracy: 100,
      sessionAnswers: answers,
      wrongPuzzleIds: [],
    })

    expect(buildReviewMistakeItems(result)).toEqual([])
    expect(hasMistakesToReview(result)).toBe(false)
  })

  it('builds one review item with user answer, correct answer, hint, and explanation', () => {
    const puzzle = ALL_PUZZLES.find((item) => item.correctIndex !== 0) ?? ALL_PUZZLES[0]
    const wrongIndex = puzzle.correctIndex === 0 ? 1 : 0
    const result = makeResult({
      correct: 0,
      incorrect: 1,
      total: 1,
      wrongPuzzleIds: [puzzle.id],
      sessionAnswers: [
        { puzzleId: puzzle.id, selectedIndex: wrongIndex, correct: false },
      ],
    })

    const items = buildReviewMistakeItems(result)
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      puzzleId: puzzle.id,
      question: puzzle.question,
      userAnswerLabel: puzzle.options[wrongIndex],
      correctAnswerLabel: puzzle.options[puzzle.correctIndex],
      hint: puzzle.hint,
      explanation: puzzle.explanation,
      category: puzzle.category,
      difficulty: puzzle.difficulty,
    })
    expect(hasMistakesToReview(result)).toBe(true)
  })

  it('builds multiple review items and skips correct answers', () => {
    const first = ALL_PUZZLES[0]
    const second = ALL_PUZZLES[1]
    const third = ALL_PUZZLES[2]
    const wrongA = first.correctIndex === 0 ? 1 : 0
    const wrongC = third.correctIndex === 0 ? 1 : 0

    const result = makeResult({
      correct: 1,
      incorrect: 2,
      total: 3,
      wrongPuzzleIds: [first.id, third.id],
      sessionAnswers: [
        { puzzleId: first.id, selectedIndex: wrongA, correct: false },
        { puzzleId: second.id, selectedIndex: second.correctIndex, correct: true },
        { puzzleId: third.id, selectedIndex: wrongC, correct: false, timedOut: false },
      ],
    })

    const items = buildReviewMistakeItems(result)
    expect(items).toHaveLength(2)
    expect(items.map((item) => item.puzzleId)).toEqual([first.id, third.id])
    expect(items[0].userAnswerLabel).toBe(first.options[wrongA])
    expect(items[1].correctAnswerLabel).toBe(third.options[third.correctIndex])
  })

  it('labels timed-out answers clearly', () => {
    const puzzle = ALL_PUZZLES[3]
    const result = makeResult({
      incorrect: 1,
      total: 1,
      wrongPuzzleIds: [puzzle.id],
      sessionAnswers: [{ puzzleId: puzzle.id, selectedIndex: null, correct: false, timedOut: true }],
    })

    const [item] = buildReviewMistakeItems(result)
    expect(item.userAnswerLabel).toBe('No answer (timed out)')
    expect(item.timedOut).toBe(true)
  })

  it('falls back to wrongPuzzleIds for legacy results without sessionAnswers', () => {
    const puzzle = ALL_PUZZLES[2]
    const result = makeResult({
      incorrect: 1,
      total: 1,
      wrongPuzzleIds: [puzzle.id],
      sessionAnswers: [],
    })

    expect(getSessionAnswers(result)).toEqual([
      { puzzleId: puzzle.id, selectedIndex: null, correct: false },
    ])

    const [item] = buildReviewMistakeItems(result)
    expect(item.userAnswerLabel).toBe('No answer (timed out)')
    expect(item.selectedIndex).toBeNull()
  })

  it('skips answers referencing puzzles that no longer exist', () => {
    const result = makeResult({
      incorrect: 1,
      total: 1,
      wrongPuzzleIds: [-999],
      sessionAnswers: [{ puzzleId: -999, selectedIndex: 0, correct: false }],
    })

    expect(buildReviewMistakeItems(result)).toEqual([])
    expect(hasMistakesToReview(result)).toBe(false)
  })

  it('navigates previous/next with safe clamps', () => {
    expect(clampReviewIndex(-2, 3)).toBe(0)
    expect(clampReviewIndex(9, 3)).toBe(2)
    expect(nextReviewIndex(0, 3)).toBe(1)
    expect(nextReviewIndex(2, 3)).toBe(2)
    expect(previousReviewIndex(2, 3)).toBe(1)
    expect(previousReviewIndex(0, 3)).toBe(0)
    expect(nextReviewIndex(0, 0)).toBe(0)
  })

  it('preserves saved session answer data when building review items', () => {
    const puzzle = ALL_PUZZLES[4]
    const wrongIndex = puzzle.correctIndex === 0 ? 1 : 0
    const savedSession: LastSession = {
      category: puzzle.category,
      difficulty: puzzle.difficulty,
      mode: 'standard',
      puzzleIds: [puzzle.id],
      index: 0,
      startedAt: 1,
      sessionAnswers: [
        { puzzleId: puzzle.id, selectedIndex: wrongIndex, correct: false },
      ],
    }

    // Simulate finishing from a resumed session: answers come from saved sessionAnswers.
    const result = makeResult({
      incorrect: 1,
      total: 1,
      wrongPuzzleIds: savedSession.sessionAnswers.filter((a) => !a.correct).map((a) => a.puzzleId),
      sessionAnswers: [...savedSession.sessionAnswers],
      category: savedSession.category,
      difficulty: savedSession.difficulty,
      mode: savedSession.mode,
    })

    const answers = getSessionAnswers(result)
    expect(answers).toEqual(savedSession.sessionAnswers)

    const items = buildReviewMistakeItems(result)
    expect(items).toHaveLength(1)
    expect(items[0].userAnswerLabel).toBe(puzzle.options[wrongIndex])
    // Original saved session payload remains intact.
    expect(savedSession.sessionAnswers[0].selectedIndex).toBe(wrongIndex)
  })
})
