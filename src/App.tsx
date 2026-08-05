import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { Category, Difficulty, LastSession, SessionMode, SessionResult } from './types'
import { APP_NAME } from './constants'
import { useProgress } from './hooks/useProgress'
import { useSettings } from './hooks/useSettings'
import { HomeScreen } from './components/HomeScreen'
import { PuzzleGame } from './components/PuzzleGame'
import { ResultsScreen } from './components/ResultsScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { LegalPage } from './components/LegalPage'
import { legalPathToScreen, screenToLegalPath } from './utils/routes'
import './App.css'

type Screen =
  | 'home'
  | 'play'
  | 'results'
  | 'settings'
  | 'privacy'
  | 'terms'
  | 'about'
  | 'contact'

interface PlayConfig {
  category: Category | 'all'
  difficulty: Difficulty
  mode: SessionMode
  resume?: boolean
  retryIds?: number[]
}

function App() {
  const {
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
    totalCompleted,
    totalPuzzles,
  } = useProgress()

  const { settings, updateSetting } = useSettings()

  const [screen, setScreen] = useState<Screen>('home')
  const [playConfig, setPlayConfig] = useState<PlayConfig | null>(null)
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [resumeSession, setResumeSession] = useState<LastSession | null>(null)
  const [legalFromSettings, setLegalFromSettings] = useState(false)

  useEffect(() => {
    const legalScreen = legalPathToScreen(window.location.pathname)
    if (legalScreen) setScreen(legalScreen)
  }, [])

  useEffect(() => {
    const onPopState = () => {
      const legalScreen = legalPathToScreen(window.location.pathname)
      if (legalScreen) {
        setScreen(legalScreen)
        return
      }
      if (window.location.pathname === '/' || window.location.pathname === '') {
        setScreen('home')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const openLegal = (page: 'privacy' | 'terms' | 'about' | 'contact') => {
    setLegalFromSettings(true)
    window.history.pushState(null, '', screenToLegalPath(page))
    setScreen(page)
  }

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined)
    StatusBar.setBackgroundColor({ color: '#0f2744' }).catch(() => undefined)

    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (screen !== 'home') {
        if (screen === 'play') {
          if (window.confirm('Leave this session? Progress in this session will be saved.')) {
            setPlayConfig(null)
            setResumeSession(null)
            setScreen('home')
          }
        } else {
          setScreen('home')
        }
        return
      }
      if (canGoBack) CapApp.exitApp()
    })

    return () => {
      sub.then((handle) => handle.remove())
    }
  }, [screen])

  const handleStart = (config: PlayConfig) => {
    setSessionResult(null)
    setPlayConfig(config)
    setResumeSession(config.resume ? lastSession : null)
    setScreen('play')
  }

  const handleFinish = (result: SessionResult) => {
    clearLastSession()
    setSessionResult(result)
    setPlayConfig(null)
    setResumeSession(null)
    setScreen('results')
  }

  const handleExitPlay = () => {
    setPlayConfig(null)
    setResumeSession(null)
    setScreen('home')
  }

  const handlePlayAgain = () => {
    if (!sessionResult) return
    handleStart({
      category: sessionResult.category,
      difficulty: sessionResult.difficulty,
      mode: sessionResult.mode,
    })
  }

  const handleRetryWrong = () => {
    if (!sessionResult) return
    handleStart({
      category: sessionResult.category,
      difficulty: sessionResult.difficulty,
      mode: 'quick',
      retryIds: sessionResult.wrongPuzzleIds,
    })
  }

  const handleShare = async () => {
    if (!sessionResult) return
    const text = `${APP_NAME}: ${sessionResult.correct}/${sessionResult.total} correct (${sessionResult.accuracy}% accuracy) in ${sessionResult.mode} mode!`
    if (navigator.share) {
      try {
        await navigator.share({ title: APP_NAME, text })
        return
      } catch {
        /* fall through */
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      window.alert('Score copied to clipboard.')
    } catch {
      window.alert(text)
    }
  }

  const goHome = () => {
    setPlayConfig(null)
    setResumeSession(null)
    setSessionResult(null)
    window.history.pushState(null, '', '/')
    setScreen('home')
  }

  if (screen === 'play' && playConfig) {
    return (
      <PuzzleGame
        category={playConfig.category}
        difficulty={playConfig.difficulty}
        mode={playConfig.mode}
        completedIds={progress.completed}
        streak={progress.streak}
        settings={settings}
        resumeSession={resumeSession}
        retryIds={playConfig.retryIds}
        onComplete={completePuzzle}
        onSessionUpdate={saveSession}
        onFinish={handleFinish}
        onExit={handleExitPlay}
        onReport={reportQuestion}
        reportedQuestions={reportedQuestions}
      />
    )
  }

  if (screen === 'results' && sessionResult) {
    return (
      <ResultsScreen
        result={sessionResult}
        onHome={goHome}
        onPlayAgain={handlePlayAgain}
        onRetryWrong={handleRetryWrong}
        onShare={handleShare}
      />
    )
  }

  if (screen === 'settings') {
    return (
      <SettingsScreen
        settings={settings}
        onUpdate={updateSetting}
        onResetProgress={resetProgress}
        onExportProgress={exportProgress}
        onImportProgress={importProgress}
        onOpenLegal={openLegal}
        onBack={goHome}
      />
    )
  }

  if (screen === 'privacy' || screen === 'terms' || screen === 'about' || screen === 'contact') {
    return (
      <LegalPage
        type={screen}
        onBack={() => {
          window.history.pushState(null, '', '/')
          setScreen(legalFromSettings ? 'settings' : 'home')
          setLegalFromSettings(false)
        }}
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
      lastSession={lastSession}
      isDifficultyUnlocked={isDifficultyUnlocked}
      onStart={handleStart}
      onOpenSettings={() => setScreen('settings')}
    />
  )
}

export default App
