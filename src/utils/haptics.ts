import { Capacitor } from '@capacitor/core'
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { reportError } from './errors'

export async function hapticImpact(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await Haptics.impact({ style: ImpactStyle.Light })
  } catch (error) {
    reportError('haptic impact failed', error)
  }
}

export async function hapticSuccess(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await Haptics.notification({ type: NotificationType.Success })
  } catch (error) {
    reportError('haptic success feedback failed', error)
  }
}

export async function hapticError(enabled: boolean) {
  if (!enabled || !Capacitor.isNativePlatform()) return
  try {
    await Haptics.notification({ type: NotificationType.Error })
  } catch (error) {
    reportError('haptic error feedback failed', error)
  }
}
