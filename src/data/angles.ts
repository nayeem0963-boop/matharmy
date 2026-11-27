import type { Tier } from './challenges'

/**
 * Angles. One ray is fixed along the baseline (pointing right); the other turns
 * counterclockwise from it by a whole number of degrees, 0 to 360.
 */
export const ANGLE_MIN = 0
export const ANGLE_MAX = 360
/** Clicking the protractor snaps to this many degrees; the stepper goes one degree at a time. */
export const CLICK_SNAP = 5

export interface AngleState {
  angle: number
}

/** Where a learner starts. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_ANGLE: AngleState = { angle: 125 }

export const clampAngle = (n: number) => Math.min(ANGLE_MAX, Math.max(ANGLE_MIN, Math.round(n)))

export type AngleKind = 'zero' | 'acute' | 'right' | 'obtuse' | 'straight' | 'reflex' | 'full'

export function classify(angle: number): AngleKind {
  if (angle <= 0) return 'zero'
  if (angle < 90) return 'acute'
  if (angle === 90) return 'right'
  if (angle < 180) return 'obtuse'
  if (angle === 180) return 'straight'
  if (angle < 360) return 'reflex'
  return 'full'
}

export const KIND_NAMES: Record<AngleKind, string> = {
  zero: 'zero angle',
  acute: 'acute angle',
  right: 'right angle',
  obtuse: 'obtuse angle',
  straight: 'straight angle',
  reflex: 'reflex angle',
  full: 'full turn',
}

/** What each kind means, in a few words. */
export const KIND_HINTS: Record<AngleKind, string> = {
  zero: 'The two rays lie on top of each other.',
  acute: 'Less than 90°: sharper than a corner.',
  right: 'Exactly 90°: the corner of a square.',
  obtuse: 'Between 90° and 180°: wider than a corner.',
  straight: 'Exactly 180°: a straight line.',
  reflex: 'Between 180° and 360°: more than a half turn.',
  full: '360°: all the way round.',
}

/** The angle that adds to 90° with this one (only for angles under 90°). */
export const complementOf = (a: number): number | null => (a < 90 ? 90 - a : null)
/** The angle that adds to 180° with this one (only for angles under 180°). */
export const supplementOf = (a: number): number | null => (a < 180 ? 180 - a : null)
/** The angle that completes a full turn (only for angles under 360°). */
export const completeTurnOf = (a: number): number | null => (a < 360 ? 360 - a : null)

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/** The share of a full turn, in lowest terms: "1/4", "5/72", "0", "1". */
export function turnFraction(angle: number): string {
  if (angle === 0) return '0'
  if (angle === 360) return '1'
  const g = gcd(angle, 360)
  return `${angle / g}/${360 / g}`
}

/** Angle in degrees for a point on the ground plane (x to the right, z towards the viewer). */
export function angleFromPoint(x: number, z: number, snap = CLICK_SNAP): number {
  const deg = (Math.atan2(-z, x) * 180) / Math.PI // counterclockwise seen from above
  const positive = (deg + 360) % 360
  return clampAngle(Math.round(positive / snap) * snap) % 360 // 360 snaps back to 0: a click cannot make a full turn
}

/* ---------- Challenges ---------- */

export type AngleRule =
  | { type: 'exact'; angle: number }
  | { type: 'kind'; kind: AngleKind }
  /** Within a range, inclusive. */
  | { type: 'range'; min: number; max: number }

export interface AngleChallenge {
  id: string
  tier: Tier
  rule: AngleRule
  prompt: string
  hint: string
}

export function isAngleSolved(c: AngleChallenge, s: AngleState): boolean {
  const r = c.rule
  switch (r.type) {
    case 'exact':
      return s.angle === r.angle
    case 'kind':
      return classify(s.angle) === r.kind
    case 'range':
      return s.angle >= r.min && s.angle <= r.max
  }
}

// IDs are stable: they are stored in saved progress.
export const angleChallenges: AngleChallenge[] = [
  // Easy: name and make the main angles
  { id: 'an-right', tier: 'easy', rule: { type: 'exact', angle: 90 }, prompt: 'Make a right angle.', hint: 'The corner of a square: 90°.' },
  { id: 'an-45', tier: 'easy', rule: { type: 'exact', angle: 45 }, prompt: 'Make an angle of 45°.', hint: 'Half of a right angle.' },
  { id: 'an-acute', tier: 'easy', rule: { type: 'kind', kind: 'acute' }, prompt: 'Make any acute angle.', hint: 'Acute means less than 90°.' },
  { id: 'an-straight', tier: 'easy', rule: { type: 'exact', angle: 180 }, prompt: 'Make a straight angle.', hint: 'The two rays point in opposite directions: 180°.' },
  // Medium: complements, supplements and the other kinds
  { id: 'an-comp-35', tier: 'medium', rule: { type: 'exact', angle: 55 }, prompt: 'Make the angle that adds to 90° with 35°.', hint: '90° − 35° = 55°.' },
  { id: 'an-supp-65', tier: 'medium', rule: { type: 'exact', angle: 115 }, prompt: 'Make the angle that adds to 180° with 65°.', hint: '180° − 65° = 115°.' },
  { id: 'an-obtuse-wide', tier: 'medium', rule: { type: 'range', min: 151, max: 179 }, prompt: 'Make an obtuse angle that is bigger than 150°.', hint: 'Obtuse is between 90° and 180°. Go close to a straight line.' },
  { id: 'an-reflex', tier: 'medium', rule: { type: 'kind', kind: 'reflex' }, prompt: 'Make any reflex angle.', hint: 'Reflex means more than 180° but less than a full turn.' },
  // Hard: turns, and exact values that need fine control
  { id: 'an-three-quarter', tier: 'hard', rule: { type: 'exact', angle: 270 }, prompt: 'Make a three-quarter turn.', hint: 'A full turn is 360°. Three quarters of it is 270°.' },
  { id: 'an-supp-123', tier: 'hard', rule: { type: 'exact', angle: 57 }, prompt: 'Make the angle that adds to 180° with 123°.', hint: '180° − 123° = 57°. Use the − and + buttons for single degrees.' },
  { id: 'an-turn-250', tier: 'hard', rule: { type: 'exact', angle: 110 }, prompt: 'Make the angle that completes a full turn with 250°.', hint: '360° − 250° = 110°.' },
  { id: 'an-reflex-range', tier: 'hard', rule: { type: 'range', min: 200, max: 250 }, prompt: 'Make a reflex angle between 200° and 250°.', hint: 'More than a half turn, but less than 250°.' },
]
