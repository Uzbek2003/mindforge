import type { GameProgress } from '../types'

export interface ParsedProgressExport {
  progress: GameProgress
  reportedQuestions: number[]
}

export type ProgressImportResult =
  | { ok: true; value: ParsedProgressExport }
  | { ok: false; reason: string }

function isNumberArray(value: unknown): value is number[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === 'number' && Number.isFinite(entry))
}

function toCount(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0
}

/**
 * Validates the JSON produced by "Export progress". Returns the reason on
 * failure so the caller can surface it instead of failing silently.
 */
export function parseProgressExport(text: string): ProgressImportResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (error) {
    return { ok: false, reason: `File is not valid JSON: ${(error as Error).message}` }
  }

  if (typeof data !== 'object' || data === null) {
    return { ok: false, reason: 'File does not contain a progress object.' }
  }

  const { progress, reportedQuestions } = data as Record<string, unknown>

  if (typeof progress !== 'object' || progress === null) {
    return { ok: false, reason: 'File is missing the "progress" object.' }
  }

  const { completed, correctCount, streak, bestStreak } = progress as Record<string, unknown>

  if (!isNumberArray(completed)) {
    return { ok: false, reason: '"progress.completed" must be an array of puzzle ids.' }
  }

  if (reportedQuestions !== undefined && !isNumberArray(reportedQuestions)) {
    return { ok: false, reason: '"reportedQuestions" must be an array of puzzle ids.' }
  }

  return {
    ok: true,
    value: {
      progress: {
        completed: [...new Set(completed)],
        correctCount: toCount(correctCount),
        streak: toCount(streak),
        bestStreak: toCount(bestStreak),
      },
      reportedQuestions: reportedQuestions === undefined ? [] : [...new Set(reportedQuestions)],
    },
  }
}
