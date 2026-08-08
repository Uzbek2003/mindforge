import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

interface StartedTone {
  frequency: number
  volume: number
  stopAt: number
}

const tones: StartedTone[] = []
const pendingTimeouts: (() => void)[] = []
let contextsCreated = 0

class FakeAudioContext {
  currentTime = 0
  destination = { id: 'destination' }

  createOscillator() {
    const oscillator = {
      type: 'square',
      frequency: { value: 0 },
      gainRef: null as { gain: { value: number } } | null,
      connect(gain: { gain: { value: number } }) {
        oscillator.gainRef = gain
      },
      start() {},
      stop(stopAt: number) {
        tones.push({
          frequency: oscillator.frequency.value,
          volume: oscillator.gainRef?.gain.value ?? -1,
          stopAt,
        })
      },
    }
    return oscillator
  }

  createGain() {
    return { gain: { value: 0 }, connect: () => {} }
  }
}

vi.stubGlobal('window', {
  AudioContext: class extends FakeAudioContext {
    constructor() {
      super()
      contextsCreated += 1
    }
  },
  setTimeout: (callback: () => void) => {
    pendingTimeouts.push(callback)
    return pendingTimeouts.length
  },
})

const { playCorrectSound, playTapSound, playWrongSound } = await import('./sounds')

beforeEach(() => {
  tones.length = 0
  pendingTimeouts.length = 0
  contextsCreated = 0
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('sound effects when enabled', () => {
  it('plays a rising two-note chime for a correct answer', () => {
    playCorrectSound(true)
    expect(tones.map((t) => t.frequency)).toEqual([660])

    expect(pendingTimeouts).toHaveLength(1)
    pendingTimeouts[0]()
    expect(tones.map((t) => t.frequency)).toEqual([660, 880])
    expect(tones[1].stopAt).toBeCloseTo(0.1)
  })

  it('plays a single low tone for a wrong answer', () => {
    playWrongSound(true)
    expect(tones).toHaveLength(1)
    expect(tones[0].frequency).toBe(220)
    expect(tones[0].volume).toBeCloseTo(0.06)
    expect(tones[0].stopAt).toBeCloseTo(0.15)
  })

  it('plays a short quiet tap tone', () => {
    playTapSound(true)
    expect(tones).toHaveLength(1)
    expect(tones[0].frequency).toBe(520)
    expect(tones[0].volume).toBeCloseTo(0.04)
    expect(tones[0].stopAt).toBeCloseTo(0.04)
  })

  it('reuses a single AudioContext across sounds', () => {
    playTapSound(true)
    playWrongSound(true)
    playTapSound(true)
    expect(contextsCreated).toBeLessThanOrEqual(1)
  })
})

describe('sound effects when disabled', () => {
  it('plays nothing and schedules nothing', () => {
    playCorrectSound(false)
    playWrongSound(false)
    playTapSound(false)
    expect(tones).toHaveLength(0)
    expect(pendingTimeouts).toHaveLength(0)
  })
})
