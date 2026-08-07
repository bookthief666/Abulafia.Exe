import { describe, it, expect } from 'vitest'
import {
  BELL_FREQUENCY,
  VOWEL_FREQUENCIES,
  breathGain,
  createAudioRuntime,
  droneGain,
  type AudioContextLike,
} from './audioRuntime'
import type { Vowel } from '../engines/metronomeEngine'

// ── Stub Web Audio graph ──────────────────────────────────────────────────
// Records every scheduled change so tests can assert on the audio graph
// without a real AudioContext.

type ParamCall = { value: number; startTime: number; timeConstant: number }

class StubParam {
  value = 0
  calls: ParamCall[] = []
  setTargetAtTime(value: number, startTime: number, timeConstant: number) {
    this.value = value
    this.calls.push({ value, startTime, timeConstant })
  }
  get lastTarget(): number | undefined {
    return this.calls.at(-1)?.value
  }
}

class StubNode {
  connections: StubNode[] = []
  connect(target: StubNode) {
    this.connections.push(target)
    return target
  }
  disconnect() {}
}

class StubOscillator extends StubNode {
  type = 'sine'
  frequency = new StubParam()
  started = 0
  stopped: number[] = []
  start() {
    this.started += 1
  }
  stop(when = 0) {
    this.stopped.push(when)
  }
}

class StubGain extends StubNode {
  gain = new StubParam()
}

class StubFilter extends StubNode {
  type = 'lowpass'
  frequency = new StubParam()
}

class StubContext {
  currentTime = 0
  state = 'running'
  destination = new StubNode()
  oscillators: StubOscillator[] = []
  gains: StubGain[] = []
  filters: StubFilter[] = []
  closed = false

  createOscillator() {
    const osc = new StubOscillator()
    this.oscillators.push(osc)
    return osc
  }
  createGain() {
    const gain = new StubGain()
    this.gains.push(gain)
    return gain
  }
  createBiquadFilter() {
    const filter = new StubFilter()
    this.filters.push(filter)
    return filter
  }
  async resume() {}
  async close() {
    this.closed = true
  }
}

function makeRuntime() {
  const ctx = new StubContext()
  const runtime = createAudioRuntime({
    createContext: () => ctx as unknown as AudioContextLike,
  })
  if (!runtime) throw new Error('expected a runtime from the stub context')
  return { ctx, runtime }
}

// ── Pure envelope functions ───────────────────────────────────────────────

describe('breathGain', () => {
  it('is silent for the whole inhale', () => {
    for (const p of [0, 0.25, 0.5, 0.75, 1]) {
      expect(breathGain('inhale', p)).toBe(0)
    }
  })

  it('rises from silence at the start of the exhale', () => {
    expect(breathGain('exhale', 0)).toBe(0)
  })

  it('reaches full amplitude at the end of the attack', () => {
    expect(breathGain('exhale', 0.15)).toBeCloseTo(1, 5)
  })

  it('decays back to silence by the end of the exhale', () => {
    expect(breathGain('exhale', 1)).toBeCloseTo(0, 5)
  })

  it('decays monotonically after the attack', () => {
    let previous = breathGain('exhale', 0.15)
    for (let p = 0.2; p <= 1.0001; p += 0.05) {
      const current = breathGain('exhale', p)
      expect(current).toBeLessThanOrEqual(previous + 1e-9)
      previous = current
    }
  })

  it('stays within [0,1] and tolerates out-of-range progress', () => {
    for (const p of [-5, -0.1, 0, 0.5, 1, 1.5, 42, NaN, Infinity]) {
      const g = breathGain('exhale', p)
      expect(g).toBeGreaterThanOrEqual(0)
      expect(g).toBeLessThanOrEqual(1)
    }
  })
})

describe('droneGain', () => {
  it('is always audible — the drone never fully drops out', () => {
    for (const p of [0, 0.5, 1]) {
      expect(droneGain('inhale', p)).toBeGreaterThan(0)
      expect(droneGain('exhale', p)).toBeGreaterThan(0)
    }
  })

  it('swells across the inhale and recedes across the exhale', () => {
    expect(droneGain('inhale', 1)).toBeGreaterThan(droneGain('inhale', 0))
    expect(droneGain('exhale', 1)).toBeLessThan(droneGain('exhale', 0))
  })

  it('is continuous across the inhale to exhale boundary', () => {
    expect(droneGain('inhale', 1)).toBeCloseTo(droneGain('exhale', 0), 5)
  })
})

