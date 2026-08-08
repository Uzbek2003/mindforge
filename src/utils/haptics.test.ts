import { beforeEach, describe, expect, it, vi } from 'vitest'

const isNativePlatform = vi.fn(() => true)
const impact = vi.fn(async () => {})
const notification = vi.fn(async () => {})

vi.mock('@capacitor/core', () => ({
  Capacitor: { isNativePlatform: () => isNativePlatform() },
}))

vi.mock('@capacitor/haptics', () => ({
  Haptics: {
    impact: (options: unknown) => impact(options),
    notification: (options: unknown) => notification(options),
  },
  ImpactStyle: { Light: 'LIGHT' },
  NotificationType: { Success: 'SUCCESS', Error: 'ERROR' },
}))

const { hapticError, hapticImpact, hapticSuccess } = await import('./haptics')

beforeEach(() => {
  vi.clearAllMocks()
  isNativePlatform.mockReturnValue(true)
  impact.mockResolvedValue(undefined)
  notification.mockResolvedValue(undefined)
})

describe('haptics on a native platform', () => {
  it('triggers a light impact', async () => {
    await hapticImpact(true)
    expect(impact).toHaveBeenCalledWith({ style: 'LIGHT' })
  })

  it('triggers success and error notifications', async () => {
    await hapticSuccess(true)
    expect(notification).toHaveBeenCalledWith({ type: 'SUCCESS' })

    await hapticError(true)
    expect(notification).toHaveBeenLastCalledWith({ type: 'ERROR' })
  })
})

describe('haptics guards', () => {
  it('does nothing when vibration is disabled', async () => {
    await hapticImpact(false)
    await hapticSuccess(false)
    await hapticError(false)
    expect(impact).not.toHaveBeenCalled()
    expect(notification).not.toHaveBeenCalled()
  })

  it('does nothing on the web where the plugin is unavailable', async () => {
    isNativePlatform.mockReturnValue(false)
    await hapticImpact(true)
    await hapticSuccess(true)
    await hapticError(true)
    expect(impact).not.toHaveBeenCalled()
    expect(notification).not.toHaveBeenCalled()
  })

  it('swallows plugin failures', async () => {
    impact.mockRejectedValue(new Error('no vibrator'))
    notification.mockRejectedValue(new Error('no vibrator'))
    await expect(hapticImpact(true)).resolves.toBeUndefined()
    await expect(hapticSuccess(true)).resolves.toBeUndefined()
    await expect(hapticError(true)).resolves.toBeUndefined()
  })
})
