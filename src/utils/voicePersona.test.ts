import { describe, expect, it } from 'vitest'
import {
  VOICE_PERSONA_DEFAULTS,
  normalizeVoicePersona,
  pickPresidentPreferredVoice,
  scorePresidentVoice,
} from './voicePersona'
import { buildExplanationSpeech, buildQuestionSpeech } from './explanationSpeech'
import type { Puzzle } from '../types'

const samplePuzzle: Puzzle = {
  id: 1,
  category: 'math',
  difficulty: 'easy',
  question: 'What is 2 plus 2?',
  options: ['3', '4', '5', '6'],
  correctIndex: 1,
  hint: 'Add them.',
  explanation: 'Two plus two equals four.',
}

describe('voice persona helpers', () => {
  it('normalizes unknown personas to Night Guardian', () => {
    expect(normalizeVoicePersona(undefined)).toBe('night-guardian')
    expect(normalizeVoicePersona('president')).toBe('president')
    expect(normalizeVoicePersona('system')).toBe('system')
  })

  it('uses energetic defaults for The President', () => {
    expect(VOICE_PERSONA_DEFAULTS.president).toEqual({
      voiceSpeed: 'fast',
      voicePitch: 'normal',
    })
  })

  it('prefers a clear US English system voice for The President', () => {
    const preferred = pickPresidentPreferredVoice([
      { id: '1', name: 'English United Kingdom', lang: 'en-GB', voiceURI: 'en-gb-x-rjs' },
      {
        id: '2',
        name: 'English United States',
        lang: 'en-US',
        voiceURI: 'en-us-x-sfg-local',
        localService: true,
      },
      { id: '3', name: 'Child Soft Voice', lang: 'en-US', voiceURI: 'child-soft' },
    ])

    expect(preferred?.id).toBe('2')
    expect(scorePresidentVoice(preferred!)).toBeGreaterThan(0)
  })

  it('falls back safely when no English voices exist', () => {
    expect(
      pickPresidentPreferredVoice([{ id: '1', name: 'French', lang: 'fr-FR', voiceURI: 'fr' }]),
    ).toBeNull()
  })

  it('builds original President scripts without real-person references', () => {
    const question = buildQuestionSpeech(samplePuzzle, 'president')
    const explanation = buildExplanationSpeech(samplePuzzle, 0, false, false, 'president')

    expect(question.toLowerCase()).toContain('team')
    expect(explanation.toLowerCase()).toContain('correct call')
    expect(question.toLowerCase()).not.toMatch(/trump|biden|obama|real president/)
    expect(explanation.toLowerCase()).not.toMatch(/trump|biden|obama/)
  })

  it('keeps Night Guardian and system scripts distinct', () => {
    const guardian = buildQuestionSpeech(samplePuzzle, 'night-guardian')
    const system = buildQuestionSpeech(samplePuzzle, 'system')
    const president = buildQuestionSpeech(samplePuzzle, 'president')

    expect(guardian).toContain('Steady focus')
    expect(system.startsWith('Question.')).toBe(true)
    expect(president).toContain('Alright, team')
  })
})
