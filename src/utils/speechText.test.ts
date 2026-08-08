import { describe, expect, it } from 'vitest'
import { TEST_VOICE_PHRASE, normalizeSpeechText } from './speechText'

describe('normalizeSpeechText', () => {
  it('strips emoji and decorative symbols', () => {
    expect(normalizeSpeechText('Correct ✓ 🎉 answer')).toBe('Correct answer.')
  })

  it('strips Markdown formatting characters', () => {
    expect(normalizeSpeechText('**bold** and _italic_ and `code`')).toBe(
      'bold and italic and code.',
    )
  })

  it('speaks arithmetic operators as words', () => {
    expect(normalizeSpeechText('2 + 3 = 5')).toBe('2 plus 3 equals 5.')
    expect(normalizeSpeechText('9 - 4')).toBe('9 minus 4.')
    expect(normalizeSpeechText('3 × 4')).toBe('3 times 4.')
    expect(normalizeSpeechText('3 x 4')).toBe('3 times 4.')
    expect(normalizeSpeechText('8 ÷ 2')).toBe('8 divided by 2.')
    expect(normalizeSpeechText('8 / 2')).toBe('8 divided by 2.')
    expect(normalizeSpeechText('50%')).toBe('50 percent.')
  })

  it('spells out common chemical formulas', () => {
    expect(normalizeSpeechText('H2O and CO2 and O2')).toBe('H two O and C O two and O two.')
  })

  it('drops UI labels that read unnaturally aloud', () => {
    expect(normalizeSpeechText('Your answer: Paris')).toBe('Paris.')
    expect(normalizeSpeechText('Correct answer: Paris')).toBe('Paris.')
    expect(normalizeSpeechText('result: tie')).toBe('tie.')
  })

  it('collapses whitespace and tightens punctuation', () => {
    expect(normalizeSpeechText('Hello   world  !')).toBe('Hello world!')
  })

  it('adds a terminal period only when missing', () => {
    expect(normalizeSpeechText('Done')).toBe('Done.')
    expect(normalizeSpeechText('Done.')).toBe('Done.')
    expect(normalizeSpeechText('Done!')).toBe('Done!')
    expect(normalizeSpeechText('Done?')).toBe('Done?')
  })

  it('returns an empty string for input with nothing speakable', () => {
    expect(normalizeSpeechText('')).toBe('')
    expect(normalizeSpeechText('   ')).toBe('')
  })
})

describe('TEST_VOICE_PHRASE', () => {
  it('is a non-empty sentence used for voice previews', () => {
    expect(TEST_VOICE_PHRASE.length).toBeGreaterThan(0)
    expect(TEST_VOICE_PHRASE).toMatch(/[.!?]$/)
  })
})
