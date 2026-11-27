import { describe, expect, it } from 'vitest'
import {
  ANGLE_MAX,
  ANGLE_MIN,
  DEFAULT_ANGLE,
  angleChallenges,
  angleFromPoint,
  classify,
  clampAngle,
  completeTurnOf,
  complementOf,
  isAngleSolved,
  supplementOf,
  turnFraction,
} from './angles'
import { TIERS, challengesForTier } from './challenges'

describe('classification', () => {
  it.each([
    [0, 'zero'], [1, 'acute'], [89, 'acute'], [90, 'right'], [91, 'obtuse'], [179, 'obtuse'],
    [180, 'straight'], [181, 'reflex'], [359, 'reflex'], [360, 'full'],
  ])('%i° is %s', (a, kind) => {
    expect(classify(a)).toBe(kind)
  })
  it('covers every whole degree exactly once', () => {
    for (let a = ANGLE_MIN; a <= ANGLE_MAX; a++) expect(classify(a)).toBeTruthy()
  })
})

describe('complement, supplement and the turn', () => {
  it('complement is under 90° only', () => {
    expect(complementOf(35)).toBe(55)
    expect(complementOf(90)).toBeNull()
    expect(complementOf(0)).toBe(90)
  })
  it('supplement is under 180° only', () => {
    expect(supplementOf(65)).toBe(115)
    expect(supplementOf(123)).toBe(57)
    expect(supplementOf(180)).toBeNull()
  })
  it('completing a full turn', () => {
    expect(completeTurnOf(250)).toBe(110)
    expect(completeTurnOf(360)).toBeNull()
  })
  it('each pair adds up', () => {
    for (let a = 1; a < 90; a++) expect(a + complementOf(a)!).toBe(90)
    for (let a = 1; a < 180; a++) expect(a + supplementOf(a)!).toBe(180)
    for (let a = 1; a < 360; a++) expect(a + completeTurnOf(a)!).toBe(360)
  })
  it('share of a full turn in lowest terms', () => {
    expect(turnFraction(90)).toBe('1/4')
    expect(turnFraction(180)).toBe('1/2')
    expect(turnFraction(270)).toBe('3/4')
    expect(turnFraction(45)).toBe('1/8')
    expect(turnFraction(125)).toBe('25/72')
    expect(turnFraction(0)).toBe('0')
    expect(turnFraction(360)).toBe('1')
  })
})

describe('clicking the protractor', () => {
  it('maps a point to the counterclockwise angle seen from above, snapped to 5°', () => {
    expect(angleFromPoint(5, 0)).toBe(0) // right
    expect(angleFromPoint(0, -5)).toBe(90) // up the screen (away from the viewer)
    expect(angleFromPoint(-5, 0)).toBe(180)
    expect(angleFromPoint(0, 5)).toBe(270) // down the screen
    expect(angleFromPoint(5, -5)).toBe(45)
  })
  it('snaps to the nearest 5° and never returns 360', () => {
    expect(angleFromPoint(5, -0.2)).toBe(0)
    expect(angleFromPoint(5, -0.5)).toBe(5) // about 5.7°
    expect(angleFromPoint(5, 0.1)).toBe(0) // just below the baseline rounds to 0, not 360
    for (let d = 0; d < 720; d += 7) {
      const r = (d * Math.PI) / 180
      const a = angleFromPoint(Math.cos(r) * 4, -Math.sin(r) * 4)
      expect(a).toBeGreaterThanOrEqual(0)
      expect(a).toBeLessThan(360)
      expect(a % 5).toBe(0)
    }
  })
  it('clamps typed angles', () => {
    expect([clampAngle(-4), clampAngle(361), clampAngle(12.6)]).toEqual([0, 360, 13])
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(angleChallenges.map((c) => c.id)).toEqual([
      'an-right', 'an-45', 'an-acute', 'an-straight',
      'an-comp-35', 'an-supp-65', 'an-obtuse-wide', 'an-reflex',
      'an-three-quarter', 'an-supp-123', 'an-turn-250', 'an-reflex-range',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(angleChallenges, t)).toHaveLength(4)
    expect(new Set(angleChallenges.map((c) => c.id)).size).toBe(angleChallenges.length)
  })
  it('every challenge can be solved by some whole-degree angle', () => {
    for (const c of angleChallenges) {
      const hits = Array.from({ length: 361 }, (_, a) => a).filter((a) => isAngleSolved(c, { angle: a }))
      expect(hits.length, c.id).toBeGreaterThan(0)
    }
  })
  it('exact answers match the story in the prompt', () => {
    const by = Object.fromEntries(angleChallenges.map((c) => [c.id, c]))
    expect(isAngleSolved(by['an-comp-35'], { angle: 90 - 35 })).toBe(true)
    expect(isAngleSolved(by['an-supp-65'], { angle: 180 - 65 })).toBe(true)
    expect(isAngleSolved(by['an-supp-123'], { angle: 180 - 123 })).toBe(true)
    expect(isAngleSolved(by['an-turn-250'], { angle: 360 - 250 })).toBe(true)
    expect(isAngleSolved(by['an-three-quarter'], { angle: (3 * 360) / 4 })).toBe(true)
  })
  it('the 57° challenge cannot be reached by clicking alone (needs fine control)', () => {
    const c = angleChallenges.find((x) => x.id === 'an-supp-123')!
    const clickable = Array.from({ length: 72 }, (_, i) => i * 5)
    expect(clickable.some((a) => isAngleSolved(c, { angle: a }))).toBe(false)
  })
  it('kind and range rules', () => {
    const by = Object.fromEntries(angleChallenges.map((c) => [c.id, c]))
    expect(isAngleSolved(by['an-acute'], { angle: 60 })).toBe(true)
    expect(isAngleSolved(by['an-acute'], { angle: 90 })).toBe(false)
    expect(isAngleSolved(by['an-reflex'], { angle: 181 })).toBe(true)
    expect(isAngleSolved(by['an-reflex'], { angle: 180 })).toBe(false)
    expect([150, 151, 179, 180].map((a) => isAngleSolved(by['an-obtuse-wide'], { angle: a }))).toEqual([false, true, true, false])
    expect([199, 200, 250, 251].map((a) => isAngleSolved(by['an-reflex-range'], { angle: a }))).toEqual([false, true, true, false])
  })
  it('the default angle does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(angleChallenges, t)[0]
      expect(isAngleSolved(first, DEFAULT_ANGLE), first.id).toBe(false)
    }
  })
})
