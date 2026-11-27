import { describe, expect, it } from 'vitest'
import {
  COLOURS,
  DEFAULT_SPINNER,
  SECTOR_MAX,
  colourOfSector,
  isSpinnerSolved,
  likelihoodOf,
  percentText,
  probabilityFraction,
  probabilityOf,
  randomAt,
  sectorOfSpin,
  spinnerChallenges,
  tallyOf,
  theoryText,
  totalSectors,
  type SpinnerState,
} from './probability'
import { TIERS, challengesForTier } from './challenges'

const wheel = (red: number, blue: number, green: number, spins = 0): SpinnerState => ({ red, blue, green, spins })

describe('the seeded random stream', () => {
  it('is deterministic', () => {
    expect(randomAt(123, 7)).toBe(randomAt(123, 7))
    expect(randomAt(123, 7)).not.toBe(randomAt(123, 8))
    expect(randomAt(123, 7)).not.toBe(randomAt(124, 7))
  })
  it('stays in [0, 1)', () => {
    for (let k = 0; k < 5000; k++) {
      const u = randomAt(987654321, k)
      expect(u).toBeGreaterThanOrEqual(0)
      expect(u).toBeLessThan(1)
    }
  })
  it('is spread evenly: ten equal buckets each hold about a tenth of 20,000 values', () => {
    const buckets = new Array(10).fill(0)
    for (let k = 0; k < 20000; k++) buckets[Math.floor(randomAt(42, k) * 10)]++
    for (const b of buckets) expect(Math.abs(b / 20000 - 0.1)).toBeLessThan(0.012)
  })
  it('spin k does not depend on the spins before it (replayable)', () => {
    const w = wheel(2, 3, 1)
    expect(sectorOfSpin(99, 500, w)).toBe(sectorOfSpin(99, 500, w))
    expect(tallyOf(99, 100, w).red + tallyOf(99, 100, w).blue + tallyOf(99, 100, w).green).toBe(100)
  })
})

describe('the wheel', () => {
  it('sectors are numbered reds first, then blues, then greens', () => {
    const w = wheel(2, 1, 3)
    expect([0, 1, 2, 3, 4, 5].map((i) => colourOfSector(i, w))).toEqual(['red', 'red', 'blue', 'green', 'green', 'green'])
    expect(totalSectors(w)).toBe(6)
  })
  it('an empty wheel has no spins', () => {
    expect(sectorOfSpin(1, 0, wheel(0, 0, 0))).toBeNull()
    expect(tallyOf(1, 50, wheel(0, 0, 0))).toEqual({ red: 0, blue: 0, green: 0 })
  })
  it('a spin never lands on a colour with no sectors', () => {
    const t = tallyOf(7, 2000, wheel(3, 0, 2))
    expect(t.blue).toBe(0)
    expect(t.red + t.green).toBe(2000)
  })
  it('a wheel of one colour always lands on it', () => {
    expect(tallyOf(7, 500, wheel(0, 4, 0))).toEqual({ red: 0, blue: 500, green: 0 })
  })
  it('the tally always adds up to the number of spins', () => {
    for (const w of [wheel(1, 1, 1), wheel(6, 0, 1), wheel(2, 5, 3)]) {
      const t = tallyOf(31, 777, w)
      expect(t.red + t.blue + t.green).toBe(777)
    }
  })
  it('a longer run extends a shorter one (the first spins stay the same)', () => {
    const w = wheel(2, 2, 2)
    const short = tallyOf(5, 100, w)
    const long = tallyOf(5, 101, w)
    const extra = (Object.keys(short) as (keyof typeof short)[]).filter((c) => long[c] !== short[c])
    expect(extra).toHaveLength(1)
    expect(long[extra[0]]).toBe(short[extra[0]] + 1)
  })
  it('the long-run share is close to the theory (5,000 spins within 3 points)', () => {
    for (const [seed, w] of [[1, wheel(2, 2, 2)], [2, wheel(1, 3, 0)], [3, wheel(3, 2, 1)]] as const) {
      const t = tallyOf(seed, 5000, w)
      for (const c of COLOURS) expect(Math.abs(t[c] / 5000 - probabilityOf(c, w)), `${seed} ${c}`).toBeLessThan(0.03)
    }
  })
})

