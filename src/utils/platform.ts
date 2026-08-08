import { Capacitor } from '@capacitor/core'

export function isAndroidNative(): boolean {
  return Capacitor.getPlatform() === 'android'
}

export function isIosNative(): boolean {
  return Capacitor.getPlatform() === 'ios'
}

/** Android or iOS — the platforms that use the native TTS plugin. */
export function isNativeTtsPath(): boolean {
  return isAndroidNative() || isIosNative()
}
