import { describe, expect, it } from 'vitest'
import { SUPPORT_EMAIL } from '../constants'
import type { Puzzle } from '../types'
import { buildQuestionReportEmail } from './report'

const puzzle: Puzzle = {
  id: 42,
  category: 'history',
  difficulty: 'medium',
  question: 'Who was the first US president?',
  options: ['Adams', 'Washington', 'Jefferson', 'Madison'],
  correctIndex: 1,
  hint: 'He is on the dollar bill',
  explanation: 'George Washington took office in 1789',
}

function parse(mailto: string) {
  const url = new URL(mailto)
  return {
    recipient: url.pathname,
    subject: url.searchParams.get('subject') ?? '',
    body: url.searchParams.get('body') ?? '',
  }
}

describe('buildQuestionReportEmail', () => {
  it('addresses the support inbox and includes the puzzle id in the subject', () => {
    const { recipient, subject } = parse(buildQuestionReportEmail(puzzle, 1))
    expect(recipient).toBe(SUPPORT_EMAIL)
    expect(subject).toBe('QuizNova question report #42')
  })

  it('reports the selected and correct answers', () => {
    const { body } = parse(buildQuestionReportEmail(puzzle, 2))
    expect(body).toContain('Puzzle ID: 42')
    expect(body).toContain('Question: Who was the first US president?')
    expect(body).toContain('Selected answer: Jefferson')
    expect(body).toContain('Correct answer: Washington')
  })

  it('marks unanswered puzzles explicitly', () => {
    const { body } = parse(buildQuestionReportEmail(puzzle, null))
    expect(body).toContain('Selected answer: Not answered')
  })

  it('percent-encodes the subject and body', () => {
    const raw = buildQuestionReportEmail(puzzle, 0)
    expect(raw.startsWith(`mailto:${SUPPORT_EMAIL}?subject=`)).toBe(true)
    expect(raw).not.toContain('\n')
    expect(raw).toContain('%0A')
  })
})
