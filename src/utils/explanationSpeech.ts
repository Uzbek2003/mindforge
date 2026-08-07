import type { Puzzle } from '../types'
import { normalizeSpeechText } from './speechText'

/** Spoken script for the puzzle question itself. */
export function buildQuestionSpeech(puzzle: Puzzle): string {
  return normalizeSpeechText(`Question. ${puzzle.question}`)
}

export function buildExplanationSpeech(
  puzzle: Puzzle,
  selectedIndex: number | null,
  correct: boolean,
  timedOut: boolean,
): string {
  const correctAnswer = puzzle.options[puzzle.correctIndex]
  const yourAnswer = selectedIndex != null ? puzzle.options[selectedIndex] : null

  let script: string

  if (correct) {
    script = `Correct. The answer is ${correctAnswer}. ${puzzle.explanation}`
  } else if (timedOut || yourAnswer == null) {
    script = `Not quite. Time ran out before you answered. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
  } else {
    script = `Not quite. You selected ${yourAnswer}. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
  }

  return normalizeSpeechText(script)
}
