import type { Tier } from './challenges'

export type Place = 'hundreds' | 'tens' | 'ones'

export interface PlaceValueCounts {
  hundreds: number
  tens: number
  ones: number
}

/** Tens and ones may exceed 9 so learners can see non-standard (regrouped) forms. */
export const PLACE_LIMITS: Record<Place, number> = { hundreds: 9, tens: 19, ones: 19 }

export const PLACE_INFO: Record<Place, { label: string; singular: string; value: number; color: string }> = {
  hundreds: { label: 'Hundreds', singular: 'hundred', value: 100, color: '#3b82f6' },
  tens: { label: 'Tens', singular: 'ten', value: 10, color: '#22d3ee' },
  ones: { label: 'Ones', singular: 'one', value: 1, color: '#facc15' },
}

export const PLACES: Place[] = ['hundreds', 'tens', 'ones']

export const placeValueTotal = (c: PlaceValueCounts) => c.hundreds * 100 + c.tens * 10 + c.ones

/** "300 + 40 + 5" (zero parts omitted, "0" when empty). */
export function expandedForm(c: PlaceValueCounts): string {
  const parts = [c.hundreds * 100, c.tens * 10, c.ones].filter((n) => n > 0)
  return parts.length ? parts.join(' + ') : '0'
}

const SMALL = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen',
]
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']

function underHundred(n: number): string {
  if (n < 20) return SMALL[n]
  const t = Math.floor(n / 10)
  const o = n % 10
  return o ? `${TENS[t]}-${SMALL[o]}` : TENS[t]
}

/** English words for 0–9999. */
export function numberToWords(n: number): string {
  if (n < 100) return underHundred(n)
  const parts: string[] = []
  const thousands = Math.floor(n / 1000)
  const hundreds = Math.floor((n % 1000) / 100)
  const rest = n % 100
  if (thousands) parts.push(`${SMALL[thousands]} thousand`)
  if (hundreds) parts.push(`${SMALL[hundreds]} hundred`)
  if (rest) parts.push(underHundred(rest))
  return parts.join(' ')
}

/* ---------- Regrouping (trading) ---------- */

export type RegroupKind = 'ones-to-ten' | 'ten-to-ones' | 'tens-to-hundred' | 'hundred-to-tens'

export interface RegroupSpec {
  from: Place
  fromBlocks: number
  to: Place
  toBlocks: number
  /** true when small blocks are bundled into a bigger one. */
  bundle: boolean
  label: string
}

export const REGROUP_SPECS: Record<RegroupKind, RegroupSpec> = {
  'ones-to-ten': { from: 'ones', fromBlocks: 10, to: 'tens', toBlocks: 1, bundle: true, label: '10 ones → 1 ten' },
  'ten-to-ones': { from: 'tens', fromBlocks: 1, to: 'ones', toBlocks: 10, bundle: false, label: '1 ten → 10 ones' },
  'tens-to-hundred': { from: 'tens', fromBlocks: 10, to: 'hundreds', toBlocks: 1, bundle: true, label: '10 tens → 1 hundred' },
  'hundred-to-tens': { from: 'hundreds', fromBlocks: 1, to: 'tens', toBlocks: 10, bundle: false, label: '1 hundred → 10 tens' },
}

export const REGROUP_KINDS = Object.keys(REGROUP_SPECS) as RegroupKind[]

/** Why a trade is unavailable, or null when it can be made. */
export function regroupBlocker(c: PlaceValueCounts, kind: RegroupKind): string | null {
  const s = REGROUP_SPECS[kind]
  if (c[s.from] < s.fromBlocks) return `Needs at least ${s.fromBlocks} ${s.from}`
  if (c[s.to] + s.toBlocks > PLACE_LIMITS[s.to]) return `Too many ${s.to} on the mat (max ${PLACE_LIMITS[s.to]})`
  return null
}

export function applyRegroup(c: PlaceValueCounts, kind: RegroupKind): PlaceValueCounts | null {
  if (regroupBlocker(c, kind)) return null
  const s = REGROUP_SPECS[kind]
  return { ...c, [s.from]: c[s.from] - s.fromBlocks, [s.to]: c[s.to] + s.toBlocks }
}

/** Animation timing shared by the 3D scene and the sound cue. Every trade moves 10 groups. */
export const REGROUP_FLIGHT_SECONDS = 0.6
export const REGROUP_STAGGER_SECONDS = 0.04
export const REGROUP_TOTAL_SECONDS = REGROUP_FLIGHT_SECONDS + 9 * REGROUP_STAGGER_SECONDS

export interface RegroupEvent {
  id: number
  kind: RegroupKind
}

export interface NumberSenseChallenge {
  id: string
  tier: Tier
  target: number
  /** Optional exact block counts the learner must use. */
  require?: Partial<PlaceValueCounts>
  prompt: string
  hint: string
}

// IDs are stable: they are stored in saved progress.
export const numberSenseChallenges: NumberSenseChallenge[] = [
  // Easy: build a number in standard form
  { id: 'n-243', tier: 'easy', target: 243, prompt: 'Build the number 243.', hint: '2 hundreds, 4 tens, 3 ones.' },
  { id: 'n-58', tier: 'easy', target: 58, prompt: 'Build the number 58.', hint: 'How many tens are in 50?' },
  { id: 'n-719', tier: 'easy', target: 719, prompt: 'Build seven hundred nineteen.', hint: '719 = 700 + 10 + 9.' },
  { id: 'n-90', tier: 'easy', target: 90, prompt: 'Build the number 90.', hint: '90 is nine tens and no ones.' },
  // Medium: zeros in the middle, first regrouping
  { id: 'n-406', tier: 'medium', target: 406, prompt: 'Build the number 406.', hint: 'The 0 means no tens at all.' },
  { id: 'n-505', tier: 'medium', target: 505, prompt: 'Build five hundred five.', hint: 'Hundreds and ones, but no tens.' },
  {
    id: 'n-34-14',
    tier: 'medium',
    target: 34,
    require: { ones: 14 },
    prompt: 'Show 34 using exactly 14 ones.',
    hint: '14 ones is 1 ten and 4 ones, so you need fewer tens.',
  },
  {
    id: 'n-81-11',
    tier: 'medium',
    target: 81,
    require: { ones: 11 },
    prompt: 'Show 81 using exactly 11 ones.',
    hint: '11 ones = 1 ten + 1 one. How many tens are left?',
  },
  // Hard: regroup across hundreds
  {
    id: 'n-130-0h',
    tier: 'hard',
    target: 130,
    require: { hundreds: 0 },
    prompt: 'Show 130 without any hundreds.',
    hint: '1 hundred is the same as 10 tens.',
  },
  {
    id: 'n-25-15',
    tier: 'hard',
    target: 25,
    require: { ones: 15 },
    prompt: 'Show 25 using 15 ones.',
    hint: 'Take one ten away and add ten ones.',
  },
  {
    id: 'n-115-0h',
    tier: 'hard',
    target: 115,
    require: { hundreds: 0 },
    prompt: 'Show 115 without any hundreds.',
    hint: '100 is ten tens, so 115 is 11 tens and 5 ones.',
  },
  {
    id: 'n-162-16t',
    tier: 'hard',
    target: 162,
    require: { tens: 16 },
    prompt: 'Show 162 using exactly 16 tens.',
    hint: '16 tens is 160. What is left over?',
  },
]

export function isNumberSenseSolved(ch: NumberSenseChallenge, c: PlaceValueCounts): boolean {
  if (placeValueTotal(c) !== ch.target) return false
  const req = ch.require ?? {}
  return PLACES.every((p) => req[p] === undefined || req[p] === c[p])
}
