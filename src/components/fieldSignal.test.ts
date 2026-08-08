import { describe, it, expect, beforeEach } from 'vitest'
import {
  IDLE_FIELD,
  drainFieldPulses,
  getFieldState,
  pulseField,
  resetField,
  setFieldState,
  type FieldState,
} from './fieldSignal'

const RITUAL: FieldState = {
  mode: 'ritual',
  phase: 'exhale',
  progress: 0.5,
  direction: 'up',
  permutationIndex: 3,
  isComplete: false,
}

beforeEach(() => {
  resetField()
})

describe('fieldSignal state', () => {
  it('rests idle until the rite says otherwise', () => {
    expect(getFieldState()).toEqual(IDLE_FIELD)
  })

  it('publishes what the chamber is doing', () => {
    setFieldState(RITUAL)
    expect(getFieldState()).toEqual(RITUAL)
  })

  it('replaces rather than merges, so stale breath cannot linger', () => {
    setFieldState(RITUAL)
    setFieldState({ ...RITUAL, phase: 'inhale', progress: 0.1 })

    const state = getFieldState()
    expect(state.mode).toBe('ritual')
    if (state.mode !== 'ritual') throw new Error('expected ritual')
    expect(state.phase).toBe('inhale')
    expect(state.progress).toBe(0.1)
  })

  it('returns to rest when the chamber is left', () => {
    setFieldState(RITUAL)
    resetField()
    expect(getFieldState()).toEqual(IDLE_FIELD)
  })
})

describe('fieldSignal pulses', () => {
  it('has nothing to drain until the breath turns', () => {
    expect(drainFieldPulses()).toBe(0)
  })

  it('hands over a requested impulse exactly once', () => {
    pulseField()
    expect(drainFieldPulses()).toBe(1)
    expect(drainFieldPulses()).toBe(0)
  })

  it('accumulates rather than overwriting', () => {
    // A backgrounded tab may miss frames; several turns of the breath must not
    // collapse into a single impulse when the loop resumes.
    pulseField()
    pulseField()
    pulseField()
    expect(drainFieldPulses()).toBe(3)
    expect(drainFieldPulses()).toBe(0)
  })

  it('clears pending impulses on reset', () => {
    pulseField()
    pulseField()
    resetField()
    expect(drainFieldPulses()).toBe(0)
  })

  it('keeps pulses independent of published state', () => {
    pulseField()
    setFieldState(RITUAL)
    expect(drainFieldPulses()).toBe(1)
    expect(getFieldState()).toEqual(RITUAL)
  })
})
