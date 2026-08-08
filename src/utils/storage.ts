/** Local storage helpers shared by the progress and settings hooks. */

export function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/** Stored object merged over `defaults`, so newly added fields keep a value. */
export function readMergedJson<T extends object>(key: string, defaults: T): T {
  const stored = readJson<Partial<T> | null>(key, null)
  if (!stored) return { ...defaults }
  return { ...defaults, ...stored }
}

/** Like {@link readMergedJson}, but falls back to a legacy key and migrates it forward. */
export function readMergedJsonWithLegacyKey<T extends object>(
  key: string,
  legacyKey: string,
  defaults: T,
): T {
  try {
    const raw = localStorage.getItem(key) ?? localStorage.getItem(legacyKey)
    if (!raw) return { ...defaults }
    const merged = { ...defaults, ...(JSON.parse(raw) as Partial<T>) }
    if (!localStorage.getItem(key)) {
      writeJson(key, merged)
    }
    return merged
  } catch {
    return { ...defaults }
  }
}

export function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

/** Writes `value`, or removes the key when the value is null. */
export function writeJsonOrRemove(key: string, value: unknown) {
  if (value == null) {
    localStorage.removeItem(key)
    return
  }
  writeJson(key, value)
}
