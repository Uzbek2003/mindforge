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
import { ReviewMistakesScreen } from './components/ReviewMistakesScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { LegalPage } from './components/LegalPage'
import { legalPathToScreen, screenToLegalPath } from './utils/routes'
import { buildReviewMistakeItems } from './utils/reviewMistakes'
import { preloadVoices, textToSpeechService } from './services/textToSpeech'
import { isDirectNativeTestRunning } from './services/directNativeTtsTest'
import { fireAndForget, reportError } from './utils/errors'
import './App.css'

type Screen =
  | 'home'
  | 'play'
  | 'results'
  | 'review-mistakes'
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

  const stopSpeech = () => {
    fireAndForget(textToSpeechService.stop(), 'stopping speech')
  }

  useEffect(() => {
    fireAndForget(preloadVoices(settings), 'preloading voices')
  }, [settings.voiceId])

  useEffect(() => {
    textToSpeechService.setVoiceIdClearHandler(() => updateSetting('voiceId', null))
  }, [updateSetting])

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

    const stateSub = CapApp.addListener('appStateChange', ({ isActive }) => {
      if (!isActive && !isDirectNativeTestRunning()) {
        fireAndForget(textToSpeechService.stop(), 'stopping speech on app background')
      }
    })

    return () => {
      fireAndForget(
        stateSub.then((handle) => handle.remove()),
        'removing appStateChange listener',
      )
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    fireAndForget(StatusBar.setStyle({ style: Style.Dark }), 'setting status bar style')
    fireAndForget(
      StatusBar.setBackgroundColor({ color: '#0f2744' }),
      'setting status bar color',
    )

    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (screen !== 'home') {
        if (screen === 'play') {
          if (window.confirm('Leave this session? Progress in this session will be saved.')) {
            stopSpeech()
            setPlayConfig(null)
            setResumeSession(null)
            setScreen('home')
          }
        } else if (screen === 'review-mistakes') {
          stopSpeech()
          setScreen('results')
        } else {
          stopSpeech()
          setScreen('home')
        }
        return
      }
      if (canGoBack) fireAndForget(CapApp.exitApp(), 'exiting app')
    })

    return () => {
      fireAndForget(
        sub.then((handle) => handle.remove()),
        'removing backButton listener',
      )
    }
  }, [screen])

  const handleStart = (config: PlayConfig) => {
    setSessionResult(null)
    setPlayConfig(config)
    setResumeSession(config.resume ? lastSession : null)
    setScreen('play')
  }

  const handleFinish = (result: SessionResult) => {
    stopSpeech()
    clearLastSession()
    setSessionResult(result)
    setPlayConfig(null)
    setResumeSession(null)
    setScreen('results')
  }

  const handleExitPlay = () => {
    stopSpeech()
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

  const handleReviewMistakes = () => {
    if (!sessionResult) return
    stopSpeech()
    setScreen('review-mistakes')
  }

  const handleShare = async () => {
    if (!sessionResult) return
    const text = `${APP_NAME}: ${sessionResult.correct}/${sessionResult.total} correct (${sessionResult.accuracy}% accuracy) in ${sessionResult.mode} mode!`
    if (navigator.share) {
      try {
        await navigator.share({ title: APP_NAME, text })
        return
      } catch (error) {
        // Dismissing the share sheet also rejects, so fall back silently to the clipboard.
        if (!(error instanceof DOMException && error.name === 'AbortError')) {
          reportError('native share failed, falling back to clipboard', error)
        }
      }
    }
    try {
      await navigator.clipboard.writeText(text)
      window.alert('Score copied to clipboard.')
    } catch (error) {
      reportError('clipboard copy failed, showing score instead', error)
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

  if (screen === 'review-mistakes' && sessionResult) {
    return (
      <ReviewMistakesScreen
        items={buildReviewMistakeItems(sessionResult)}
        onBack={() => setScreen('results')}
        onHome={goHome}
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
        onReviewMistakes={handleReviewMistakes}
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
