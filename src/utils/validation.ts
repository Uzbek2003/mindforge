import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type Category,
  type Difficulty,
  type GameProgress,
  type LastSession,
  type SessionAnswer,
  type SessionMode,
  type TextSize,
  type VoiceSpeed,
} from '../types'
import { normalizeVoicePitch } from './voiceProsody'

/** Upper bound on ids/answers kept from untrusted JSON, guarding against oversized payloads. */
export const MAX_STORED_IDS = 10_000
/** Upper bound on an imported progress file, in bytes. */
export const MAX_IMPORT_BYTES = 1_000_000

const PROTOTYPE_KEYS = new Set(['__proto__', 'constructor', 'prototype'])

const CATEGORIES: readonly Category[] = ['math', 'science', 'history', 'computer-science']
const DIFFICULTIES: readonly Difficulty[] = ['easy', 'medium', 'hard']
const SESSION_MODES: readonly SessionMode[] = [
  'quick',
  'standard',
  'challenge',
  'full',
  'endless',
  'daily',
]
const TEXT_SIZES: readonly TextSize[] = ['normal', 'large']
const VOICE_SPEEDS: readonly VoiceSpeed[] = ['slow', 'normal', 'fast']

/**
 * Parses JSON into a plain object, dropping prototype-polluting keys at every level.
 * Returns null for invalid JSON or any non-object payload.
 */
export function parseJsonObject(raw: string): Record<string, unknown> | null {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw, (key, value) => (PROTOTYPE_KEYS.has(key) ? undefined : value))
  } catch {
    return null
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null
  return parsed as Record<string, unknown>
}

function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function boolOr(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function countOr(value: unknown, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback
  return Math.min(Math.max(Math.trunc(value), 0), Number.MAX_SAFE_INTEGER)
}

function idList(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  const ids: number[] = []
  for (const entry of value) {
    if (typeof entry !== 'number' || !Number.isSafeInteger(entry) || entry < 0) continue
    if (!ids.includes(entry)) ids.push(entry)
    if (ids.length >= MAX_STORED_IDS) break
  }
  return ids
}

export function sanitizeReportedQuestions(value: unknown): number[] {
  return idList(value)
}

export function sanitizeProgress(value: unknown): GameProgress {
  const source = (typeof value === 'object' && value !== null ? value : {}) as Record<
    string,
    unknown
  >
  const completed = idList(source.completed)
  const correctCount = Math.min(countOr(source.correctCount, 0), completed.length)
  const streak = countOr(source.streak, 0)
  return {
    completed,
    correctCount,
    streak,
    bestStreak: Math.max(countOr(source.bestStreak, 0), streak),
  }
}

function sanitizeSessionAnswer(value: unknown): SessionAnswer | null {
  if (typeof value !== 'object' || value === null) return null
  const source = value as Record<string, unknown>
  if (typeof source.puzzleId !== 'number' || !Number.isSafeInteger(source.puzzleId)) return null
  const selectedIndex =
    typeof source.selectedIndex === 'number' &&
    Number.isInteger(source.selectedIndex) &&
    source.selectedIndex >= 0 &&
    source.selectedIndex <= 3
      ? source.selectedIndex
      : null
  return {
    puzzleId: source.puzzleId,
    selectedIndex,
    correct: boolOr(source.correct, false),
    timedOut: boolOr(source.timedOut, false),
  }
}

/** Returns null when the stored session cannot be trusted to resume safely. */
export function sanitizeLastSession(value: unknown): LastSession | null {
  if (typeof value !== 'object' || value === null) return null
  const source = value as Record<string, unknown>
  const puzzleIds = idList(source.puzzleIds)
  if (puzzleIds.length === 0) return null
  const answers = Array.isArray(source.sessionAnswers) ? source.sessionAnswers : []
  const sessionAnswers = answers
    .slice(0, MAX_STORED_IDS)
    .map(sanitizeSessionAnswer)
    .filter((answer): answer is SessionAnswer => answer !== null)
  const index = countOr(source.index, 0)
  return {
    category: source.category === 'all' ? 'all' : oneOf(source.category, CATEGORIES, 'math'),
    difficulty: oneOf(source.difficulty, DIFFICULTIES, 'easy'),
    mode: oneOf(source.mode, SESSION_MODES, 'standard'),
    puzzleIds,
    index: Math.min(index, puzzleIds.length - 1),
    sessionAnswers,
    startedAt: countOr(source.startedAt, Date.now()),
  }
}

export function sanitizeSettings(value: unknown): AppSettings {
  const source = (typeof value === 'object' && value !== null ? value : {}) as Record<
    string,
    unknown
  >
  const voiceVolume =
    typeof source.voiceVolume === 'number' && Number.isFinite(source.voiceVolume)
      ? Math.min(Math.max(source.voiceVolume, 0), 1)
      : DEFAULT_SETTINGS.voiceVolume
  return {
    soundEnabled: boolOr(source.soundEnabled, DEFAULT_SETTINGS.soundEnabled),
    vibrationEnabled: boolOr(source.vibrationEnabled, DEFAULT_SETTINGS.vibrationEnabled),
    textSize: oneOf(source.textSize, TEXT_SIZES, DEFAULT_SETTINGS.textSize),
    reduceAnimations: boolOr(source.reduceAnimations, DEFAULT_SETTINGS.reduceAnimations),
    voiceExplanationsEnabled: boolOr(
      source.voiceExplanationsEnabled,
      DEFAULT_SETTINGS.voiceExplanationsEnabled,
    ),
    voiceAutoPlay: boolOr(source.voiceAutoPlay, DEFAULT_SETTINGS.voiceAutoPlay),
    voiceId: typeof source.voiceId === 'string' ? source.voiceId.slice(0, 200) : null,
    voiceSpeed: oneOf(source.voiceSpeed, VOICE_SPEEDS, DEFAULT_SETTINGS.voiceSpeed),
    voicePitch: normalizeVoicePitch(
      typeof source.voicePitch === 'string' ? source.voicePitch : DEFAULT_SETTINGS.voicePitch,
    ),
    voiceVolume,
    stopSpeechOnLeave: boolOr(source.stopSpeechOnLeave, DEFAULT_SETTINGS.stopSpeechOnLeave),
  }
}
