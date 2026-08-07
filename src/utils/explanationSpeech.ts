import type { Puzzle, VoicePersona } from '../types'
import { normalizeSpeechText } from './speechText'

/** Spoken script for the puzzle question itself. */
export function buildQuestionSpeech(
  puzzle: Puzzle,
  persona: VoicePersona = 'night-guardian',
): string {
  const question = puzzle.question

  let script: string
  switch (persona) {
    case 'president':
      script = `Alright, team — question time. ${question}`
      break
    case 'night-guardian':
      script = `Steady focus. Question. ${question}`
      break
    default:
      script = `Question. ${question}`
  }

  return normalizeSpeechText(script)
}

export function buildExplanationSpeech(
  puzzle: Puzzle,
  selectedIndex: number | null,
  correct: boolean,
  timedOut: boolean,
  persona: VoicePersona = 'night-guardian',
): string {
  const correctAnswer = puzzle.options[puzzle.correctIndex]
  const yourAnswer = selectedIndex != null ? puzzle.options[selectedIndex] : null

  let script: string

  if (persona === 'president') {
    if (correct) {
      script = `Yes! That's a win. The answer is ${correctAnswer}. Quick briefing: ${puzzle.explanation}`
    } else if (timedOut || yourAnswer == null) {
      script = `Clock ran out before the call came in. The correct answer is ${correctAnswer}. Here's the briefing: ${puzzle.explanation}`
    } else {
      script = `Not this time — you selected ${yourAnswer}. The correct call is ${correctAnswer}. Let's break it down: ${puzzle.explanation}`
    }
  } else if (persona === 'night-guardian') {
    if (correct) {
      script = `Well done. The answer is ${correctAnswer}. ${puzzle.explanation}`
    } else if (timedOut || yourAnswer == null) {
      script = `Time slipped away before you answered. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
    } else {
      script = `Not quite. You selected ${yourAnswer}. The correct answer is ${correctAnswer}. ${puzzle.explanation}`
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
