import { describe, expect, it } from 'vitest'
import {
  DEFAULT_INT,
  LINE_MAX,
  LINE_MIN,
  OPERAND_MAX,
  OPERAND_MIN,
  absOf,
  bracketed,
  clampLine,
  clampOperand,
  compareText,
  compareWords,
  distanceBetween,
  expressionText,
  intChallenges,
  isIntSolved,
  modeOfChallenge,
  moveWords,
  oppositeOf,
  placeText,
  resultOf,
  signed,
  type IntOp,
  type IntState,
} from './integers'
import { TIERS, challengesForTier } from './challenges'

const line = (p: number, q: number): IntState => ({ ...DEFAULT_INT, mode: 'line', p, q })
const move = (a: number, op: IntOp, b: number): IntState => ({ ...DEFAULT_INT, mode: 'move', a, op, b })

describe('integer basics', () => {
  it('writes negatives with a real minus sign', () => {
    expect(signed(-7)).toBe('−7')
    expect(signed(4)).toBe('4')
    expect(signed(0)).toBe('0')
    expect(bracketed(-4)).toBe('(−4)')
    expect(bracketed(4)).toBe('4')
  })
  it('absolute value, opposite and distance', () => {
    expect(absOf(-7)).toBe(7)
    expect(oppositeOf(6)).toBe(-6)
    expect(oppositeOf(-6)).toBe(6)
    expect(oppositeOf(0)).toBe(0) // zero is its own opposite (and never "−0")
    expect(Object.is(oppositeOf(0), -0)).toBe(false)
    expect(distanceBetween(-3, 5)).toBe(8)
    expect(distanceBetween(5, -3)).toBe(8)
    expect(distanceBetween(2, 2)).toBe(0)
  })
  it('places a number relative to zero', () => {
    expect(placeText(-3)).toBe('3 units left of zero')
    expect(placeText(1)).toBe('1 unit right of zero')
    expect(placeText(0)).toBe('at zero')
  })
  it('compares', () => {
    expect(compareText(-3, 5)).toBe('−3 < 5')
    expect(compareText(5, -3)).toBe('5 > −3')
    expect(compareText(2, 2)).toBe('2 = 2')
    expect(compareWords(-3, 5)).toBe('−3 is to the left of 5, so it is less')
    expect(compareWords(-2, -6)).toBe('−2 is to the right of −6, so it is greater')
    expect(compareWords(1, 1)).toBe('Same place on the line')
  })
  it('clamps', () => {
    expect([clampLine(-99), clampLine(99), clampLine(3.4)]).toEqual([LINE_MIN, LINE_MAX, 3])
    expect([clampOperand(-9), clampOperand(9)]).toEqual([OPERAND_MIN, OPERAND_MAX])
  })
})

