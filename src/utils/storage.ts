import { reportError } from './errors'

function getStorage(): Storage | null {
  try {
    if (typeof localStorage === 'undefined') return null
    return localStorage
  } catch (error) {
    // Access itself throws when storage is disabled (e.g. blocked cookies).
    reportError('localStorage unavailable', error)
    return null
  }
}

export function hasStoredValue(key: string): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    return storage.getItem(key) != null
  } catch (error) {
    reportError(`could not read "${key}" from localStorage`, error)
    return false
  }
}

export function readStoredJson<T>(key: string): T | null {
  const storage = getStorage()
  if (!storage) return null

  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch (error) {
    reportError(`could not read "${key}" from localStorage`, error)
    return null
  }
  if (raw == null) return null

  try {
    return JSON.parse(raw) as T
  } catch (error) {
    reportError(`ignoring corrupt "${key}" value in localStorage`, error)
    return null
  }
}

export function writeStoredJson(key: string, value: unknown): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    // Quota exceeded and private-browsing restrictions land here; a failed
    // write must never break the render that triggered it.
    reportError(`could not save "${key}" to localStorage`, error)
    return false
  }
}

export function removeStoredItem(key: string): boolean {
  const storage = getStorage()
  if (!storage) return false
  try {
    storage.removeItem(key)
    return true
  } catch (error) {
    reportError(`could not remove "${key}" from localStorage`, error)
    return false
  }
}
