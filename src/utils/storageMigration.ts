import {
  STORAGE_KEYS,
  STORAGE_KEYS_LEGACY,
  STORAGE_MIGRATION_FLAG,
} from '../constants'

type StorageKeyName = keyof typeof STORAGE_KEYS

/**
 * Prefer QuizNova-era values when present (they are the latest writes from the
 * previous brand), then keep legacy keys in place (additive — no deletes).
 */
export function migrateQuizNovaStorageKeys(
  storage: Storage = localStorage,
): { migrated: StorageKeyName[]; skipped: boolean } {
  if (storage.getItem(STORAGE_MIGRATION_FLAG) === '1') {
    return { migrated: [], skipped: true }
  }

  const migrated: StorageKeyName[] = []
  for (const name of Object.keys(STORAGE_KEYS) as StorageKeyName[]) {
    const legacyValue = storage.getItem(STORAGE_KEYS_LEGACY[name])
    if (legacyValue == null) continue
    storage.setItem(STORAGE_KEYS[name], legacyValue)
    migrated.push(name)
  }

  storage.setItem(STORAGE_MIGRATION_FLAG, '1')
  return { migrated, skipped: false }
}

/** Read current key, then QuizNova legacy key (defensive after migration). */
export function readStorageKey(
  name: StorageKeyName,
  storage: Storage = localStorage,
): string | null {
  return storage.getItem(STORAGE_KEYS[name]) ?? storage.getItem(STORAGE_KEYS_LEGACY[name])
}
