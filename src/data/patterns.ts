import type { Tier } from './challenges'

/**
 * Patterns and Sequences. A sequence starts at a number and either adds the same
 * amount each time or multiplies by the same amount each time. The first
 * TERMS_SHOWN terms are drawn as bars, and any term can be looked up.
 */
export type PatternKind = 'add' | 'multiply'

export const TERMS_SHOWN = 6
export const START_MIN = 1
export const START_MAX = 20
export const FIND_MIN = 1
export const FIND_MAX = 12

/** Allowed range of the step for each kind (adding 1-10, multiplying by 2-5). */
export const STEP_RANGE: Record<PatternKind, { min: number; max: number }> = {
  add: { min: 1, max: 10 },
  multiply: { min: 2, max: 5 },
}

export const KIND_LABELS: Record<PatternKind, string> = {
  add: 'Add the same each time',
  multiply: 'Multiply each time',
}

export interface PatternState {
  kind: PatternKind
  start: number
  step: number
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_PATTERN: PatternState = { kind: 'add', start: 3, step: 4 }

/** The n-th term (n starts at 1). */
export const termAt = (p: PatternState, n: number): number =>
  p.kind === 'add' ? p.start + p.step * (n - 1) : p.start * p.step ** (n - 1)

export const termsOf = (p: PatternState, count = TERMS_SHOWN): number[] =>
  Array.from({ length: count }, (_, i) => termAt(p, i + 1))

export const clampStep = (kind: PatternKind, step: number) =>
  Math.min(STEP_RANGE[kind].max, Math.max(STEP_RANGE[kind].min, Math.floor(step)))

/** "Start at 3, add 4 each time" */
export const ruleSentence = (p: PatternState) =>
  p.kind === 'add' ? `Start at ${p.start}, add ${p.step} each time` : `Start at ${p.start}, multiply by ${p.step} each time`

/** The rule for any term: "3 + 4 × (n − 1)" or "3 × 2^(n − 1)". */
export const nthTermRule = (p: PatternState) =>
  p.kind === 'add' ? `${p.start} + ${p.step} × (n − 1)` : `${p.start} × ${p.step}^(n − 1)`

/** Worked line for one term: "3 + 4 × 9 = 39". */
export const termWorking = (p: PatternState, n: number) =>
  p.kind === 'add'
    ? `${p.start} + ${p.step} × ${n - 1} = ${termAt(p, n)}`
    : `${p.start} × ${p.step}^${n - 1} = ${termAt(p, n)}`

/* ---------- Challenges ---------- */

export type PatternRule =
  | { type: 'exact'; kind: PatternKind; start: number; step: number }
  /** The n-th term equals `value` (for the given kind, or any kind). */
  | { type: 'term'; n: number; value: number; kind?: PatternKind }
  /** Every value appears among the terms shown. */
  | { type: 'contains'; kind: PatternKind; values: number[] }

export interface PatternChallenge {
  id: string
  tier: Tier
  rule: PatternRule
  prompt: string
  hint: string
}

export function isPatternSolved(c: PatternChallenge, p: PatternState): boolean {
  const r = c.rule
  switch (r.type) {
    case 'exact':
      return p.kind === r.kind && p.start === r.start && p.step === r.step
    case 'term':
      return (r.kind === undefined || p.kind === r.kind) && termAt(p, r.n) === r.value
    case 'contains': {
      if (p.kind !== r.kind) return false
      const terms = termsOf(p)
      return r.values.every((v) => terms.includes(v))
    }
  }
}

// IDs are stable: they are stored in saved progress.
export const patternChallenges: PatternChallenge[] = [
  // Easy: build a described pattern
  { id: 'p-add-2-3', tier: 'easy', rule: { type: 'exact', kind: 'add', start: 2, step: 3 }, prompt: 'Make a pattern that starts at 2 and adds 3 each time.', hint: '2, 5, 8, 11 ...' },
  { id: 'p-add-5-5', tier: 'easy', rule: { type: 'exact', kind: 'add', start: 5, step: 5 }, prompt: 'Start at 5 and count on by 5s.', hint: '5, 10, 15, 20 ...' },
  { id: 'p-term-3-10', tier: 'easy', rule: { type: 'term', n: 3, value: 10 }, prompt: 'Make a pattern whose 3rd term is 10.', hint: 'Many patterns work. Try start 4 and add 3: 4, 7, 10.' },
  { id: 'p-mul-1-2', tier: 'easy', rule: { type: 'exact', kind: 'multiply', start: 1, step: 2 }, prompt: 'Make a doubling pattern that starts at 1.', hint: 'Choose "Multiply each time" and multiply by 2: 1, 2, 4, 8 ...' },
  // Medium: work backwards from a term, or hit two numbers
  { id: 'p-term-4-13', tier: 'medium', rule: { type: 'term', n: 4, value: 13, kind: 'add' }, prompt: 'Make an adding pattern whose 4th term is 13.', hint: 'Start + 3 steps = 13. Try adding 4 from a start of 1.' },
  { id: 'p-mul-3-2', tier: 'medium', rule: { type: 'exact', kind: 'multiply', start: 3, step: 2 }, prompt: 'Start at 3 and double each time.', hint: '3, 6, 12, 24 ...' },
  { id: 'p-contains-20-28', tier: 'medium', rule: { type: 'contains', kind: 'add', values: [20, 28] }, prompt: 'Make an adding pattern that includes both 20 and 28.', hint: 'The gap from 20 to 28 is 8. Which step fits into 8?' },
  { id: 'p-term-6-31', tier: 'medium', rule: { type: 'term', n: 6, value: 31, kind: 'add' }, prompt: 'Make an adding pattern whose 6th term is 31.', hint: 'Start + 5 steps = 31. Try a step of 5 and a start of 6.' },
  // Hard: multiply, larger terms, two targets
  { id: 'p-term-4-54-mul', tier: 'hard', rule: { type: 'term', n: 4, value: 54, kind: 'multiply' }, prompt: 'Make a multiplying pattern whose 4th term is 54.', hint: 'Start × step × step × step = 54. Think of 2 × 27 and 27 = 3 × 3 × 3.' },
  { id: 'p-term-10-50', tier: 'hard', rule: { type: 'term', n: 10, value: 50, kind: 'add' }, prompt: 'Make an adding pattern whose 10th term is 50.', hint: 'Start + 9 steps = 50. A step of 5 from a start of 5 works.' },
  { id: 'p-mul-2-5', tier: 'hard', rule: { type: 'exact', kind: 'multiply', start: 2, step: 5 }, prompt: 'Start at 2 and multiply by 5 each time.', hint: '2, 10, 50, 250 ...' },
  { id: 'p-contains-28-49', tier: 'hard', rule: { type: 'contains', kind: 'add', values: [28, 49] }, prompt: 'Make an adding pattern that includes both 28 and 49 in its first 6 terms.', hint: '49 − 28 = 21. The step has to fit into 21.' },
]