describe('add and subtract', () => {
  it('results', () => {
    expect(resultOf({ a: -2, op: 'add', b: 3 })).toBe(1)
    expect(resultOf({ a: 3, op: 'subtract', b: -4 })).toBe(7)
    expect(resultOf({ a: -4, op: 'subtract', b: 5 })).toBe(-9)
    expect(resultOf({ a: 3, op: 'add', b: -3 })).toBe(0)
  })
  it('subtracting a number equals adding its opposite, for every pair', () => {
    for (let a = OPERAND_MIN; a <= OPERAND_MAX; a++)
      for (let b = OPERAND_MIN; b <= OPERAND_MAX; b++)
        expect(resultOf({ a, op: 'subtract', b })).toBe(resultOf({ a, op: 'add', b: oppositeOf(b) }))
  })
  it('every result lands on the number line', () => {
    for (let a = OPERAND_MIN; a <= OPERAND_MAX; a++)
      for (let b = OPERAND_MIN; b <= OPERAND_MAX; b++)
        for (const op of ['add', 'subtract'] as const) {
          const r = resultOf({ a, op, b })
          expect(r).toBeGreaterThanOrEqual(LINE_MIN)
          expect(r).toBeLessThanOrEqual(LINE_MAX)
        }
  })
  it('working and words', () => {
    expect(expressionText({ a: -2, op: 'add', b: 3 })).toBe('−2 + 3 = 1')
    expect(expressionText({ a: 3, op: 'subtract', b: -4 })).toBe('3 − (−4) = 7')
    expect(expressionText({ a: -3, op: 'add', b: -5 })).toBe('−3 + (−5) = −8')
    expect(moveWords({ a: -2, op: 'add', b: 3 })).toBe('Start at −2. Move 3 right. You land on 1.')
    expect(moveWords({ a: 3, op: 'subtract', b: 4 })).toBe('Start at 3. Move 4 left. You land on −1.')
    expect(moveWords({ a: 3, op: 'subtract', b: -4 })).toContain('Move 4 right')
    expect(moveWords({ a: 3, op: 'subtract', b: -4 })).toContain('adding the opposite')
    expect(moveWords({ a: 2, op: 'add', b: 0 })).toBe('Start at 2. Move 0. You stay on 2.')
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(intChallenges.map((c) => c.id)).toEqual([
      'i-place-neg-7', 'i-opposite-6', 'i-order-neg', 'i-abs-5',
      'i-gap-7', 'i-result-neg3', 'i-from-neg3-to-1', 'i-sub-3-neg4',
      'i-sub-negative-9', 'i-add-negatives-8', 'i-sub-positive-9', 'i-zero-pair',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(intChallenges, t)).toHaveLength(4)
    expect(new Set(intChallenges.map((c) => c.id)).size).toBe(intChallenges.length)
  })
  it('number line challenges use the line view; the rest use add and subtract', () => {
    const modes = Object.fromEntries(intChallenges.map((c) => [c.id, modeOfChallenge(c)]))
    expect(modes['i-place-neg-7']).toBe('line')
    expect(modes['i-gap-7']).toBe('line')
    expect(modes['i-result-neg3']).toBe('move')
    expect(modes['i-zero-pair']).toBe('move')
  })
  it('every challenge can be solved inside the limits', () => {
    for (const c of intChallenges) {
      let found = false
      if (modeOfChallenge(c) === 'line') {
        for (let p = LINE_MIN; p <= LINE_MAX && !found; p++)
          for (let q = LINE_MIN; q <= LINE_MAX && !found; q++) if (isIntSolved(c, line(p, q))) found = true
      } else {
        for (let a = OPERAND_MIN; a <= OPERAND_MAX && !found; a++)
          for (let b = OPERAND_MIN; b <= OPERAND_MAX && !found; b++)
            for (const op of ['add', 'subtract'] as const) if (isIntSolved(c, move(a, op, b))) found = true
      }
      expect(found, c.id).toBe(true)
    }
  })
  it('line rules', () => {
    const by = Object.fromEntries(intChallenges.map((c) => [c.id, c]))
    expect(isIntSolved(by['i-place-neg-7'], line(-7, 0))).toBe(true)
    expect(isIntSolved(by['i-place-neg-7'], line(7, 0))).toBe(false)
    expect(isIntSolved(by['i-opposite-6'], line(6, -6))).toBe(true)
    expect(isIntSolved(by['i-opposite-6'], line(-6, 6))).toBe(false) // A must be on 6
    expect(isIntSolved(by['i-order-neg'], line(-2, -6))).toBe(true)
    expect(isIntSolved(by['i-order-neg'], line(-6, -2))).toBe(false)
    expect(isIntSolved(by['i-abs-5'], line(-5, 0))).toBe(true)
    expect(isIntSolved(by['i-abs-5'], line(5, 0))).toBe(true)
    expect(isIntSolved(by['i-gap-7'], line(-3, 4))).toBe(true)
    expect(isIntSolved(by['i-gap-7'], line(3, 10))).toBe(false) // 7 apart, but A is not below zero
  })
  it('add and subtract rules', () => {
    const by = Object.fromEntries(intChallenges.map((c) => [c.id, c]))
    expect(isIntSolved(by['i-from-neg3-to-1'], move(-3, 'add', 4))).toBe(true)
    expect(isIntSolved(by['i-from-neg3-to-1'], move(-3, 'subtract', -4))).toBe(true)
    expect(isIntSolved(by['i-from-neg3-to-1'], move(-2, 'add', 3))).toBe(false)
    expect(isIntSolved(by['i-sub-3-neg4'], move(3, 'subtract', -4))).toBe(true)
    expect(isIntSolved(by['i-sub-3-neg4'], move(3, 'add', 4))).toBe(false) // same answer, different expression
    expect(isIntSolved(by['i-sub-negative-9'], move(5, 'subtract', -4))).toBe(true)
    expect(isIntSolved(by['i-sub-negative-9'], move(5, 'add', 4))).toBe(false) // not a subtraction
    expect(isIntSolved(by['i-add-negatives-8'], move(-3, 'add', -5))).toBe(true)
    expect(isIntSolved(by['i-add-negatives-8'], move(-3, 'add', 5))).toBe(false)
    expect(isIntSolved(by['i-sub-positive-9'], move(-4, 'subtract', 5))).toBe(true)
    expect(isIntSolved(by['i-zero-pair'], move(3, 'add', -3))).toBe(true)
    expect(isIntSolved(by['i-zero-pair'], move(0, 'add', 0))).toBe(false) // zero is not a pair
    expect(isIntSolved(by['i-zero-pair'], move(3, 'subtract', 3))).toBe(false) // must be an addition
  })
  it('the default state does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(intChallenges, t)[0]
      expect(isIntSolved(first, DEFAULT_INT), first.id).toBe(false)
    }
  })
})
