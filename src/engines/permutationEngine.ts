export type PermutationToken = { char: string; sourceIndex: number }

export function generatePermutations(input: string): PermutationToken[][] {
  const tokens: PermutationToken[] = Array.from(input, (char, sourceIndex) => ({
    char,
    sourceIndex,
  }))

  const n = tokens.length
  const results: PermutationToken[][] = []

  if (n === 0) {
    results.push([])
    return results
  }

  const working = tokens.slice()
  results.push(working.slice())

  const c = new Array<number>(n).fill(0)
  let i = 0
  while (i < n) {
    if (c[i] < i) {
      const swapIndex = i % 2 === 0 ? 0 : c[i]
      const tmp = working[swapIndex]
      working[swapIndex] = working[i]
      working[i] = tmp
      results.push(working.slice())
      c[i] += 1
      i = 0
    } else {
      c[i] = 0
      i += 1
    }
  }

  return results
}

export function renderPermutation(tokens: PermutationToken[]): string {
  return tokens.map((t) => t.char).join('')
}
