import type { BreathPhase, Direction } from '../engines/metronomeEngine'

/**
 * A one-way channel from the rite to the atmosphere.
 *
 * The particle field renders above the chamber in the tree but has to know
 * what the chamber is doing — breath, direction, which arrangement is in hand,
 * whether the rite has ended. Threading that through React would re-render the
 * whole app on every animation frame, which is exactly what the field's own
 * RAF loop exists to avoid.
 *
 * So state is published to a module-scoped signal instead. The chamber writes
 * from an effect; the field reads inside its loop. React is not involved, and
 * nothing here holds a component reference, so there is nothing to leak.
 *
 * Everything is a plain function over module state, which makes it directly
 * testable — `resetField()` exists for that.
 */

export type FieldState =
  | { mode: 'idle' }
  | {
      mode: 'ritual'
      phase: BreathPhase
      progress: number
      direction: Direction
      permutationIndex: number
      isComplete: boolean
    }

export const IDLE_FIELD: FieldState = { mode: 'idle' }

let state: FieldState = IDLE_FIELD

/** Pending one-shot impulses, drained by the render loop. */
let pulses = 0

export function setFieldState(next: FieldState): void {
  state = next
}

export function getFieldState(): FieldState {
  return state
}

/**
 * Request a single radial impulse through the field — used at the turn from
 * inhale to exhale, so the shockwave moves the room rather than being drawn
 * on top of it.
 *
 * Impulses accumulate rather than overwrite: if the loop is throttled or the
 * tab is backgrounded, a queued turn should still be felt when it resumes,
 * and several turns must not collapse into one.
 */
export function pulseField(): void {
  pulses += 1
}

/**
 * Take every pending impulse and clear the queue. Returns how many were
 * waiting, so a loop that missed frames can apply them in proportion.
 */
export function drainFieldPulses(): number {
  const drained = pulses
  pulses = 0
  return drained
}

/** Return the module to its initial state. For tests and for unmount. */
export function resetField(): void {
  state = IDLE_FIELD
  pulses = 0
}
