import { describe, expect, it } from 'vitest'
import {
  TIERS,
  challengesForTier,
  fractionChallenges,
  geometryChallenges,
  isFractionSolved,
  type GeometryState,
} from './challenges'
import {
  computeMetrics,
  effectiveDimensions,
  type Dimensions,
  type ShapeId,
} from './geometryShapes'

const geo = (shapeId: ShapeId, width: number, height = width, depth = width): GeometryState => {
  const dimensions = effectiveDimensions(shapeId, { width, height, depth } as Dimensions)
  return { shapeId, dimensions, metrics: computeMetrics(shapeId, dimensions) }
}

describe('tiers', () => {
  it('are easy, medium, hard', () => {
    expect(TIERS).toEqual(['easy', 'medium', 'hard'])
  })
  it('challengesForTier filters and preserves order', () => {
    expect(challengesForTier(fractionChallenges, 'easy').map((c) => c.id)).toEqual([
      'f-1-2', 'f-1-4', 'f-3-4', 'f-2-3',
    ])
  })
})

describe('fraction challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(fractionChallenges.map((c) => c.id)).toEqual([
      'f-1-2', 'f-1-4', 'f-3-4', 'f-2-3',
      'f-2-5', 'f-3-8', 'f-5-6', 'f-7-10',
      'f-5-4', 'f-3-2', 'f-7-4', 'f-11-6',
    ])
  })

  it('ids match their numerator and denominator', () => {
    for (const c of fractionChallenges) expect(c.id).toBe(`f-${c.numerator}-${c.denominator}`)
  })

  it('hard tier is improper fractions only', () => {
    for (const c of challengesForTier(fractionChallenges, 'hard')) expect(c.numerator).toBeGreaterThan(c.denominator)
  })

  it('accepts the exact fraction and equivalents', () => {
    const twoThirds = fractionChallenges.find((c) => c.id === 'f-2-3')!
    expect(isFractionSolved(twoThirds, 2, 3)).toBe(true)
    expect(isFractionSolved(twoThirds, 4, 6)).toBe(true)
    expect(isFractionSolved(twoThirds, 8, 12)).toBe(true)
    expect(isFractionSolved(twoThirds, 3, 4)).toBe(false)
    expect(isFractionSolved(twoThirds, 2, 4)).toBe(false)
  })

  it('never counts zero as solved', () => {
    for (const c of fractionChallenges) expect(isFractionSolved(c, 0, 4)).toBe(false)
  })

  it('is solvable inside the UI limits (denominator <= 12, numerator <= 2 x denominator)', () => {
    for (const c of fractionChallenges) {
      let found = false
      for (let d = 1; d <= 12 && !found; d++)
        for (let n = 0; n <= d * 2 && !found; n++) if (isFractionSolved(c, n, d)) found = true
      expect(found, c.id).toBe(true)
    }
  })
})

describe('geometry challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(geometryChallenges.map((c) => c.id)).toEqual([
      'g-cube-27', 'g-5-faces', 'g-curved', 'g-sphere',
      'g-prism-24', 'g-cube-area-96', 'g-cyl-r2-h3', 'g-prism-36',
      'g-prism-area-52', 'g-tri-12', 'g-cube-3375', 'g-cyl-16pi',
    ])
  })

  // One known-good answer per challenge, so every check is exercised.
  const solutions: Record<string, GeometryState> = {
    'g-cube-27': geo('cube', 3),
    'g-5-faces': geo('triangular-prism', 2, 2, 2),
    'g-curved': geo('cylinder', 2, 2),
    'g-sphere': geo('sphere', 2),
    'g-prism-24': geo('rectangular-prism', 2, 4, 3),
    'g-cube-area-96': geo('cube', 4),
    'g-cyl-r2-h3': geo('cylinder', 2, 3),
    'g-prism-36': geo('rectangular-prism', 3, 4, 3),
    'g-prism-area-52': geo('rectangular-prism', 2, 4, 3),
    'g-tri-12': geo('triangular-prism', 2, 3, 4),
    'g-cube-3375': geo('cube', 1.5),
    'g-cyl-16pi': geo('cylinder', 2, 4),
  }

  it('has a known solution for every challenge', () => {
    expect(Object.keys(solutions).sort()).toEqual(geometryChallenges.map((c) => c.id).sort())
  })

  it.each(geometryChallenges.map((c) => [c.id, c] as const))('%s accepts its solution', (id, c) => {
    expect(c.check(solutions[id])).toBe(true)
  })

  it('rejects the wrong solid and wrong measurements', () => {
    const byId = Object.fromEntries(geometryChallenges.map((c) => [c.id, c]))
    expect(byId['g-cube-27'].check(geo('cube', 2))).toBe(false)
    expect(byId['g-cube-27'].check(geo('rectangular-prism', 3, 3, 3))).toBe(false) // same volume, wrong solid
    expect(byId['g-sphere'].check(geo('cylinder', 1, 1))).toBe(false)
    expect(byId['g-cyl-r2-h3'].check(geo('cylinder', 2, 4))).toBe(false)
    expect(byId['g-cyl-16pi'].check(geo('cylinder', 2, 3))).toBe(false)
  })

  it('has prompts and hints for every challenge', () => {
    for (const c of geometryChallenges) {
      expect(c.prompt.length).toBeGreaterThan(5)
      expect(c.hint.length).toBeGreaterThan(5)
    }
  })

  it('has 4 challenges per tier', () => {
    for (const t of TIERS) expect(challengesForTier(geometryChallenges, t)).toHaveLength(4)
  })
})
