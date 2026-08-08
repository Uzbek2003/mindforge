import type { Difficulty } from '../types'

/** Family-friendly story encounter kinds. */
export type AdventureNodeKind = 'stage' | 'enemy' | 'boss'

export type AdventureNodeId =
  | 'gate-of-counting'
  | 'bridge-of-patterns'
  | 'sum-stealer'
  | 'spire-of-solutions'
  | 'echo-sovereign'

export interface AdventureEnemy {
  id: string
  name: string
  title: string
  /** Short non-violent fantasy description. */
  blurb: string
  maxHp: number
  /** Emoji/icon glyph — decorative only. */
  icon: string
}

export interface AdventureNode {
  id: AdventureNodeId
  kind: AdventureNodeKind
  name: string
  synopsis: string
  /** Puzzle ids from the existing math bank (unchanged content). */
  puzzleIds: number[]
  enemy: AdventureEnemy
  /** XP awarded for a first-attempt correct answer. */
  xpFull: number
  /** Damage dealt on a first-attempt correct answer. */
  damageFull: number
}

export interface AdventureWorldPreview {
  id: string
  name: string
  tagline: string
  locked: boolean
  unlockHint: string
}

export interface NumberKingdomStory {
  worldId: 'math-kingdom'
  title: string
  prologue: string[]
  epilogue: string
  nodes: AdventureNode[]
  worldPreviews: AdventureWorldPreview[]
}

export interface AdventureBattleAttempt {
  puzzleId: number
  attempt: 1 | 2
  selectedIndex: number | null
  correct: boolean
  timedOut?: boolean
}

export interface AdventureBattleResult {
  nodeId: AdventureNodeId
  victory: boolean
  xpGained: number
  damageDealt: number
  attempts: AdventureBattleAttempt[]
}

export interface AdventureProgress {
  version: 1
  totalXp: number
  /** Highest cleared node index in Number Kingdom path (−1 = none). */
  highestClearedIndex: number
  /** Node ids the player has beaten at least once. */
  clearedNodeIds: AdventureNodeId[]
  /** Optional resume pointer for an in-progress battle. */
  activeNodeId: AdventureNodeId | null
}

export const EMPTY_ADVENTURE_PROGRESS: AdventureProgress = {
  version: 1,
  totalXp: 0,
  highestClearedIndex: -1,
  clearedNodeIds: [],
  activeNodeId: null,
}

export function levelFromXp(totalXp: number): number {
  // Gentle curve: 40 XP ≈ one early level.
  return 1 + Math.floor(Math.max(0, totalXp) / 40)
}

export function xpIntoLevel(totalXp: number): { level: number; current: number; needed: number } {
  const level = levelFromXp(totalXp)
  const floor = (level - 1) * 40
  return { level, current: totalXp - floor, needed: 40 }
}

export function damageForAttempt(fullDamage: number, attempt: 1 | 2, correct: boolean): number {
  if (!correct) return 0
  return attempt === 1 ? fullDamage : Math.max(1, Math.floor(fullDamage / 2))
}

export function xpForAttempt(fullXp: number, attempt: 1 | 2, correct: boolean): number {
  if (!correct) return 0
  return attempt === 1 ? fullXp : Math.max(1, Math.floor(fullXp / 2))
}

export type AdventureDifficultyBand = Difficulty
