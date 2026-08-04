import { useState } from 'react'
import type { Category, Difficulty } from './types'
import { useProgress } from './hooks/useProgress'
import { HomeScreen } from './components/HomeScreen'
import { PuzzleGame } from './components/PuzzleGame'
import './App.css'

type Screen = 'home' | 'play'

interface PlayConfig {
  category: Category | 'all'
  difficulty: Difficulty
}

function App() {
  const {
    progress,
    completePuzzle,
    resetProgress,
    easyCompleted,
    mediumCompleted,
    isDifficultyUnlocked,
    totalCompleted,
    totalPuzzles,
  } = useProgress()

  const [screen, setScreen] = useState<Screen>('home')
  const [playConfig, setPlayConfig] = useState<PlayConfig | null>(null)

  const handleStart = (category: Category | 'all', difficulty: Difficulty) => {
    setPlayConfig({ category, difficulty })
    setScreen('play')
  }

  const handleExit = () => {
    setPlayConfig(null)
    setScreen('home')
  }

  const handleReset = () => {
    if (window.confirm('Reset all progress? This cannot be undone.')) {
      resetProgress()
    }
  }

  if (screen === 'play' && playConfig) {
    return (
      <PuzzleGame
        category={playConfig.category}
        difficulty={playConfig.difficulty}
        completedIds={progress.completed}
        streak={progress.streak}
        onComplete={completePuzzle}
        onExit={handleExit}
      />
    )
  }

  return (
    <HomeScreen
      completedIds={progress.completed}
      totalCompleted={totalCompleted}
      totalPuzzles={totalPuzzles}
      correctCount={progress.correctCount}
      bestStreak={progress.bestStreak}
      easyCompleted={easyCompleted}
      mediumCompleted={mediumCompleted}
      isDifficultyUnlocked={isDifficultyUnlocked}
      onStart={handleStart}
      onReset={handleReset}
    />
  )
}

export default App
