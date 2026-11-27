import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DECIMAL,
  GRID,
  clampSquares,
  decimalChallenges,
  decimalText,
  decimalTwoPlaces,
  fractionText,
  fromDigits,
  hundredthsOf,
  isDecimalSolved,
  percentText,
  placeWords,
  simplestFraction,
  tenthsOf,
} from './decimals'
import { TIERS, challengesForTier } from './challenges'

describe('forms of the same amount', () => {
  it('decimals', () => {
    expect(decimalText(42)).toBe('0.42')
    expect(decimalText(50)).toBe('0.5')
    expect(decimalText(7)).toBe('0.07')
    expect(decimalText(100)).toBe('1')
    expect(decimalText(0)).toBe('0')
    expect(decimalText(10)).toBe('0.1')
    expect(decimalTwoPlaces(50)).toBe('0.50')
  })
  it('percent', () => {
    expect(percentText(42)).toBe('42%')
    expect(percentText(100)).toBe('100%')
  })
  it('fractions in lowest terms', () => {
    expect(simplestFraction(42)).toEqual({ num: 21, den: 50 })
    expect(simplestFraction(75)).toEqual({ num: 3, den: 4 })
    expect(simplestFraction(35)).toEqual({ num: 7, den: 20 })
    expect(simplestFraction(50)).toEqual({ num: 1, den: 2 })
    expect(simplestFraction(7)).toEqual({ num: 7, den: 100 })
    expect(fractionText(100)).toBe('1')
    expect(fractionText(0)).toBe('0')
    expect(fractionText(25)).toBe('1/4')
  })
  it('every amount agrees across the three forms', () => {
    for (let n = 0; n <= GRID; n++) {
      const { num, den } = simplestFraction(n)
      expect(num / den, String(n)).toBeCloseTo(n / 100, 12)
      expect(Number(decimalText(n)), String(n)).toBeCloseTo(n / 100, 12)
      expect(Number.parseInt(percentText(n), 10)).toBe(n)
    }
  })
  it('place words', () => {
    expect(placeWords(42)).toBe('4 tenths and 2 hundredths')
    expect(placeWords(30)).toBe('3 tenths')
    expect(placeWords(7)).toBe('7 hundredths')
    expect(placeWords(11)).toBe('1 tenth and 1 hundredth')
    expect(placeWords(100)).toBe('1 whole')
    expect(placeWords(0)).toBe('nothing shaded')
  })
  it('tenths and hundredths digits', () => {
    expect([tenthsOf(42), hundredthsOf(42)]).toEqual([4, 2])
    expect(fromDigits(4, 2)).toBe(42)
    expect(fromDigits(10, 5)).toBe(100) // a whole has no extra hundredths
    expect(clampSquares(-3)).toBe(0)
    expect(clampSquares(250)).toBe(100)
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(decimalChallenges.map((c) => c.id)).toEqual([
      'd-dec-0-5', 'd-pct-25', 'd-frac-3-10', 'd-dec-0-07',
      'd-dec-0-35', 'd-pct-85', 'd-frac-3-4', 'd-between-0-4-0-5',
      'd-between-0-7-3-4', 'd-between-3-8-0-4', 'd-frac-7-20', 'd-whole-1',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(decimalChallenges, t)).toHaveLength(4)
    expect(new Set(decimalChallenges.map((c) => c.id)).size).toBe(decimalChallenges.length)
  })
  it('every challenge can be solved by some number of squares', () => {
    for (const c of decimalChallenges) {
      const hits = Array.from({ length: GRID + 1 }, (_, n) => n).filter((n) => isDecimalSolved(c, { squares: n }))
      expect(hits.length, c.id).toBeGreaterThan(0)
    }
  })
  it('exact rules need exactly that many squares', () => {
    const c = decimalChallenges.find((x) => x.id === 'd-pct-25')!
    expect(isDecimalSolved(c, { squares: 25 })).toBe(true)
    expect(isDecimalSolved(c, { squares: 24 })).toBe(false)
  })
  it('between rules exclude both ends', () => {
    const c = decimalChallenges.find((x) => x.id === 'd-between-0-4-0-5')!
    expect([40, 41, 49, 50].map((n) => isDecimalSolved(c, { squares: n }))).toEqual([false, true, true, false])
    const hard = decimalChallenges.find((x) => x.id === 'd-between-0-7-3-4')!
    expect([70, 71, 74, 75].map((n) => isDecimalSolved(hard, { squares: n }))).toEqual([false, true, true, false])
  })
  it('between rules with a fractional bound (3/8 is 37.5 squares)', () => {
    const c = decimalChallenges.find((x) => x.id === 'd-between-3-8-0-4')!
    const hits = Array.from({ length: 101 }, (_, n) => n).filter((n) => isDecimalSolved(c, { squares: n }))
    expect(hits).toEqual([38, 39])
  })
  it('the same amount solves different challenges (35 is 0.35 and 7/20)', () => {
    expect(isDecimalSolved(decimalChallenges.find((x) => x.id === 'd-dec-0-35')!, { squares: 35 })).toBe(true)
    expect(isDecimalSolved(decimalChallenges.find((x) => x.id === 'd-frac-7-20')!, { squares: 35 })).toBe(true)
  })
  it('the default does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(decimalChallenges, t)[0]
      expect(isDecimalSolved(first, DEFAULT_DECIMAL), first.id).toBe(false)
    }
  })
})
