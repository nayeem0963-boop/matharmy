export type MathModuleId = 'fractions' | 'geometry' | 'number-sense' | 'add-subtract' | 'multiplication' | 'division' | 'patterns' | 'area-perimeter' | 'decimals' | 'data-graphs'

export type MathModuleStatus = 'available' | 'coming-soon'

export interface MathModule {
  id: MathModuleId
  title: string
  /** Short label used in the header tabs. */
  tabLabel: string
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
    tabLabel: 'Fractions',
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
    title: 'Geometry 3D Explorer',
    tabLabel: 'Geometry',
    tagline: 'Shapes in three dimensions',
    description:
      'Resize 3D solids, unfold them into nets, and watch volume and surface area update live.',
    gradeBand: 'Grades 4–7',
    status: 'available',
    color: '#22c55e',
    skills: ['Faces, edges, vertices', 'Nets', 'Volume', 'Surface area'],
  },
  {
    id: 'number-sense',
    title: 'Number Sense',
    tabLabel: 'Number Sense',
    tagline: 'Place value you can touch',
    description:
      'Build numbers from hundreds flats, tens rods and ones cubes, then see them in standard, expanded and word form.',
    gradeBand: 'Grades 1–3',
    status: 'available',
    color: '#3b82f6',
    skills: ['Place value', 'Regrouping', 'Comparing numbers'],
  },
  {
    id: 'add-subtract',
    title: 'Add & Subtract',
    tabLabel: 'Add & Subtract',
    tagline: 'Carry and borrow with blocks',
    description:
      'Add or take away with base-ten blocks. Trade ten ones for a ten to carry, or break a ten to borrow, and see the column method alongside.',
    gradeBand: 'Grades 1–3',
    status: 'available',
    color: '#14b8a6',
    skills: ['Adding with carrying', 'Subtracting with borrowing', 'Column method'],
  },
  {
    id: 'multiplication',
    title: 'Multiplication Arrays',
    tabLabel: 'Multiply',
    tagline: 'Rows × columns as 3D grids',
    description:
      'Build rows and columns of cubes. Count row by row, swap the rows and columns, and see the repeated addition and the whole fact family.',
    gradeBand: 'Grades 2–5',
    status: 'available',
    color: '#f472b6',
    skills: ['Repeated addition', 'Skip counting', 'Order does not matter', 'Fact families'],
  },
  {
    id: 'division',
    title: 'Division and Grouping',
    tabLabel: 'Divide',
    tagline: 'Share and group, with leftovers',
    description:
      'Share cubes equally or make groups of a set size. See the quotient, the remainder and the multiplication that checks your division.',
    gradeBand: 'Grades 3–5',
    status: 'available',
    color: '#84cc16',
    skills: ['Sharing equally', 'Grouping', 'Remainders', 'Division and multiplication'],
  },
  {
    id: 'patterns',
    title: 'Patterns and Sequences',
    tabLabel: 'Patterns',
    tagline: 'Spot the rule, predict the next',
    description:
      'Build number patterns that add or multiply the same amount each time. See them as bars, jump to any term, and find the rule behind them.',
    gradeBand: 'Grades 1–6',
    status: 'available',
    color: '#fb7185',
    skills: ['Number patterns', 'Skip counting', 'Rules and terms', 'Doubling and growth'],
  },
  {
    id: 'area-perimeter',
    title: 'Area and Perimeter',
    tabLabel: 'Area',
    tagline: 'Count the tiles, trace the edge',
    description:
      'Build rectangles and L-shapes on a grid. Count the squares inside for area and the edges around the outside for perimeter, and see how they differ.',
    gradeBand: 'Grades 3–6',
    status: 'available',
    color: '#818cf8',
    skills: ['Area', 'Perimeter', 'Rectangles', 'Composite L-shapes'],
  },
  {
    id: 'decimals',
    title: 'Decimals and Percentages',
    tabLabel: 'Decimals',
    tagline: 'One amount, three ways',
    description:
      'Shade a hundred grid and read the same amount as a decimal, a fraction and a percent. Tenths are columns, hundredths are single squares.',
    gradeBand: 'Grades 4–7',
    status: 'available',
    color: '#e879f9',
    skills: ['Tenths and hundredths', 'Decimals', 'Percentages', 'Fractions as decimals'],
  },
  {
    id: 'data-graphs',
    title: 'Data and Graphs',
    tabLabel: 'Graphs',
    tagline: 'Build a graph, read the data',
    description:
      'Build a bar graph from a survey and read it as data: total, range, mean, median and mode. Change a bar and watch every number respond.',
    gradeBand: 'Grades 2–7',
    status: 'available',
    color: '#38bdf8',
    skills: ['Bar graphs', 'Reading data', 'Mean, median and mode', 'Range'],
  },
]

/** Teasers for the welcome page; not selectable yet. */
export interface UpcomingModule {
  title: string
  tagline: string
  color: string
}

export const upcomingModules: UpcomingModule[] = [
  { title: 'Coordinate Plane', tagline: 'Plot, slide, flip and turn', color: '#a78bfa' },
  { title: 'Angles', tagline: 'Measure with a 3D protractor', color: '#fb923c' },
]

export const getModule = (id: MathModuleId): MathModule =>
  mathModules.find((m) => m.id === id) ?? mathModules[0]
