import { describe, expect, it } from 'vitest'
import {
  BAR_COUNT,
  DEFAULT_GRAPH,
  VALUE_MAX,
  VALUE_MIN,
  clampValue,
  formatStat,
  getTopic,
  graphChallenges,
  isGraphSolved,
  meanOf,
  medianOf,
  modeOf,
  rangeOf,
  tallestIndex,
  topics,
  totalOf,
  type GraphState,
} from './dataGraphs'
import { TIERS, challengesForTier } from './challenges'

const g = (...values: number[]): GraphState => ({ topic: 'fruit', values })

describe('statistics', () => {
  it('total, mean, range', () => {
    expect(totalOf([3, 5, 2, 4, 6])).toBe(20)
    expect(meanOf([3, 5, 2, 4, 6])).toBe(4)
    expect(meanOf([1, 2, 2, 3, 4])).toBeCloseTo(2.4, 10)
    expect(rangeOf([3, 5, 2, 4, 6])).toBe(4)
    expect(rangeOf([4, 4, 4, 4, 4])).toBe(0)
  })
  it('median of an odd number of values is the middle one, in order', () => {
    expect(medianOf([3, 5, 2, 4, 6])).toBe(4)
    expect(medianOf([9, 1, 5, 7, 3])).toBe(5)
    expect(medianOf([0, 0, 0, 10, 10])).toBe(0)
  })
  it('median of an even number of values averages the middle two', () => {
    expect(medianOf([1, 2, 3, 4])).toBe(2.5)
  })
  it('mode: one value that appears most, more than once', () => {
    expect(modeOf([3, 3, 1, 5, 2])).toBe(3)
    expect(modeOf([1, 2, 3, 4, 5])).toBeNull() // all different
    expect(modeOf([2, 2, 3, 3, 5])).toBeNull() // two modes
    expect(modeOf([4, 4, 4, 1, 1])).toBe(4)
  })
  it('tallest bar, only when it is on its own', () => {
    expect(tallestIndex([3, 5, 2, 4, 6])).toBe(4)
    expect(tallestIndex([6, 6, 1, 2, 3])).toBeNull()
  })
  it('formats statistics without trailing zeros', () => {
    expect(formatStat(4)).toBe('4')
    expect(formatStat(2.4)).toBe('2.4')
    expect(formatStat(2.3333333)).toBe('2.33')
  })
  it('clamps counts to 0–10', () => {
    expect([clampValue(-2), clampValue(4.9), clampValue(44)]).toEqual([VALUE_MIN, 4, VALUE_MAX])
  })
})

describe('topics', () => {
  it('each has five categories and a question', () => {
    for (const t of topics) {
      expect(t.categories).toHaveLength(BAR_COUNT)
      expect(t.question.length).toBeGreaterThan(3)
    }
    expect(getTopic('pets').categories[0]).toBe('Dog')
    expect(getTopic('nope' as never).id).toBe('fruit')
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(graphChallenges.map((c) => c.id)).toEqual([
      'g-total-10', 'g-tallest-1', 'g-mean-3', 'g-all-equal',
      'g-median-6', 'g-range-5', 'g-mode-3', 'g-tied-2-4',
      'g-mean-6-median-4', 'g-range-9-mean-5', 'g-median-above-mean', 'g-total-23-mode-4',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(graphChallenges, t)).toHaveLength(4)
    expect(new Set(graphChallenges.map((c) => c.id)).size).toBe(graphChallenges.length)
  })

  // A known solution for every challenge (the search space, 11^5, is too big to brute-force in a unit test).
  const solutions: Record<string, number[]> = {
    'g-total-10': [2, 2, 2, 2, 2],
    'g-tallest-1': [9, 1, 2, 3, 4],
    'g-mean-3': [3, 3, 3, 3, 3],
    'g-all-equal': [7, 7, 7, 7, 7],
    'g-median-6': [2, 4, 6, 8, 10],
    'g-range-5': [1, 2, 3, 4, 6],
    'g-mode-3': [3, 3, 1, 5, 2],
    'g-tied-2-4': [1, 9, 2, 9, 3],
    'g-mean-6-median-4': [4, 4, 4, 9, 9],
    'g-range-9-mean-5': [0, 9, 5, 5, 6],
    'g-median-above-mean': [1, 2, 8, 9, 10],
    'g-total-23-mode-4': [4, 4, 1, 6, 8],
  }
  it('has a known solution for every challenge, and each is accepted', () => {
    expect(Object.keys(solutions).sort()).toEqual(graphChallenges.map((c) => c.id).sort())
    for (const c of graphChallenges) expect(isGraphSolved(c, g(...solutions[c.id])), c.id).toBe(true)
  })
  it('rejects near misses', () => {
    const by = Object.fromEntries(graphChallenges.map((c) => [c.id, c]))
    expect(isGraphSolved(by['g-tallest-1'], g(9, 9, 2, 3, 4))).toBe(false) // tied, not on its own
    expect(isGraphSolved(by['g-all-equal'], g(0, 0, 0, 0, 0))).toBe(false) // zero does not count
    expect(isGraphSolved(by['g-mode-3'], g(3, 3, 5, 5, 2))).toBe(false) // two modes
    expect(isGraphSolved(by['g-tied-2-4'], g(1, 9, 2, 8, 3))).toBe(false)
    expect(isGraphSolved(by['g-mean-6-median-4'], g(6, 6, 6, 6, 6))).toBe(false) // mean 6 but median 6
    expect(isGraphSolved(by['g-median-above-mean'], g(3, 3, 3, 3, 3))).toBe(false) // equal, not above
    expect(isGraphSolved(by['g-total-23-mode-4'], g(4, 4, 4, 4, 7))).toBe(true) // 4 four times and total 23 is fine
    expect(isGraphSolved(by['g-total-23-mode-4'], g(4, 4, 4, 4, 8))).toBe(false) // total 24
  })
  it('the default graph does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(graphChallenges, t)[0]
      expect(isGraphSolved(first, DEFAULT_GRAPH), first.id).toBe(false)
    }
  })
})