describe('theory', () => {
  it('fractions in lowest terms', () => {
    expect(probabilityFraction('red', wheel(2, 2, 2))).toBe('1/3')
    expect(probabilityFraction('blue', wheel(3, 3, 0))).toBe('1/2')
    expect(probabilityFraction('green', wheel(3, 3, 0))).toBe('0')
    expect(probabilityFraction('red', wheel(4, 0, 0))).toBe('1')
    expect(probabilityFraction('red', wheel(0, 0, 0))).toBe('—')
    expect(probabilityFraction('green', wheel(2, 3, 3))).toBe('3/8')
  })
  it('the three probabilities add up to 1', () => {
    for (let r = 0; r <= SECTOR_MAX; r++)
      for (let b = 0; b <= SECTOR_MAX; b++)
        for (let g = 0; g <= SECTOR_MAX; g++) {
          if (r + b + g === 0) continue
          const w = wheel(r, b, g)
          expect(COLOURS.reduce((sum, c) => sum + probabilityOf(c, w), 0)).toBeCloseTo(1, 12)
        }
  })
  it('percentages and words', () => {
    expect(percentText(1 / 3)).toBe('33.3%')
    expect(percentText(0.5)).toBe('50%')
    expect(percentText(1)).toBe('100%')
    expect(percentText(0)).toBe('0%')
    expect([0, 0.2, 0.5, 0.75, 1].map(likelihoodOf)).toEqual(['impossible', 'unlikely', 'even chance', 'likely', 'certain'])
  })
  it('theory text', () => {
    expect(theoryText('red', wheel(3, 3, 0))).toBe('3 of 6 sectors: 1/2, 50%, even chance')
    expect(theoryText('green', wheel(3, 3, 0))).toBe('0 of 6 sectors: 0, 0%, impossible')
    expect(theoryText('red', wheel(0, 0, 0))).toBe('No sectors yet')
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(spinnerChallenges.map((c) => c.id)).toEqual([
      'pr-red-half', 'pr-green-impossible', 'pr-blue-certain', 'pr-all-equal',
      'pr-red-quarter', 'pr-order', 'pr-spin-50', 'pr-blue-two-thirds',
      'pr-green-3-8', 'pr-red-unlikely', 'pr-fair-100', 'pr-spin-300',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(spinnerChallenges, t)).toHaveLength(4)
    expect(new Set(spinnerChallenges.map((c) => c.id)).size).toBe(spinnerChallenges.length)
  })
  it('every challenge can be solved by some wheel and number of spins', () => {
    for (const c of spinnerChallenges) {
      let found = false
      for (let r = 0; r <= SECTOR_MAX && !found; r++)
        for (let b = 0; b <= SECTOR_MAX && !found; b++)
          for (let g = 0; g <= SECTOR_MAX && !found; g++) if (isSpinnerSolved(c, wheel(r, b, g, 300))) found = true
      expect(found, c.id).toBe(true)
    }
  })
  it('fraction rules accept every wheel that gives that fraction, and nothing else', () => {
    const half = spinnerChallenges.find((x) => x.id === 'pr-red-half')!
    for (const [r, b, g] of [[1, 1, 0], [2, 1, 1], [3, 3, 0], [3, 2, 1]]) expect(isSpinnerSolved(half, wheel(r, b, g))).toBe(true)
    expect(isSpinnerSolved(half, wheel(2, 2, 2))).toBe(false)
    expect(isSpinnerSolved(half, wheel(0, 0, 0))).toBe(false) // no sectors: no chance at all
    const threeEighths = spinnerChallenges.find((x) => x.id === 'pr-green-3-8')!
    expect(isSpinnerSolved(threeEighths, wheel(3, 2, 3))).toBe(true)
    expect(isSpinnerSolved(threeEighths, wheel(1, 2, 3))).toBe(false) // 3/6
    expect(isSpinnerSolved(threeEighths, wheel(6, 4, 6))).toBe(true) // 6/16
  })
  it('impossible and certain need at least one sector', () => {
    const imp = spinnerChallenges.find((x) => x.id === 'pr-green-impossible')!
    expect(isSpinnerSolved(imp, wheel(2, 2, 0))).toBe(true)
    expect(isSpinnerSolved(imp, wheel(0, 0, 0))).toBe(false)
    expect(isSpinnerSolved(imp, wheel(2, 2, 1))).toBe(false)
    const cert = spinnerChallenges.find((x) => x.id === 'pr-blue-certain')!
    expect(isSpinnerSolved(cert, wheel(0, 3, 0))).toBe(true)
    expect(isSpinnerSolved(cert, wheel(1, 3, 0))).toBe(false)
  })
  it('equal, ordered and fair rules', () => {
    const by = Object.fromEntries(spinnerChallenges.map((c) => [c.id, c]))
    expect(isSpinnerSolved(by['pr-all-equal'], wheel(2, 2, 2))).toBe(true)
    expect(isSpinnerSolved(by['pr-all-equal'], wheel(0, 0, 0))).toBe(false)
    expect(isSpinnerSolved(by['pr-order'], wheel(3, 2, 1))).toBe(true)
    expect(isSpinnerSolved(by['pr-order'], wheel(3, 3, 1))).toBe(false)
    expect(isSpinnerSolved(by['pr-order'], wheel(2, 1, 0))).toBe(true)
    expect(isSpinnerSolved(by['pr-red-unlikely'], wheel(1, 3, 2))).toBe(true)
    expect(isSpinnerSolved(by['pr-red-unlikely'], wheel(0, 3, 3))).toBe(false) // impossible, not unlikely
    expect(isSpinnerSolved(by['pr-red-unlikely'], wheel(3, 3, 0))).toBe(false) // even chance
  })
  it('spin challenges count spins; the fair-wheel challenge needs both parts', () => {
    const by = Object.fromEntries(spinnerChallenges.map((c) => [c.id, c]))
    expect(isSpinnerSolved(by['pr-spin-50'], wheel(2, 2, 2, 49))).toBe(false)
    expect(isSpinnerSolved(by['pr-spin-50'], wheel(2, 2, 2, 50))).toBe(true)
    expect(isSpinnerSolved(by['pr-fair-100'], wheel(3, 3, 0, 100))).toBe(true)
    expect(isSpinnerSolved(by['pr-fair-100'], wheel(3, 3, 0, 99))).toBe(false)
    expect(isSpinnerSolved(by['pr-fair-100'], wheel(3, 2, 0, 100))).toBe(false) // not fair
    expect(isSpinnerSolved(by['pr-fair-100'], wheel(3, 3, 1, 100))).toBe(false) // a third colour
  })
  it('the default wheel does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(spinnerChallenges, t)[0]
      expect(isSpinnerSolved(first, DEFAULT_SPINNER), first.id).toBe(false)
    }
  })
})
