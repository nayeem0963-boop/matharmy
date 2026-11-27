import { describe, expect, it } from 'vitest'
import {
  OPERAND_MAX,
  addSubtractChallenges,
  answerOf,
  applyPart,
  columnWorking,
  digitsOf,
  isFinished,
  isStandardForm,
  partBlocker,
  regroupMat,
  startMat,
  validOperands,
  type Mat,
  type Operation,
} from './addSubtract'
import { TIERS, challengesForTier } from './challenges'
import { PLACE_LIMITS, REGROUP_KINDS } from './placeValue'

const play = (mat: Mat, op: Operation, b: number, steps: ('ones' | 'tens' | (typeof REGROUP_KINDS)[number])[]) => {
  let m = mat
  for (const s of steps) {
    const next = s === 'ones' || s === 'tens' ? applyPart(m, op, b, s) : regroupMat(m, s)
    if (!next) throw new Error(`step ${s} not allowed`)
    m = next
  }
  return m
}

describe('basics', () => {
  it('splits two-digit numbers', () => {
    expect(digitsOf(47)).toEqual({ tens: 4, ones: 7 })
    expect(digitsOf(5)).toEqual({ tens: 0, ones: 5 })
    expect(digitsOf(90)).toEqual({ tens: 9, ones: 0 })
  })
  it('answers', () => {
    expect(answerOf('add', 47, 38)).toBe(85)
    expect(answerOf('subtract', 52, 27)).toBe(25)
  })
  it('starts with the first number on the mat; empty places of B count as done', () => {
    expect(startMat(47, 38)).toEqual({ counts: { hundreds: 0, tens: 4, ones: 7 }, done: { ones: false, tens: false } })
    expect(startMat(45, 30).done).toEqual({ ones: true, tens: false })
    expect(startMat(45, 0).done).toEqual({ ones: true, tens: true })
  })
  it('standard form means 9 or fewer tens and ones', () => {
    expect(isStandardForm({ hundreds: 1, tens: 9, ones: 9 })).toBe(true)
    expect(isStandardForm({ hundreds: 0, tens: 10, ones: 0 })).toBe(false)
    expect(isStandardForm({ hundreds: 0, tens: 0, ones: 10 })).toBe(false)
  })
})

describe('validOperands', () => {
  it('clamps to 0..99 and keeps subtraction non-negative', () => {
    expect(validOperands('add', 120, 130)).toEqual({ a: OPERAND_MAX, b: OPERAND_MAX })
    expect(validOperands('subtract', 40, 70)).toEqual({ a: 40, b: 40 })
    expect(validOperands('add', -3, 2.7)).toEqual({ a: 0, b: 2 })
  })
})

describe('adding', () => {
  it('no regroup: 23 + 14', () => {
    const m = play(startMat(23, 14), 'add', 14, ['ones', 'tens'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 3, ones: 7 })
    expect(isFinished(m, 'add', 23, 14)).toBe(true)
  })
  it('is not finished until both places are added', () => {
    const m = play(startMat(23, 14), 'add', 14, ['ones'])
    expect(isFinished(m, 'add', 23, 14)).toBe(false)
  })
  it('carry ones: 27 + 15 needs a trade', () => {
    let m = play(startMat(27, 15), 'add', 15, ['ones', 'tens'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 3, ones: 12 })
    expect(isFinished(m, 'add', 27, 15)).toBe(false) // 12 ones: not standard
    m = play(m, 'add', 15, ['ones-to-ten'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 4, ones: 2 })
    expect(isFinished(m, 'add', 27, 15)).toBe(true)
  })
  it('carry into hundreds: 68 + 57 = 125', () => {
    const m = play(startMat(68, 57), 'add', 57, ['ones', 'tens', 'ones-to-ten', 'tens-to-hundred'])
    expect(m.counts).toEqual({ hundreds: 1, tens: 2, ones: 5 })
    expect(isFinished(m, 'add', 68, 57)).toBe(true)
  })
  it('the largest sum fits on the mat: 99 + 99 = 198', () => {
    const m = play(startMat(99, 99), 'add', 99, ['ones', 'tens', 'ones-to-ten', 'tens-to-hundred'])
    expect(m.counts).toEqual({ hundreds: 1, tens: 9, ones: 8 })
    expect(isFinished(m, 'add', 99, 99)).toBe(true)
  })
  it('no place can ever overflow the mat when adding two valid numbers', () => {
    for (let a = 0; a <= 99; a += 7)
      for (let b = 0; b <= 99; b += 5) {
        const m = play(startMat(a, b), 'add', b, ['ones', 'tens'].filter((p) => !startMat(a, b).done[p as 'ones' | 'tens']) as ('ones' | 'tens')[])
        expect(m.counts.ones).toBeLessThanOrEqual(PLACE_LIMITS.ones)
        expect(m.counts.tens).toBeLessThanOrEqual(PLACE_LIMITS.tens)
      }
  })
})

