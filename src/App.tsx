import { useEffect, useState } from 'react'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { StatusBar, Style } from '@capacitor/status-bar'
import type { Category, Difficulty, LastSession, SessionMode, SessionResult } from './types'
import { APP_NAME } from './constants'
import { useProgress } from './hooks/useProgress'
import { useSettings } from './hooks/useSettings'
import { useAdventureProgress } from './hooks/useAdventureProgress'
import { NUMBER_KINGDOM, getNumberKingdomNode } from './config/numberKingdom'
import type { AdventureNodeId } from './types/adventure'
import { HomeScreen } from './components/HomeScreen'
import { PuzzleGame } from './components/PuzzleGame'
import { ResultsScreen } from './components/ResultsScreen'
import { ReviewMistakesScreen } from './components/ReviewMistakesScreen'
import { SettingsScreen } from './components/SettingsScreen'
import { LegalPage } from './components/LegalPage'
import { AdventureIntroScreen } from './components/adventure/AdventureIntroScreen'
import { AdventureMapScreen } from './components/adventure/AdventureMapScreen'
import {
  StoryBattleScreen,
  type StoryBattleFinishPayload,
} from './components/adventure/StoryBattleScreen'
import { AdventureVictoryScreen } from './components/adventure/AdventureVictoryScreen'
import { legalPathToScreen, screenToLegalPath } from './utils/routes'
import { buildReviewMistakeItems } from './utils/reviewMistakes'
import { preloadVoices, textToSpeechService } from './services/textToSpeech'
import { isDirectNativeTestRunning } from './services/directNativeTtsTest'
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
  | 'adventure-intro'
  | 'adventure-map'
  | 'adventure-battle'
  | 'adventure-victory'

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
  const adventure = useAdventureProgress()

  const [screen, setScreen] = useState<Screen>('home')
  const [playConfig, setPlayConfig] = useState<PlayConfig | null>(null)
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null)
  const [resumeSession, setResumeSession] = useState<LastSession | null>(null)
  const [legalFromSettings, setLegalFromSettings] = useState(false)
  const [battleNodeId, setBattleNodeId] = useState<AdventureNodeId | null>(null)
  const [battleResult, setBattleResult] = useState<StoryBattleFinishPayload | null>(null)

  useEffect(() => {
    preloadVoices(settings).catch(() => undefined)
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
      if (!isActive && !isDirectNativeTestRunning()) void textToSpeechService.stop()
    })

    return () => {
      stateSub.then((handle) => handle.remove())
    }
  }, [])

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    StatusBar.setStyle({ style: Style.Dark }).catch(() => undefined)
    StatusBar.setBackgroundColor({ color: '#0f2744' }).catch(() => undefined)

    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      if (screen !== 'home') {
        if (screen === 'play') {
          if (window.confirm('Leave this session? Progress in this session will be saved.')) {
            void textToSpeechService.stop()
            setPlayConfig(null)
            setResumeSession(null)
            setScreen('home')
          }
        } else if (screen === 'review-mistakes') {
          void textToSpeechService.stop()
          setScreen('results')
        } else if (screen === 'adventure-battle') {
          if (window.confirm('Retreat from this encounter? Progress in this fight will be lost.')) {
            void textToSpeechService.stop()
            adventure.setActiveNode(null)
            setBattleNodeId(null)
            setScreen('adventure-map')
          }
        } else if (screen === 'adventure-victory') {
          void textToSpeechService.stop()
          setBattleResult(null)
          setScreen('adventure-map')
        } else if (screen === 'adventure-map' || screen === 'adventure-intro') {
          void textToSpeechService.stop()
          setScreen('home')
        } else {
          void textToSpeechService.stop()
          setScreen('home')
        }
        return
      }
      if (canGoBack) CapApp.exitApp()
    })

    return () => {
      sub.then((handle) => handle.remove())
    }
  }, [adventure.setActiveNode, screen])

  const handleStart = (config: PlayConfig) => {
    setSessionResult(null)
    setPlayConfig(config)
    setResumeSession(config.resume ? lastSession : null)
    setScreen('play')
  }

  const handleFinish = (result: SessionResult) => {
    void textToSpeechService.stop()
    clearLastSession()
    setSessionResult(result)
    setPlayConfig(null)
    setResumeSession(null)
    setScreen('results')
  }

  const handleExitPlay = () => {
    void textToSpeechService.stop()
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
    void textToSpeechService.stop()
    setScreen('review-mistakes')
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
    setBattleNodeId(null)
    setBattleResult(null)
    adventure.setActiveNode(null)
    window.history.pushState(null, '', '/')
    setScreen('home')
  }

  const openAdventure = () => {
    void textToSpeechService.stop()
    setBattleResult(null)
    setBattleNodeId(null)
    if (adventure.progress.highestClearedIndex >= 0 || adventure.progress.totalXp > 0) {
      setScreen('adventure-map')
      return
    }
    setScreen('adventure-intro')
  }

  const startBattle = (nodeId: AdventureNodeId) => {
    if (!adventure.isNodeUnlocked(nodeId)) return
    void textToSpeechService.stop()
    adventure.setActiveNode(nodeId)
    setBattleNodeId(nodeId)
    setBattleResult(null)
    setScreen('adventure-battle')
  }

  const handleBattleFinish = (result: StoryBattleFinishPayload) => {
    void textToSpeechService.stop()
    if (result.cleared) {
      adventure.clearNode(result.nodeId)
    } else {
      adventure.setActiveNode(null)
    }
    setBattleResult(result)
    setBattleNodeId(null)
    setScreen('adventure-victory')
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

  if (screen === 'adventure-intro') {
    return (
      <AdventureIntroScreen
        playerLevel={adventure.level}
        totalXp={adventure.progress.totalXp}
        onBegin={() => setScreen('adventure-map')}
        onBack={goHome}
      />
    )
  }

  if (screen === 'adventure-map') {
    return (
      <AdventureMapScreen
        playerLevel={adventure.level}
        xpCurrent={adventure.levelInfo.current}
        xpNeeded={adventure.levelInfo.needed}
        totalXp={adventure.progress.totalXp}
        highestClearedIndex={adventure.progress.highestClearedIndex}
        clearedNodeIds={adventure.progress.clearedNodeIds}
        kingdomComplete={adventure.kingdomComplete}
        onSelectNode={startBattle}
        onBack={goHome}
      />
    )
  }

  if (screen === 'adventure-battle' && battleNodeId) {
    const node = getNumberKingdomNode(battleNodeId)
    if (!node) {
      return (
        <AdventureMapScreen
          playerLevel={adventure.level}
          xpCurrent={adventure.levelInfo.current}
          xpNeeded={adventure.levelInfo.needed}
          totalXp={adventure.progress.totalXp}
          highestClearedIndex={adventure.progress.highestClearedIndex}
          clearedNodeIds={adventure.progress.clearedNodeIds}
          kingdomComplete={adventure.kingdomComplete}
          onSelectNode={startBattle}
          onBack={goHome}
        />
      )
    }
    return (
      <StoryBattleScreen
        node={node}
        settings={settings}
        playerLevel={adventure.level}
        totalXp={adventure.progress.totalXp}
        onAwardXp={adventure.awardXp}
        onCompletePuzzle={completePuzzle}
        onFinish={handleBattleFinish}
        onExit={() => {
          void textToSpeechService.stop()
          adventure.setActiveNode(null)
          setBattleNodeId(null)
          setScreen('adventure-map')
        }}
      />
    )
  }

  if (screen === 'adventure-victory' && battleResult) {
    return (
      <AdventureVictoryScreen
        result={battleResult}
        playerLevel={adventure.level}
        totalXp={adventure.progress.totalXp}
        kingdomComplete={adventure.kingdomComplete}
        onContinueMap={() => {
          setBattleResult(null)
          setScreen('adventure-map')
        }}
        onHome={goHome}
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
      adventureLevel={adventure.level}
      adventureXp={adventure.progress.totalXp}
      adventureClearedCount={adventure.progress.clearedNodeIds.length}
      adventureTotalNodes={NUMBER_KINGDOM.nodes.length}
      onStart={handleStart}
      onOpenAdventure={openAdventure}
      onOpenSettings={() => setScreen('settings')}
    />
  )
}

export default App
