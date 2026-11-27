import { describe, expect, it } from 'vitest'
import {
  PLACE_LIMITS,
  PLACES,
  REGROUP_KINDS,
  REGROUP_SPECS,
  applyRegroup,
  expandedForm,
  isNumberSenseSolved,
  numberSenseChallenges,
  numberToWords,
  placeValueTotal,
  regroupBlocker,
  type PlaceValueCounts,
} from './placeValue'

const counts = (hundreds: number, tens: number, ones: number): PlaceValueCounts => ({ hundreds, tens, ones })

describe('placeValueTotal', () => {
  it('adds hundreds, tens and ones by place value', () => {
    expect(placeValueTotal(counts(2, 4, 3))).toBe(243)
    expect(placeValueTotal(counts(0, 0, 0))).toBe(0)
    expect(placeValueTotal(counts(9, 19, 19))).toBe(1109)
  })

  it('treats non-standard (regrouped) forms as the same number', () => {
    expect(placeValueTotal(counts(0, 13, 0))).toBe(130)
    expect(placeValueTotal(counts(1, 3, 0))).toBe(130)
  })
})

describe('expandedForm', () => {
  it('omits zero parts', () => {
    expect(expandedForm(counts(3, 4, 5))).toBe('300 + 40 + 5')
    expect(expandedForm(counts(4, 0, 6))).toBe('400 + 6')
    expect(expandedForm(counts(0, 9, 0))).toBe('90')
  })
  it('shows 0 when empty', () => {
    expect(expandedForm(counts(0, 0, 0))).toBe('0')
  })
  it('keeps non-standard counts as given', () => {
    expect(expandedForm(counts(0, 12, 14))).toBe('120 + 14')
  })
})

describe('numberToWords', () => {
  it.each([
    [0, 'zero'],
    [7, 'seven'],
    [13, 'thirteen'],
    [20, 'twenty'],
    [21, 'twenty-one'],
    [58, 'fifty-eight'],
    [90, 'ninety'],
    [100, 'one hundred'],
    [101, 'one hundred one'],
    [119, 'one hundred nineteen'],
    [243, 'two hundred forty-three'],
    [406, 'four hundred six'],
    [719, 'seven hundred nineteen'],
    [1000, 'one thousand'],
    [1109, 'one thousand one hundred nine'],
  ])('%i -> %s', (n, words) => {
    expect(numberToWords(n)).toBe(words)
  })

  it('names every reachable total without gaps or undefined', () => {
    const max = placeValueTotal(counts(9, 19, 19))
    for (let n = 0; n <= max; n++) {
      const w = numberToWords(n)
      expect(w).toMatch(/^[a-z]+([ -][a-z]+)*$/)
    }
  })
})

describe('regrouping', () => {
  it('bundles 10 ones into 1 ten', () => {
    expect(applyRegroup(counts(0, 1, 12), 'ones-to-ten')).toEqual(counts(0, 2, 2))
  })
  it('breaks 1 ten into 10 ones', () => {
    expect(applyRegroup(counts(0, 2, 3), 'ten-to-ones')).toEqual(counts(0, 1, 13))
  })
  it('bundles 10 tens into 1 hundred', () => {
    expect(applyRegroup(counts(1, 10, 4), 'tens-to-hundred')).toEqual(counts(2, 0, 4))
  })
  it('breaks 1 hundred into 10 tens', () => {
    expect(applyRegroup(counts(2, 3, 4), 'hundred-to-tens')).toEqual(counts(1, 13, 4))
  })

  it('never changes the number being shown', () => {
    const starts = [counts(1, 12, 12), counts(3, 5, 15), counts(2, 10, 19), counts(5, 0, 0), counts(0, 19, 19)]
    for (const start of starts) {
      for (const kind of REGROUP_KINDS) {
        const next = applyRegroup(start, kind)
        if (next) expect(placeValueTotal(next)).toBe(placeValueTotal(start))
      }
    }
  })

  it('is blocked, with a reason, when there are not enough blocks', () => {
    expect(regroupBlocker(counts(0, 0, 9), 'ones-to-ten')).toBe('Needs at least 10 ones')
    expect(applyRegroup(counts(0, 0, 9), 'ones-to-ten')).toBeNull()
    expect(regroupBlocker(counts(0, 0, 0), 'hundred-to-tens')).toMatch(/Needs at least 1 hundreds/)
  })

  it('is blocked when the destination would exceed the mat limit', () => {
    expect(regroupBlocker(counts(0, 10, 12), 'ten-to-ones')).toMatch(/Too many ones/)
    expect(applyRegroup(counts(0, 10, 12), 'ten-to-ones')).toBeNull()
    expect(applyRegroup(counts(0, 19, 19), 'ones-to-ten')).toBeNull()
  })

  it('does not mutate its input', () => {
    const start = counts(1, 12, 12)
    const copy = { ...start }
    applyRegroup(start, 'ones-to-ten')
    expect(start).toEqual(copy)
  })

  it('every trade moves 10 groups (animation timing assumption)', () => {
    for (const kind of REGROUP_KINDS) {
      const s = REGROUP_SPECS[kind]
      expect(Math.max(s.fromBlocks, s.toBlocks)).toBe(10)
    }
  })
})

describe('Number Sense challenges', () => {
  it('have unique, stable-format ids and 4 per tier', () => {
    const ids = numberSenseChallenges.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
    ids.forEach((id) => expect(id).toMatch(/^n-\d+/))
    for (const tier of ['easy', 'medium', 'hard'] as const) {
      expect(numberSenseChallenges.filter((c) => c.tier === tier)).toHaveLength(4)
    }
  })

  it('keeps the saved-progress id list unchanged', () => {
    expect(numberSenseChallenges.map((c) => c.id)).toEqual([
      'n-243', 'n-58', 'n-719', 'n-90',
      'n-406', 'n-505', 'n-34-14', 'n-81-11',
      'n-130-0h', 'n-25-15', 'n-115-0h', 'n-162-16t',
    ])
  })

  it('each can be solved within the mat limits', () => {
    for (const ch of numberSenseChallenges) {
      let found = false
      for (let h = 0; h <= PLACE_LIMITS.hundreds && !found; h++)
        for (let t = 0; t <= PLACE_LIMITS.tens && !found; t++)
          for (let o = 0; o <= PLACE_LIMITS.ones && !found; o++)
            if (isNumberSenseSolved(ch, counts(h, t, o))) found = true
      expect(found, ch.id).toBe(true)
    }
  })

  it('requires the exact total', () => {
    const ch = numberSenseChallenges.find((c) => c.id === 'n-243')!
    expect(isNumberSenseSolved(ch, counts(2, 4, 3))).toBe(true)
    expect(isNumberSenseSolved(ch, counts(2, 4, 4))).toBe(false)
    expect(isNumberSenseSolved(ch, counts(2, 3, 13))).toBe(true) // regrouped form is still 243
  })

  it('enforces required block counts', () => {
    const ch = numberSenseChallenges.find((c) => c.id === 'n-34-14')!
    expect(isNumberSenseSolved(ch, counts(0, 2, 14))).toBe(true)
    expect(isNumberSenseSolved(ch, counts(0, 3, 4))).toBe(false) // right number, wrong build
    const noHundreds = numberSenseChallenges.find((c) => c.id === 'n-130-0h')!
    expect(isNumberSenseSolved(noHundreds, counts(0, 13, 0))).toBe(true)
    expect(isNumberSenseSolved(noHundreds, counts(1, 3, 0))).toBe(false)
  })

  it('PLACES covers the three places in order', () => {
    expect(PLACES).toEqual(['hundreds', 'tens', 'ones'])
  })
})
