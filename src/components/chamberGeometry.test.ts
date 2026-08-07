import { describe, it, expect } from 'vitest'
import {
  CARDINALS,
  CENTRE,
  DIRECTION_CUE,
  VOWEL_GLYPH,
  activeRingIndex,
  cardinalAngle,
  cardinalUnit,
  directionStretch,
  directionTranslate,
  octagonPoints,
  polarPoint,
  syllableFor,
} from './chamberGeometry'
import type { Direction, Vowel } from '../engines/metronomeEngine'

const ALL_VOWELS: Vowel[] = ['holam', 'qamatz', 'hiriq', 'tzere', 'qubuts']
const ALL_DIRECTIONS: Direction[] = ['up', 'right', 'down', 'left', 'forward']

describe('VOWEL_GLYPH', () => {
  it('covers every canonical vowel', () => {
    for (const v of ALL_VOWELS) expect(VOWEL_GLYPH[v]).toBeTruthy()
  })

  it('maps each vowel to a distinct single letter', () => {
    const glyphs = ALL_VOWELS.map((v) => VOWEL_GLYPH[v])
    expect(new Set(glyphs).size).toBe(glyphs.length)
    for (const g of glyphs) expect(g).toHaveLength(1)
  })

  it('follows the standard Hebrew phonetic mapping', () => {
    expect(VOWEL_GLYPH).toEqual({
      holam: 'O',
      qamatz: 'A',
      hiriq: 'I',
      tzere: 'E',
      qubuts: 'U',
    })
  })
})

describe('DIRECTION_CUE', () => {
  it('gives every direction a bodily instruction', () => {
    for (const d of ALL_DIRECTIONS) {
      expect(DIRECTION_CUE[d]).toBeTruthy()
    }
  })

  it('describes forward as inward rather than as a compass point', () => {
    expect(DIRECTION_CUE.forward).toBe('Inward')
  })
})

describe('octagonPoints', () => {
  it('produces eight vertices', () => {
    expect(octagonPoints(40).split(' ')).toHaveLength(8)
  })

  it('places the first vertex at the top (pointy-top)', () => {
    const [first] = octagonPoints(40).split(' ')
    const [x, y] = first.split(',').map(Number)
    expect(x).toBeCloseTo(CENTRE, 2)
    expect(y).toBeCloseTo(CENTRE - 40, 2)
  })

  it('keeps every vertex at the requested radius from the centre', () => {
    for (const pt of octagonPoints(31.5).split(' ')) {
      const [x, y] = pt.split(',').map(Number)
      const dist = Math.hypot(x - CENTRE, y - CENTRE)
      expect(dist).toBeCloseTo(31.5, 2)
    }
  })

  it('collapses to the centre at radius zero', () => {
    for (const pt of octagonPoints(0).split(' ')) {
      const [x, y] = pt.split(',').map(Number)
      expect(x).toBeCloseTo(CENTRE, 3)
      expect(y).toBeCloseTo(CENTRE, 3)
    }
  })
})

describe('polarPoint', () => {
  it('returns the centre at radius zero', () => {
    expect(polarPoint(50, 50, 0, 1.234)).toEqual({ x: 50, y: 50 })
  })

  it('places angle zero directly to the right', () => {
    const p = polarPoint(50, 50, 10, 0)
    expect(p.x).toBeCloseTo(60, 6)
    expect(p.y).toBeCloseTo(50, 6)
  })

  it('places -pi/2 directly above, since screen y grows downward', () => {
    const p = polarPoint(50, 50, 10, -Math.PI / 2)
    expect(p.x).toBeCloseTo(50, 6)
    expect(p.y).toBeCloseTo(40, 6)
  })
})

describe('cardinalAngle', () => {
  it('returns null for forward, which has no angle on the plane', () => {
    expect(cardinalAngle('forward')).toBeNull()
  })

  it('agrees with cardinalUnit for every cardinal', () => {
    for (const c of CARDINALS) {
      const angle = cardinalAngle(c)
      expect(angle).not.toBeNull()
      const { ux, uy } = cardinalUnit(c)
      expect(Math.cos(angle as number)).toBeCloseTo(ux, 6)
      expect(Math.sin(angle as number)).toBeCloseTo(uy, 6)
    }
  })
})

