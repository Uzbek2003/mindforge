import { mathPuzzles } from './math'
import { sciencePuzzles } from './science'
import { historyPuzzles } from './history'
import { csPuzzles } from './computer-science'
import type { Category, Difficulty, Puzzle } from '../types'

export const ALL_PUZZLES: Puzzle[] = [
  ...mathPuzzles,
  ...sciencePuzzles,
  ...historyPuzzles,
  ...csPuzzles,
]

export function getPuzzles(filters?: {
  category?: Category | 'all'
  difficulty?: Difficulty
}): Puzzle[] {
  return ALL_PUZZLES.filter((puzzle) => {
    if (filters?.category && filters.category !== 'all' && puzzle.category !== filters.category) {
      return false
    }
    if (filters?.difficulty && puzzle.difficulty !== filters.difficulty) {
      return false
    }
    return true
  })
}

export function getPuzzleById(id: number): Puzzle | undefined {
  return ALL_PUZZLES.find((p) => p.id === id)
}

export function countByDifficulty(difficulty: Difficulty): number {
  return ALL_PUZZLES.filter((p) => p.difficulty === difficulty).length
}

export function countByCategory(category: Category): number {
  return ALL_PUZZLES.filter((p) => p.category === category).length
}
