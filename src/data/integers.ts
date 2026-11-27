import type { Tier } from './challenges'

/**
 * Integers and Number Lines. Two ways in: put two points on a number line from
 * -10 to 10 and compare them (distance from zero, opposites, order, how far
 * apart), or start at a number and add or subtract another, and watch the move.
 */
export const LINE_MIN = -10
export const LINE_MAX = 10
/** Start and step in the add/subtract view stay small enough for the answer to land on the line. */
export const OPERAND_MIN = -5
export const OPERAND_MAX = 5

export type IntMode = 'line' | 'move'
export type IntOp = 'add' | 'subtract'

export const MODE_LABELS: Record<IntMode, string> = { line: 'Number line', move: 'Add and subtract' }
export const OP_LABELS: Record<IntOp, string> = { add: 'Add (+)', subtract: 'Subtract (−)' }

export interface IntState {
  mode: IntMode
  /** The two points on the line (compare view). */
  p: number
  q: number
  /** Start, operation and number (add and subtract view). */
  a: number
  op: IntOp
  b: number
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_INT: IntState = { mode: 'line', p: -3, q: 5, a: -2, op: 'add', b: 3 }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.round(n)))
export const clampLine = (n: number) => clamp(n, LINE_MIN, LINE_MAX)
export const clampOperand = (n: number) => clamp(n, OPERAND_MIN, OPERAND_MAX)

/** −7 with a real minus sign, 7 for a positive number. */
export const signed = (n: number) => (n < 0 ? `−${Math.abs(n)}` : String(n))
/** A negative number in brackets when it follows an operation: 3 − (−4). */
export const bracketed = (n: number) => (n < 0 ? `(${signed(n)})` : String(n))

export const absOf = (n: number) => Math.abs(n)
export const oppositeOf = (n: number) => (n === 0 ? 0 : -n)
export const distanceBetween = (p: number, q: number) => Math.abs(p - q)
export const resultOf = (s: Pick<IntState, 'a' | 'op' | 'b'>) => (s.op === 'add' ? s.a + s.b : s.a - s.b)

/** Where a number sits relative to zero, in words. */
export function placeText(n: number): string {
  if (n === 0) return 'at zero'
  return `${Math.abs(n)} ${Math.abs(n) === 1 ? 'unit' : 'units'} ${n < 0 ? 'left' : 'right'} of zero`
}

/** "−3 < 5", "5 > −3" or "2 = 2": the comparison as a statement about the first number. */
export function compareText(p: number, q: number): string {
  const sym = p < q ? '<' : p > q ? '>' : '='
  return `${signed(p)} ${sym} ${signed(q)}`
}

/** The first number is further left, further right, or in the same place. */
export function compareWords(p: number, q: number): string {
  if (p === q) return 'Same place on the line'
  return p < q ? `${signed(p)} is to the left of ${signed(q)}, so it is less` : `${signed(p)} is to the right of ${signed(q)}, so it is greater`
}

/** "3 − (−4) = 3 + 4 = 7" or "−2 + 3 = 1": the working for the add and subtract view. */
export function expressionText(s: Pick<IntState, 'a' | 'op' | 'b'>): string {
  const r = resultOf(s)
  if (s.op === 'add') return `${signed(s.a)} + ${bracketed(s.b)} = ${signed(r)}`
  return `${signed(s.a)} − ${bracketed(s.b)} = ${signed(r)}`
}

/** What happens on the line, in words. */
export function moveWords(s: Pick<IntState, 'a' | 'op' | 'b'>): string {
  const r = resultOf(s)
  const step = s.op === 'add' ? s.b : -s.b // the actual movement: positive is right
  const start = `Start at ${signed(s.a)}.`
  if (step === 0) return `${start} Move 0. You stay on ${signed(r)}.`
  const way = `Move ${Math.abs(step)} ${step > 0 ? 'right' : 'left'}.`
  const extra = s.op === 'subtract' && s.b < 0 ? ' Subtracting a negative is the same as adding the opposite.' : ''
  return `${start} ${way} You land on ${signed(r)}.${extra}`
}

/* ---------- Challenges ---------- */

export type IntRule =
  // number line view
  | { type: 'place'; value: number }
  | { type: 'pair'; p: number; q: number }
  | { type: 'both-negative-p-right' }
  | { type: 'distance-from-zero'; value: number }
  | { type: 'gap'; value: number }
  // add and subtract view
  | { type: 'result'; target: number }
  | { type: 'from-to'; a: number; target: number }
  | { type: 'expression'; a: number; op: IntOp; b: number }
  | { type: 'subtract-negative'; target: number }
  | { type: 'add-negatives'; target: number }
  | { type: 'subtract-positive-from-negative'; target: number }
  | { type: 'zero-pair' }

