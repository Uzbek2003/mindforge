import { useCallback, useEffect, useState } from 'react'
import type { Difficulty, GameProgress, LastSession } from '../types'
import { ALL_PUZZLES } from '../data'
import { UNLOCK_THRESHOLDS } from '../types'
import { STORAGE_KEYS } from '../constants'
import { countCompleted } from '../utils/progress'
import {
  readJson,
  readMergedJsonWithLegacyKey,
  writeJson,
  writeJsonOrRemove,
} from '../utils/storage'

const defaultProgress: GameProgress = {
  completed: [],
  correctCount: 0,
  streak: 0,
  bestStreak: 0,
}

function loadProgress(): GameProgress {
  return readMergedJsonWithLegacyKey(
    STORAGE_KEYS.progress,
    STORAGE_KEYS.progressLegacy,
    defaultProgress,
  )
}

function loadLastSession(): LastSession | null {
  return readJson<LastSession | null>(STORAGE_KEYS.lastSession, null)
}

function loadReported(): number[] {
  return readJson<number[]>(STORAGE_KEYS.reportedQuestions, [])
}

export function useProgress() {
  const [progress, setProgress] = useState<GameProgress>(loadProgress)
  const [lastSession, setLastSession] = useState<LastSession | null>(loadLastSession)
  const [reportedQuestions, setReportedQuestions] = useState<number[]>(loadReported)

  useEffect(() => {
    writeJson(STORAGE_KEYS.progress, progress)
  }, [progress])

  useEffect(() => {
    writeJsonOrRemove(STORAGE_KEYS.lastSession, lastSession)
  }, [lastSession])

  useEffect(() => {
    writeJson(STORAGE_KEYS.reportedQuestions, reportedQuestions)
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

  const exportProgress = useCallback(() => {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress,
      reportedQuestions,
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'quiznova-progress.json'
    link.click()
    URL.revokeObjectURL(url)
  }, [progress, reportedQuestions])

  const importProgress = useCallback(async () => {
    return new Promise<'success' | 'cancelled' | 'error'>((resolve) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json,.json'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          resolve('cancelled')
          return
        }
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          if (!data.progress?.completed) {
            resolve('error')
            return
          }
          setProgress({ ...defaultProgress, ...data.progress })
          if (Array.isArray(data.reportedQuestions)) {
            setReportedQuestions(data.reportedQuestions)
          }
          resolve('success')
        } catch {
          resolve('error')
        }
      }
      input.click()
    })
  }, [])

  const easyCompleted = countCompleted(progress.completed, { difficulty: 'easy' })
  const mediumCompleted = countCompleted(progress.completed, { difficulty: 'medium' })

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
