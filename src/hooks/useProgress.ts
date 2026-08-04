import { useCallback, useEffect, useState } from 'react'
import type { Difficulty, GameProgress } from '../types'
import { ALL_PUZZLES } from '../data'
import { UNLOCK_THRESHOLDS } from '../types'

const STORAGE_KEY = 'mindforge-progress'

const defaultProgress: GameProgress = {
  completed: [],
  correctCount: 0,
  streak: 0,
  bestStreak: 0,
}

function loadProgress(): GameProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultProgress }
    return { ...defaultProgress, ...JSON.parse(raw) }
  } catch {
    return { ...defaultProgress }
  }
}

function saveProgress(progress: GameProgress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function useProgress() {
  const [progress, setProgress] = useState<GameProgress>(loadProgress)

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

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
  }, [])

  const easyCompleted = progress.completed.filter((id) =>
    ALL_PUZZLES.find((p) => p.id === id)?.difficulty === 'easy',
  ).length

  const mediumCompleted = progress.completed.filter((id) =>
    ALL_PUZZLES.find((p) => p.id === id)?.difficulty === 'medium',
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
    completePuzzle,
    resetProgress,
    easyCompleted,
    mediumCompleted,
    isDifficultyUnlocked,
    totalCompleted: progress.completed.length,
    totalPuzzles: ALL_PUZZLES.length,
  }
}
