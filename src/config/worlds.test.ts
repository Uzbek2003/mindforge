import { describe, expect, it } from 'vitest'
import type { Category } from '../types'
import { MIXED_ADVENTURE, WORLDS, getWorldByCategory, getWorldDisplayName } from './worlds'

const CATEGORIES: Category[] = ['math', 'science', 'history', 'computer-science']

describe('WORLDS', () => {
  it('defines exactly one world per category with unique ids', () => {
    expect(WORLDS).toHaveLength(CATEGORIES.length)
    expect(new Set(WORLDS.map((world) => world.id)).size).toBe(WORLDS.length)
    expect(WORLDS.map((world) => world.category).sort()).toEqual([...CATEGORIES].sort())
  })

  it('gives every world a complete theme and copy', () => {
    for (const world of WORLDS) {
      expect(world.name.length).toBeGreaterThan(0)
      expect(world.shortName.length).toBeGreaterThan(0)
      expect(world.tagline.length).toBeGreaterThan(0)
      expect(world.icon.length).toBeGreaterThan(0)
      expect(world.progressionKey).toBe(world.category)
      expect(world.theme.accent).toMatch(/^#[0-9a-f]{6}$/i)
      expect(world.theme.accentSoft).toContain('rgba')
      expect(world.theme.gradient).toContain('linear-gradient')
      expect(world.theme.shadow.length).toBeGreaterThan(0)
    }
  })
})

describe('getWorldByCategory', () => {
  it('returns the matching world for each category', () => {
    for (const category of CATEGORIES) {
      expect(getWorldByCategory(category).category).toBe(category)
    }
  })

  it('falls back to the first world for an unknown category', () => {
    expect(getWorldByCategory('astrology' as Category)).toBe(WORLDS[0])
  })
})

describe('getWorldDisplayName', () => {
  it('uses the mixed adventure name for the "all" pseudo-category', () => {
    expect(getWorldDisplayName('all')).toBe(MIXED_ADVENTURE.shortName)
  })

  it('uses the world short name for real categories', () => {
    expect(getWorldDisplayName('math')).toBe(getWorldByCategory('math').shortName)
    expect(getWorldDisplayName('computer-science')).toBe('Coding Academy')
  })
})
