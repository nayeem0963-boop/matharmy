import type { Tier } from './challenges'

/**
 * Probability with a spinner. The wheel has sectors in three colours; the learner
 * sets how many of each. The theoretical probability of a colour is its share of
 * the sectors. Spinning gives an experimental probability, which drifts toward
 * the theory as the number of spins grows.
 *
 * Spins come from a seeded stream (one number per spin, worked out from the seed
 * and the spin's position), so a run of spins can be replayed exactly and tested.
 */
export type Colour = 'red' | 'blue' | 'green'
export const COLOURS: Colour[] = ['red', 'blue', 'green']
export const COLOUR_HEX: Record<Colour, string> = { red: '#ef4444', blue: '#3b82f6', green: '#22c55e' }

export const SECTOR_MAX = 6
export const SPINS_MAX = 5000

export interface Sectors {
  red: number
  blue: number
  green: number
}

export interface SpinnerState extends Sectors {
  /** Spins done since the wheel was last changed. */
  spins: number
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_SPINNER: SpinnerState = { red: 2, blue: 2, green: 2, spins: 0 }

export const clampSectors = (n: number) => Math.min(SECTOR_MAX, Math.max(0, Math.floor(n)))
export const totalSectors = (s: Sectors) => s.red + s.blue + s.green

/** One number in [0, 1) for spin k of a seed (a small integer hash: deterministic and well spread). */
export function randomAt(seed: number, k: number): number {
  let t = (seed + Math.imul(k + 1, 0x9e3779b9)) >>> 0
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** The sector a spin lands on (0-based, reds first, then blues, then greens), or null with no sectors. */
export function sectorOfSpin(seed: number, k: number, s: Sectors): number | null {
  const total = totalSectors(s)
  return total === 0 ? null : Math.floor(randomAt(seed, k) * total)
}

export function colourOfSector(index: number, s: Sectors): Colour {
  return index < s.red ? 'red' : index < s.red + s.blue ? 'blue' : 'green'
}

export type Tally = Record<Colour, number>

/** How many of the first `spins` spins landed on each colour. */
export function tallyOf(seed: number, spins: number, s: Sectors): Tally {
  const tally: Tally = { red: 0, blue: 0, green: 0 }
  for (let k = 0; k < spins; k++) {
    const sector = sectorOfSpin(seed, k, s)
    if (sector !== null) tally[colourOfSector(sector, s)]++
  }
  return tally
}

/* ---------- Theory ---------- */

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** The theoretical probability of a colour as a fraction in lowest terms ("1/3", "0", "1"). */
export function probabilityFraction(colour: Colour, s: Sectors): string {
  const total = totalSectors(s)
  if (total === 0) return '—'
  const n = s[colour]
  if (n === 0) return '0'
  if (n === total) return '1'
  const g = gcd(n, total)
  return `${n / g}/${total / g}`
}

export const probabilityOf = (colour: Colour, s: Sectors) => {
  const total = totalSectors(s)
  return total === 0 ? 0 : s[colour] / total
}

/** A percentage with at most one decimal place ("33.3%", "50%"). */
export const percentText = (p: number) => `${Math.round(p * 1000) / 10}%`

export type Likelihood = 'impossible' | 'unlikely' | 'even chance' | 'likely' | 'certain'

/** The everyday word for a probability. Even chance is exactly one half; unlikely and likely are the rest below and above it. */
export function likelihoodOf(p: number): Likelihood {
  if (p <= 0) return 'impossible'
  if (p >= 1) return 'certain'
  if (p === 0.5) return 'even chance'
  return p < 0.5 ? 'unlikely' : 'likely'
}

/** "Red: 3 of 6 sectors, 1/2, 50%, even chance" */
export function theoryText(colour: Colour, s: Sectors): string {
  const total = totalSectors(s)
  if (total === 0) return 'No sectors yet'
  return `${s[colour]} of ${total} sectors: ${probabilityFraction(colour, s)}, ${percentText(probabilityOf(colour, s))}, ${likelihoodOf(probabilityOf(colour, s))}`
}

/* ---------- Challenges ---------- */

export type SpinnerRule =
  /** The chance of this colour equals num/den (any wheel that gives that fraction). */
  | { type: 'prob'; colour: Colour; num: number; den: number }
  | { type: 'impossible'; colour: Colour }
  | { type: 'certain'; colour: Colour }
  | { type: 'all-equal' }
  /** red has more sectors than blue, and blue more than green */
  | { type: 'order' }
  | { type: 'fair-two-colour' }
  | { type: 'likelihood'; colour: Colour; word: Likelihood }
  | { type: 'spins'; min: number }
  | { type: 'all'; rules: SpinnerRule[] }

export interface SpinnerChallenge {
  id: string
  tier: Tier
  rule: SpinnerRule
  prompt: string
  hint: string
}

function ruleHolds(r: SpinnerRule, s: SpinnerState): boolean {
  const total = totalSectors(s)
  switch (r.type) {
    case 'prob':
      return total > 0 && s[r.colour] * r.den === r.num * total
    case 'impossible':
      return total > 0 && s[r.colour] === 0
    case 'certain':
      return total > 0 && s[r.colour] === total
    case 'all-equal':
      return s.red === s.blue && s.blue === s.green && s.red > 0
    case 'order':
      return s.red > s.blue && s.blue > s.green
    case 'fair-two-colour':
      return s.green === 0 && s.red === s.blue && s.red > 0
    case 'likelihood':
      return total > 0 && likelihoodOf(probabilityOf(r.colour, s)) === r.word
    case 'spins':
      return s.spins >= r.min
    case 'all':
      return r.rules.every((x) => ruleHolds(x, s))
  }
}

export const isSpinnerSolved = (c: SpinnerChallenge, s: SpinnerState) => ruleHolds(c.rule, s)

// IDs are stable: they are stored in saved progress.
export const spinnerChallenges: SpinnerChallenge[] = [
  // Easy: build a wheel with a described chance
  { id: 'pr-red-half', tier: 'easy', rule: { type: 'prob', colour: 'red', num: 1, den: 2 }, prompt: 'Make a wheel where the chance of red is 1/2.', hint: 'Half of the sectors must be red: 1 red and 1 other, or 2 and 2, or 3 and 3 …' },
  { id: 'pr-green-impossible', tier: 'easy', rule: { type: 'impossible', colour: 'green' }, prompt: 'Make landing on green impossible.', hint: 'If there are no green sectors, green can never happen.' },
  { id: 'pr-blue-certain', tier: 'easy', rule: { type: 'certain', colour: 'blue' }, prompt: 'Make landing on blue certain.', hint: 'Every sector has to be blue.' },
  { id: 'pr-all-equal', tier: 'easy', rule: { type: 'all-equal' }, prompt: 'Make all three colours equally likely.', hint: 'The same number of red, blue and green sectors (not zero).' },
  // Medium: fractions, ordering, and a first experiment
  { id: 'pr-red-quarter', tier: 'medium', rule: { type: 'prob', colour: 'red', num: 1, den: 4 }, prompt: 'Make a wheel where the chance of red is 1/4.', hint: 'Red is one quarter of all the sectors: 1 red in 4, or 2 red in 8, or 3 in 12 …' },
  { id: 'pr-order', tier: 'medium', rule: { type: 'order' }, prompt: 'Make red more likely than blue, and blue more likely than green.', hint: 'More sectors means more likely. For example 3 red, 2 blue, 1 green.' },
  { id: 'pr-spin-50', tier: 'medium', rule: { type: 'spins', min: 50 }, prompt: 'Spin the wheel at least 50 times.', hint: 'Use "Spin 10 times" or "Spin 100 times". Watch the bars grow.' },
  { id: 'pr-blue-two-thirds', tier: 'medium', rule: { type: 'prob', colour: 'blue', num: 2, den: 3 }, prompt: 'Make a wheel where the chance of blue is 2/3.', hint: 'Two thirds of the sectors are blue: 2 blue and 1 other, 4 and 2, or 6 and 3.' },
  // Hard: harder fractions, a fair test, and a long run
  { id: 'pr-green-3-8', tier: 'hard', rule: { type: 'prob', colour: 'green', num: 3, den: 8 }, prompt: 'Make a wheel where the chance of green is 3/8.', hint: 'You need 8 sectors with 3 green, or 16 with 6 green.' },
  { id: 'pr-red-unlikely', tier: 'hard', rule: { type: 'likelihood', colour: 'red', word: 'unlikely' }, prompt: 'Make red unlikely, but not impossible.', hint: 'Less than half of the sectors are red, and at least one is.' },
  { id: 'pr-fair-100', tier: 'hard', rule: { type: 'all', rules: [{ type: 'fair-two-colour' }, { type: 'spins', min: 100 }] }, prompt: 'Make a fair two-colour wheel (red and blue only, equal), then spin it 100 times.', hint: 'Fair means red and blue have the same number of sectors. Then press "Spin 100 times".' },
  { id: 'pr-spin-300', tier: 'hard', rule: { type: 'spins', min: 300 }, prompt: 'Spin the wheel at least 300 times and watch the bars settle.', hint: 'Spin 100 times, three times over. Changing the wheel starts the count again.' },
]