export interface IntChallenge {
  id: string
  tier: Tier
  rule: IntRule
  prompt: string
  hint: string
}

export const modeOfChallenge = (c: IntChallenge): IntMode => {
  switch (c.rule.type) {
    case 'place':
    case 'pair':
    case 'both-negative-p-right':
    case 'distance-from-zero':
    case 'gap':
      return 'line'
    default:
      return 'move'
  }
}

export function isIntSolved(c: IntChallenge, s: IntState): boolean {
  const r = c.rule
  const res = resultOf(s)
  switch (r.type) {
    case 'place':
      return s.p === r.value
    case 'pair':
      return s.p === r.p && s.q === r.q
    case 'both-negative-p-right':
      return s.p < 0 && s.q < 0 && s.p > s.q
    case 'distance-from-zero':
      return absOf(s.p) === r.value
    case 'gap':
      return s.p < 0 && s.q > 0 && distanceBetween(s.p, s.q) === r.value
    case 'result':
      return res === r.target
    case 'from-to':
      return s.a === r.a && res === r.target
    case 'expression':
      return s.a === r.a && s.op === r.op && s.b === r.b
    case 'subtract-negative':
      return s.op === 'subtract' && s.b < 0 && res === r.target
    case 'add-negatives':
      return s.op === 'add' && s.a < 0 && s.b < 0 && res === r.target
    case 'subtract-positive-from-negative':
      return s.op === 'subtract' && s.a < 0 && s.b > 0 && res === r.target
    case 'zero-pair':
      return s.op === 'add' && s.a !== 0 && res === 0
  }
}

// IDs are stable: they are stored in saved progress.
export const intChallenges: IntChallenge[] = [
  // Easy: place and compare on the number line
  { id: 'i-place-neg-7', tier: 'easy', rule: { type: 'place', value: -7 }, prompt: 'Put point A on −7.', hint: 'Negative numbers are to the left of zero. Count 7 steps left.' },
  { id: 'i-opposite-6', tier: 'easy', rule: { type: 'pair', p: 6, q: -6 }, prompt: 'Put A on 6 and B on its opposite.', hint: 'Opposites are the same distance from zero, on different sides.' },
  { id: 'i-order-neg', tier: 'easy', rule: { type: 'both-negative-p-right' }, prompt: 'Put A and B both below zero, with A to the right of B.', hint: 'Further right means greater: −2 is greater than −6.' },
  { id: 'i-abs-5', tier: 'easy', rule: { type: 'distance-from-zero', value: 5 }, prompt: 'Put A so that it is 5 units from zero.', hint: 'Two places work: 5 and −5. Both have an absolute value of 5.' },
  // Medium: gaps, and the first moves
  { id: 'i-gap-7', tier: 'medium', rule: { type: 'gap', value: 7 }, prompt: 'Put A below zero and B above zero so they are 7 units apart.', hint: 'Add the distances from zero: for example −3 and 4 are 3 + 4 = 7 apart.' },
  { id: 'i-result-neg3', tier: 'medium', rule: { type: 'result', target: -3 }, prompt: 'Make an addition or subtraction that lands on −3.', hint: 'Try −1 + (−2), or start at 2 and subtract 5.' },
  { id: 'i-from-neg3-to-1', tier: 'medium', rule: { type: 'from-to', a: -3, target: 1 }, prompt: 'Start at −3 and finish at 1.', hint: 'How far is it from −3 to 1? Add 4, or subtract −4.' },
  { id: 'i-sub-3-neg4', tier: 'medium', rule: { type: 'expression', a: 3, op: 'subtract', b: -4 }, prompt: 'Show 3 − (−4).', hint: 'Start at 3, subtract, and choose −4. The answer is 7.' },
  // Hard: negative operands
  { id: 'i-sub-negative-9', tier: 'hard', rule: { type: 'subtract-negative', target: 9 }, prompt: 'Subtract a negative number to get 9.', hint: 'Subtracting a negative is adding a positive: 5 − (−4) = 9.' },
  { id: 'i-add-negatives-8', tier: 'hard', rule: { type: 'add-negatives', target: -8 }, prompt: 'Add two negative numbers to get −8.', hint: 'Both moves go left: −3 + (−5), or −4 + (−4).' },
  { id: 'i-sub-positive-9', tier: 'hard', rule: { type: 'subtract-positive-from-negative', target: -9 }, prompt: 'Subtract a positive number from a negative number to get −9.', hint: 'Start left of zero and move further left: −4 − 5 = −9.' },
  { id: 'i-zero-pair', tier: 'hard', rule: { type: 'zero-pair' }, prompt: 'Add two opposite numbers (not zero) to get a sum of 0.', hint: 'A number and its opposite cancel: 3 + (−3) = 0.' },
]