describe('subtracting', () => {
  it('no borrow: 45 − 32', () => {
    const m = play(startMat(45, 32), 'subtract', 32, ['ones', 'tens'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 1, ones: 3 })
    expect(isFinished(m, 'subtract', 45, 32)).toBe(true)
  })
  it('blocks taking away too many ones and explains why', () => {
    const mat = startMat(52, 27)
    expect(partBlocker(mat, 'subtract', 27, 'ones')).toBe('Not enough ones: regroup a ten first')
    expect(applyPart(mat, 'subtract', 27, 'ones')).toBeNull()
  })
  it('borrow: 52 − 27 = 25', () => {
    const m = play(startMat(52, 27), 'subtract', 27, ['ten-to-ones', 'ones', 'tens'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 2, ones: 5 })
    expect(isFinished(m, 'subtract', 52, 27)).toBe(true)
  })
  it('borrow from a number ending in zero: 90 − 47 = 43', () => {
    const m = play(startMat(90, 47), 'subtract', 47, ['ten-to-ones', 'ones', 'tens'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 4, ones: 3 })
    expect(isFinished(m, 'subtract', 90, 47)).toBe(true)
  })
  it('equal numbers leave an empty mat', () => {
    const m = play(startMat(36, 36), 'subtract', 36, ['ones', 'tens'])
    expect(m.counts).toEqual({ hundreds: 0, tens: 0, ones: 0 })
    expect(isFinished(m, 'subtract', 36, 36)).toBe(true)
  })
  it('cannot do the same place twice', () => {
    const m = play(startMat(45, 32), 'subtract', 32, ['ones'])
    expect(partBlocker(m, 'subtract', 32, 'ones')).toBe('Already done')
  })
})

describe('column working', () => {
  it('explains a carry', () => {
    const w = columnWorking('add', 27, 15)
    expect(w[0]).toEqual({ place: 'ones', text: '7 + 5 = 12: write 2, carry 1 ten' })
    expect(w[1].text).toBe('2 + 1 + 1 = 4')
  })
  it('explains a carry into the hundreds', () => {
    const w = columnWorking('add', 68, 57)
    expect(w.map((s) => s.place)).toEqual(['ones', 'tens', 'hundreds'])
    expect(w[1].text).toBe('6 + 5 + 1 = 12 tens: write 2, carry 1 hundred')
  })
  it('explains a borrow', () => {
    const w = columnWorking('subtract', 52, 27)
    expect(w[0].text).toBe('2 − 7 is not possible: borrow 1 ten, 12 − 7 = 5')
    expect(w[1].text).toBe('5 − 1 (borrowed) − 2 = 2')
  })
  it('plain steps when nothing is regrouped', () => {
    expect(columnWorking('subtract', 45, 32).map((s) => s.text)).toEqual(['5 − 2 = 3', '4 − 3 = 1'])
    expect(columnWorking('add', 23, 14).map((s) => s.text)).toEqual(['3 + 4 = 7', '2 + 1 = 3'])
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(addSubtractChallenges.map((c) => c.id)).toEqual([
      'as-add-23-14', 'as-sub-45-32', 'as-add-31-42', 'as-sub-68-25',
      'as-add-27-15', 'as-sub-52-27', 'as-add-46-38', 'as-sub-71-36',
      'as-add-68-57', 'as-sub-90-47', 'as-add-95-87', 'as-sub-83-59',
    ])
  })
  it('has 4 per tier, valid operands and ids that match them', () => {
    for (const t of TIERS) expect(challengesForTier(addSubtractChallenges, t)).toHaveLength(4)
    for (const c of addSubtractChallenges) {
      expect(c.id).toBe(`as-${c.op === 'add' ? 'add' : 'sub'}-${c.a}-${c.b}`)
      expect(validOperands(c.op, c.a, c.b)).toEqual({ a: c.a, b: c.b })
      expect(answerOf(c.op, c.a, c.b)).toBeGreaterThanOrEqual(0)
    }
  })
  it('every challenge can be finished, and never starts finished', () => {
    for (const c of addSubtractChallenges) {
      const start = startMat(c.a, c.b)
      expect(isFinished(start, c.op, c.a, c.b), c.id).toBe(false)
      // Greedy play: do whatever part is allowed, otherwise regroup as needed.
      let m: Mat = start
      for (let i = 0; i < 12 && !isFinished(m, c.op, c.a, c.b); i++) {
        const part = (['ones', 'tens'] as const).find((p) => !partBlocker(m, c.op, c.b, p))
        if (part) m = applyPart(m, c.op, c.b, part)!
        else {
          const kind = c.op === 'add'
            ? (m.counts.ones >= 10 ? 'ones-to-ten' : 'tens-to-hundred')
            : 'ten-to-ones'
          m = regroupMat(m, kind) ?? m
        }
        if (c.op === 'add' && m.done.ones && m.done.tens) {
          while (m.counts.ones >= 10) m = regroupMat(m, 'ones-to-ten')!
          while (m.counts.tens >= 10) m = regroupMat(m, 'tens-to-hundred')!
        }
      }
      expect(isFinished(m, c.op, c.a, c.b), c.id).toBe(true)
    }
  })
  it('medium and hard challenges need at least one regroup', () => {
    for (const c of addSubtractChallenges.filter((x) => x.tier !== 'easy')) {
      const x = digitsOf(c.a)
      const y = digitsOf(c.b)
      const needs = c.op === 'add' ? x.ones + y.ones >= 10 : x.ones < y.ones
      expect(needs, c.id).toBe(true)
    }
  })
})
