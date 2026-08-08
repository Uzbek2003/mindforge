import { useCallback, useEffect, useState } from 'react'
import type { Difficulty, GameProgress, LastSession } from '../types'
import { ALL_PUZZLES } from '../data'
import { UNLOCK_THRESHOLDS } from '../types'
import { STORAGE_KEYS } from '../constants'
import { reportError } from '../utils/errors'
import { hasStoredValue, readStoredJson, removeStoredItem, writeStoredJson } from '../utils/storage'
import { parseProgressExport } from '../utils/progressImport'

export type ExportProgressResult = { ok: true } | { ok: false; reason: string }

export type ImportProgressResult =
  | { status: 'success' }
  | { status: 'cancelled' }
  | { status: 'error'; reason: string }

const defaultProgress: GameProgress = {
  completed: [],
  correctCount: 0,
  streak: 0,
  bestStreak: 0,
}

function loadProgress(): GameProgress {
  const stored =
    readStoredJson<Partial<GameProgress>>(STORAGE_KEYS.progress) ??
    readStoredJson<Partial<GameProgress>>(STORAGE_KEYS.progressLegacy)
  if (!stored) return { ...defaultProgress }

  const parsed = { ...defaultProgress, ...stored }
  if (!hasStoredValue(STORAGE_KEYS.progress)) {
    writeStoredJson(STORAGE_KEYS.progress, parsed)
  }
  return parsed
}

function saveProgress(progress: GameProgress) {
  writeStoredJson(STORAGE_KEYS.progress, progress)
}

function loadLastSession(): LastSession | null {
  return readStoredJson<LastSession>(STORAGE_KEYS.lastSession)
}

function saveLastSession(session: LastSession | null) {
  if (session) {
    writeStoredJson(STORAGE_KEYS.lastSession, session)
  } else {
    removeStoredItem(STORAGE_KEYS.lastSession)
  }
}

function loadReported(): number[] {
  return readStoredJson<number[]>(STORAGE_KEYS.reportedQuestions) ?? []
}

export function useProgress() {
  const [progress, setProgress] = useState<GameProgress>(loadProgress)
  const [lastSession, setLastSession] = useState<LastSession | null>(loadLastSession)
  const [reportedQuestions, setReportedQuestions] = useState<number[]>(loadReported)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    saveLastSession(lastSession)
  }, [lastSession])

  useEffect(() => {
    writeStoredJson(STORAGE_KEYS.reportedQuestions, reportedQuestions)
  }, [reportedQuestions])

  const completePuzzle = useCallback((puzzleId: number, correct: boolean) => {
    setProgress((prev) => {
      const alreadyDone = prev.completed.includes(puzzleId)
      const completed = alreadyDone ? prev.completed : [...prev.completed, puzzleId]
      const streak = correct ? prev.streak + 1 : 0
      const bestStreak = Math.max(prev.bestStreak, streak)
      const correctCount = correct && !alreadyDone ? prev.correctCount + 1 : prev.correctCount
      return { completed, correctCount, streak, bestStreak }
    })
  }, [])

  const resetProgress = useCallback(() => {
    setProgress({ ...defaultProgress })
    setLastSession(null)
  }, [])

  const saveSession = useCallback((session: LastSession | null) => {
    setLastSession(session)
  }, [])

  const clearLastSession = useCallback(() => {
    setLastSession(null)
  }, [])

  const reportQuestion = useCallback((puzzleId: number) => {
    setReportedQuestions((prev) => (prev.includes(puzzleId) ? prev : [...prev, puzzleId]))
  }, [])

  const exportProgress = useCallback((): ExportProgressResult => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      reportedQuestions,
    }
    let url: string | null = null
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'quiznova-progress.json'
      link.click()
      return { ok: true }
    } catch (error) {
      reportError('progress export failed', error)
      return { ok: false, reason: error instanceof Error ? error.message : String(error) }
    } finally {
      if (url) URL.revokeObjectURL(url)
    }
  }, [progress, reportedQuestions])

  const importProgress = useCallback(async () => {
    return new Promise<ImportProgressResult>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json,.json'
      input.onchange = () => {
        const file = input.files?.[0]
        if (!file) {
          resolve({ status: 'cancelled' })
          return
        }

        file
          .text()
          .then((text) => {
            const parsed = parseProgressExport(text)
            if (!parsed.ok) {
              reportError('progress import rejected', new Error(parsed.reason))
              resolve({ status: 'error', reason: parsed.reason })
              return
            }
            setProgress(parsed.value.progress)
            setReportedQuestions(parsed.value.reportedQuestions)
            resolve({ status: 'success' })
          })
          .catch((error: unknown) => {
            reportError('progress import failed', error)
            resolve({
              status: 'error',
              reason: error instanceof Error ? error.message : 'The file could not be read.',
            })
          })
      }
      input.click()
    })
  }, [])

  const easyCompleted = progress.completed.filter(
    (id) => ALL_PUZZLES.find((p) => p.id === id)?.difficulty === 'easy',
  ).length

  const mediumCompleted = progress.completed.filter(
    (id) => ALL_PUZZLES.find((p) => p.id === id)?.difficulty === 'medium',
  ).length

  const isDifficultyUnlocked = useCallback(
    (difficulty: Difficulty): boolean => {
      if (difficulty === 'easy') return true
      if (difficulty === 'medium') return easyCompleted >= UNLOCK_THRESHOLDS.medium
      return mediumCompleted >= UNLOCK_THRESHOLDS.hard
    },
    [easyCompleted, mediumCompleted],
  )

  return {
    progress,
    lastSession,
    reportedQuestions,
    completePuzzle,
    resetProgress,
    saveSession,
    clearLastSession,
    reportQuestion,
    exportProgress,
    importProgress,
    easyCompleted,
    mediumCompleted,
    isDifficultyUnlocked,
    totalCompleted: progress.completed.length,
    totalPuzzles: ALL_PUZZLES.length,
  }
}
