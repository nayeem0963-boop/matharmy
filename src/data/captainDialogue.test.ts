import { describe, expect, it } from 'vitest'
import { CAPTAIN_EVENTS, captainLine, captainLineCount, captainTip } from './captainDialogue'
import { mathModules } from './mathModules'

describe('Captain dialogue', () => {
  it('has several lines for every event, all non-empty and short enough for a bubble', () => {
    for (const e of CAPTAIN_EVENTS) {
      expect(captainLineCount(e)).toBeGreaterThanOrEqual(3)
      for (let i = 0; i < captainLineCount(e); i++) {
        const line = captainLine(e, i)
        expect(line.length).toBeGreaterThan(5)
        expect(line.length).toBeLessThan(60)
      }
    }
  })
  it('cycles predictably and never fails on odd numbers', () => {
    expect(captainLine('solve', 0)).toBe(captainLine('solve', captainLineCount('solve')))
    expect(captainLine('solve', 0)).not.toBe(captainLine('solve', 1))
    expect(captainLine('badge', -7)).toBeTruthy()
  })
  it('has a tip for every module', () => {
    for (const m of mathModules) {
      expect(captainTip(m.id, 0).length).toBeGreaterThan(5)
      expect(captainTip(m.id, 1)).toBeTruthy()
    }
  })
})
