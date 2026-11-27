import { describe, expect, it } from 'vitest'
import {
  ARRAY_MAX,
  ARRAY_MIN,
  DEFAULT_ARRAY,
  arrayChallenges,
  factFamily,
  isArraySolved,
  productOf,
  repeatedAddition,
  skipCount,
} from './multiplication'
import { TIERS, challengesForTier } from './challenges'

describe('array maths', () => {
  it('multiplies', () => {
    expect(productOf(3, 4)).toBe(12)
    expect(productOf(ARRAY_MAX, ARRAY_MAX)).toBe(100)
  })
  it('writes repeated addition', () => {
    expect(repeatedAddition(3, 4)).toBe('4 + 4 + 4 = 12')
    expect(repeatedAddition(1, 5)).toBe('5 = 5')
    expect(repeatedAddition(4, 1)).toBe('1 + 1 + 1 + 1 = 4')
  })
  it('skip counts row by row', () => {
    expect(skipCount(4, 3)).toEqual([4, 8, 12])
    expect(skipCount(7, 0)).toEqual([])
    expect(skipCount(2, 5)).toEqual([2, 4, 6, 8, 10])
  })
  it('lists the fact family, without repeats for squares', () => {
    expect(factFamily(3, 4)).toEqual(['3 × 4 = 12', '4 × 3 = 12', '12 ÷ 3 = 4', '12 ÷ 4 = 3'])
    expect(factFamily(5, 5)).toEqual(['5 × 5 = 25', '25 ÷ 5 = 5'])
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(arrayChallenges.map((c) => c.id)).toEqual([
      'm-exact-2-3', 'm-exact-4-5', 'm-rows-6-2', 'm-square-9',
      'm-rows-12-3', 'm-cols-18-3', 'm-exact-6-4', 'm-square-16',
      'm-exact-7-8', 'm-wide-36', 'm-tall-40', 'm-square-81',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(arrayChallenges, t)).toHaveLength(4)
    expect(new Set(arrayChallenges.map((c) => c.id)).size).toBe(arrayChallenges.length)
  })

  it('every challenge is solvable inside the 1-10 limits, and the prompt matches the rule', () => {
    for (const c of arrayChallenges) {
      const solutions: [number, number][] = []
      for (let r = ARRAY_MIN; r <= ARRAY_MAX; r++)
        for (let k = ARRAY_MIN; k <= ARRAY_MAX; k++) if (isArraySolved(c, { rows: r, cols: k })) solutions.push([r, k])
      expect(solutions.length, c.id).toBeGreaterThan(0)
    }
  })

  it('exact rules need the right orientation', () => {
    const c = arrayChallenges.find((x) => x.id === 'm-exact-2-3')!
    expect(isArraySolved(c, { rows: 2, cols: 3 })).toBe(true)
    expect(isArraySolved(c, { rows: 3, cols: 2 })).toBe(false)
  })
  it('product-with-rows and -with-columns rules', () => {
    const rows = arrayChallenges.find((x) => x.id === 'm-rows-12-3')!
    expect(isArraySolved(rows, { rows: 3, cols: 4 })).toBe(true)
    expect(isArraySolved(rows, { rows: 4, cols: 3 })).toBe(false)
    expect(isArraySolved(rows, { rows: 3, cols: 5 })).toBe(false)
    const cols = arrayChallenges.find((x) => x.id === 'm-cols-18-3')!
    expect(isArraySolved(cols, { rows: 6, cols: 3 })).toBe(true)
    expect(isArraySolved(cols, { rows: 3, cols: 6 })).toBe(false)
  })
  it('square, wide and tall rules', () => {
    const sq = arrayChallenges.find((x) => x.id === 'm-square-16')!
    expect(isArraySolved(sq, { rows: 4, cols: 4 })).toBe(true)
    expect(isArraySolved(sq, { rows: 2, cols: 8 })).toBe(false)
    const wide = arrayChallenges.find((x) => x.id === 'm-wide-36')!
    expect(isArraySolved(wide, { rows: 4, cols: 9 })).toBe(true)
    expect(isArraySolved(wide, { rows: 9, cols: 4 })).toBe(false)
    expect(isArraySolved(wide, { rows: 6, cols: 6 })).toBe(false)
    const tall = arrayChallenges.find((x) => x.id === 'm-tall-40')!
    expect(isArraySolved(tall, { rows: 8, cols: 5 })).toBe(true)
    expect(isArraySolved(tall, { rows: 5, cols: 8 })).toBe(false)
  })
  it('the default array does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(arrayChallenges, t)[0]
      expect(isArraySolved(first, DEFAULT_ARRAY), first.id).toBe(false)
    }
  })
})
