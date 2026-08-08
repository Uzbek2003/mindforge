import {
  damageForAttempt,
  xpForAttempt,
  type AdventureBattleAttempt,
  type AdventureNode,
} from '../types/adventure'

export type BattlePhase =
  | 'answering'
  | 'retry-hint'
  | 'resolved-correct'
  | 'resolved-miss'
  | 'victory'
  | 'node-complete'

export interface BattleStrike {
  damage: number
  xp: number
  attempt: 1 | 2
  correct: boolean
  enemyDefeated: boolean
}

/** Apply one resolved attempt against the current enemy HP. */
export function resolveStrike(
  node: AdventureNode,
  attempt: 1 | 2,
  correct: boolean,
  enemyHp: number,
): BattleStrike {
  const damage = damageForAttempt(node.damageFull, attempt, correct)
  const xp = xpForAttempt(node.xpFull, attempt, correct)
  const nextHp = Math.max(0, enemyHp - damage)
  return {
    damage,
    xp,
    attempt,
    correct,
    enemyDefeated: nextHp <= 0,
  }
}

export function summarizeBattle(attempts: AdventureBattleAttempt[]): {
  correctFirstTry: number
  correctSecondTry: number
  missed: number
} {
  const byPuzzle = new Map<number, AdventureBattleAttempt[]>()
  for (const attempt of attempts) {
    const list = byPuzzle.get(attempt.puzzleId) ?? []
    list.push(attempt)
    byPuzzle.set(attempt.puzzleId, list)
  }

  let correctFirstTry = 0
  let correctSecondTry = 0
  let missed = 0

  for (const list of byPuzzle.values()) {
    const first = list.find((a) => a.attempt === 1)
    const second = list.find((a) => a.attempt === 2)
    if (first?.correct) {
      correctFirstTry += 1
    } else if (second?.correct) {
      correctSecondTry += 1
    } else {
      missed += 1
    }
  }

  return { correctFirstTry, correctSecondTry, missed }
}

/**
 * After the puzzle queue is exhausted, the node still clears if any damage was dealt
 * or the enemy was already defeated (family-friendly “they fade away”).
 */
export function shouldClearNode(enemyHp: number, damageDealt: number, puzzlesResolved: number): boolean {
  if (enemyHp <= 0) return true
  return puzzlesResolved > 0 && damageDealt > 0
}
