import { reportError } from './errors'

let audioCtx: AudioContext | null = null
let audioUnavailable = false

function getContext(): AudioContext | null {
  if (typeof window === 'undefined' || audioUnavailable) return null
  if (!audioCtx) {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!Ctx) {
      audioUnavailable = true
      return null
    }
    try {
      audioCtx = new Ctx()
    } catch (error) {
      audioUnavailable = true
      reportError('audio context unavailable — sound effects disabled', error)
      return null
    }
  }
  return audioCtx
}

function tone(frequency: number, duration: number, volume = 0.08) {
  const ctx = getContext()
  if (!ctx) return
  try {
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    gain.gain.value = volume
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start()
    oscillator.stop(ctx.currentTime + duration)
  } catch (error) {
    // A failed sound effect must not interrupt answering a question.
    reportError('sound effect failed', error)
  }
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
