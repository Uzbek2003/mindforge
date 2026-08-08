import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { AppSettings, Puzzle } from '../../types'
import { getPuzzleById } from '../../data'
import { DIFFICULTY_TIME_LIMITS } from '../../types'
import type { AdventureBattleAttempt, AdventureNode } from '../../types/adventure'
import { resolveStrike, shouldClearNode } from '../../utils/adventureCombat'
import { hapticError, hapticSuccess } from '../../utils/haptics'
import { playCorrectSound, playWrongSound } from '../../utils/sounds'
import { buildExplanationSpeech, buildQuestionSpeech } from '../../utils/explanationSpeech'
import { useVoiceExplanation } from '../../hooks/useVoiceExplanation'
import { VoiceExplanationPanel } from '../VoiceExplanationPanel'
import { Header } from '../UI'

export interface StoryBattleFinishPayload {
  nodeId: AdventureNode['id']
  victory: boolean
  cleared: boolean
  xpGained: number
  damageDealt: number
  attempts: AdventureBattleAttempt[]
  enemyName: string
  nodeName: string
}

interface StoryBattleScreenProps {
  node: AdventureNode
  settings: AppSettings
  playerLevel: number
  totalXp: number
  onAwardXp: (amount: number) => void
  onCompletePuzzle: (puzzleId: number, correct: boolean) => void
  onFinish: (result: StoryBattleFinishPayload) => void
  onExit: () => void
}

type Phase = 'answering' | 'retry' | 'resolved' | 'finished'

