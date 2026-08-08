import { useCallback, useEffect, useState } from 'react'
import { DEFAULT_SETTINGS, type AppSettings } from '../types'
import { STORAGE_KEYS } from '../constants'
import { normalizeVoicePitch } from '../utils/voiceProsody'
import { readMergedJson, writeJson } from '../utils/storage'

function loadSettings(): AppSettings {
  const parsed = readMergedJson(STORAGE_KEYS.settings, DEFAULT_SETTINGS)
  parsed.voicePitch = normalizeVoicePitch(parsed.voicePitch as string)
  if (parsed.voiceSpeed !== 'slow' && parsed.voiceSpeed !== 'fast') {
    parsed.voiceSpeed = 'normal'
  }
  return parsed
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  useEffect(() => {
    writeJson(STORAGE_KEYS.settings, settings)
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
