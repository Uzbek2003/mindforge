import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../types'
import { buildExplanationSpeech, buildQuestionSpeech } from './explanationSpeech'
import { getTestVoicePhrase } from './speechText'

const puzzle: Puzzle = {
  id: 1,
  category: 'math',
  difficulty: 'easy',
  question: 'What is 2 + 2?',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  hint: 'Basic addition',
  explanation: 'Two plus two equals four.',
}

describe('persona speech scripts', () => {
  it('builds distinct question scripts per persona', () => {
    expect(buildQuestionSpeech(puzzle, 'system')).toContain('Question.')
    expect(buildQuestionSpeech(puzzle, 'night-guardian')).toContain('Steady now')
    expect(buildQuestionSpeech(puzzle, 'president')).toContain('focus up')
  })

  it('uses confident humorous President wording for correct and incorrect answers', () => {
    const correct = buildExplanationSpeech(puzzle, 1, true, false, 'president')
    const wrong = buildExplanationSpeech(puzzle, 0, false, false, 'president')
    const timedOut = buildExplanationSpeech(puzzle, null, false, true, 'president')

    expect(correct).toContain('Nice work')
    expect(wrong).toContain('Close, but not quite')
    expect(timedOut).toContain("Time's up")
    expect(`${correct} ${wrong} ${timedOut}`.toLowerCase()).not.toMatch(/trump|obama|biden/)
  })

  it('keeps Night Guardian calm and System Default neutral', () => {
    expect(buildExplanationSpeech(puzzle, 1, true, false, 'night-guardian')).toContain('Well done')
    expect(buildExplanationSpeech(puzzle, 1, true, false, 'system')).toContain('Correct.')
  })

  it('adapts the Settings test phrase to the selected persona', () => {
    expect(getTestVoicePhrase('president')).toContain('The President')
    expect(getTestVoicePhrase('night-guardian')).toContain('Night Guardian')
    expect(getTestVoicePhrase('system')).toContain('MindForge learning guide')
  })
})
