import { describe, expect, it } from 'vitest'
import {
  PROGRESS_EXPORT_FILENAME,
  STORAGE_KEYS,
  STORAGE_KEYS_LEGACY,
  STORAGE_MIGRATION_FLAG,
} from '../constants'
import { migrateQuizNovaStorageKeys, readStorageKey } from './storageMigration'

function createMemoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial))
  return {
    get length() {
      return map.size
    },
    clear() {
      map.clear()
    },
    getItem(key: string) {
      return map.has(key) ? map.get(key)! : null
    },
    key(index: number) {
      return [...map.keys()][index] ?? null
    },
    removeItem(key: string) {
      map.delete(key)
    },
    setItem(key: string, value: string) {
      map.set(key, String(value))
    },
  }
}

describe('storage migration (QuizNova → MindForge)', () => {
  it('copies every quiznova-* key onto the matching mindforge-* key', () => {
    const storage = createMemoryStorage({
      [STORAGE_KEYS_LEGACY.progress]: JSON.stringify({ completed: [1], correctCount: 1, streak: 1, bestStreak: 1 }),
      [STORAGE_KEYS_LEGACY.settings]: JSON.stringify({ soundEnabled: false }),
      [STORAGE_KEYS_LEGACY.lastSession]: JSON.stringify({ mode: 'quick' }),
      [STORAGE_KEYS_LEGACY.reportedQuestions]: JSON.stringify([7, 8]),
      [STORAGE_KEYS_LEGACY.adventure]: JSON.stringify({ version: 1, totalXp: 40, highestClearedIndex: 0, clearedNodeIds: [], activeNodeId: null }),
    })

    const result = migrateQuizNovaStorageKeys(storage)
    expect(result.skipped).toBe(false)
    expect(result.migrated.sort()).toEqual(
      ['adventure', 'lastSession', 'progress', 'reportedQuestions', 'settings'].sort(),
    )

    for (const name of Object.keys(STORAGE_KEYS) as (keyof typeof STORAGE_KEYS)[]) {
      expect(storage.getItem(STORAGE_KEYS[name])).toBe(storage.getItem(STORAGE_KEYS_LEGACY[name]))
    }
    expect(storage.getItem(STORAGE_MIGRATION_FLAG)).toBe('1')
  })

  it('keeps quiznova-* keys after migration (additive)', () => {
    const legacyProgress = JSON.stringify({ completed: [2], correctCount: 1, streak: 0, bestStreak: 1 })
    const storage = createMemoryStorage({
      [STORAGE_KEYS_LEGACY.progress]: legacyProgress,
    })

    migrateQuizNovaStorageKeys(storage)

    expect(storage.getItem(STORAGE_KEYS_LEGACY.progress)).toBe(legacyProgress)
    expect(storage.getItem(STORAGE_KEYS.progress)).toBe(legacyProgress)
  })

  it('prefers quiznova progress over a stale pre-existing mindforge-progress key', () => {
    const stale = JSON.stringify({ completed: [], correctCount: 0, streak: 0, bestStreak: 0 })
    const fresh = JSON.stringify({ completed: [3, 4], correctCount: 2, streak: 2, bestStreak: 2 })
    const storage = createMemoryStorage({
      [STORAGE_KEYS.progress]: stale,
      [STORAGE_KEYS_LEGACY.progress]: fresh,
    })

    migrateQuizNovaStorageKeys(storage)

    expect(storage.getItem(STORAGE_KEYS.progress)).toBe(fresh)
  })

  it('is a no-op when the migration flag is already set', () => {
    const storage = createMemoryStorage({
      [STORAGE_MIGRATION_FLAG]: '1',
      [STORAGE_KEYS_LEGACY.progress]: JSON.stringify({ completed: [9], correctCount: 1, streak: 0, bestStreak: 1 }),
    })

    const result = migrateQuizNovaStorageKeys(storage)
    expect(result.skipped).toBe(true)
    expect(result.migrated).toEqual([])
    expect(storage.getItem(STORAGE_KEYS.progress)).toBeNull()
  })

  it('readStorageKey falls back to quiznova legacy values', () => {
    const storage = createMemoryStorage({
      [STORAGE_KEYS_LEGACY.settings]: JSON.stringify({ voiceEnabled: true }),
    })
    expect(readStorageKey('settings', storage)).toContain('voiceEnabled')
  })

  it('exports under the MindForge filename constant', () => {
    expect(PROGRESS_EXPORT_FILENAME).toBe('mindforge-progress.json')
  })
})
