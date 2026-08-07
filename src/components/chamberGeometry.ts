import type { Direction, Vowel } from '../engines/metronomeEngine'

/**
 * Pure geometry and vocabulary for the ritual core.
 *
 * Kept apart from `SomaticHud` so the maths can be verified without mounting a
 * component: every function here is a total function of its arguments, with no
 * dependency on React, the DOM, or the clock.
 */

/** Standard Hebrew / Abulafian operational phonetic mapping. */
export const VOWEL_GLYPH: Record<Vowel, string> = {
  holam: 'O',
  qamatz: 'A',
  hiriq: 'I',
  tzere: 'E',
  qubuts: 'U',
}

/**
 * How each direction is described to the practitioner. The somatic mapping is
 * a bodily instruction, not a label, so it is phrased as one.
 */
export const DIRECTION_CUE: Record<Direction, string> = {
  up: 'Rising',
  right: 'Rightward',
  down: 'Descending',
  left: 'Leftward',
  forward: 'Inward',
}

export type Cardinal = 'up' | 'right' | 'down' | 'left'
export const CARDINALS: readonly Cardinal[] = ['up', 'right', 'down', 'left']

/** The SVG viewBox is 100x100; the core is centred on (50,50). */
export const CENTRE = 50

/** Eight vertices around the centre at radius r, pointy-top. */
export function octagonPoints(r: number): string {
  const pts: string[] = []
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 4
    pts.push(
      `${(CENTRE + r * Math.cos(a)).toFixed(3)},${(CENTRE + r * Math.sin(a)).toFixed(3)}`,
    )
  }
  return pts.join(' ')
}

export function polarPoint(
  cx: number,
  cy: number,
  r: number,
  angleRad: number,
): { x: number; y: number } {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) }
}

/**
 * Cardinal direction to SVG angle in radians, with screen-y pointing down.
 * `forward` has no angle — it is the Z axis, and lives at the centre.
 */
export function cardinalAngle(d: Direction): number | null {
  switch (d) {
    case 'up':
      return -Math.PI / 2
    case 'right':
      return 0
    case 'down':
      return Math.PI / 2
    case 'left':
      return Math.PI
    case 'forward':
    default:
      return null
  }
}

/** Unit vector for a cardinal, in SVG coordinates. */
export function cardinalUnit(c: Cardinal): { ux: number; uy: number } {
  switch (c) {
    case 'up':
      return { ux: 0, uy: -1 }
    case 'right':
      return { ux: 1, uy: 0 }
    case 'down':
      return { ux: 0, uy: 1 }
    case 'left':
      return { ux: -1, uy: 0 }
  }
}

/**
 * Index of the evenly spaced ring slot nearest a given angle, or -1 when there
 * is no active cardinal. Ring slots start at -π/2 and run clockwise.
 */
export function activeRingIndex(
  count: number,
  targetAngle: number | null,
): number {
  if (targetAngle === null) return -1
  if (count <= 0) return -1
  let best = 0
  let bestDelta = Infinity
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / count
    let delta =
      Math.abs(((a - targetAngle) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI)
    if (delta > Math.PI) delta = 2 * Math.PI - delta
    if (delta < bestDelta) {
      bestDelta = delta
      best = i
    }
  }
  return best
}

/** Offset applied to the whole core so the direction is felt, not read. */
export function directionTranslate(d: Direction): { dx: string; dy: string } {
  switch (d) {
    case 'up':
      return { dx: '0', dy: '-5vmin' }
    case 'down':
      return { dx: '0', dy: '5vmin' }
    case 'left':
      return { dx: '-5vmin', dy: '0' }
    case 'right':
      return { dx: '5vmin', dy: '0' }
    case 'forward':
    default:
      return { dx: '0', dy: '0' }
  }
}

/** Slight anisotropic stretch along the axis of travel. */
export function directionStretch(d: Direction): { sx: number; sy: number } {
  switch (d) {
    case 'up':
    case 'down':
      return { sx: 0.96, sy: 1.06 }
    case 'left':
    case 'right':
      return { sx: 1.06, sy: 0.96 }
    case 'forward':
    default:
      return { sx: 1, sy: 1 }
  }
}

/**
 * The syllable to intone: the operative letter fused with its vowel.
 * Empty when there is no letter in hand — i.e. once the rite is complete.
 */
export function syllableFor(letter: string, vowel: Vowel): string {
  if (!letter) return ''
  return `${letter}${VOWEL_GLYPH[vowel]}`
}
