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
import { addSubtractChallenges } from './addSubtract'
import { divisionChallenges } from './division'
import { angleChallenges } from './angles'
import { areaChallenges } from './areaPerimeter'
import { graphChallenges } from './dataGraphs'
import { decimalChallenges } from './decimals'
import { patternChallenges } from './patterns'
import { arrayChallenges } from './multiplication'
import { numberSenseChallenges } from './placeValue'

const ids = (list: { id: string }[]) => list.map((c) => c.id)
const empty = (): BadgeContext => ({
  solved: { fractions: [], geometry: [], 'number-sense': [], 'add-subtract': [], multiplication: [], division: [], patterns: [], 'area-perimeter': [], decimals: [], 'data-graphs': [], angles: [] },
  bestStreak: 0,
})
const earned = (ctx: BadgeContext) => evaluateBadges(ctx)

describe('badge catalogue', () => {
  it('keeps the saved-progress badge ids unchanged', () => {
    expect(BADGE_IDS).toEqual([
      'first-steps', 'fraction-finder', 'fraction-master', 'shape-shifter', 'geometry-master',
      'place-value-pro', 'add-subtract-pro', 'array-architect', 'fair-sharer', 'pattern-spotter', 'area-ace', 'decimal-detective', 'graph-guru', 'angle-ace', 'hot-streak', 'unstoppable', 'hard-mode-hero', 'matharmy-general',
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
    expect(ids(MODULE_CHALLENGES['add-subtract'])).toEqual(ids(addSubtractChallenges))
    expect(ids(MODULE_CHALLENGES.multiplication)).toEqual(ids(arrayChallenges))
    expect(ids(MODULE_CHALLENGES.division)).toEqual(ids(divisionChallenges))
    expect(ids(MODULE_CHALLENGES.patterns)).toEqual(ids(patternChallenges))
    expect(ids(MODULE_CHALLENGES['area-perimeter'])).toEqual(ids(areaChallenges))
    expect(ids(MODULE_CHALLENGES.decimals)).toEqual(ids(decimalChallenges))
    expect(ids(MODULE_CHALLENGES['data-graphs'])).toEqual(ids(graphChallenges))
    expect(ids(MODULE_CHALLENGES.angles)).toEqual(ids(angleChallenges))
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

  it('Add & Subtract Pro needs every Add & Subtract challenge', () => {
    const c = empty()
    c.solved['add-subtract'] = ids(addSubtractChallenges).slice(1)
    expect(earned(c)).not.toContain('add-subtract-pro')
    c.solved['add-subtract'] = ids(addSubtractChallenges)
    expect(earned(c)).toContain('add-subtract-pro')
  })

  it('Array Architect needs every Multiplication Arrays challenge', () => {
    const c = empty()
    c.solved.multiplication = ids(arrayChallenges).slice(1)
    expect(earned(c)).not.toContain('array-architect')
    c.solved.multiplication = ids(arrayChallenges)
    expect(earned(c)).toContain('array-architect')
  })

  it('Fair Sharer needs every Division and Grouping challenge', () => {
    const c = empty()
    c.solved.division = ids(divisionChallenges).slice(1)
    expect(earned(c)).not.toContain('fair-sharer')
    c.solved.division = ids(divisionChallenges)
    expect(earned(c)).toContain('fair-sharer')
  })

  it('Pattern Spotter needs every Patterns and Sequences challenge', () => {
    const c = empty()
    c.solved.patterns = ids(patternChallenges).slice(1)
    expect(earned(c)).not.toContain('pattern-spotter')
    c.solved.patterns = ids(patternChallenges)
    expect(earned(c)).toContain('pattern-spotter')
  })

  it('Area & Perimeter Ace needs every Area and Perimeter challenge', () => {
    const c = empty()
    c.solved['area-perimeter'] = ids(areaChallenges).slice(1)
    expect(earned(c)).not.toContain('area-ace')
    c.solved['area-perimeter'] = ids(areaChallenges)
    expect(earned(c)).toContain('area-ace')
  })

  it('Decimal Detective needs every Decimals and Percentages challenge', () => {
    const c = empty()
    c.solved.decimals = ids(decimalChallenges).slice(1)
    expect(earned(c)).not.toContain('decimal-detective')
    c.solved.decimals = ids(decimalChallenges)
    expect(earned(c)).toContain('decimal-detective')
  })

  it('Graph Guru needs every Data and Graphs challenge', () => {
    const c = empty()
    c.solved['data-graphs'] = ids(graphChallenges).slice(1)
    expect(earned(c)).not.toContain('graph-guru')
    c.solved['data-graphs'] = ids(graphChallenges)
    expect(earned(c)).toContain('graph-guru')
  })

  it('Angle Ace needs every Angles challenge', () => {
    const c = empty()
    c.solved.angles = ids(angleChallenges).slice(1)
    expect(earned(c)).not.toContain('angle-ace')
    c.solved.angles = ids(angleChallenges)
    expect(earned(c)).toContain('angle-ace')
  })

  it('MathArmy General needs every challenge in every module, and then earns every badge except streak-only ones that need the streak', () => {
    const c = empty()
    c.solved = {
      fractions: ids(fractionChallenges),
      geometry: ids(geometryChallenges),
      'number-sense': ids(numberSenseChallenges),
      'add-subtract': ids(addSubtractChallenges),
      multiplication: ids(arrayChallenges),
      division: ids(divisionChallenges),
      patterns: ids(patternChallenges),
      'area-perimeter': ids(areaChallenges),
      decimals: ids(decimalChallenges),
      'data-graphs': ids(graphChallenges),
      angles: ids(angleChallenges),
    }
    expect(earned(c)).toContain('matharmy-general')
    c.solved.geometry = c.solved.geometry.slice(1)
    expect(earned(c)).not.toContain('matharmy-general')
    c.solved.geometry = ids(geometryChallenges)
    c.bestStreak = 5
    expect(earned(c).sort()).toEqual([...BADGE_IDS].sort())
  })
})