describe('VOWEL_FREQUENCIES', () => {
  it('covers exactly the five canonical vowels', () => {
    expect(Object.keys(VOWEL_FREQUENCIES).sort()).toEqual(
      ['hiriq', 'holam', 'qamatz', 'qubuts', 'tzere'].sort(),
    )
  })

  it('assigns a distinct positive frequency to each vowel', () => {
    const values = Object.values(VOWEL_FREQUENCIES)
    expect(new Set(values).size).toBe(values.length)
    for (const hz of values) expect(hz).toBeGreaterThan(0)
  })

  it('rises with the vertical axis of the somatic mapping', () => {
    // hiriq is downward, holam is upward; qubuts (inward) sits between them.
    expect(VOWEL_FREQUENCIES.hiriq).toBeLessThan(VOWEL_FREQUENCIES.qubuts)
    expect(VOWEL_FREQUENCIES.qubuts).toBeLessThan(VOWEL_FREQUENCIES.holam)
  })
})

// ── Runtime behaviour ─────────────────────────────────────────────────────

describe('createAudioRuntime', () => {
  it('returns null when no AudioContext can be constructed', () => {
    const runtime = createAudioRuntime({
      createContext: () => {
        throw new Error('no audio on this platform')
      },
    })
    expect(runtime).toBeNull()
  })

  it('builds and starts the tone and drone oscillators', () => {
    const { ctx } = makeRuntime()
    expect(ctx.oscillators).toHaveLength(2)
    for (const osc of ctx.oscillators) {
      expect(osc.started).toBe(1)
      expect(osc.type).toBe('sine')
    }
  })

  it('routes everything through a lowpass filter', () => {
    const { ctx } = makeRuntime()
    expect(ctx.filters).toHaveLength(1)
    expect(ctx.filters[0].type).toBe('lowpass')
  })

  it('tunes the tone oscillator to the active vowel', () => {
    const { ctx, runtime } = makeRuntime()
    const tone = ctx.oscillators[0]

    const vowels: Vowel[] = ['holam', 'qamatz', 'hiriq', 'tzere', 'qubuts']
    for (const vowel of vowels) {
      runtime.setBreath('exhale', 0.5, vowel)
      expect(tone.frequency.lastTarget).toBe(VOWEL_FREQUENCIES[vowel])
    }
  })

  it('keeps the sounded tone silent through the inhale', () => {
    const { ctx, runtime } = makeRuntime()
    // gains[0] is master, gains[1] is the tone gain.
    const toneGain = ctx.gains[1]
    runtime.setBreath('inhale', 0.5, 'holam')
    expect(toneGain.gain.lastTarget).toBe(0)
  })

  it('opens the tone on the exhale', () => {
    const { ctx, runtime } = makeRuntime()
    const toneGain = ctx.gains[1]
    runtime.setBreath('exhale', 0.15, 'holam')
    expect(toneGain.gain.lastTarget).toBeGreaterThan(0)
  })

  it('strikes a bell at the configured pitch and lets it ring out', () => {
    const { ctx, runtime } = makeRuntime()
    const before = ctx.oscillators.length
    runtime.strikeBell()
    expect(ctx.oscillators.length).toBe(before + 1)

    const bell = ctx.oscillators.at(-1)!
    expect(bell.frequency.value).toBe(BELL_FREQUENCY)
    expect(bell.started).toBe(1)
    expect(bell.stopped).toHaveLength(1)
    expect(bell.stopped[0]).toBeGreaterThan(ctx.currentTime)
  })

  it('closes the context on dispose', () => {
    const { ctx, runtime } = makeRuntime()
    runtime.dispose()
    expect(ctx.closed).toBe(true)
  })

  it('ignores calls made after dispose', () => {
    const { ctx, runtime } = makeRuntime()
    runtime.dispose()
    const oscillatorCount = ctx.oscillators.length

    runtime.setBreath('exhale', 0.5, 'holam')
    runtime.strikeBell()
    runtime.dispose()

    expect(ctx.oscillators.length).toBe(oscillatorCount)
  })
})
