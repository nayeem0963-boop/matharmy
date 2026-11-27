import type { Tier } from './challenges'
import { PLACE_LIMITS, applyRegroup, placeValueTotal, type PlaceValueCounts, type RegroupKind } from './placeValue'

/**
 * Add & Subtract with base-ten blocks.
 *
 * The learner starts with the blocks for the first number (A) on the mat, then
 * adds or takes away the second number (B) one place at a time, regrouping
 * (carrying or borrowing) when the blocks say so. A sum or difference is
 * finished when both places are done and every place holds 9 or fewer blocks.
 */
export type Operation = 'add' | 'subtract'
export type Part = 'ones' | 'tens'

export const OPERAND_MAX = 99
export const OPERATION_SYMBOL: Record<Operation, string> = { add: '+', subtract: '−' }

export interface Mat {
  counts: PlaceValueCounts
  /** Which of B's places have been added / taken away. */
  done: Record<Part, boolean>
}

export const digitsOf = (n: number): Record<Part, number> => ({ tens: Math.floor(n / 10), ones: n % 10 })
export const answerOf = (op: Operation, a: number, b: number) => (op === 'add' ? a + b : a - b)

/** The mat before anything is done: A's blocks. A place where B has no blocks counts as done. */
export function startMat(a: number, b: number): Mat {
  const d = digitsOf(a)
  const e = digitsOf(b)
  return {
    counts: { hundreds: 0, tens: d.tens, ones: d.ones },
    done: { ones: e.ones === 0, tens: e.tens === 0 },
  }
}

/** Why a place cannot be added / taken away right now, or null when it can. */
export function partBlocker(mat: Mat, op: Operation, b: number, part: Part): string | null {
  if (mat.done[part]) return 'Already done'
  const amount = digitsOf(b)[part]
  if (op === 'add') {
    return mat.counts[part] + amount > PLACE_LIMITS[part] ? `Too many ${part} on the mat: regroup first` : null
  }
  if (mat.counts[part] >= amount) return null
  return part === 'ones' ? 'Not enough ones: regroup a ten first' : 'Not enough tens: regroup a hundred first'
}

export function applyPart(mat: Mat, op: Operation, b: number, part: Part): Mat | null {
  if (partBlocker(mat, op, b, part)) return null
  const amount = digitsOf(b)[part]
  const delta = op === 'add' ? amount : -amount
  return {
    counts: { ...mat.counts, [part]: mat.counts[part] + delta },
    done: { ...mat.done, [part]: true },
  }
}

export function regroupMat(mat: Mat, kind: RegroupKind): Mat | null {
  const counts = applyRegroup(mat.counts, kind)
  return counts ? { ...mat, counts } : null
}

export const isStandardForm = (c: PlaceValueCounts) => c.tens <= 9 && c.ones <= 9

export function isFinished(mat: Mat, op: Operation, a: number, b: number): boolean {
  return (
    mat.done.ones &&
    mat.done.tens &&
    isStandardForm(mat.counts) &&
    placeValueTotal(mat.counts) === answerOf(op, a, b)
  )
}

/** Clamp the operands so a subtraction never goes below zero. */
export function validOperands(op: Operation, a: number, b: number) {
  const A = Math.min(OPERAND_MAX, Math.max(0, Math.floor(a)))
  const B = Math.min(op === 'subtract' ? A : OPERAND_MAX, Math.max(0, Math.floor(b)))
  return { a: A, b: B }
}

/* ---------- Worked column method (shown while exploring, hidden in challenges) ---------- */

export interface WorkingStep {
  place: 'ones' | 'tens' | 'hundreds'
  text: string
}

