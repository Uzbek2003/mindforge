import type { AppSettings, Difficulty } from '../types'
import { DIFFICULTY_TIME_LIMITS } from '../types'

/** Multiplier applied when Extended Time is on and Untimed Mode is off. */
export const EXTENDED_TIME_MULTIPLIER = 1.5

export type TimerSettings = Pick<AppSettings, 'untimedMode' | 'extendedTime'>

/**
 * Resolve the per-question time limit in seconds.
 * Returns `null` when Untimed Mode is enabled (timer disabled).
 * Extended Time only applies when the timer is active.
 */
export function resolveQuestionTimeLimit(
  difficulty: Difficulty,
  settings: TimerSettings,
): number | null {
  if (settings.untimedMode) return null
  const base = DIFFICULTY_TIME_LIMITS[difficulty]
  if (settings.extendedTime) return Math.round(base * EXTENDED_TIME_MULTIPLIER)
  return base
}

/** Retry attempt limit for story battles (75% of the active limit, minimum 20s). */
export function resolveRetryTimeLimit(activeLimit: number | null): number | null {
  if (activeLimit == null) return null
  return Math.max(20, Math.floor(activeLimit * 0.75))
}
