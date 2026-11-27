import type { Tier } from './challenges'

/**
 * Multiplication Arrays: rows x columns grids of cubes.
 * The array is the model: rows of equal size are repeated addition, turning it
 * on its side shows the order does not matter, and a product splits back into
 * its factors for division.
 */
export const ARRAY_MAX = 10
export const ARRAY_MIN = 1

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_ARRAY = { rows: 3, cols: 5 }

export const productOf = (rows: number, cols: number) => rows * cols

/** "4 + 4 + 4 = 12": `rows` equal groups of `cols`. */
export function repeatedAddition(rows: number, cols: number): string {
  const total = productOf(rows, cols)
  return rows === 1 ? `${cols} = ${total}` : `${Array(rows).fill(cols).join(' + ')} = ${total}`
}

/** Counting row by row: cols, 2 x cols, ... for the first `rows` rows. */
export function skipCount(cols: number, rows: number): number[] {
  return Array.from({ length: Math.max(0, rows) }, (_, i) => cols * (i + 1))
}

/** The four related facts for an array (two when the array is square). */
export function factFamily(rows: number, cols: number): string[] {
  const p = productOf(rows, cols)
  const facts = [`${rows} × ${cols} = ${p}`]
  if (rows !== cols) facts.push(`${cols} × ${rows} = ${p}`)
  facts.push(`${p} ÷ ${rows} = ${cols}`)
  if (rows !== cols) facts.push(`${p} ÷ ${cols} = ${rows}`)
  return facts
}

/* ---------- Challenges ---------- */

export type ArrayRule =
  | { type: 'exact'; rows: number; cols: number }
  | { type: 'product-rows'; product: number; rows: number }
  | { type: 'product-cols'; product: number; cols: number }
  | { type: 'product-wide'; product: number } // more columns than rows
  | { type: 'product-tall'; product: number } // more rows than columns
  | { type: 'square'; product: number }

export interface ArrayChallenge {
  id: string
  tier: Tier
  rule: ArrayRule
  prompt: string
  hint: string
}

export interface ArrayState {
  rows: number
  cols: number
}

export function isArraySolved(c: ArrayChallenge, s: ArrayState): boolean {
  const { rows, cols } = s
  const r = c.rule
  const p = productOf(rows, cols)
  switch (r.type) {
    case 'exact':
      return rows === r.rows && cols === r.cols
    case 'product-rows':
      return p === r.product && rows === r.rows
    case 'product-cols':
      return p === r.product && cols === r.cols
    case 'product-wide':
      return p === r.product && cols > rows
    case 'product-tall':
      return p === r.product && rows > cols
    case 'square':
      return p === r.product && rows === cols
  }
}

// IDs are stable: they are stored in saved progress.
export const arrayChallenges: ArrayChallenge[] = [
  // Easy: build a named array, or a small product
  { id: 'm-exact-2-3', tier: 'easy', rule: { type: 'exact', rows: 2, cols: 3 }, prompt: 'Build an array with 2 rows of 3.', hint: '2 × 3: two rows, three in each row.' },
  { id: 'm-exact-4-5', tier: 'easy', rule: { type: 'exact', rows: 4, cols: 5 }, prompt: 'Make 4 rows of 5.', hint: 'Count by 5s, four times.' },
  { id: 'm-rows-6-2', tier: 'easy', rule: { type: 'product-rows', product: 6, rows: 2 }, prompt: 'Make an array for 6 with 2 rows.', hint: '2 rows: how many in each row to make 6?' },
  { id: 'm-square-9', tier: 'easy', rule: { type: 'square', product: 9 }, prompt: 'Make a square array with 9 cubes.', hint: 'A square has the same number of rows and columns.' },
  // Medium: find the other factor, or a missing shape
  { id: 'm-rows-12-3', tier: 'medium', rule: { type: 'product-rows', product: 12, rows: 3 }, prompt: 'Make an array for 12 with 3 rows.', hint: '3 × ? = 12. Try skip counting by 3.' },
  { id: 'm-cols-18-3', tier: 'medium', rule: { type: 'product-cols', product: 18, cols: 3 }, prompt: 'Make an array for 18 with 3 columns.', hint: '? × 3 = 18. Count by 3s until you reach 18.' },
  { id: 'm-exact-6-4', tier: 'medium', rule: { type: 'exact', rows: 6, cols: 4 }, prompt: 'Build 6 rows of 4.', hint: '6 × 4 = 24.' },
  { id: 'm-square-16', tier: 'medium', rule: { type: 'square', product: 16 }, prompt: 'Make a square array with 16 cubes.', hint: 'Which number times itself makes 16?' },
  // Hard: products with a condition, larger facts
  { id: 'm-exact-7-8', tier: 'hard', rule: { type: 'exact', rows: 7, cols: 8 }, prompt: 'Build 7 rows of 8.', hint: '7 × 8 = 56. Count the cubes to check.' },
  { id: 'm-wide-36', tier: 'hard', rule: { type: 'product-wide', product: 36 }, prompt: 'Make an array for 36 with more columns than rows.', hint: 'The factors of 36 that fit here are 4 and 9.' },
  { id: 'm-tall-40', tier: 'hard', rule: { type: 'product-tall', product: 40 }, prompt: 'Make an array for 40 with more rows than columns.', hint: '8 and 5 multiply to 40. Which one are the rows?' },
  { id: 'm-square-81', tier: 'hard', rule: { type: 'square', product: 81 }, prompt: 'Make a square array with 81 cubes.', hint: '9 × 9. You will need the largest array.' },
]
