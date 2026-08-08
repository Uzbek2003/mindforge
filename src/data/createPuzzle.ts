import type { Category, Puzzle } from '../types'

/**
 * Terse `Puzzle` builder for the category data files:
 * `const p = puzzleFactory('math')`.
 */
export function puzzleFactory(category: Category) {
  return (
    id: number,
    difficulty: Puzzle['difficulty'],
    question: string,
    options: Puzzle['options'],
    correctIndex: Puzzle['correctIndex'],
    hint: string,
    explanation: string,
  ): Puzzle => ({
    id,
    category,
    difficulty,
    question,
    options,
    correctIndex,
    hint,
    explanation,
  })
}
