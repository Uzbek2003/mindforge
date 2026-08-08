import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hasStoredValue, readStoredJson, removeStoredItem, writeStoredJson } from './storage'

interface FakeStorage {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

function installStorage(storage: FakeStorage) {
  vi.stubGlobal('localStorage', storage)
}

function memoryStorage(): FakeStorage {
  const map = new Map<string, string>()
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => {
      map.set(key, value)
    },
    removeItem: (key) => {
      map.delete(key)
    },
  }
}

describe('storage helpers', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('round-trips JSON values', () => {
    installStorage(memoryStorage())
    expect(writeStoredJson('key', { a: 1 })).toBe(true)
    expect(readStoredJson<{ a: number }>('key')).toEqual({ a: 1 })
    expect(hasStoredValue('key')).toBe(true)
    expect(removeStoredItem('key')).toBe(true)
    expect(readStoredJson('key')).toBeNull()
  })

  it('reports a failed write instead of throwing', () => {
    const storage = memoryStorage()
    storage.setItem = () => {
      throw new DOMException('quota', 'QuotaExceededError')
    }
    installStorage(storage)

    expect(writeStoredJson('key', { a: 1 })).toBe(false)
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('reports corrupt JSON and falls back to null', () => {
    const storage = memoryStorage()
    storage.setItem('key', '{not json')
    installStorage(storage)

    expect(readStoredJson('key')).toBeNull()
    expect(console.error).toHaveBeenCalledOnce()
  })

  it('reports storage that throws on access', () => {
    installStorage({
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => undefined,
      removeItem: () => undefined,
    })

    expect(readStoredJson('key')).toBeNull()
    expect(hasStoredValue('key')).toBe(false)
    expect(console.error).toHaveBeenCalledTimes(2)
  })
})
