import type { MathModule, MathModuleId } from './mathModules'

/** The three strands of the curriculum map. Every module belongs to exactly one. */
export type StrandId = 'number' | 'geometry' | 'thinking'

export interface Strand {
  id: StrandId
  title: string
}

export const STRANDS: Strand[] = [
  { id: 'number', title: 'Number and Operations' },
  { id: 'geometry', title: 'Geometry and Measurement' },
  { id: 'thinking', title: 'Mathematical Thinking' },
]

// A Record over every module id, so adding a module without choosing its strand is a type error.
export const MODULE_STRAND: Record<MathModuleId, StrandId> = {
  'number-sense': 'number',
  'add-subtract': 'number',
  multiplication: 'number',
  division: 'number',
  fractions: 'number',
  decimals: 'number',
  geometry: 'geometry',
  'area-perimeter': 'geometry',
  angles: 'geometry',
  patterns: 'thinking',
  'data-graphs': 'thinking',
}

/** First and last grade of a module, read from its "Grades 3–5" label. */
export function gradeRange(m: Pick<MathModule, 'gradeBand'>): [number, number] {
  const match = /(\d+)\s*[–-]\s*(\d+)/.exec(m.gradeBand)
  if (!match) throw new Error(`Cannot read the grades from "${m.gradeBand}"`)
  return [Number(match[1]), Number(match[2])]
}

export interface GradeFilter {
  id: 'all' | '1-2' | '3-4' | '5-7'
  label: string
  /** Inclusive grade range; null for "all". */
  range: [number, number] | null
}

export const GRADE_FILTERS: GradeFilter[] = [
  { id: 'all', label: 'All grades', range: null },
  { id: '1-2', label: 'Grades 1–2', range: [1, 2] },
  { id: '3-4', label: 'Grades 3–4', range: [3, 4] },
  { id: '5-7', label: 'Grades 5–7', range: [5, 7] },
]

/** A module is shown for a filter when its grades overlap the filter's. */
export function matchesGrades(m: Pick<MathModule, 'gradeBand'>, filter: GradeFilter): boolean {
  if (!filter.range) return true
  const [from, to] = gradeRange(m)
  return from <= filter.range[1] && to >= filter.range[0]
}

export interface StrandGroup {
  strand: Strand
  modules: MathModule[]
}

/**
 * Modules grouped by strand and sorted by the grade they start at (then where
 * they end, then registry order, which puts a foundation module first).
 * Strands with nothing to show are left out.
 */
export function groupModules(modules: MathModule[], filter: GradeFilter): StrandGroup[] {
  return STRANDS.map((strand) => ({
    strand,
    modules: modules
      .map((m, index) => ({ m, index }))
      .filter(({ m }) => MODULE_STRAND[m.id] === strand.id && matchesGrades(m, filter))
      .sort((a, b) => {
        const [fa, ta] = gradeRange(a.m)
        const [fb, tb] = gradeRange(b.m)
        return fa - fb || ta - tb || a.index - b.index
      })
      .map(({ m }) => m),
  })).filter((g) => g.modules.length > 0)
}
