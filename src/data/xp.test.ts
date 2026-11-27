import { describe, expect, it } from 'vitest'
import { MAX_LEVEL, XP_BY_TIER, levelFromXp, xpToReach } from './xp'
import { MODULE_CHALLENGES } from './badges'

describe('xp and levels', () => {
  it('tiers are worth more as they get harder', () => {
    expect(XP_BY_TIER).toEqual({ easy: 10, medium: 20, hard: 30 })
  })

  it('level thresholds', () => {
    expect([1, 2, 3, 4, 5, 6].map(xpToReach)).toEqual([0, 50, 150, 300, 500, 750])
  })

  it.each([
    [0, 1, 0, 50],
    [49, 1, 49, 50],
    [50, 2, 0, 100],
    [149, 2, 99, 100],
    [150, 3, 0, 150],
    [720, 5, 220, 250],
  ])('%i XP -> level %i (%i into a %i span)', (xp, level, into, span) => {
    expect(levelFromXp(xp)).toEqual({ level, into, span })
  })

  it('handles bad input and the level cap', () => {
    expect(levelFromXp(-10).level).toBe(1)
    expect(levelFromXp(NaN).level).toBe(1)
    expect(levelFromXp(1.9).into).toBe(1)
    const top = levelFromXp(xpToReach(MAX_LEVEL) + 5000)
    expect(top).toEqual({ level: MAX_LEVEL, into: 5000, span: 0 })
  })

  it('all current challenges are worth 1920 XP', () => {
    const total = Object.values(MODULE_CHALLENGES)
      .flat()
      .reduce((n, c) => n + XP_BY_TIER[c.tier], 0)
    expect(total).toBe(1920)
  })
})
