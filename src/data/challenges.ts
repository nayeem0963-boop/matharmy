import type { Dimensions, ShapeId, ShapeMetrics } from './geometryShapes'

/* ------------------------------------------------------------------ */
/* Difficulty tiers                                                    */
/* ------------------------------------------------------------------ */
export type Tier = 'easy' | 'medium' | 'hard'
export const TIERS: Tier[] = ['easy', 'medium', 'hard']
export const TIER_LABELS: Record<Tier, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }

export const challengesForTier = <C extends { tier: Tier }>(challenges: C[], tier: Tier) =>
  challenges.filter((c) => c.tier === tier)

/* ------------------------------------------------------------------ */
/* Fractions                                                           */
/* ------------------------------------------------------------------ */
export interface FractionChallenge {
  id: string
  tier: Tier
  numerator: number
  denominator: number
}

// IDs are stable: they are stored in saved progress.
export const fractionChallenges: FractionChallenge[] = [
  // Easy: everyday fractions of one whole
  { id: 'f-1-2', tier: 'easy', numerator: 1, denominator: 2 },
  { id: 'f-1-4', tier: 'easy', numerator: 1, denominator: 4 },
  { id: 'f-3-4', tier: 'easy', numerator: 3, denominator: 4 },
  { id: 'f-2-3', tier: 'easy', numerator: 2, denominator: 3 },
  // Medium: less familiar denominators
  { id: 'f-2-5', tier: 'medium', numerator: 2, denominator: 5 },
  { id: 'f-3-8', tier: 'medium', numerator: 3, denominator: 8 },
  { id: 'f-5-6', tier: 'medium', numerator: 5, denominator: 6 },
  { id: 'f-7-10', tier: 'medium', numerator: 7, denominator: 10 },
  // Hard: improper fractions (more than one whole)
  { id: 'f-5-4', tier: 'hard', numerator: 5, denominator: 4 },
  { id: 'f-3-2', tier: 'hard', numerator: 3, denominator: 2 },
  { id: 'f-7-4', tier: 'hard', numerator: 7, denominator: 4 },
  { id: 'f-11-6', tier: 'hard', numerator: 11, denominator: 6 },
]

/** Equivalent fractions count as correct (e.g. 4/6 solves 2/3). */
export const isFractionSolved = (c: FractionChallenge, numerator: number, denominator: number) =>
  numerator > 0 && numerator * c.denominator === c.numerator * denominator

/* ------------------------------------------------------------------ */
/* Geometry                                                            */
/* ------------------------------------------------------------------ */
export interface GeometryState {
  shapeId: ShapeId
  dimensions: Dimensions
  metrics: ShapeMetrics
}

export interface GeometryChallenge {
  id: string
  tier: Tier
  prompt: string
  hint: string
  check: (state: GeometryState) => boolean
}

const near = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps

export const geometryChallenges: GeometryChallenge[] = [
  // Easy: recognise solids, one simple measurement
  {
    id: 'g-cube-27',
    tier: 'easy',
    prompt: 'Build a cube with a volume of 27 cubic units.',
    hint: 'Which number times itself three times makes 27?',
    check: (s) => s.shapeId === 'cube' && near(s.metrics.volume, 27),
  },
  {
    id: 'g-5-faces',
    tier: 'easy',
    prompt: 'Pick the solid with 5 faces, 9 edges and 6 vertices.',
    hint: 'Two of its faces are triangles.',
    check: (s) => s.shapeId === 'triangular-prism',
  },
  {
    id: 'g-curved',
    tier: 'easy',
    prompt: 'Pick the solid with 2 flat faces and 1 curved surface.',
    hint: 'Think of a can of soup.',
    check: (s) => s.shapeId === 'cylinder',
  },
  {
    id: 'g-sphere',
    tier: 'easy',
    prompt: 'Pick the solid with no edges and no vertices.',
    hint: 'It rolls in every direction.',
    check: (s) => s.shapeId === 'sphere',
  },
  // Medium: hit a target with two or three dimensions
  {
    id: 'g-prism-24',
    tier: 'medium',
    prompt: 'Make a rectangular prism with a volume of 24.',
    hint: 'Try l × w × h with small whole numbers.',
    check: (s) => s.shapeId === 'rectangular-prism' && near(s.metrics.volume, 24),
  },
  {
    id: 'g-cube-area-96',
    tier: 'medium',
    prompt: 'Build a cube with a surface area of 96.',
    hint: '96 ÷ 6 = 16. Which edge length gives a face of 16?',
    check: (s) => s.shapeId === 'cube' && near(s.metrics.surfaceArea, 96),
  },
  {
    id: 'g-cyl-r2-h3',
    tier: 'medium',
    prompt: 'Build a cylinder with radius 2 and height 3.',
    hint: 'Use the Radius and Height sliders.',
    check: (s) => s.shapeId === 'cylinder' && near(s.dimensions.width, 2) && near(s.dimensions.height, 3),
  },
  {
    id: 'g-prism-36',
    tier: 'medium',
    prompt: 'Make a rectangular prism with a volume of 36.',
    hint: 'Try 3 × 3 × 4 or 2 × 3 × 6.',
    check: (s) => s.shapeId === 'rectangular-prism' && near(s.metrics.volume, 36),
  },
  // Hard: surface area, triangles, half units, π
  {
    id: 'g-prism-area-52',
    tier: 'hard',
    prompt: 'Make a rectangular prism with a surface area of 52.',
    hint: 'Try dimensions 2, 3 and 4.',
    check: (s) => s.shapeId === 'rectangular-prism' && near(s.metrics.surfaceArea, 52),
  },
  {
    id: 'g-tri-12',
    tier: 'hard',
    prompt: 'Make a triangular prism with a volume of 12.',
    hint: '½ × b × h × l = 12, so b × h × l = 24.',
    check: (s) => s.shapeId === 'triangular-prism' && near(s.metrics.volume, 12),
  },
  {
    id: 'g-cube-3375',
    tier: 'hard',
    prompt: 'Build a cube with a volume of 3.375.',
    hint: 'Half units count: what is 1.5 × 1.5 × 1.5?',
    check: (s) => s.shapeId === 'cube' && near(s.metrics.volume, 3.375),
  },
  {
    id: 'g-cyl-16pi',
    tier: 'hard',
    prompt: 'Build a cylinder with a volume of about 50.27 (that is 16π).',
    hint: 'V = πr²h, so r²h must be 16.',
    check: (s) => s.shapeId === 'cylinder' && near(s.metrics.volume, 16 * Math.PI, 0.01),
  },
]
