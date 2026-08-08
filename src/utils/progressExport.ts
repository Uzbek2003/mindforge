import type { GameProgress } from '../types'

const defaultProgress: GameProgress = {
  completed: [],
  correctCount: 0,
  streak: 0,
  bestStreak: 0,
}

export interface ProgressExportPayload {
  version?: number
  exportedAt?: string
  progress: GameProgress
  reportedQuestions?: number[]
}

/**
 * Accepts current MindForge exports and older QuizNova-era exports.
 * Brand/filename is not part of the schema — only `progress.completed` is required.
 */
export function parseProgressExport(data: unknown): ProgressExportPayload | null {
  if (!data || typeof data !== 'object') return null
  const record = data as Record<string, unknown>
  const progress = record.progress
  if (!progress || typeof progress !== 'object') return null
  const completed = (progress as Record<string, unknown>).completed
  if (!Array.isArray(completed)) return null

  return {
    version: typeof record.version === 'number' ? record.version : undefined,
    exportedAt: typeof record.exportedAt === 'string' ? record.exportedAt : undefined,
    progress: { ...defaultProgress, ...(progress as GameProgress) },
    reportedQuestions: Array.isArray(record.reportedQuestions)
      ? (record.reportedQuestions as number[])
      : undefined,
  }
}
