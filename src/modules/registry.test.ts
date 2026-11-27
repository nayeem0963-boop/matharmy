import { describe, expect, it } from 'vitest'
import { MODULE_CHALLENGES } from '../data/badges'
import { mathModules } from '../data/mathModules'
import { defaultProgress } from '../utils/progressStore'

/**
 * A module id has to be known in four places today. These tests fail loudly when
 * a new module is added in one place and forgotten in another.
 */
describe('module registry consistency', () => {
  const ids = mathModules.map((m) => m.id).sort()
  it('saved progress has a slot for every module', () => {
    expect(Object.keys(defaultProgress().modules).sort()).toEqual(ids)
  })
  it('badge rules know every module’s challenges', () => {
    expect(Object.keys(MODULE_CHALLENGES).sort()).toEqual(ids)
  })
  it('module ids are unique and URL-safe (they become hash routes)', () => {
    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) expect(id).toMatch(/^[a-z0-9-]+$/)
  })
  it('every module has display metadata', () => {
    for (const m of mathModules) {
      expect(m.title && m.tabLabel && m.gradeBand && m.color).toBeTruthy()
      expect(m.skills.length).toBeGreaterThan(0)
    }
  })
})