export function columnWorking(op: Operation, a: number, b: number): WorkingStep[] {
  const x = digitsOf(a)
  const y = digitsOf(b)
  const steps: WorkingStep[] = []
  if (op === 'add') {
    const ones = x.ones + y.ones
    const carry = ones >= 10 ? 1 : 0
    steps.push({
      place: 'ones',
      text: carry
        ? `${x.ones} + ${y.ones} = ${ones}: write ${ones - 10}, carry 1 ten`
        : `${x.ones} + ${y.ones} = ${ones}`,
    })
    const tens = x.tens + y.tens + carry
    if (tens >= 10) {
      steps.push({
        place: 'tens',
        text: `${x.tens} + ${y.tens}${carry ? ' + 1' : ''} = ${tens} tens: write ${tens - 10}, carry 1 hundred`,
      })
      steps.push({ place: 'hundreds', text: '1 hundred' })
    } else {
      steps.push({ place: 'tens', text: `${x.tens} + ${y.tens}${carry ? ' + 1' : ''} = ${tens}` })
    }
    return steps
  }
  const borrow = x.ones < y.ones ? 1 : 0
  steps.push({
    place: 'ones',
    text: borrow
      ? `${x.ones} − ${y.ones} is not possible: borrow 1 ten, ${x.ones + 10} − ${y.ones} = ${x.ones + 10 - y.ones}`
      : `${x.ones} − ${y.ones} = ${x.ones - y.ones}`,
  })
  const left = x.tens - borrow
  steps.push({
    place: 'tens',
    text: `${x.tens}${borrow ? ' − 1 (borrowed)' : ''} − ${y.tens} = ${left - y.tens}`,
  })
  return steps
}

/* ---------- Challenges ---------- */

export interface AddSubtractChallenge {
  id: string
  tier: Tier
  op: Operation
  a: number
  b: number
  hint: string
}

// IDs are stable: they are stored in saved progress.
export const addSubtractChallenges: AddSubtractChallenge[] = [
  // Easy: no regrouping
  { id: 'as-add-23-14', tier: 'easy', op: 'add', a: 23, b: 14, hint: 'Add the ones, then the tens. Nothing reaches 10.' },
  { id: 'as-sub-45-32', tier: 'easy', op: 'subtract', a: 45, b: 32, hint: 'Take away the ones first, then the tens.' },
  { id: 'as-add-31-42', tier: 'easy', op: 'add', a: 31, b: 42, hint: '1 one + 2 ones, then 3 tens + 4 tens.' },
  { id: 'as-sub-68-25', tier: 'easy', op: 'subtract', a: 68, b: 25, hint: 'There are enough ones and tens to take away.' },
  // Medium: one regroup (carry or borrow)
  { id: 'as-add-27-15', tier: 'medium', op: 'add', a: 27, b: 15, hint: '7 + 5 ones makes 12 ones. Trade 10 ones for 1 ten.' },
  { id: 'as-sub-52-27', tier: 'medium', op: 'subtract', a: 52, b: 27, hint: 'You cannot take 7 from 2 ones. Break 1 ten into 10 ones first.' },
  { id: 'as-add-46-38', tier: 'medium', op: 'add', a: 46, b: 38, hint: '6 + 8 ones is 14 ones: one ten and 4 ones.' },
  { id: 'as-sub-71-36', tier: 'medium', op: 'subtract', a: 71, b: 36, hint: 'Only 1 one: borrow a ten to take away 6.' },
  // Hard: regroup in more than one place, or into hundreds
  { id: 'as-add-68-57', tier: 'hard', op: 'add', a: 68, b: 57, hint: 'Ones make a ten, and then the tens make a hundred.' },
  { id: 'as-sub-90-47', tier: 'hard', op: 'subtract', a: 90, b: 47, hint: 'No ones at all: break a ten into 10 ones first.' },
  { id: 'as-add-95-87', tier: 'hard', op: 'add', a: 95, b: 87, hint: 'Two trades: ones into a ten, then tens into a hundred.' },
  { id: 'as-sub-83-59', tier: 'hard', op: 'subtract', a: 83, b: 59, hint: 'Borrow for the ones, then take away the tens.' },
]

export const challengePrompt = (c: AddSubtractChallenge) =>
  `Work out ${c.a} ${OPERATION_SYMBOL[c.op]} ${c.b} with the blocks. Finish with 9 or fewer in every place.`