export function StoryBattleScreen({
  node,
  settings,
  playerLevel,
  totalXp,
  onAwardXp,
  onCompletePuzzle,
  onFinish,
  onExit,
}: StoryBattleScreenProps) {
  const puzzles = useMemo(
    () =>
      node.puzzleIds
        .map((id) => getPuzzleById(id))
        .filter((p): p is Puzzle => Boolean(p)),
    [node.puzzleIds],
  )

  const [index, setIndex] = useState(0)
  const [attempt, setAttempt] = useState<1 | 2>(1)
  const [selected, setSelected] = useState<number | null>(null)
  const [phase, setPhase] = useState<Phase>('answering')
  const [enemyHp, setEnemyHp] = useState(node.enemy.maxHp)
  const [damageDealt, setDamageDealt] = useState(0)
  const [xpGained, setXpGained] = useState(0)
  const [attempts, setAttempts] = useState<AdventureBattleAttempt[]>([])
  const [lastStrikeXp, setLastStrikeXp] = useState(0)
  const [lastStrikeDamage, setLastStrikeDamage] = useState(0)
  const [timedOut, setTimedOut] = useState(false)
  const [fxPulse, setFxPulse] = useState(false)
  const answeringRef = useRef(false)
  const finishedRef = useRef(false)

  const puzzle = puzzles[index]
  const timeLimit = puzzle ? DIFFICULTY_TIME_LIMITS[puzzle.difficulty] : 60
  const [timeLeft, setTimeLeft] = useState(timeLimit)

  const voice = useVoiceExplanation(settings)
  const { play: playVoice, stop: stopVoice } = voice
  const stopSpeechOnLeave = settings.stopSpeechOnLeave

  useEffect(() => () => stopVoice(), [stopVoice])

  useEffect(() => {
    return () => {
      if (stopSpeechOnLeave) stopVoice()
    }
  }, [index, attempt, stopSpeechOnLeave, stopVoice])

  const finishBattle = useCallback(
    (nextAttempts: AdventureBattleAttempt[], nextHp: number, nextDamage: number, nextXp: number) => {
      if (finishedRef.current) return
      finishedRef.current = true
      stopVoice()
      const victory = nextHp <= 0
      const cleared = shouldClearNode(nextHp, nextDamage, puzzles.length)
      setPhase('finished')
      onFinish({
        nodeId: node.id,
        victory,
        cleared,
        xpGained: nextXp,
        damageDealt: nextDamage,
        attempts: nextAttempts,
        enemyName: node.enemy.name,
        nodeName: node.name,
      })
    },
    [node.enemy.name, node.id, node.name, onFinish, puzzles.length, stopVoice],
  )

  const advanceOrFinish = useCallback(
    (nextAttempts: AdventureBattleAttempt[], nextHp: number, nextDamage: number, nextXp: number) => {
      if (nextHp <= 0 || index >= puzzles.length - 1) {
        finishBattle(nextAttempts, nextHp, nextDamage, nextXp)
        return
      }
      answeringRef.current = false
      setIndex((i) => i + 1)
      setAttempt(1)
      setSelected(null)
      setTimedOut(false)
      setLastStrikeXp(0)
      setLastStrikeDamage(0)
      setPhase('answering')
      const nextPuzzle = puzzles[index + 1]
      setTimeLeft(nextPuzzle ? DIFFICULTY_TIME_LIMITS[nextPuzzle.difficulty] : timeLimit)
    },
    [finishBattle, index, puzzles, timeLimit],
  )

  const resolveAnswer = useCallback(
    async (optionIndex: number | null, wasTimedOut: boolean) => {
      if (!puzzle || answeringRef.current || phase === 'finished') return
      answeringRef.current = true

      const correct = optionIndex != null && optionIndex === puzzle.correctIndex
      const record: AdventureBattleAttempt = {
        puzzleId: puzzle.id,
        attempt,
        selectedIndex: optionIndex,
        correct,
        timedOut: wasTimedOut,
      }
      const nextAttempts = [...attempts, record]
      setAttempts(nextAttempts)
      setSelected(optionIndex)
      setTimedOut(wasTimedOut)

      if (!correct && attempt === 1) {
        playWrongSound(settings.soundEnabled)
        await hapticError(settings.vibrationEnabled)
        setPhase('retry')
        setAttempt(2)
        setSelected(null)
        answeringRef.current = false
        setTimeLeft(Math.max(20, Math.floor(timeLimit * 0.75)))
        return
      }

      const strike = resolveStrike(node, attempt, correct, enemyHp)
      const nextHp = Math.max(0, enemyHp - strike.damage)
      const nextDamage = damageDealt + strike.damage
      const nextXp = xpGained + strike.xp

      setEnemyHp(nextHp)
      setDamageDealt(nextDamage)
      setXpGained(nextXp)
      setLastStrikeDamage(strike.damage)
      setLastStrikeXp(strike.xp)

      if (strike.xp > 0) onAwardXp(strike.xp)
      onCompletePuzzle(puzzle.id, correct)

      if (correct) {
        playCorrectSound(settings.soundEnabled)
        await hapticSuccess(settings.vibrationEnabled)
        setFxPulse(true)
        window.setTimeout(() => setFxPulse(false), 600)
      } else {
        playWrongSound(settings.soundEnabled)
        await hapticError(settings.vibrationEnabled)
      }

      setPhase('resolved')
      answeringRef.current = false

      if (nextHp <= 0) {
        // Brief pause so the player sees the defeat flash before finish.
        window.setTimeout(() => finishBattle(nextAttempts, nextHp, nextDamage, nextXp), 700)
      }
    },
    [
      attempt,
      attempts,
      damageDealt,
      enemyHp,
      finishBattle,
      node,
      onAwardXp,
      onCompletePuzzle,
      phase,
      puzzle,
      settings.soundEnabled,
      settings.vibrationEnabled,
      timeLimit,
      xpGained,
    ],
  )

  const handleSelect = (optionIndex: number) => {
    if (phase !== 'answering' && phase !== 'retry') return
    void resolveAnswer(optionIndex, false)
  }

  const handleTimeout = useCallback(() => {
    if (phase !== 'answering' && phase !== 'retry') return
    void resolveAnswer(null, true)
  }, [phase, resolveAnswer])

  useEffect(() => {
    if (phase !== 'answering' && phase !== 'retry') return
    if (!puzzle) return

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
  }, [handleTimeout, phase, puzzle?.id, attempt])

  useEffect(() => {
    if (!puzzle || (phase !== 'answering' && phase !== 'retry')) return
    if (!settings.voiceAutoPlay || !settings.voiceExplanationsEnabled || !settings.soundEnabled) return
    playVoice(buildQuestionSpeech(puzzle))
  }, [
    puzzle?.id,
    attempt,
    phase,
    settings.soundEnabled,
    settings.voiceAutoPlay,
    settings.voiceExplanationsEnabled,
    playVoice,
  ])

  const handleContinue = () => {
    if (phase !== 'resolved') return
    if (stopSpeechOnLeave) stopVoice()
    advanceOrFinish(attempts, enemyHp, damageDealt, xpGained)
  }

  const handleExit = () => {
    stopVoice()
    onExit()
  }

  if (!puzzle) {
    return (
      <div className="screen adventure-screen">
        <Header onHome={handleExit} showHome />
        <div className="empty-state">
          <h2>Encounter unavailable</h2>
          <p>This story stage could not load its puzzles.</p>
          <button type="button" className="btn btn-primary" onClick={handleExit}>
            Back to map
          </button>
        </div>
      </div>
    )
  }

  const hpPct = Math.max(0, Math.round((enemyHp / node.enemy.maxHp) * 100))
  const isCorrect = selected != null && selected === puzzle.correctIndex
  const explanationSpeech =
    phase === 'resolved'
      ? buildExplanationSpeech(puzzle, selected, Boolean(isCorrect), timedOut)
      : ''
  const timerPct = (timeLeft / timeLimit) * 100
  const kindLabel =
    node.kind === 'boss' ? 'Final boss' : node.kind === 'enemy' ? 'Encounter' : 'Learning stage'

  return (
    <div className={`screen adventure-screen story-battle ${fxPulse ? 'fx-hit' : ''}`}>
      <Header onHome={handleExit} showHome homeLabel="Retreat" />

      <div className="battle-top" role="status" aria-live="polite">
        <div className="battle-enemy-card">
          <span className="battle-enemy-icon" aria-hidden="true">
            {node.enemy.icon}
          </span>
          <div className="battle-enemy-meta">
            <span className={`adventure-kind-badge kind-${node.kind}`}>{kindLabel}</span>
            <strong>{node.enemy.name}</strong>
            <span className="panel-hint">{node.enemy.blurb}</span>
          </div>
        </div>
        <div className="battle-hp-block">
          <div className="battle-hp-labels">
            <span>Harmony</span>
            <span>
              {enemyHp} / {node.enemy.maxHp}
            </span>
          </div>
          <div className="battle-hp-bar" aria-label={`Enemy harmony ${hpPct}%`}>
            <div className="battle-hp-fill" style={{ width: `${hpPct}%` }} />
          </div>
        </div>
        <div className="battle-player-row">
          <span>Keeper Lv {playerLevel}</span>
          <span>+{xpGained} XP this fight · {totalXp} total</span>
        </div>
      </div>

      <div className="game-meta">
        <span className="badge">{node.name}</span>
        <span className="badge badge-muted">
          Puzzle {index + 1}/{puzzles.length}
        </span>
        <span className="badge badge-muted">Attempt {attempt}/2</span>
        {(phase === 'answering' || phase === 'retry') && (
          <span className={`timer-badge ${timeLeft <= 10 ? 'timer-low' : ''}`}>⏱ {timeLeft}s</span>
        )}
      </div>

      {(phase === 'answering' || phase === 'retry') && (
        <div className="timer-bar" aria-hidden="true">
          <div className="timer-bar-fill" style={{ width: `${timerPct}%` }} />
        </div>
      )}

      <div className="puzzle-card adventure-puzzle-card">
        <p className="puzzle-question" id="adventure-question">
          {puzzle.question}
        </p>

        {phase === 'retry' && (
          <div className="hint-box adventure-retry-hint" role="note">
            <strong>Second chance.</strong> {puzzle.hint}
          </div>
        )}

        <div className="options-grid" role="listbox" aria-labelledby="adventure-question">
          {puzzle.options.map((option, i) => {
            let className = 'option-btn'
            if (phase === 'resolved' || (phase === 'retry' && selected === i && attempt === 2)) {
              if (phase === 'resolved' && i === puzzle.correctIndex) className += ' correct'
              else if (i === selected && !(phase === 'resolved' && isCorrect)) className += ' wrong'
            } else if (selected === i && phase !== 'retry') {
              className += ' selected'
            }

            const disabled = phase === 'resolved' || phase === 'finished'
            return (
              <button
                key={`${puzzle.id}-${attempt}-${i}`}
                type="button"
                className={className}
                onClick={() => handleSelect(i)}
                disabled={disabled}
                role="option"
                aria-selected={selected === i}
              >
                <span className="option-letter" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="option-text">{option}</span>
              </button>
            )
          })}
        </div>

        {phase === 'resolved' && (
          <div
            className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'} ${settings.reduceAnimations ? 'no-animation' : ''}`}
            role="alert"
          >
            <div className="feedback-header">
              <span className="feedback-icon" aria-hidden="true">
                {isCorrect ? '✓' : '✕'}
              </span>
              <strong>
                {isCorrect
                  ? attempt === 1
                    ? 'Clean strike — full power!'
                    : 'Recovered — half power'
                  : timedOut
                    ? "Time's up — the chime slips away"
                    : 'Missed — revealing the answer'}
              </strong>
            </div>

            {isCorrect && (
              <p className="feedback-answer">
                <span className="feedback-label">Effect:</span> −{lastStrikeDamage} harmony · +
                {lastStrikeXp} XP
              </p>
            )}

            {!isCorrect && (
              <p className="feedback-answer">
                <span className="feedback-label">Correct answer:</span>{' '}
                {puzzle.options[puzzle.correctIndex]}
              </p>
            )}

            <p className="feedback-explanation">{puzzle.explanation}</p>

            <VoiceExplanationPanel
              settings={settings}
              isSpeaking={voice.isSpeaking}
              isPaused={voice.isPaused}
              status={voice.status}
              voiceUnavailable={voice.voiceUnavailable}
              onPlay={() => voice.play(explanationSpeech)}
              onPause={voice.pause}
              onResume={voice.resume}
              onReplay={() => voice.replay(explanationSpeech)}
              onStop={voice.stop}
            />

            {enemyHp > 0 && (
              <div className="feedback-actions">
                <button type="button" className="btn btn-primary" onClick={handleContinue}>
                  {index < puzzles.length - 1 ? 'Next puzzle' : 'Finish encounter'}
                </button>
              </div>
            )}
            {enemyHp <= 0 && (
              <p className="panel-hint adventure-defeat-note">
                {node.enemy.name} calms… finishing the encounter.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
