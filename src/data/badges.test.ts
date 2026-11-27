import { describe, expect, it } from 'vitest'
import {
  BADGES,
  BADGE_IDS,
  MODULE_CHALLENGES,
  evaluateBadges,
  getBadge,
  type BadgeContext,
} from './badges'
import { fractionChallenges, geometryChallenges } from './challenges'
import { numberSenseChallenges } from './placeValue'

const ids = (list: { id: string }[]) => list.map((c) => c.id)
const empty = (): BadgeContext => ({ solved: { fractions: [], geometry: [], 'number-sense': [] }, bestStreak: 0 })
const earned = (ctx: BadgeContext) => evaluateBadges(ctx)

describe('badge catalogue', () => {
  it('keeps the saved-progress badge ids unchanged', () => {
    expect(BADGE_IDS).toEqual([
      'first-steps', 'fraction-finder', 'fraction-master', 'shape-shifter', 'geometry-master',
      'place-value-pro', 'hot-streak', 'unstoppable', 'hard-mode-hero', 'matharmy-general',
    ])
  })
  it('has unique ids and complete metadata', () => {
    expect(new Set(BADGE_IDS).size).toBe(BADGES.length)
    for (const b of BADGES) {
      expect(b.title && b.description && b.icon).toBeTruthy()
    }
  })
  it('getBadge finds by id', () => {
    expect(getBadge('hot-streak')?.title).toBe('Hot Streak')
    expect(getBadge('missing')).toBeUndefined()
  })
  it('MODULE_CHALLENGES lists every challenge', () => {
    expect(ids(MODULE_CHALLENGES.fractions)).toEqual(ids(fractionChallenges))
    expect(ids(MODULE_CHALLENGES.geometry)).toEqual(ids(geometryChallenges))
    expect(ids(MODULE_CHALLENGES['number-sense'])).toEqual(ids(numberSenseChallenges))
  })
})

describe('badge rules', () => {
  it('earns nothing with no progress', () => {
    expect(earned(empty())).toEqual([])
  })

  it('First Steps: any one solve in any module', () => {
    const c = empty()
    c.solved['number-sense'] = ['n-58']
    expect(earned(c)).toEqual(['first-steps'])
  })

  it('Fraction Finder needs every Easy fraction; Fraction Master needs all', () => {
    const c = empty()
    c.solved.fractions = ['f-1-2', 'f-1-4', 'f-3-4']
    expect(earned(c)).not.toContain('fraction-finder')
    c.solved.fractions = ['f-1-2', 'f-1-4', 'f-3-4', 'f-2-3']
    expect(earned(c)).toContain('fraction-finder')
    expect(earned(c)).not.toContain('fraction-master')
    c.solved.fractions = ids(fractionChallenges)
    expect(earned(c)).toContain('fraction-master')
  })

  it('Shape Shifter at 3 geometry solves; Geometry Master at all', () => {
    const c = empty()
    c.solved.geometry = ['g-cube-27', 'g-sphere']
    expect(earned(c)).not.toContain('shape-shifter')
    c.solved.geometry = ['g-cube-27', 'g-sphere', 'g-curved']
    expect(earned(c)).toContain('shape-shifter')
    c.solved.geometry = ids(geometryChallenges)
    expect(earned(c)).toContain('geometry-master')
  })

  it('Place Value Pro needs all Number Sense challenges', () => {
    const c = empty()
    c.solved['number-sense'] = ids(numberSenseChallenges).slice(1)
    expect(earned(c)).not.toContain('place-value-pro')
    c.solved['number-sense'] = ids(numberSenseChallenges)
    expect(earned(c)).toContain('place-value-pro')
  })

  it('streak badges at 3 and 5', () => {
    const c = empty()
    c.bestStreak = 2
    expect(earned(c)).not.toContain('hot-streak')
    c.bestStreak = 3
    expect(earned(c)).toContain('hot-streak')
    expect(earned(c)).not.toContain('unstoppable')
    c.bestStreak = 5
    expect(earned(c)).toEqual(expect.arrayContaining(['hot-streak', 'unstoppable']))
  })

  it('Hard Mode Hero counts Hard solves across modules', () => {
    const c = empty()
    c.solved.fractions = ['f-5-4']
    c.solved.geometry = ['g-prism-area-52']
    expect(earned(c)).not.toContain('hard-mode-hero')
    c.solved['number-sense'] = ['n-25-15']
    expect(earned(c)).toContain('hard-mode-hero')
    // Easy solves do not count.
    const easy = empty()
    easy.solved.fractions = ['f-1-2', 'f-1-4', 'f-3-4']
    expect(earned(easy)).not.toContain('hard-mode-hero')
  })

  it('ignores unknown challenge ids', () => {
    const c = empty()
    c.solved.fractions = ['f-99-99']
    expect(earned(c)).toEqual([])
  })

  it('MathArmy General needs every challenge in every module, and then earns every badge except streak-only ones that need the streak', () => {
    const c = empty()
    c.solved = {
      fractions: ids(fractionChallenges),
      geometry: ids(geometryChallenges),
      'number-sense': ids(numberSenseChallenges),
    }
    expect(earned(c)).toContain('matharmy-general')
    c.solved.geometry = c.solved.geometry.slice(1)
    expect(earned(c)).not.toContain('matharmy-general')
    c.solved.geometry = ids(geometryChallenges)
    c.bestStreak = 5
    expect(earned(c).sort()).toEqual([...BADGE_IDS].sort())
  })
})
