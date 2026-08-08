import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type AppSettings } from '../types'
import { STORAGE_KEYS } from '../constants'
import { normalizeVoicePitch } from '../utils/voiceProsody'
import { readStoredJson, writeStoredJson } from '../utils/storage'

function loadSettings(): AppSettings {
  const stored = readStoredJson<Partial<AppSettings>>(STORAGE_KEYS.settings)
  if (!stored) return { ...DEFAULT_SETTINGS }

  const parsed = { ...DEFAULT_SETTINGS, ...stored }
  parsed.voicePitch = normalizeVoicePitch(parsed.voicePitch as string)
  if (parsed.voiceSpeed !== 'slow' && parsed.voiceSpeed !== 'fast') {
    parsed.voiceSpeed = 'normal'
  }
  return parsed
}

function saveSettings(settings: AppSettings) {
  writeStoredJson(STORAGE_KEYS.settings, settings)
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
    document.documentElement.dataset.textSize = settings.textSize
    document.documentElement.dataset.reduceMotion = settings.reduceAnimations ? 'true' : 'false'
  }, [settings])

  const updateSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS })
  }, [])

  return { settings, updateSetting, resetSettings }
}
