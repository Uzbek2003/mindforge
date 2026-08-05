import type { Category } from '../types'

/**
 * Future player economy — stored separately when game mechanics ship.
 * Progress hooks in useProgress can migrate into this shape without UI rewrites.
 */
export interface WorldProgressSnapshot {
  worldId: string
  category: Category
  completedCount: number
  totalCount: number
  /** Placeholder for Phase 2 — not shown in UI until implemented. */
  xp?: number
  level?: number
}

export interface PlayerGameProfile {
  totalXp: number
  coins: number
  dailyStreak: number
  lastDailyClaimAt: string | null
  worlds: Record<string, WorldProgressSnapshot>
  achievementIds: string[]
}

export const EMPTY_PLAYER_GAME_PROFILE: PlayerGameProfile = {
  totalXp: 0,
  coins: 0,
  dailyStreak: 0,
  lastDailyClaimAt: null,
  worlds: {},
  achievementIds: [],
}
