import { describe, expect, it } from 'vitest'
import { NUMBER_KINGDOM } from '../config/numberKingdom'
import {
  damageForAttempt,
  levelFromXp,
  xpForAttempt,
  xpIntoLevel,
} from '../types/adventure'
import { resolveStrike, shouldClearNode, summarizeBattle } from './adventureCombat'

describe('adventure combat rewards', () => {
  const node = NUMBER_KINGDOM.nodes[0]

  it('awards full damage and XP on first-attempt correct answers', () => {
    expect(damageForAttempt(node.damageFull, 1, true)).toBe(node.damageFull)
    expect(xpForAttempt(node.xpFull, 1, true)).toBe(node.xpFull)
    const strike = resolveStrike(node, 1, true, node.enemy.maxHp)
    expect(strike.damage).toBe(node.damageFull)
    expect(strike.xp).toBe(node.xpFull)
  })

  it('awards half damage and half XP on second-attempt correct answers', () => {
    expect(damageForAttempt(20, 2, true)).toBe(10)
    expect(xpForAttempt(12, 2, true)).toBe(6)
    const strike = resolveStrike(node, 2, true, node.enemy.maxHp)
    expect(strike.damage).toBe(Math.floor(node.damageFull / 2))
    expect(strike.xp).toBe(Math.floor(node.xpFull / 2))
  })

  it('awards nothing for incorrect answers', () => {
    expect(damageForAttempt(20, 1, false)).toBe(0)
    expect(xpForAttempt(12, 2, false)).toBe(0)
  })

  it('marks the enemy defeated when HP reaches zero', () => {
    const strike = resolveStrike(node, 1, true, 15)
    expect(strike.enemyDefeated).toBe(true)
  })
})

describe('adventure progression helpers', () => {
  it('levels from XP on a gentle curve', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(39)).toBe(1)
    expect(levelFromXp(40)).toBe(2)
    expect(xpIntoLevel(45)).toEqual({ level: 2, current: 5, needed: 40 })
  })

  it('clears a node after the queue if any damage was dealt', () => {
    expect(shouldClearNode(10, 20, 3)).toBe(true)
    expect(shouldClearNode(10, 0, 3)).toBe(false)
    expect(shouldClearNode(0, 40, 2)).toBe(true)
  })

  it('summarizes first-try, second-try, and missed puzzles', () => {
    const summary = summarizeBattle([
      { puzzleId: 1, attempt: 1, selectedIndex: 0, correct: true },
      { puzzleId: 2, attempt: 1, selectedIndex: 1, correct: false },
      { puzzleId: 2, attempt: 2, selectedIndex: 2, correct: true },
      { puzzleId: 3, attempt: 1, selectedIndex: 0, correct: false },
      { puzzleId: 3, attempt: 2, selectedIndex: 1, correct: false },
    ])
    expect(summary).toEqual({ correctFirstTry: 1, correctSecondTry: 1, missed: 1 })
  })
})

describe('Number Kingdom story config', () => {
  it('includes three learning stages, one enemy, and one boss', () => {
    const kinds = NUMBER_KINGDOM.nodes.map((node) => node.kind)
    expect(kinds.filter((k) => k === 'stage')).toHaveLength(3)
    expect(kinds.filter((k) => k === 'enemy')).toHaveLength(1)
    expect(kinds.filter((k) => k === 'boss')).toHaveLength(1)
  })

  it('uses only math-bank puzzle ids', () => {
    for (const node of NUMBER_KINGDOM.nodes) {
      expect(node.puzzleIds.length).toBeGreaterThan(0)
      for (const id of node.puzzleIds) {
        expect(id).toBeGreaterThanOrEqual(1)
        expect(id).toBeLessThanOrEqual(25)
      }
    }
  })
})
