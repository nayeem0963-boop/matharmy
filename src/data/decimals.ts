import type { Tier } from './challenges'

/**
 * Decimals and Percentages on a hundred grid. The whole is 100 squares; every
 * square is one hundredth (0.01, 1%, 1/100). A column of ten is one tenth. The
 * same amount is read as a decimal, a fraction and a percent.
 */
export const GRID = 100
export const TENTHS_MAX = 10
export const HUNDREDTHS_MAX = 9

/** How many squares are shaded, 0 to 100. */
export interface DecimalState {
  squares: number
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_DECIMAL: DecimalState = { squares: 42 }

export const clampSquares = (n: number) => Math.min(GRID, Math.max(0, Math.floor(n)))
export const tenthsOf = (n: number) => Math.floor(n / 10)
export const hundredthsOf = (n: number) => n % 10

/** Build from the two steppers; a whole (10 tenths) has no hundredths. */
export const fromDigits = (tenths: number, hundredths: number) => clampSquares(10 * tenths + hundredths)

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** "0.42", "0.5", "1": the decimal for n hundredths, in the usual short form. */
export function decimalText(n: number): string {
  if (n === GRID) return '1'
  if (n === 0) return '0'
  return (n / 100).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}

/** "0.42" with two places always (hundredths shown even when 0). */
export const decimalTwoPlaces = (n: number) => (n / 100).toFixed(2)

export const percentText = (n: number) => `${n}%`

/** The fraction in lowest terms: "21/50". 0 and 1 are shown as whole numbers. */
export function simplestFraction(n: number): { num: number; den: number } {
  if (n === 0) return { num: 0, den: 1 }
  const g = gcd(n, GRID)
  return { num: n / g, den: GRID / g }
}
export const fractionText = (n: number) => {
  const { num, den } = simplestFraction(n)
  return den === 1 ? String(num) : `${num}/${den}`
}

/** "4 tenths and 2 hundredths" */
export function placeWords(n: number): string {
  if (n === GRID) return '1 whole'
  const t = tenthsOf(n)
  const h = hundredthsOf(n)
  const parts = [t > 0 ? `${t} ${t === 1 ? 'tenth' : 'tenths'}` : '', h > 0 ? `${h} ${h === 1 ? 'hundredth' : 'hundredths'}` : ''].filter(Boolean)
  return parts.length ? parts.join(' and ') : 'nothing shaded'
}

/* ---------- Challenges ---------- */

export type DecimalRule =
  | { type: 'exact'; n: number }
  /** Strictly between two values, given in hundredths (they may be fractions of a square). */
  | { type: 'between'; lo: number; hi: number }

export interface DecimalChallenge {
  id: string
  tier: Tier
  rule: DecimalRule
  prompt: string
  hint: string
}

export function isDecimalSolved(c: DecimalChallenge, s: DecimalState): boolean {
  const r = c.rule
  return r.type === 'exact' ? s.squares === r.n : s.squares > r.lo && s.squares < r.hi
}

// IDs are stable: they are stored in saved progress.
export const decimalChallenges: DecimalChallenge[] = [
  // Easy: one form, familiar amounts
  { id: 'd-dec-0-5', tier: 'easy', rule: { type: 'exact', n: 50 }, prompt: 'Show 0.5 on the grid.', hint: '0.5 is 5 tenths: five full columns.' },
  { id: 'd-pct-25', tier: 'easy', rule: { type: 'exact', n: 25 }, prompt: 'Show 25%.', hint: '25% means 25 out of every 100 squares.' },
  { id: 'd-frac-3-10', tier: 'easy', rule: { type: 'exact', n: 30 }, prompt: 'Show 3/10.', hint: 'Tenths are the columns. 3 columns.' },
  { id: 'd-dec-0-07', tier: 'easy', rule: { type: 'exact', n: 7 }, prompt: 'Show 0.07.', hint: '0 tenths and 7 hundredths: just 7 single squares.' },
  // Medium: two places, other forms
  { id: 'd-dec-0-35', tier: 'medium', rule: { type: 'exact', n: 35 }, prompt: 'Show 0.35.', hint: '3 tenths and 5 hundredths.' },
  { id: 'd-pct-85', tier: 'medium', rule: { type: 'exact', n: 85 }, prompt: 'Show 85%.', hint: '85 squares out of 100.' },
  { id: 'd-frac-3-4', tier: 'medium', rule: { type: 'exact', n: 75 }, prompt: 'Show 3/4 of the grid.', hint: 'A quarter is 25 squares. How many is three quarters?' },
  { id: 'd-between-0-4-0-5', tier: 'medium', rule: { type: 'between', lo: 40, hi: 50 }, prompt: 'Show a decimal between 0.4 and 0.5.', hint: 'Between 4 tenths and 5 tenths: add some hundredths.' },
  // Hard: comparing across forms, one whole
  { id: 'd-between-0-7-3-4', tier: 'hard', rule: { type: 'between', lo: 70, hi: 75 }, prompt: 'Show an amount greater than 0.7 and less than 3/4.', hint: '3/4 is 0.75. Which hundredths fit between 0.70 and 0.75?' },
  { id: 'd-between-3-8-0-4', tier: 'hard', rule: { type: 'between', lo: 37.5, hi: 40 }, prompt: 'Show an amount greater than 3/8 and less than 0.4.', hint: '3/8 is 0.375. The next hundredths above it are 0.38 and 0.39.' },
  { id: 'd-frac-7-20', tier: 'hard', rule: { type: 'exact', n: 35 }, prompt: 'Show 7/20.', hint: '1/20 is 5 squares (5%). Seven of them?' },
  { id: 'd-whole-1', tier: 'hard', rule: { type: 'exact', n: 100 }, prompt: 'Shade the whole grid: 1 whole, 100%, 1.00.', hint: '10 tenths make 1 whole.' },
]
