import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

async function runHaptic(enabled: boolean, run: () => Promise<void>) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await run()
  } catch {
    /* noop */
  }
}

export function hapticImpact(enabled: boolean) {
  return runHaptic(enabled, () => Haptics.impact({ style: ImpactStyle.Light }))
}

export function hapticSuccess(enabled: boolean) {
  return runHaptic(enabled, () => Haptics.notification({ type: NotificationType.Success }))
}

export function hapticError(enabled: boolean) {
  return runHaptic(enabled, () => Haptics.notification({ type: NotificationType.Error }))
}
