import type { Puzzle } from '../types'

export function buildExplanationSpeech(
  puzzle: Puzzle,
  selectedIndex: number | null,
  correct: boolean,
  timedOut: boolean,
): string {
  const correctAnswer = puzzle.options[puzzle.correctIndex]
  const yourAnswer = selectedIndex != null ? puzzle.options[selectedIndex] : null

  if (correct) {
    return `Correct. The answer is ${correctAnswer}. ${puzzle.explanation}`
  }

  if (timedOut || yourAnswer == null) {
    return `Not quite. Time ran out before you answered. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
  }

  return `Not quite. Your answer was ${yourAnswer}. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
}
