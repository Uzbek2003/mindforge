import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppSettings, Category, Difficulty, LastSession, Puzzle, SessionAnswer, SessionMode, SessionResult } from '../types'
import { getPuzzleById } from '../data'
import { CATEGORY_LABELS, DIFFICULTY_LABELS, DIFFICULTY_TIME_LIMITS, SESSION_MODE_CONFIG } from '../types'
import { buildSessionQueue, buildEndlessExtension, calcSessionStreak } from '../utils/session'
import { hapticError, hapticSuccess } from '../utils/haptics'
import { playCorrectSound, playWrongSound } from '../utils/sounds'
import { buildQuestionReportEmail } from '../utils/report'
import { buildExplanationSpeech, buildQuestionSpeech } from '../utils/explanationSpeech'
import { useVoiceExplanation } from '../hooks/useVoiceExplanation'
import { VoiceExplanationPanel } from './VoiceExplanationPanel'
import { Header } from './UI'

interface PuzzleGameProps {
  category: Category | 'all'
  difficulty: Difficulty
  mode: SessionMode
  completedIds: number[]
  streak: number
  settings: AppSettings
  resumeSession?: LastSession | null
  retryIds?: number[]
  onComplete: (puzzleId: number, correct: boolean) => void
  onSessionUpdate: (session: LastSession | null) => void
  onFinish: (result: SessionResult) => void
  onExit: () => void
  onReport: (puzzleId: number) => void
  reportedQuestions: number[]
}

