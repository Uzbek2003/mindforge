import type { Category, Difficulty } from '../types'
import { getPuzzles } from '../data'

/** Share of `value` in `max` as a percentage; 0 when there is nothing to measure. */
export function percentOf(value: number, max: number): number {
  return max > 0 ? (value / max) * 100 : 0
}

export function roundedPercentOf(value: number, max: number): number {
  return Math.round(percentOf(value, max))
}

/** How many puzzles matching `filters` the player has already attempted. */
export function countCompleted(
  completedIds: number[],
  filters: { category?: Category | 'all'; difficulty?: Difficulty } = {},
): number {
  return getPuzzles(filters).filter((puzzle) => completedIds.includes(puzzle.id)).length
}
