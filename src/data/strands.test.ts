import { describe, expect, it } from 'vitest'
import { mathModules } from './mathModules'
import { GRADE_FILTERS, MODULE_STRAND, STRANDS, gradeRange, groupModules, matchesGrades } from './strands'

const filter = (id: string) => GRADE_FILTERS.find((f) => f.id === id)!

describe('strands and grades', () => {
  it('every module has a strand, and every strand has modules', () => {
    expect(Object.keys(MODULE_STRAND).sort()).toEqual(mathModules.map((m) => m.id).sort())
    for (const s of STRANDS) expect(Object.values(MODULE_STRAND)).toContain(s.id)
  })

  it('reads grade ranges from the label', () => {
    expect(gradeRange({ gradeBand: 'Grades 3–5' })).toEqual([3, 5])
    expect(gradeRange({ gradeBand: 'Grades 1-3' })).toEqual([1, 3])
    expect(() => gradeRange({ gradeBand: 'Everyone' })).toThrow()
  })
  it('every module has a sensible grade range within 1 to 7', () => {
    for (const m of mathModules) {
      const [from, to] = gradeRange(m)
      expect(from, m.id).toBeGreaterThanOrEqual(1)
      expect(to, m.id).toBeLessThanOrEqual(7)
      expect(from, m.id).toBeLessThanOrEqual(to)
    }
  })

  it('a filter matches modules whose grades overlap it', () => {
    const fractions = mathModules.find((m) => m.id === 'fractions')! // grades 3–5
    expect(matchesGrades(fractions, filter('all'))).toBe(true)
    expect(matchesGrades(fractions, filter('1-2'))).toBe(false)
    expect(matchesGrades(fractions, filter('3-4'))).toBe(true)
    expect(matchesGrades(fractions, filter('5-7'))).toBe(true)
  })

  it('shows every module once under "All grades", grouped by strand', () => {
    const groups = groupModules(mathModules, filter('all'))
    expect(groups.map((g) => g.strand.id)).toEqual(['number', 'geometry', 'thinking'])
    const ids = groups.flatMap((g) => g.modules.map((m) => m.id))
    expect(ids.sort()).toEqual(mathModules.map((m) => m.id).sort())
  })

  it('sorts a strand by starting grade, keeping the foundation module first on a tie', () => {
    const number = groupModules(mathModules, filter('all'))[0].modules.map((m) => m.id)
    expect(number).toEqual(['number-sense', 'add-subtract', 'multiplication', 'fractions', 'division', 'decimals'])
    const starts = number.map((id) => gradeRange(mathModules.find((m) => m.id === id)!)[0])
    expect(starts).toEqual([...starts].sort((a, b) => a - b))
  })

  it('filtering by grade drops modules and empty strands', () => {
    const early = groupModules(mathModules, filter('1-2'))
    const ids = early.flatMap((g) => g.modules.map((m) => m.id))
    expect(ids).toContain('number-sense')
    expect(ids).toContain('patterns')
    expect(ids).not.toContain('decimals') // grades 4–7
    expect(ids).not.toContain('angles') // grades 3–7
    // Geometry and Measurement has nothing for grades 1–2, so it is left out
    expect(early.map((g) => g.strand.id)).toEqual(['number', 'thinking'])
  })

  it('every grade filter shows at least one module', () => {
    for (const f of GRADE_FILTERS) expect(groupModules(mathModules, f).length, f.id).toBeGreaterThan(0)
  })
})