export function PuzzleGame({
  category,
  difficulty,
  mode,
  completedIds,
  streak,
  settings,
  resumeSession,
  retryIds,
  onComplete,
  onSessionUpdate,
  onFinish,
  onExit,
  onReport,
  reportedQuestions,
}: PuzzleGameProps) {
  const timeLimit = DIFFICULTY_TIME_LIMITS[difficulty]

  const [puzzleQueue, setPuzzleQueue] = useState<Puzzle[]>(() => {
    if (resumeSession) {
      return resumeSession.puzzleIds
        .map((id) => getPuzzleById(id))
        .filter((p): p is Puzzle => Boolean(p))
    }
    return buildSessionQueue({ category, difficulty, mode, completedIds, retryIds })
  })

  const [index, setIndex] = useState(resumeSession?.index ?? 0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [timedOut, setTimedOut] = useState(false)
  const [answeredPuzzle, setAnsweredPuzzle] = useState<Puzzle | null>(null)
  const [sessionAnswers, setSessionAnswers] = useState<SessionAnswer[]>(
    resumeSession?.sessionAnswers ?? [],
  )
  const [reported, setReported] = useState(false)
  const [timeLeft, setTimeLeft] = useState(timeLimit)
  const startedAt = useRef(resumeSession?.startedAt ?? Date.now())
  const answeringRef = useRef(false)
  const voice = useVoiceExplanation(settings)
  const { play: playVoice, stop: stopVoice } = voice
  const stopSpeechOnLeave = settings.stopSpeechOnLeave

  const puzzle = puzzleQueue[index]
  const displayPuzzle = revealed && answeredPuzzle ? answeredPuzzle : puzzle
  const sessionTotal = puzzleQueue.length
  const sessionNum = index + 1
  const isEndless = mode === 'endless'

  // Always stop speech when the game screen unmounts.
  useEffect(() => {
    return () => {
      stopVoice()
    }
  }, [stopVoice])

  // Stop speech when moving to another question (configurable).
  useEffect(() => {
    return () => {
      if (stopSpeechOnLeave) stopVoice()
    }
  }, [index, stopSpeechOnLeave, stopVoice])

  useEffect(() => {
    if (!puzzle || puzzleQueue.length === 0) return
    onSessionUpdate({
      category,
      difficulty,
      mode,
      puzzleIds: puzzleQueue.map((p) => p.id),
      index,
      sessionAnswers,
      startedAt: startedAt.current,
    })
  }, [category, difficulty, index, mode, onSessionUpdate, puzzle, puzzleQueue, sessionAnswers])

  const finishSession = useCallback(
    (answers: SessionAnswer[]) => {
      stopVoice()
      const correct = answers.filter((a) => a.correct).length
      const incorrect = answers.length - correct
      onSessionUpdate(null)
      onFinish({
        correct,
        incorrect,
        total: answers.length,
        accuracy: answers.length ? Math.round((correct / answers.length) * 100) : 0,
        bestStreakInSession: calcSessionStreak(answers.map((a) => a.correct)),
        timeMs: Date.now() - startedAt.current,
        wrongPuzzleIds: answers.filter((a) => !a.correct).map((a) => a.puzzleId),
        category,
        difficulty,
        mode,
      })
    },
    [category, difficulty, mode, onFinish, onSessionUpdate, stopVoice],
  )

  const revealAnswer = useCallback(
    async (
      currentPuzzle: Puzzle,
      optionIndex: number | null,
      correct: boolean,
      wasTimedOut: boolean,
    ) => {
      setAnsweredPuzzle(currentPuzzle)
      setSelected(optionIndex)
      setTimedOut(wasTimedOut)
      setRevealed(true)
      onComplete(currentPuzzle.id, correct)

      setSessionAnswers((prev) => [
        ...prev,
        {
          puzzleId: currentPuzzle.id,
          selectedIndex: optionIndex,
          correct,
          timedOut: wasTimedOut,
        },
      ])

      if (correct) {
        playCorrectSound(settings.soundEnabled)
        await hapticSuccess(settings.vibrationEnabled)
      } else {
        playWrongSound(settings.soundEnabled)
        await hapticError(settings.vibrationEnabled)
      }
    },
    [onComplete, settings.soundEnabled, settings.vibrationEnabled],
  )

  const handleSelect = async (optionIndex: number) => {
    if (revealed || !puzzle || answeringRef.current) return
    answeringRef.current = true
    const correct = optionIndex === puzzle.correctIndex
    await revealAnswer(puzzle, optionIndex, correct, false)
  }

  const handleTimeout = useCallback(async () => {
    if (revealed || !puzzle || answeringRef.current) return
    answeringRef.current = true
    await revealAnswer(puzzle, null, false, true)
  }, [puzzle, revealAnswer, revealed])

  useEffect(() => {
    if (revealed || !puzzle) return

    setTimeLeft(timeLimit)
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          handleTimeout()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [handleTimeout, puzzle?.id, revealed, timeLimit])

  const handleNext = useCallback(() => {
    if (stopSpeechOnLeave) stopVoice()
    answeringRef.current = false
    setReported(false)
    setTimedOut(false)

    if (isEndless && index >= puzzleQueue.length - 1) {
      const seenIds = new Set(puzzleQueue.map((p) => p.id))
      const more = buildEndlessExtension(seenIds, completedIds)

      if (more.length === 0) {
        finishSession(sessionAnswers)
        return
      }

      setPuzzleQueue((queue) => [...queue, ...more])
      setIndex((i) => i + 1)
      setSelected(null)
      setShowHint(false)
      setRevealed(false)
      setAnsweredPuzzle(null)
      setTimeLeft(timeLimit)
      return
    }

    if (index < puzzleQueue.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      setShowHint(false)
      setRevealed(false)
      setAnsweredPuzzle(null)
      setTimeLeft(timeLimit)
      return
    }

    finishSession(sessionAnswers)
  }, [
    completedIds,
    finishSession,
    index,
    isEndless,
    puzzleQueue,
    sessionAnswers,
    stopSpeechOnLeave,
    stopVoice,
    timeLimit,
  ])

  const isCorrect = selected === displayPuzzle?.correctIndex
  const questionSpeech = displayPuzzle && !revealed ? buildQuestionSpeech(displayPuzzle) : ''
  const explanationSpeech =
    revealed && displayPuzzle
      ? buildExplanationSpeech(displayPuzzle, selected, Boolean(isCorrect), timedOut)
      : ''
  const panelSpeech = explanationSpeech || questionSpeech

  // Auto-read the question when it appears.
  useEffect(() => {
    if (!puzzle || revealed || !questionSpeech) return
    if (!settings.voiceAutoPlay || !settings.voiceExplanationsEnabled || !settings.soundEnabled) return
    playVoice(questionSpeech)
  }, [
    puzzle?.id,
    questionSpeech,
    revealed,
    settings.soundEnabled,
    settings.voiceAutoPlay,
    settings.voiceExplanationsEnabled,
    playVoice,
  ])

  // Auto-read the explanation after an answer is revealed (replaces any question speech).
  useEffect(() => {
    if (!revealed || !displayPuzzle || !explanationSpeech) return
    if (!settings.voiceAutoPlay || !settings.voiceExplanationsEnabled || !settings.soundEnabled) return
    playVoice(explanationSpeech)
  }, [
    displayPuzzle?.id,
    explanationSpeech,
    revealed,
    settings.soundEnabled,
    settings.voiceAutoPlay,
    settings.voiceExplanationsEnabled,
    playVoice,
  ])

  const handleReport = () => {
    if (!displayPuzzle || reported) return
    window.location.href = buildQuestionReportEmail(displayPuzzle, selected)
    onReport(displayPuzzle.id)
    setReported(true)
  }

  const handleExit = useCallback(() => {
    stopVoice()
    onExit()
  }, [onExit, stopVoice])

  if (!puzzle || puzzleQueue.length === 0) {
    return (
      <div className="screen">
        <Header onHome={handleExit} showHome />
        <div className="empty-state">
          <h2>All questions completed!</h2>
          <p>
            You&apos;ve answered every available {DIFFICULTY_LABELS[difficulty].toLowerCase()} puzzle
            in this selection. Try another category or difficulty level.
          </p>
          <button type="button" className="btn btn-primary" onClick={handleExit}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  const yourAnswer =
    selected != null ? displayPuzzle.options[selected] : null
  const correctAnswer = displayPuzzle.options[displayPuzzle.correctIndex]
  const alreadyReported = reported || reportedQuestions.includes(displayPuzzle.id)
  const timerPct = (timeLeft / timeLimit) * 100
  const timerLow = timeLeft <= 10 && !revealed

  return (
    <div className="screen game-screen">
      <Header onHome={handleExit} showHome />

      <div className="game-meta" role="status" aria-live="polite">
        <span className="badge">{category === 'all' ? 'Grand Adventure' : CATEGORY_LABELS[category]}</span>
        <span className={`badge badge-${difficulty}`}>{DIFFICULTY_LABELS[difficulty]}</span>
        <span className="badge badge-muted">{SESSION_MODE_CONFIG[mode].label}</span>
        <span
          className={`timer-badge ${timerLow ? 'timer-low' : ''} ${revealed ? 'timer-paused' : ''}`}
          aria-label={`${timeLeft} seconds remaining`}
        >
          ⏱ {timeLeft}s
        </span>
        <span className="game-counter" aria-label={`Question ${sessionNum} of ${sessionTotal}`}>
          {sessionNum} / {isEndless ? '∞' : sessionTotal}
        </span>
        {streak > 0 && <span className="streak">Streak: {streak}</span>}
      </div>

      {!revealed && (
        <div className="timer-bar" aria-hidden="true">
          <div className="timer-bar-fill" style={{ width: `${timerPct}%` }} />
        </div>
      )}

      <div className="puzzle-card">
        <p className="puzzle-question" id="question-text">
          {displayPuzzle.question}
        </p>

        {!showHint && !revealed && (
          <button type="button" className="btn btn-hint" onClick={() => setShowHint(true)}>
            Show hint
          </button>
        )}
        {showHint && !revealed && (
          <p className="hint-box" role="note">
            Hint: {displayPuzzle.hint}
          </p>
        )}

        <div className="options-grid" role="listbox" aria-labelledby="question-text">
          {displayPuzzle.options.map((option, i) => {
            let className = 'option-btn'
            let statusLabel = ''
            if (revealed) {
              if (i === displayPuzzle.correctIndex) {
                className += ' correct'
                statusLabel = 'Correct answer'
              } else if (i === selected) {
                className += ' wrong'
                statusLabel = 'Your answer — incorrect'
              }
            } else if (selected === i) {
              className += ' selected'
            }

            return (
              <button
                key={`${displayPuzzle.id}-${i}`}
                type="button"
                className={className}
                onClick={() => handleSelect(i)}
                disabled={revealed}
                role="option"
                aria-selected={selected === i}
                aria-label={`${String.fromCharCode(65 + i)}. ${option}${statusLabel ? `. ${statusLabel}` : ''}`}
              >
                <span className="option-letter" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="option-text">{option}</span>
                {revealed && i === displayPuzzle.correctIndex && (
                  <span className="result-icon correct-icon" aria-hidden="true">✓</span>
                )}
                {revealed && i === selected && !isCorrect && (
                  <span className="result-icon wrong-icon" aria-hidden="true">✕</span>
                )}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div
            className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'} ${settings.reduceAnimations ? 'no-animation' : ''}`}
            role="alert"
          >
            <div className="feedback-header">
              <span className="feedback-icon" aria-hidden="true">{isCorrect ? '✓' : '✕'}</span>
              <strong>
                {isCorrect ? 'Correct!' : timedOut ? "Time's up!" : 'Not quite'}
              </strong>
            </div>

            <VoiceExplanationPanel
              settings={settings}
              isSpeaking={voice.isSpeaking}
              isPaused={voice.isPaused}
              status={voice.status}
              voiceUnavailable={voice.voiceUnavailable}
              onPlay={() => voice.play(panelSpeech)}
              onPause={voice.pause}
              onResume={voice.resume}
              onReplay={() => voice.replay(panelSpeech)}
              onStop={voice.stop}
            />

            {!isCorrect && timedOut && (
              <p className="feedback-answer">
                <span className="feedback-label">Result:</span> Time ran out before you answered.
              </p>
            )}
            {!isCorrect && !timedOut && yourAnswer && (
              <p className="feedback-answer">
                <span className="feedback-label">Your answer:</span> {yourAnswer}
              </p>
            )}
            <p className="feedback-answer">
              <span className="feedback-label">Correct answer:</span> {correctAnswer}
            </p>
            <p className="feedback-explanation">{displayPuzzle.explanation}</p>

            <div className="feedback-actions">
              <button type="button" className="btn btn-primary" onClick={handleNext}>
                {isEndless
                  ? 'Next puzzle'
                  : index < puzzleQueue.length - 1
                    ? 'Next puzzle'
                    : 'View results'}
              </button>
              {isEndless && (
                <button type="button" className="btn btn-ghost" onClick={() => finishSession(sessionAnswers)}>
                  End session
                </button>
              )}
              <button
                type="button"
                className="btn btn-ghost"
                onClick={handleReport}
                disabled={alreadyReported}
              >
                {alreadyReported ? 'Question reported' : 'Report incorrect question'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
