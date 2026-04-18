export type Vowel = 'holam' | 'qamatz' | 'hiriq' | 'tzere' | 'qubuts'
export type Direction = 'up' | 'right' | 'down' | 'left' | 'forward'
export type BreathPhase = 'inhale' | 'exhale'

export type VowelStep = {
  vowel: Vowel
  direction: Direction
}

export type MetronomeConfig = {
  inhaleMs: number
  exhaleMs: number
  sequence: VowelStep[]
}

export type MetronomeState = {
  phase: BreathPhase
  phaseElapsedMs: number
  activeIndex: number
  cycleCount: number
}

const VALID_VOWELS: readonly Vowel[] = ['holam', 'qamatz', 'hiriq', 'tzere', 'qubuts']
const VALID_DIRECTIONS: readonly Direction[] = ['up', 'right', 'down', 'left', 'forward']

export function createDefaultSequence(): VowelStep[] {
  return [
    { vowel: 'holam', direction: 'up' },
    { vowel: 'qamatz', direction: 'right' },
    { vowel: 'hiriq', direction: 'down' },
    { vowel: 'tzere', direction: 'left' },
    { vowel: 'qubuts', direction: 'forward' },
  ]
}

export function createDefaultConfig(): MetronomeConfig {
  return {
    inhaleMs: 4000,
    exhaleMs: 4000,
    sequence: createDefaultSequence(),
  }
}

export function createInitialMetronomeState(): MetronomeState {
  return {
    phase: 'inhale',
    phaseElapsedMs: 0,
    activeIndex: 0,
    cycleCount: 0,
  }
}

function isValidVowel(v: unknown): v is Vowel {
  return typeof v === 'string' && (VALID_VOWELS as readonly string[]).includes(v)
}

function isValidDirection(d: unknown): d is Direction {
  return typeof d === 'string' && (VALID_DIRECTIONS as readonly string[]).includes(d)
}

function assertValidConfig(config: MetronomeConfig): void {
  if (!Number.isFinite(config.inhaleMs) || config.inhaleMs <= 0) {
    throw new Error(
      `Invalid MetronomeConfig: inhaleMs must be a positive finite number (got ${config.inhaleMs}).`,
    )
  }
  if (!Number.isFinite(config.exhaleMs) || config.exhaleMs <= 0) {
    throw new Error(
      `Invalid MetronomeConfig: exhaleMs must be a positive finite number (got ${config.exhaleMs}).`,
    )
  }
  if (!Array.isArray(config.sequence) || config.sequence.length === 0) {
    throw new Error('Invalid MetronomeConfig: sequence must be a non-empty array of VowelStep.')
  }
  for (let i = 0; i < config.sequence.length; i++) {
    const step = config.sequence[i]
    if (step === null || typeof step !== 'object') {
      throw new Error(`Invalid MetronomeConfig: sequence[${i}] must be a VowelStep object.`)
    }
    if (!isValidVowel(step.vowel)) {
      throw new Error(
        `Invalid MetronomeConfig: sequence[${i}].vowel must be one of ${VALID_VOWELS.join(', ')} (got ${String(step.vowel)}).`,
      )
    }
    if (!isValidDirection(step.direction)) {
      throw new Error(
        `Invalid MetronomeConfig: sequence[${i}].direction must be one of ${VALID_DIRECTIONS.join(', ')} (got ${String(step.direction)}).`,
      )
    }
  }
}

function assertValidState(state: MetronomeState, config: MetronomeConfig): void {
  if (state.phase !== 'inhale' && state.phase !== 'exhale') {
    throw new Error(
      `Invalid MetronomeState: phase must be 'inhale' or 'exhale' (got ${String(state.phase)}).`,
    )
  }
  if (!Number.isFinite(state.phaseElapsedMs)) {
    throw new Error(
      `Invalid MetronomeState: phaseElapsedMs must be a finite number (got ${state.phaseElapsedMs}).`,
    )
  }
  if (state.phaseElapsedMs < 0) {
    throw new Error(
      `Invalid MetronomeState: phaseElapsedMs must be non-negative (got ${state.phaseElapsedMs}).`,
    )
  }
  const phaseDuration = state.phase === 'inhale' ? config.inhaleMs : config.exhaleMs
  if (state.phaseElapsedMs > phaseDuration) {
    throw new Error(
      `Invalid MetronomeState: phaseElapsedMs (${state.phaseElapsedMs}) exceeds ${state.phase} duration (${phaseDuration}).`,
    )
  }
  if (!Number.isInteger(state.activeIndex)) {
    throw new Error(
      `Invalid MetronomeState: activeIndex must be an integer (got ${state.activeIndex}).`,
    )
  }
  if (state.activeIndex < 0 || state.activeIndex >= config.sequence.length) {
    throw new Error(
      `Invalid MetronomeState: activeIndex ${state.activeIndex} is out of bounds for sequence of length ${config.sequence.length}.`,
    )
  }
  if (!Number.isInteger(state.cycleCount)) {
    throw new Error(
      `Invalid MetronomeState: cycleCount must be an integer (got ${state.cycleCount}).`,
    )
  }
  if (state.cycleCount < 0) {
    throw new Error(
      `Invalid MetronomeState: cycleCount must be non-negative (got ${state.cycleCount}).`,
    )
  }
}

export function advanceMetronome(
  state: MetronomeState,
  deltaMs: number,
  config: MetronomeConfig,
): MetronomeState {
  assertValidConfig(config)
  assertValidState(state, config)
  if (!Number.isFinite(deltaMs) || deltaMs < 0) {
    throw new Error(`Invalid deltaMs: must be a non-negative finite number (got ${deltaMs}).`)
  }

  let phase: BreathPhase = state.phase
  let phaseElapsedMs = state.phaseElapsedMs
  let activeIndex = state.activeIndex
  let cycleCount = state.cycleCount
  let remaining = deltaMs

  while (remaining > 0) {
    const phaseDuration = phase === 'inhale' ? config.inhaleMs : config.exhaleMs
    const timeLeftInPhase = phaseDuration - phaseElapsedMs

    if (remaining < timeLeftInPhase) {
      phaseElapsedMs += remaining
      remaining = 0
    } else {
      remaining -= timeLeftInPhase
      phaseElapsedMs = 0
      if (phase === 'inhale') {
        phase = 'exhale'
      } else {
        phase = 'inhale'
        const nextIndex = activeIndex + 1
        if (nextIndex >= config.sequence.length) {
          activeIndex = 0
          cycleCount += 1
        } else {
          activeIndex = nextIndex
        }
      }
    }
  }

  return { phase, phaseElapsedMs, activeIndex, cycleCount }
}

export function getActiveStep(
  state: MetronomeState,
  config: MetronomeConfig,
): VowelStep {
  assertValidConfig(config)
  assertValidState(state, config)
  return config.sequence[state.activeIndex]
}

export function getPhaseProgress(
  state: MetronomeState,
  config: MetronomeConfig,
): number {
  assertValidConfig(config)
  assertValidState(state, config)
  const phaseDuration = state.phase === 'inhale' ? config.inhaleMs : config.exhaleMs
  return state.phaseElapsedMs / phaseDuration
}

