import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../types'
import { buildExplanationSpeech, buildQuestionSpeech } from './explanationSpeech'

const puzzle: Puzzle = {
  id: 1,
  category: 'math',
  difficulty: 'easy',
  question: 'What is 2 + 2? 🤔',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  hint: 'Count on your fingers',
  explanation: 'Adding two and two gives four',
}

describe('buildQuestionSpeech', () => {
  it('prefixes the question and normalizes it for speech', () => {
    expect(buildQuestionSpeech(puzzle)).toBe('Question. What is 2 plus 2?')
  })
})

describe('buildExplanationSpeech', () => {
  it('confirms the answer when the player is correct', () => {
    const script = buildExplanationSpeech(puzzle, 1, true, false)
    expect(script).toBe('Correct. The answer is 4. Adding two and two gives four.')
  })

  it('mentions the timeout when time ran out', () => {
    const script = buildExplanationSpeech(puzzle, null, false, true)
    expect(script).toContain('Time ran out before you answered')
    expect(script).toContain('The correct answer is 4')
  })

  it('treats a missing selection as a timeout even when not flagged', () => {
    const script = buildExplanationSpeech(puzzle, null, false, false)
    expect(script).toContain('Time ran out before you answered')
  })

  it('repeats the wrong selection alongside the correct answer', () => {
    const script = buildExplanationSpeech(puzzle, 2, false, false)
    expect(script).toBe(
      'Not quite. You selected 5. The correct answer is 4. Adding two and two gives four.',
    )
  })

  it('always ends with sentence-final punctuation', () => {
    expect(buildExplanationSpeech(puzzle, 0, false, false)).toMatch(/[.!?]$/)
  })
})
