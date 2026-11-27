import { describe, expect, it } from 'vitest'
import {
  DEFAULT_DIVISION,
  DIVISOR_MAX,
  DIVISOR_MIN,
  TOTAL_MAX,
  TOTAL_MIN,
  checkSentence,
  describe as describeDivision,
  divisionChallenges,
  equation,
  isDivisionSolved,
  layoutOf,
  quotientOf,
  remainderOf,
  type DivisionState,
} from './division'
import { TIERS, challengesForTier } from './challenges'

const s = (mode: DivisionState['mode'], total: number, divisor: number): DivisionState => ({ mode, total, divisor })

describe('division maths', () => {
  it('quotient and remainder', () => {
    expect(quotientOf(20, 3)).toBe(6)
    expect(remainderOf(20, 3)).toBe(2)
    expect(remainderOf(12, 4)).toBe(0)
    expect(quotientOf(2, 5)).toBe(0)
  })
  it('sharing: divisor groups, quotient in each', () => {
    expect(layoutOf(s('share', 13, 4))).toEqual({ groups: 4, perGroup: 3, leftOver: 1 })
  })
  it('grouping: quotient groups of divisor', () => {
    expect(layoutOf(s('group', 17, 5))).toEqual({ groups: 3, perGroup: 5, leftOver: 2 })
  })
  it('cubes drawn plus left over always equal the total', () => {
    for (const mode of ['share', 'group'] as const)
      for (let total = TOTAL_MIN; total <= TOTAL_MAX; total++)
        for (let d = DIVISOR_MIN; d <= DIVISOR_MAX; d++) {
          const { groups, perGroup, leftOver } = layoutOf(s(mode, total, d))
          expect(groups * perGroup + leftOver).toBe(total)
          expect(leftOver).toBeLessThan(d)
        }
  })
  it('writes the equation and the multiplication check', () => {
    expect(equation(s('share', 20, 3))).toBe('20 ÷ 3 = 6 r 2')
    expect(equation(s('share', 12, 4))).toBe('12 ÷ 4 = 3')
    expect(checkSentence(s('share', 20, 3))).toBe('6 × 3 + 2 = 20')
    expect(checkSentence(s('group', 12, 4))).toBe('3 × 4 = 12')
  })
  it('describes what the cubes show, including too few cubes', () => {
    expect(describeDivision(s('share', 13, 4))).toBe('13 cubes shared into 4 groups: 3 in each, 1 left over')
    expect(describeDivision(s('group', 15, 5))).toBe('15 cubes in groups of 5: 3 groups, none left over')
    expect(describeDivision(s('group', 15, 15 - 5))).toContain('1 group')
    expect(describeDivision(s('share', 2, 5))).toContain('cannot give each of 5 groups even one')
    expect(describeDivision(s('group', 3, 5))).toContain('cannot make a group of 5')
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(divisionChallenges.map((c) => c.id)).toEqual([
      'd-share-12-3', 'd-group-15-5', 'd-share-10-2', 'd-group-8-4',
      'd-share-13-4', 'd-result-group-5-3-2', 'd-none-share-6', 'd-result-share-3-4-1',
      'd-share-47-6', 'd-result-group-8-5-7', 'd-rem-9-8', 'd-none-group-7',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(divisionChallenges, t)).toHaveLength(4)
    expect(new Set(divisionChallenges.map((c) => c.id)).size).toBe(divisionChallenges.length)
  })
  it('every challenge can be solved inside the limits', () => {
    for (const c of divisionChallenges) {
      let found = false
      for (const mode of ['share', 'group'] as const)
        for (let total = TOTAL_MIN; total <= TOTAL_MAX && !found; total++)
          for (let d = DIVISOR_MIN; d <= DIVISOR_MAX && !found; d++)
            if (isDivisionSolved(c, s(mode, total, d))) found = true
      expect(found, c.id).toBe(true)
    }
  })
  it('exact rules need the mode, total and divisor', () => {
    const c = divisionChallenges.find((x) => x.id === 'd-share-13-4')!
    expect(isDivisionSolved(c, s('share', 13, 4))).toBe(true)
    expect(isDivisionSolved(c, s('group', 13, 4))).toBe(false)
    expect(isDivisionSolved(c, s('share', 13, 3))).toBe(false)
  })
  it('result rules accept any total with that quotient and remainder', () => {
    const c = divisionChallenges.find((x) => x.id === 'd-result-group-5-3-2')!
    expect(isDivisionSolved(c, s('group', 17, 5))).toBe(true)
    expect(isDivisionSolved(c, s('group', 15, 5))).toBe(false)
    expect(isDivisionSolved(c, s('share', 17, 5))).toBe(false)
  })
  it('no-remainder rules need at least one full group', () => {
    const c = divisionChallenges.find((x) => x.id === 'd-none-share-6')!
    expect(isDivisionSolved(c, s('share', 18, 6))).toBe(true)
    expect(isDivisionSolved(c, s('share', 5, 6))).toBe(false) // 0 r 5
    expect(isDivisionSolved(c, s('share', 13, 6))).toBe(false)
  })
  it('remainder rules work in either mode', () => {
    const c = divisionChallenges.find((x) => x.id === 'd-rem-9-8')!
    expect(isDivisionSolved(c, s('share', 26, 9))).toBe(true)
    expect(isDivisionSolved(c, s('group', 17, 9))).toBe(true)
    expect(isDivisionSolved(c, s('group', 8, 9))).toBe(false) // no full group yet
    expect(isDivisionSolved(c, s('group', 18, 9))).toBe(false)
  })
  it('the default state does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(divisionChallenges, t)[0]
      expect(isDivisionSolved(first, DEFAULT_DIVISION), first.id).toBe(false)
    }
  })
})
