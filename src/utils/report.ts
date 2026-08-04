import { SUPPORT_EMAIL } from '../constants'
import type { Puzzle } from '../types'

export function buildQuestionReportEmail(
  puzzle: Puzzle,
  selectedIndex: number | null,
): string {
  const selectedAnswer =
    selectedIndex != null ? puzzle.options[selectedIndex] : 'Not answered'
  const correctAnswer = puzzle.options[puzzle.correctIndex]
  const subject = encodeURIComponent(`QuizNova question report #${puzzle.id}`)
  const body = encodeURIComponent(
    [
      'QuizNova — Question Report',
      '',
      `Puzzle ID: ${puzzle.id}`,
      `Question: ${puzzle.question}`,
      `Selected answer: ${selectedAnswer}`,
      `Correct answer: ${correctAnswer}`,
      '',
      'Additional notes:',
      '',
    ].join('\n'),
  )

  return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`
}
