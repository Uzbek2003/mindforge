let audioCtx: AudioContext | null = null

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (Ctx) audioCtx = new Ctx()
  }
  return audioCtx
}

function tone(frequency: number, duration: number, volume = 0.08) {
  const ctx = getContext()
  if (!ctx) return
  const oscillator = ctx.createOscillator()
  const gain = ctx.createGain()
  oscillator.type = 'sine'
  oscillator.frequency.value = frequency
  gain.gain.value = volume
  oscillator.connect(gain)
  gain.connect(ctx.destination)
  oscillator.start()
  oscillator.stop(ctx.currentTime + duration)
}

export function playCorrectSound(enabled: boolean) {
  if (!enabled) return
  tone(660, 0.08)
  window.setTimeout(() => tone(880, 0.1), 80)
}

export function playWrongSound(enabled: boolean) {
  if (!enabled) return
  tone(220, 0.15, 0.06)
}

export function playTapSound(enabled: boolean) {
  if (!enabled) return
  tone(520, 0.04, 0.04)
}
