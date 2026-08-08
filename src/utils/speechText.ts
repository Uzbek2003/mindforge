import { APP_NAME } from '../constants'
import type { VoicePersona } from '../types'

/** Normalize puzzle explanation text for natural speech synthesis. */
export function normalizeSpeechText(text: string): string {
  let result = text
    // Remove emoji and decorative symbols
    .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, '')
    .replace(/[✓✕✔✖🦇🔊⏱∑⚗🏛💻]/g, '')
    // Remove Markdown formatting
    .replace(/[*_#`~[\]()]/g, ' ')
    // Math and science symbols → spoken words
    .replace(/(\d)\s*\+\s*(\d)/g, '$1 plus $2')
    .replace(/(\d)\s*-\s*(\d)/g, '$1 minus $2')
    .replace(/(\d)\s*[×xX]\s*(\d)/g, '$1 times $2')
    .replace(/(\d)\s*÷\s*(\d)/g, '$1 divided by $2')
    .replace(/(\d)\s*=\s*(\d)/g, '$1 equals $2')
    .replace(/(\d)\s*\/\s*(\d)/g, '$1 divided by $2')
    .replace(/(\d)\s*%/g, '$1 percent')
    .replace(/\bH2O\b/g, 'H two O')
    .replace(/\bCO2\b/g, 'C O two')
    .replace(/\bO2\b/g, 'O two')
    // Avoid unnatural label phrasing
    .replace(/Your answer:\s*/gi, '')
    .replace(/Correct answer:\s*/gi, '')
    .replace(/Result:\s*/gi, '')
    // Clean whitespace and punctuation runs
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim()

  if (result && !/[.!?]$/.test(result)) {
    result += '.'
  }

  return result
}

/** Persona-aware Settings test phrase. Original wording only — no real-person references. */
export function getTestVoicePhrase(persona: VoicePersona): string {
  switch (persona) {
    case 'president':
      return normalizeSpeechText(
        `Hello. I am The President, your ${APP_NAME} quiz coach. This is a quick check that the voice is clear, confident, and ready for action.`,
      )
    case 'night-guardian':
      return normalizeSpeechText(
        `Hello. I am the Night Guardian, your ${APP_NAME} learning guide. This is a test of the selected English voice.`,
      )
    case 'system':
    default:
      return normalizeSpeechText(
        `Hello. I am your ${APP_NAME} learning guide. This is a test of the selected English voice.`,
      )
  }
}

/** @deprecated Prefer getTestVoicePhrase(persona). Kept for any legacy imports. */
export const TEST_VOICE_PHRASE = getTestVoicePhrase('system')
