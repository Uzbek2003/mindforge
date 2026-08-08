import type { Puzzle, VoicePersona } from '../types'
import { normalizeSpeechText } from './speechText'

/** Spoken script for the puzzle question itself. */
export function buildQuestionSpeech(puzzle: Puzzle, persona: VoicePersona = 'system'): string {
  switch (persona) {
    case 'president':
      return normalizeSpeechText(`Alright, focus up. Here is your question. ${puzzle.question}`)
    case 'night-guardian':
      return normalizeSpeechText(`Steady now. Here is your question. ${puzzle.question}`)
    case 'system':
    default:
      return normalizeSpeechText(`Question. ${puzzle.question}`)
  }
}

export function buildExplanationSpeech(
  puzzle: Puzzle,
  selectedIndex: number | null,
  correct: boolean,
  timedOut: boolean,
  persona: VoicePersona = 'system',
): string {
  const correctAnswer = puzzle.options[puzzle.correctIndex]
  const yourAnswer = selectedIndex != null ? puzzle.options[selectedIndex] : null

  let script: string

  if (persona === 'president') {
    if (correct) {
      script = `Nice work. You nailed it. The answer is ${correctAnswer}. ${puzzle.explanation}`
    } else if (timedOut || yourAnswer == null) {
      script = `Time's up. No answer logged this round. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
    } else {
      script = `Close, but not quite. You went with ${yourAnswer}. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
    }
  } else if (persona === 'night-guardian') {
    if (correct) {
      script = `Well done. The answer is ${correctAnswer}. ${puzzle.explanation}`
    } else if (timedOut || yourAnswer == null) {
      script = `Time has run out. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
    } else {
      script = `Not this time. You selected ${yourAnswer}. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
    }
  } else if (correct) {
    script = `Correct. The answer is ${correctAnswer}. ${puzzle.explanation}`
  } else if (timedOut || yourAnswer == null) {
    script = `Not quite. Time ran out before you answered. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
  } else {
    script = `Not quite. You selected ${yourAnswer}. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
  }

  return normalizeSpeechText(script)
}
