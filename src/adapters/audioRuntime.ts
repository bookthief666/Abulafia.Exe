import type { BreathPhase, Vowel } from '../engines/metronomeEngine'

/**
 * Ritual audio adapter.
 *
 * Like `metronomeRuntime`, this module owns an impure boundary (the Web Audio
 * clock and graph) and keeps it behind a narrow, injectable surface so the
 * engine layer stays pure. No audio assets are used — every tone is
 * synthesised, matching the approach taken by the sibling apps.
 *
 * The chamber is silent by default. Nothing here starts until the practitioner
 * asks for sound, because browsers require a user gesture before an
 * AudioContext may run, and because silence is the default discipline.
 */

/**
 * Vowel frequencies, in Hz.
 *
 * Built as a just-intoned series over a 108 Hz fundamental, ordered so that
 * the pitch rises and falls with the vertical axis of the somatic mapping:
 * `hiriq` (downward) sits lowest, `holam` (upward) highest, and `qubuts`
 * (inward/forward) sits at the centre as the fundamental's octave.
 */
export const VOWEL_FREQUENCIES: Record<Vowel, number> = {
  hiriq: 144, // down   — Y −1
  tzere: 162, // left   — X −1
  qubuts: 216, // forward — Z +1
  qamatz: 243, // right  — X +1
  holam: 288, // up     — Y +1
}

/** Pitch of the soft bell struck at each inhale→exhale transition. */
export const BELL_FREQUENCY = 432

/** Peak gain of the sustained tone. Deliberately low; this sits under a voice. */
const TONE_PEAK_GAIN = 0.045
const DRONE_PEAK_GAIN = 0.02
const BELL_PEAK_GAIN = 0.05

/**
 * The subset of the Web Audio API this adapter needs. Declaring it explicitly
 * lets tests inject a stub without constructing a real audio graph.
 */
export type AudioContextLike = {
  readonly currentTime: number
  readonly destination: AudioNode
  readonly state: string
  createOscillator(): OscillatorNode
  createGain(): GainNode
  createBiquadFilter(): BiquadFilterNode
  resume(): Promise<void>
  close(): Promise<void>
}

export type AudioRuntime = {
  /** Sustained vowel tone + drone, gated by breath phase. */
  setBreath(phase: BreathPhase, progress: number, vowel: Vowel): void
  /** Strike the transition bell. Call once per phase flip. */
  strikeBell(): void
  /** Fade everything out and release the graph. */
  dispose(): void
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

/**
 * The exhale is the sounded half of the cycle, so amplitude follows a shape
 * that swells as the breath is released and returns to silence on the inhale.
 *
 * Exhale: rises quickly, holds, then releases — `sin(π · progress)` skewed
 * toward the attack. Inhale: silent, save for a faint bed of drone.
 */
export function breathGain(phase: BreathPhase, progress: number): number {
  const p = clamp01(progress)
  if (phase === 'inhale') return 0
  // Fast attack (~15% of the phase), long decay across the remainder.
  const attack = 0.15
  if (p < attack) return p / attack
  const tail = (p - attack) / (1 - attack)
  return 1 - tail * tail
}

/** Drone breathes in counterpoint: present throughout, fuller on the exhale. */
export function droneGain(phase: BreathPhase, progress: number): number {
  const p = clamp01(progress)
  return phase === 'inhale' ? 0.35 + 0.25 * p : 0.6 - 0.2 * p
}

export type CreateAudioRuntimeOptions = {
  /** Injectable for tests. Defaults to the platform AudioContext. */
  createContext?: () => AudioContextLike
}

/**
 * Builds the audio graph:
 *
 *   vowel osc ─┐
 *              ├─→ lowpass ─→ master gain ─→ destination
 *   drone osc ─┘
 *   bell osc ──→ bell gain ──────────────────↗
 *
 * Returns `null` when Web Audio is unavailable, so callers can degrade to
 * silence without branching on feature detection themselves.
 */
export function createAudioRuntime(
  options: CreateAudioRuntimeOptions = {},
): AudioRuntime | null {
  const { createContext } = options

  let ctx: AudioContextLike
  try {
    if (createContext) {
      ctx = createContext()
    } else {
      const Ctor =
        typeof globalThis !== 'undefined'
          ? (globalThis as { AudioContext?: new () => AudioContextLike })
              .AudioContext
          : undefined
      if (!Ctor) return null
      ctx = new Ctor()
    }
  } catch {
    return null
  }

  let disposed = false

  const master = ctx.createGain()
  master.gain.value = 0
  master.connect(ctx.destination)

  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 900
  filter.connect(master)

  const tone = ctx.createOscillator()
  tone.type = 'sine'
  tone.frequency.value = VOWEL_FREQUENCIES.holam
  const toneGain = ctx.createGain()
  toneGain.gain.value = 0
  tone.connect(toneGain)
  toneGain.connect(filter)

  const drone = ctx.createOscillator()
  drone.type = 'sine'
  drone.frequency.value = 54
  const droneGainNode = ctx.createGain()
  droneGainNode.gain.value = 0
  drone.connect(droneGainNode)
  droneGainNode.connect(filter)

  tone.start()
  drone.start()
  master.gain.value = 1

  const setBreath: AudioRuntime['setBreath'] = (phase, progress, vowel) => {
    if (disposed) return
    const now = ctx.currentTime
    const target = VOWEL_FREQUENCIES[vowel] ?? VOWEL_FREQUENCIES.holam

    tone.frequency.setTargetAtTime(target, now, 0.08)
    // Open the filter as the breath is released, so the exhale brightens.
    filter.frequency.setTargetAtTime(target * 3.8, now, 0.2)
    toneGain.gain.setTargetAtTime(
      breathGain(phase, progress) * TONE_PEAK_GAIN,
      now,
      0.05,
    )
    droneGainNode.gain.setTargetAtTime(
      droneGain(phase, progress) * DRONE_PEAK_GAIN,
      now,
      0.4,
    )
  }

  const strikeBell: AudioRuntime['strikeBell'] = () => {
    if (disposed) return
    const now = ctx.currentTime
    const bell = ctx.createOscillator()
    const bellGain = ctx.createGain()
    bell.type = 'sine'
    bell.frequency.value = BELL_FREQUENCY
    bellGain.gain.value = BELL_PEAK_GAIN
    bell.connect(bellGain)
    bellGain.connect(master)
    bellGain.gain.setTargetAtTime(0, now, 0.35)
    bell.start()
    bell.stop(now + 1.6)
  }

  const dispose: AudioRuntime['dispose'] = () => {
    if (disposed) return
    disposed = true
    const now = ctx.currentTime
    master.gain.setTargetAtTime(0, now, 0.1)
    try {
      tone.stop(now + 0.4)
      drone.stop(now + 0.4)
    } catch {
      // Some stubs and older implementations reject a second stop(); the
      // context is being torn down regardless.
    }
    void ctx.close()
  }

  return { setBreath, strikeBell, dispose }
}
