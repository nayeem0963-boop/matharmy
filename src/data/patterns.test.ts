import { describe, expect, it } from 'vitest'
import {
  DEFAULT_PATTERN,
  START_MAX,
  START_MIN,
  STEP_RANGE,
  TERMS_SHOWN,
  clampStep,
  isPatternSolved,
  nthTermRule,
  patternChallenges,
  ruleSentence,
  termAt,
  termWorking,
  termsOf,
  type PatternKind,
  type PatternState,
} from './patterns'
import { TIERS, challengesForTier } from './challenges'

const p = (kind: PatternKind, start: number, step: number): PatternState => ({ kind, start, step })

describe('terms', () => {
  it('adding', () => {
    expect(termsOf(p('add', 3, 4))).toEqual([3, 7, 11, 15, 19, 23])
    expect(termAt(p('add', 3, 4), 10)).toBe(39)
  })
  it('multiplying', () => {
    expect(termsOf(p('multiply', 3, 2))).toEqual([3, 6, 12, 24, 48, 96])
    expect(termAt(p('multiply', 2, 5), 4)).toBe(250)
  })
  it('shows six terms by default and the first term is the start', () => {
    expect(termsOf(p('add', 1, 1))).toHaveLength(TERMS_SHOWN)
    expect(termAt(p('multiply', 7, 3), 1)).toBe(7)
  })
  it('stays exact at the largest term that can be looked up', () => {
    expect(Number.isSafeInteger(termAt(p('multiply', START_MAX, 5), 12))).toBe(true)
  })
  it('clamps the step to the kind’s range', () => {
    expect(clampStep('add', 0)).toBe(1)
    expect(clampStep('add', 99)).toBe(10)
    expect(clampStep('multiply', 1)).toBe(2)
    expect(clampStep('multiply', 9)).toBe(5)
    expect(STEP_RANGE.multiply.min).toBe(2) // multiplying by 1 is not a pattern
  })
  it('explains the rule in words and symbols', () => {
    expect(ruleSentence(p('add', 3, 4))).toBe('Start at 3, add 4 each time')
    expect(ruleSentence(p('multiply', 3, 2))).toBe('Start at 3, multiply by 2 each time')
    expect(nthTermRule(p('add', 3, 4))).toBe('3 + 4 × (n − 1)')
    expect(nthTermRule(p('multiply', 3, 2))).toBe('3 × 2^(n − 1)')
    expect(termWorking(p('add', 3, 4), 10)).toBe('3 + 4 × 9 = 39')
    expect(termWorking(p('multiply', 3, 2), 4)).toBe('3 × 2^3 = 24')
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(patternChallenges.map((c) => c.id)).toEqual([
      'p-add-2-3', 'p-add-5-5', 'p-term-3-10', 'p-mul-1-2',
      'p-term-4-13', 'p-mul-3-2', 'p-contains-20-28', 'p-term-6-31',
      'p-term-4-54-mul', 'p-term-10-50', 'p-mul-2-5', 'p-contains-28-49',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(patternChallenges, t)).toHaveLength(4)
    expect(new Set(patternChallenges.map((c) => c.id)).size).toBe(patternChallenges.length)
  })
  it('every challenge can be solved inside the limits', () => {
    for (const c of patternChallenges) {
      let found = false
      for (const kind of ['add', 'multiply'] as const)
        for (let s = START_MIN; s <= START_MAX && !found; s++)
          for (let k = STEP_RANGE[kind].min; k <= STEP_RANGE[kind].max && !found; k++)
            if (isPatternSolved(c, p(kind, s, k))) found = true
      expect(found, c.id).toBe(true)
    }
  })
  it('exact rules need the kind, start and step', () => {
    const c = patternChallenges.find((x) => x.id === 'p-add-2-3')!
    expect(isPatternSolved(c, p('add', 2, 3))).toBe(true)
    expect(isPatternSolved(c, p('add', 3, 2))).toBe(false)
    expect(isPatternSolved(c, p('multiply', 2, 3))).toBe(false)
  })
  it('term rules: any kind, or a specific kind', () => {
    const any = patternChallenges.find((x) => x.id === 'p-term-3-10')!
    expect(isPatternSolved(any, p('add', 4, 3))).toBe(true) // 4, 7, 10
    expect(isPatternSolved(any, p('add', 2, 4))).toBe(true) // 2, 6, 10
    expect(isPatternSolved(any, p('add', 3, 3))).toBe(false)
    const mul = patternChallenges.find((x) => x.id === 'p-term-4-54-mul')!
    expect(isPatternSolved(mul, p('multiply', 2, 3))).toBe(true) // 2, 6, 18, 54
    expect(isPatternSolved(mul, p('add', 15, 13))).toBe(false) // out of range, and wrong kind
    expect(isPatternSolved(mul, p('multiply', 3, 3))).toBe(false)
  })
  it('contains rules look at the terms shown only', () => {
    const c = patternChallenges.find((x) => x.id === 'p-contains-28-49')!
    expect(isPatternSolved(c, p('add', 14, 7))).toBe(true) // 14 21 28 35 42 49
    expect(isPatternSolved(c, p('add', 7, 7))).toBe(false) // 49 is the 7th term
    const easy = patternChallenges.find((x) => x.id === 'p-contains-20-28')!
    expect(isPatternSolved(easy, p('add', 8, 4))).toBe(true) // 8 12 16 20 24 28
    expect(isPatternSolved(easy, p('add', 4, 4))).toBe(false) // 28 would be the 7th term
    expect(isPatternSolved(easy, p('multiply', 5, 2))).toBe(false)
  })
  it('the default pattern does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(patternChallenges, t)[0]
      expect(isPatternSolved(first, DEFAULT_PATTERN), first.id).toBe(false)
    }
  })
})
