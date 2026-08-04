import { useCallback, useState } from 'react'
import type { Category, Difficulty, Puzzle } from '../types'
import { getPuzzles } from '../data'
import { CATEGORY_LABELS, DIFFICULTY_LABELS } from '../types'
import { Header } from './UI'

interface PuzzleGameProps {
  category: Category | 'all'
  difficulty: Difficulty
  completedIds: number[]
  streak: number
  onComplete: (puzzleId: number, correct: boolean) => void
  onExit: () => void
}

function buildSessionQueue(
  category: Category | 'all',
  difficulty: Difficulty,
  completedIds: number[],
): Puzzle[] {
  const filters =
    category === 'all' ? { difficulty } : { category, difficulty }
  const all = getPuzzles(filters)
  const unsolved = all.filter((p) => !completedIds.includes(p.id))
  const pool = unsolved.length > 0 ? unsolved : all
  return [...pool].sort(() => Math.random() - 0.5)
}

export function PuzzleGame({
  category,
  difficulty,
  completedIds,
  streak,
  onComplete,
  onExit,
}: PuzzleGameProps) {
  // Lock the queue for this play session — do NOT rebuild when completedIds
  // changes after each answer, or the current question swaps mid-answer.
  const [puzzleQueue] = useState(() =>
    buildSessionQueue(category, difficulty, completedIds),
  )

  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [showHint, setShowHint] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [answeredPuzzle, setAnsweredPuzzle] = useState<Puzzle | null>(null)

  const puzzle = puzzleQueue[index]
  const displayPuzzle = revealed && answeredPuzzle ? answeredPuzzle : puzzle
  const sessionTotal = puzzleQueue.length
  const sessionNum = index + 1

  const handleSelect = (optionIndex: number) => {
    if (revealed || !puzzle) return
    setAnsweredPuzzle(puzzle)
    setSelected(optionIndex)
    setRevealed(true)
    const correct = optionIndex === puzzle.correctIndex
    onComplete(puzzle.id, correct)
  }

  const handleNext = useCallback(() => {
    if (index < puzzleQueue.length - 1) {
      setIndex((i) => i + 1)
      setSelected(null)
      setShowHint(false)
      setRevealed(false)
      setAnsweredPuzzle(null)
    } else {
      onExit()
    }
  }, [index, puzzleQueue.length, onExit])

  if (!puzzle) {
    return (
      <div className="screen">
        <Header onHome={onExit} showHome />
        <div className="empty-state">
          <h2>No puzzles found</h2>
          <button type="button" className="btn btn-primary" onClick={onExit}>
            Back to home
          </button>
        </div>
      </div>
    )
  }

  const isCorrect = selected === displayPuzzle.correctIndex

  return (
    <div className="screen game-screen">
      <Header onHome={onExit} showHome />

      <div className="game-meta">
        <span className="badge">{category === 'all' ? 'Mixed' : CATEGORY_LABELS[category]}</span>
        <span className={`badge badge-${difficulty}`}>{DIFFICULTY_LABELS[difficulty]}</span>
        <span className="badge badge-muted">Ages {displayPuzzle.ageMin}–{displayPuzzle.ageMax}</span>
        <span className="game-counter">
          {sessionNum} / {sessionTotal}
        </span>
        {streak > 0 && <span className="streak">🔥 {streak} streak</span>}
      </div>

      <div className="puzzle-card">
        <p className="puzzle-question">{displayPuzzle.question}</p>

        {!showHint && !revealed && (
          <button type="button" className="btn btn-hint" onClick={() => setShowHint(true)}>
            Show hint
          </button>
        )}
        {showHint && !revealed && (
          <p className="hint-box">💡 {displayPuzzle.hint}</p>
        )}

        <div className="options-grid">
          {displayPuzzle.options.map((option, i) => {
            let className = 'option-btn'
            if (revealed) {
              if (i === displayPuzzle.correctIndex) className += ' correct'
              else if (i === selected) className += ' wrong'
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
              >
                <span className="option-letter">{String.fromCharCode(65 + i)}</span>
                {option}
              </button>
            )
          })}
        </div>

        {revealed && (
          <div className={`feedback ${isCorrect ? 'feedback-correct' : 'feedback-wrong'}`}>
            <strong>{isCorrect ? 'Correct!' : 'Not quite'}</strong>
            <p>{displayPuzzle.explanation}</p>
            <button type="button" className="btn btn-primary" onClick={handleNext}>
              {index < puzzleQueue.length - 1 ? 'Next puzzle' : 'Finish session'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
