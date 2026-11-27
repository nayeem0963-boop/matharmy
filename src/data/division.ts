import type { Tier } from './challenges'

/**
 * Division and Grouping. A pile of cubes is either shared equally into a number
 * of groups, or split into groups of a given size. Either way there is a
 * quotient and sometimes a remainder, and quotient x divisor + remainder = total.
 */
export type DivisionMode = 'share' | 'group'

export const TOTAL_MIN = 1
export const TOTAL_MAX = 50
export const DIVISOR_MIN = 2
export const DIVISOR_MAX = 10

export const MODE_LABELS: Record<DivisionMode, string> = { share: 'Share equally', group: 'Make groups of' }

export interface DivisionState {
  mode: DivisionMode
  total: number
  /** Number of groups (share) or size of each group (group). */
  divisor: number
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_DIVISION: DivisionState = { mode: 'share', total: 20, divisor: 3 }

export const quotientOf = (total: number, divisor: number) => Math.floor(total / divisor)
export const remainderOf = (total: number, divisor: number) => total % divisor

export interface DivisionLayout {
  /** Number of equal groups drawn, and how many cubes are in each. */
  groups: number
  perGroup: number
  leftOver: number
}

export function layoutOf(s: DivisionState): DivisionLayout {
  const q = quotientOf(s.total, s.divisor)
  const leftOver = remainderOf(s.total, s.divisor)
  return s.mode === 'share'
    ? { groups: s.divisor, perGroup: q, leftOver }
    : { groups: q, perGroup: s.divisor, leftOver }
}

/** "20 ÷ 3 = 6 r 2" */
export const equation = (s: DivisionState) => {
  const q = quotientOf(s.total, s.divisor)
  const r = remainderOf(s.total, s.divisor)
  return `${s.total} ÷ ${s.divisor} = ${q}${r ? ` r ${r}` : ''}`
}

/** "6 × 3 + 2 = 20": multiplication checks the division. */
export const checkSentence = (s: DivisionState) => {
  const q = quotientOf(s.total, s.divisor)
  const r = remainderOf(s.total, s.divisor)
  return `${q} × ${s.divisor}${r ? ` + ${r}` : ''} = ${s.total}`
}

/** Plain-words summary of what the cubes show. */
export function describe(s: DivisionState): string {
  const { groups, perGroup, leftOver } = layoutOf(s)
  const left = leftOver === 0 ? 'none left over' : `${leftOver} left over`
  if (s.mode === 'share') {
    return perGroup === 0
      ? `${s.total} cubes cannot give each of ${s.divisor} groups even one`
      : `${s.total} cubes shared into ${s.divisor} groups: ${perGroup} in each, ${left}`
  }
  return groups === 0
    ? `${s.total} cubes cannot make a group of ${s.divisor}`
    : `${s.total} cubes in groups of ${s.divisor}: ${groups} ${groups === 1 ? 'group' : 'groups'}, ${left}`
}

/* ---------- Challenges ---------- */

export type DivisionRule =
  | { type: 'exact'; mode: DivisionMode; total: number; divisor: number }
  /** Any total that gives this quotient and remainder with this divisor. */
  | { type: 'result'; mode: DivisionMode; divisor: number; quotient: number; remainder: number }
  /** Any total (at least one full group) that divides with nothing left over. */
  | { type: 'no-remainder'; mode: DivisionMode; divisor: number }
  /** Any total with this remainder for this divisor. */
  | { type: 'remainder'; divisor: number; remainder: number }

export interface DivisionChallenge {
  id: string
  tier: Tier
  rule: DivisionRule
  prompt: string
  hint: string
}

export function isDivisionSolved(c: DivisionChallenge, s: DivisionState): boolean {
  const r = c.rule
  const q = quotientOf(s.total, s.divisor)
  const rem = remainderOf(s.total, s.divisor)
  switch (r.type) {
    case 'exact':
      return s.mode === r.mode && s.total === r.total && s.divisor === r.divisor
    case 'result':
      return s.mode === r.mode && s.divisor === r.divisor && q === r.quotient && rem === r.remainder
    case 'no-remainder':
      return s.mode === r.mode && s.divisor === r.divisor && rem === 0 && q >= 1
    case 'remainder':
      return s.divisor === r.divisor && rem === r.remainder && q >= 1
  }
}

// IDs are stable: they are stored in saved progress.
export const divisionChallenges: DivisionChallenge[] = [
  // Easy: share or group an exact number, nothing left over
  { id: 'd-share-12-3', tier: 'easy', rule: { type: 'exact', mode: 'share', total: 12, divisor: 3 }, prompt: 'Share 12 cubes equally into 3 groups.', hint: 'Deal them out one at a time: how many in each group?' },
  { id: 'd-group-15-5', tier: 'easy', rule: { type: 'exact', mode: 'group', total: 15, divisor: 5 }, prompt: 'Make groups of 5 from 15 cubes.', hint: 'How many groups of 5 can you make?' },
  { id: 'd-share-10-2', tier: 'easy', rule: { type: 'exact', mode: 'share', total: 10, divisor: 2 }, prompt: 'Share 10 cubes equally into 2 groups.', hint: 'Half of 10.' },
  { id: 'd-group-8-4', tier: 'easy', rule: { type: 'exact', mode: 'group', total: 8, divisor: 4 }, prompt: 'Make groups of 4 from 8 cubes.', hint: 'Count by 4s: 4, 8.' },
  // Medium: remainders, and finding a total that fits
  { id: 'd-share-13-4', tier: 'medium', rule: { type: 'exact', mode: 'share', total: 13, divisor: 4 }, prompt: 'Share 13 cubes into 4 groups. What is left over?', hint: '4 × 3 = 12, so one cube cannot be shared.' },
  { id: 'd-result-group-5-3-2', tier: 'medium', rule: { type: 'result', mode: 'group', divisor: 5, quotient: 3, remainder: 2 }, prompt: 'Make groups of 5 so you get 3 groups and 2 left over.', hint: '3 groups of 5 is 15. Add the 2 left over.' },
  { id: 'd-none-share-6', tier: 'medium', rule: { type: 'no-remainder', mode: 'share', divisor: 6 }, prompt: 'Share into 6 groups with none left over.', hint: 'Pick a total in the 6 times table, like 12 or 18.' },
  { id: 'd-result-share-3-4-1', tier: 'medium', rule: { type: 'result', mode: 'share', divisor: 3, quotient: 4, remainder: 1 }, prompt: 'Share into 3 groups so each gets 4 and 1 is left over.', hint: '3 × 4 = 12, plus 1 more.' },
  // Hard: bigger numbers and any-total conditions
  { id: 'd-share-47-6', tier: 'hard', rule: { type: 'exact', mode: 'share', total: 47, divisor: 6 }, prompt: 'Share 47 cubes into 6 groups.', hint: '6 × 7 = 42. How many are left?' },
  { id: 'd-result-group-8-5-7', tier: 'hard', rule: { type: 'result', mode: 'group', divisor: 8, quotient: 5, remainder: 7 }, prompt: 'Make groups of 8: 5 groups and 7 left over. How many cubes?', hint: '5 × 8 = 40. Then 7 more.' },
  { id: 'd-rem-9-8', tier: 'hard', rule: { type: 'remainder', divisor: 9, remainder: 8 }, prompt: 'Divide by 9 so that 8 are left over.', hint: 'One less than a multiple of 9: 17, 26, 35 ...' },
  { id: 'd-none-group-7', tier: 'hard', rule: { type: 'no-remainder', mode: 'group', divisor: 7 }, prompt: 'Make groups of 7 with none left over.', hint: 'Count by 7s: 7, 14, 21 ...' },
]
