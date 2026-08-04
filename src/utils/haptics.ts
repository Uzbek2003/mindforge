import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'

export async function hapticImpact(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch {
    /* noop */
  }
}

export async function hapticSuccess(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch {
    /* noop */
  }
}

export async function hapticError(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch {
    /* noop */
  }
}
