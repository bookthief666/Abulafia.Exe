import { describe, it, expect } from 'vitest'
import {
  generatePermutations,
  renderPermutation,
  type PermutationToken,
} from './permutationEngine'

describe('Permutation Engine — Miktav', () => {
  const yhvh = 'YHVH'

  it('generates exactly 24 permutations for "YHVH" (4! positional souls)', () => {
    const output = generatePermutations(yhvh)
    expect(output.length).toBe(24)
  })

  it('emits exactly 4 tokens per permutation', () => {
    const output = generatePermutations(yhvh)
    for (const perm of output) {
      expect(perm.length).toBe(4)
    }
  })

  it('each permutation contains sourceIndex values [0, 1, 2, 3] exactly once', () => {
    const output = generatePermutations(yhvh)
    for (const perm of output) {
      const sorted = perm.map((t: PermutationToken) => t.sourceIndex).sort()
      expect(sorted).toEqual([0, 1, 2, 3])
    }
  })

  it('all 24 sourceIndex orderings are distinct', () => {
    const output = generatePermutations(yhvh)
    const signatures = new Set(
      output.map((p) => p.map((t) => t.sourceIndex).join(',')),
    )
    expect(signatures.size).toBe(24)
  })

  it('tolerates duplicate rendered strings (positional souls axiom — YHVH renders to only 12 distinct strings)', () => {
    const output = generatePermutations(yhvh)
    const rendered = output.map(renderPermutation)
    expect(rendered.length).toBe(24)
    const distinctRenders = new Set(rendered)
    expect(distinctRenders.size).toBe(12)
    expect(distinctRenders.size).toBeLessThan(output.length)
  })

  it('preserves the original char at each sourceIndex position', () => {
    const output = generatePermutations(yhvh)
    for (const perm of output) {
      for (const token of perm) {
        expect(token.char).toBe(yhvh[token.sourceIndex])
      }
    }
  })

  it('returns a single empty permutation for an empty input (0! = 1)', () => {
    const output = generatePermutations('')
    expect(output).toEqual([[]])
  })

  it('returns a single-token permutation for a length-1 input (1! = 1)', () => {
    const output = generatePermutations('A')
    expect(output.length).toBe(1)
    expect(output[0]).toEqual([{ char: 'A', sourceIndex: 0 }])
  })

  it('generates exactly n! permutations for lengths 2, 3, 5', () => {
    expect(generatePermutations('AB').length).toBe(2)
    expect(generatePermutations('ABC').length).toBe(6)
    expect(generatePermutations('ABCDE').length).toBe(120)
  })

  it('renderPermutation concatenates tokens in order', () => {
    const tokens: PermutationToken[] = [
      { char: 'H', sourceIndex: 1 },
      { char: 'Y', sourceIndex: 0 },
      { char: 'H', sourceIndex: 3 },
      { char: 'V', sourceIndex: 2 },
    ]
    expect(renderPermutation(tokens)).toBe('HYHV')
  })
})

