import {
  advanceMetronome,
  createInitialMetronomeState,
  type MetronomeConfig,
  type MetronomeState,
} from '../engines/metronomeEngine'

export type MetronomeRuntimeState = {
  running: boolean
  lastNowMs: number | null
  metronome: MetronomeState
}

function assertFiniteNowMs(nowMs: number): void {
  if (typeof nowMs !== 'number' || !Number.isFinite(nowMs)) {
    throw new Error(
      `Invalid nowMs: must be a finite number (got ${String(nowMs)}).`,
    )
  }
}

export function createInitialRuntimeState(): MetronomeRuntimeState {
  return {
    running: false,
    lastNowMs: null,
    metronome: createInitialMetronomeState(),
  }
}

export function startRuntime(
  state: MetronomeRuntimeState,
  nowMs: number,
): MetronomeRuntimeState {
  assertFiniteNowMs(nowMs)
  return {
    running: true,
    lastNowMs: nowMs,
    metronome: state.metronome,
  }
}

export function pauseRuntime(
  state: MetronomeRuntimeState,
): MetronomeRuntimeState {
  return {
    running: false,
    lastNowMs: null,
    metronome: state.metronome,
  }
}

export function resetRuntime(): MetronomeRuntimeState {
  return createInitialRuntimeState()
}

export function tickRuntime(
  state: MetronomeRuntimeState,
  nowMs: number,
  config: MetronomeConfig,
): MetronomeRuntimeState {
  assertFiniteNowMs(nowMs)

  if (!state.running) {
    return state
  }

  if (state.lastNowMs === null) {
    return {
      running: state.running,
      lastNowMs: nowMs,
      metronome: state.metronome,
    }
  }

  let deltaMs = nowMs - state.lastNowMs
  if (deltaMs < 0) {
    deltaMs = 0
  }

  const nextMetronome = advanceMetronome(state.metronome, deltaMs, config)

  return {
    running: state.running,
    lastNowMs: nowMs,
    metronome: nextMetronome,
  }
}

