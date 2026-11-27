export type MathModuleId = 'fractions' | 'geometry' | 'number-sense'

export type MathModuleStatus = 'available' | 'coming-soon'

export interface MathModule {
  id: MathModuleId
  title: string
  tagline: string
  description: string
  gradeBand: string
  status: MathModuleStatus
  /** Accent colour used by the module's tab and 3D scene. */
  color: string
  skills: string[]
}

export const mathModules: MathModule[] = [
  {
    id: 'fractions',
    title: 'Fractions',
    tagline: 'See parts of a whole',
    description:
      'Build fractions from 3D blocks. Change the numerator and denominator and watch the bar split and fill.',
    gradeBand: 'Grades 3–5',
    status: 'available',
    color: '#f59e0b',
    skills: ['Parts of a whole', 'Equivalent fractions', 'Improper fractions'],
  },
  {
    id: 'geometry',
    title: 'Geometry',
    tagline: 'Shapes in three dimensions',
    description:
      'Explore faces, edges and vertices of 3D solids, and how nets fold into shapes.',
    gradeBand: 'Grades 4–7',
    status: 'coming-soon',
    color: '#22c55e',
    skills: ['Faces, edges, vertices', 'Nets', 'Volume'],
  },
  {
    id: 'number-sense',
    title: 'Number Sense',
    tagline: 'Place value you can touch',
    description:
      'Stack ones, tens and hundreds blocks to build numbers and see how regrouping works.',
    gradeBand: 'Grades 1–3',
    status: 'coming-soon',
    color: '#3b82f6',
    skills: ['Place value', 'Regrouping', 'Comparing numbers'],
  },
]

export const getModule = (id: MathModuleId): MathModule =>
  mathModules.find((m) => m.id === id) ?? mathModules[0]