describe('cardinalUnit', () => {
  it('returns unit vectors', () => {
    for (const c of CARDINALS) {
      const { ux, uy } = cardinalUnit(c)
      expect(Math.hypot(ux, uy)).toBeCloseTo(1, 9)
    }
  })

  it('points up as negative y, matching SVG coordinates', () => {
    expect(cardinalUnit('up')).toEqual({ ux: 0, uy: -1 })
    expect(cardinalUnit('down')).toEqual({ ux: 0, uy: 1 })
  })
})

describe('activeRingIndex', () => {
  it('returns -1 when there is no active cardinal', () => {
    expect(activeRingIndex(12, null)).toBe(-1)
  })

  it('returns -1 for an empty ring', () => {
    expect(activeRingIndex(0, 0)).toBe(-1)
  })

  it('selects slot 0 for up, since rings start at the top', () => {
    expect(activeRingIndex(12, cardinalAngle('up'))).toBe(0)
    expect(activeRingIndex(8, cardinalAngle('up'))).toBe(0)
  })

  it('selects the quarter-way slot for right on a 12-slot ring', () => {
    expect(activeRingIndex(12, cardinalAngle('right'))).toBe(3)
  })

  it('selects the halfway slot for down on a 12-slot ring', () => {
    expect(activeRingIndex(12, cardinalAngle('down'))).toBe(6)
  })

  it('selects the three-quarter slot for left on a 12-slot ring', () => {
    expect(activeRingIndex(12, cardinalAngle('left'))).toBe(9)
  })

  it('always returns an index inside the ring', () => {
    for (const count of [1, 3, 4, 5, 7, 8, 12]) {
      for (const c of CARDINALS) {
        const idx = activeRingIndex(count, cardinalAngle(c))
        expect(idx).toBeGreaterThanOrEqual(0)
        expect(idx).toBeLessThan(count)
      }
    }
  })

  it('is stable against angles wrapped by a full turn', () => {
    const base = activeRingIndex(12, Math.PI / 3)
    expect(activeRingIndex(12, Math.PI / 3 + 2 * Math.PI)).toBe(base)
    expect(activeRingIndex(12, Math.PI / 3 - 2 * Math.PI)).toBe(base)
  })
})

describe('directionTranslate', () => {
  it('leaves forward at the centre', () => {
    expect(directionTranslate('forward')).toEqual({ dx: '0', dy: '0' })
  })

  it('moves up along negative y and down along positive y', () => {
    expect(directionTranslate('up').dy.startsWith('-')).toBe(true)
    expect(directionTranslate('down').dy.startsWith('-')).toBe(false)
  })

  it('moves left and right in opposition', () => {
    expect(directionTranslate('left').dx).toBe('-5vmin')
    expect(directionTranslate('right').dx).toBe('5vmin')
  })
})

describe('directionStretch', () => {
  it('leaves forward unstretched', () => {
    expect(directionStretch('forward')).toEqual({ sx: 1, sy: 1 })
  })

  it('stretches along the axis of travel', () => {
    const vertical = directionStretch('up')
    expect(vertical.sy).toBeGreaterThan(vertical.sx)

    const horizontal = directionStretch('right')
    expect(horizontal.sx).toBeGreaterThan(horizontal.sy)
  })

  it('treats opposite directions on an axis identically', () => {
    expect(directionStretch('up')).toEqual(directionStretch('down'))
    expect(directionStretch('left')).toEqual(directionStretch('right'))
  })
})

describe('syllableFor', () => {
  it('fuses the letter with its vowel', () => {
    expect(syllableFor('Y', 'holam')).toBe('YO')
    expect(syllableFor('H', 'qamatz')).toBe('HA')
    expect(syllableFor('V', 'hiriq')).toBe('VI')
  })

  it('is empty when no letter is in hand', () => {
    expect(syllableFor('', 'holam')).toBe('')
  })

  it('produces a syllable for every vowel', () => {
    for (const v of ALL_VOWELS) {
      expect(syllableFor('Y', v)).toBe(`Y${VOWEL_GLYPH[v]}`)
    }
  })
})
