import type { Tier } from './challenges'

/**
 * Symmetry. Two ways in:
 *  - Shapes: pick one of twelve shapes and see its lines of symmetry and its
 *    order of rotational symmetry (how many times it fits itself in one turn).
 *  - Mirror: a 6 × 6 pattern with a mirror line. Turn tiles on and off until the
 *    pattern is the same on both sides.
 */
export type SymMode = 'shapes' | 'mirror'
export const MODE_LABELS: Record<SymMode, string> = { shapes: 'Shapes', mirror: 'Mirror pattern' }

/* ---------------------------------------------------------------- Shapes */

export type ShapeId =
  | 'rectangle' | 'square' | 'scalene' | 'isosceles' | 'equilateral' | 'parallelogram'
  | 'rhombus' | 'kite' | 'trapezoid' | 'pentagon' | 'hexagon' | 'circle'

export interface Pt {
  x: number
  y: number
}

export interface ShapeDef {
  id: ShapeId
  name: string
  /** Corners, around the centre (y up). Empty for the circle. */
  corners: Pt[]
  /** Angles of the lines of symmetry in degrees, 0 (across) up to 180. Empty when there are none or infinitely many. */
  lineAngles: number[]
  lines: number | 'infinite'
  /** Order of rotational symmetry: how many times it matches itself in one full turn. */
  rotation: number | 'infinite'
}

const regular = (n: number, radius = 2): Pt[] =>
  Array.from({ length: n }, (_, k) => {
    const a = ((90 + (k * 360) / n) * Math.PI) / 180
    return { x: Math.cos(a) * radius, y: Math.sin(a) * radius }
  })

/** The n lines of a regular n-gon with a corner at the top: 90°, 90° + 180°/n, ... (mod 180). */
const regularLines = (n: number) => Array.from({ length: n }, (_, k) => (90 + (k * 180) / n) % 180).sort((a, b) => a - b)

export const SHAPES: ShapeDef[] = [
  { id: 'rectangle', name: 'Rectangle', corners: [{ x: -2, y: -1.2 }, { x: 2, y: -1.2 }, { x: 2, y: 1.2 }, { x: -2, y: 1.2 }], lineAngles: [0, 90], lines: 2, rotation: 2 },
  { id: 'square', name: 'Square', corners: [{ x: -1.5, y: -1.5 }, { x: 1.5, y: -1.5 }, { x: 1.5, y: 1.5 }, { x: -1.5, y: 1.5 }], lineAngles: [0, 45, 90, 135], lines: 4, rotation: 4 },
  { id: 'scalene', name: 'Scalene triangle', corners: [{ x: -2, y: -1.2 }, { x: 2.1, y: -1 }, { x: 0.4, y: 2 }], lineAngles: [], lines: 0, rotation: 1 },
  { id: 'isosceles', name: 'Isosceles triangle', corners: [{ x: -1.4, y: -1.4 }, { x: 1.4, y: -1.4 }, { x: 0, y: 2 }], lineAngles: [90], lines: 1, rotation: 1 },
  { id: 'equilateral', name: 'Equilateral triangle', corners: regular(3), lineAngles: regularLines(3), lines: 3, rotation: 3 },
  { id: 'parallelogram', name: 'Parallelogram', corners: [{ x: -2, y: -1 }, { x: 1, y: -1 }, { x: 2, y: 1 }, { x: -1, y: 1 }], lineAngles: [], lines: 0, rotation: 2 },
  { id: 'rhombus', name: 'Rhombus', corners: [{ x: 0, y: 2 }, { x: 1.3, y: 0 }, { x: 0, y: -2 }, { x: -1.3, y: 0 }], lineAngles: [0, 90], lines: 2, rotation: 2 },
  { id: 'kite', name: 'Kite', corners: [{ x: 0, y: 2 }, { x: 1.2, y: 0.5 }, { x: 0, y: -1.8 }, { x: -1.2, y: 0.5 }], lineAngles: [90], lines: 1, rotation: 1 },
  { id: 'trapezoid', name: 'Isosceles trapezoid', corners: [{ x: -2, y: -1.2 }, { x: 2, y: -1.2 }, { x: 1.2, y: 1.2 }, { x: -1.2, y: 1.2 }], lineAngles: [90], lines: 1, rotation: 1 },
  { id: 'pentagon', name: 'Regular pentagon', corners: regular(5), lineAngles: regularLines(5), lines: 5, rotation: 5 },
  { id: 'hexagon', name: 'Regular hexagon', corners: regular(6), lineAngles: regularLines(6), lines: 6, rotation: 6 },
  { id: 'circle', name: 'Circle', corners: [], lineAngles: [], lines: 'infinite', rotation: 'infinite' },
]
/** The shape shown first. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_SHAPE: ShapeId = 'kite'
export const getShape = (id: ShapeId) => SHAPES.find((s) => s.id === id) ?? SHAPES[0]

/** "Fits itself every 90°" for order 4; "every turn" for the circle; "only after a full turn" for order 1. */
export function rotationText(s: ShapeDef): string {
  if (s.rotation === 'infinite') return 'Fits itself after any turn'
  if (s.rotation === 1) return 'Only fits itself after a full turn (order 1)'
  return `Fits itself every ${Math.round(360 / s.rotation)}° (order ${s.rotation})`
}
export const linesText = (s: ShapeDef) =>
  s.lines === 'infinite' ? 'Infinitely many lines of symmetry' : s.lines === 0 ? 'No lines of symmetry' : `${s.lines} ${s.lines === 1 ? 'line' : 'lines'} of symmetry`

/* ---------------------------------------------------------------- Mirror grid */

export const GRID = 6
export type Axis = 'vertical' | 'horizontal' | 'diagonal'
export const AXIS_LABELS: Record<Axis, string> = { vertical: 'Up and down', horizontal: 'Across', diagonal: 'Diagonal' }

/** Row 0 is the top. cells[y * GRID + x] is true when the tile is on. */
export type Cells = boolean[]

/** The tile that mirrors (x, y) in an axis. */
export function mirrorOf(x: number, y: number, axis: Axis): [number, number] {
  if (axis === 'vertical') return [GRID - 1 - x, y]
  if (axis === 'horizontal') return [x, GRID - 1 - y]
  return [y, x]
}

/** Pairs of tiles that differ across an axis (each pair counted once). A tile on a diagonal mirror line has no pair. */
export function mismatches(cells: Cells, axis: Axis): [number, number][] {
  const out: [number, number][] = []
  for (let y = 0; y < GRID; y++)
    for (let x = 0; x < GRID; x++) {
      const [mx, my] = mirrorOf(x, y, axis)
      if (my * GRID + mx <= y * GRID + x) continue // each pair once
      if (cells[y * GRID + x] !== cells[my * GRID + mx]) out.push([x, y])
    }
  return out
}

export const isSymmetric = (cells: Cells, axes: Axis[]) => axes.every((a) => mismatches(cells, a).length === 0)
export const filledCount = (cells: Cells) => cells.filter(Boolean).length

/** Every tile that is on the wrong side of a mirror in any of the axes (to highlight). */
export function offTiles(cells: Cells, axes: Axis[]): Set<number> {
  const bad = new Set<number>()
  for (const axis of axes)
    for (const [x, y] of mismatches(cells, axis)) {
      const [mx, my] = mirrorOf(x, y, axis)
      bad.add(y * GRID + x)
      bad.add(my * GRID + mx)
    }
  return bad
}

const fromRows = (rows: string[]): Cells => rows.flatMap((r) => [...r].map((c) => c === '#'))
const toggle = (cells: Cells, flips: [number, number][]): Cells => {
  const next = [...cells]
  for (const [x, y] of flips) next[y * GRID + x] = !next[y * GRID + x]
  return next
}

export type PresetId = 'A' | 'B' | 'C' | 'D'

interface Preset {
  /** The tidy, symmetric picture. */
  target: Cells
  /** What the learner starts with: the picture with a few tiles wrong. */
  start: Cells
  axes: Axis[]
}

function preset(rows: string[], flips: [number, number][], axes: Axis[]): Preset {
  const target = fromRows(rows)
  return { target, start: toggle(target, flips), axes }
}

export const PRESETS: Record<PresetId, Preset> = {
  // Up-and-down symmetry (left mirrors right). Two tiles are wrong.
  A: preset(['.#..#.', '#.##.#', '######', '#.##.#', '.#..#.', '..##..'], [[3, 1], [5, 4]], ['vertical']),
  // Across symmetry (top mirrors bottom), and only that. Two tiles are wrong.
  B: preset(['.##...', '#..#..', '..###.', '..###.', '#..#..', '.##...'], [[3, 1], [4, 3]], ['horizontal']),
  // Both: left-right and top-bottom. Three tiles are wrong.
  C: preset(['#.##.#', '.####.', '..##..', '..##..', '.####.', '#.##.#'], [[1, 0], [4, 2], [0, 5]], ['vertical', 'horizontal']),
  // Diagonal symmetry (top-left to bottom-right). Three tiles are wrong.
  D: preset(['#.#..#', '..##..', '###.#.', '.#.#..', '..#.##', '#...#.'], [[1, 1], [4, 3], [5, 5]], ['diagonal']),
}

/** What a learner sees in free play: a pattern that is not symmetric. */
export const DEFAULT_CELLS: Cells = fromRows(['##...#', '#.#...', '.###..', '..#.#.', '...##.', '.....#'])
export const emptyCells = (): Cells => new Array(GRID * GRID).fill(false)
export const MIN_FILLED = 6 // a nearly empty grid is "symmetric" but proves nothing

/* ---------------------------------------------------------------- Challenges */

export type SymRule =
  | { type: 'lines'; count: number | 'infinite' }
  | { type: 'rotation'; order: number }
  /** As many lines of symmetry as its order of rotation, and at least two. */
  | { type: 'lines-equal-rotation' }
  /** Rotation of the given order and no lines of symmetry. */
  | { type: 'rotation-no-lines'; order: number }
  | { type: 'mirror'; preset: PresetId }

export interface SymChallenge {
  id: string
  tier: Tier
  rule: SymRule
  prompt: string
  hint: string
}

export const modeOfChallenge = (c: SymChallenge): SymMode => (c.rule.type === 'mirror' ? 'mirror' : 'shapes')

export interface SymView {
  shapeId: ShapeId
  /** The pattern for a mirror challenge, as the learner has changed it. */
  cellsFor: (challengeId: string) => Cells
}

export function isSymSolved(c: SymChallenge, v: SymView): boolean {
  const r = c.rule
  const s = getShape(v.shapeId)
  switch (r.type) {
    case 'lines':
      return s.lines === r.count
    case 'rotation':
      return s.rotation === r.order
    case 'lines-equal-rotation':
      return typeof s.lines === 'number' && s.lines >= 2 && s.lines === s.rotation
    case 'rotation-no-lines':
      return s.rotation === r.order && s.lines === 0
    case 'mirror': {
      const cells = v.cellsFor(c.id)
      return filledCount(cells) >= MIN_FILLED && isSymmetric(cells, PRESETS[r.preset].axes)
    }
  }
}

// IDs are stable: they are stored in saved progress.
export const symChallenges: SymChallenge[] = [
  // Easy: count lines of symmetry
  { id: 'sy-lines-4', tier: 'easy', rule: { type: 'lines', count: 4 }, prompt: 'Pick a shape with exactly 4 lines of symmetry.', hint: 'Fold it along each line: both halves must match. A square folds 4 ways.' },
  { id: 'sy-lines-1', tier: 'easy', rule: { type: 'lines', count: 1 }, prompt: 'Pick a shape with exactly 1 line of symmetry.', hint: 'Think of a kite, or a triangle with two equal sides.' },
  { id: 'sy-lines-0', tier: 'easy', rule: { type: 'lines', count: 0 }, prompt: 'Pick a shape with no lines of symmetry.', hint: 'No fold makes the halves match. Look at the slanted shapes.' },
  { id: 'sy-lines-inf', tier: 'easy', rule: { type: 'lines', count: 'infinite' }, prompt: 'Pick the shape with infinitely many lines of symmetry.', hint: 'Every line through the centre is a line of symmetry.' },
  // Medium: mirror patterns and turns
  { id: 'sy-fix-vertical', tier: 'medium', rule: { type: 'mirror', preset: 'A' }, prompt: 'Fix the pattern so the left side mirrors the right side.', hint: 'The red tiles have no match across the line. Turn them on or off.' },
  { id: 'sy-fix-across', tier: 'medium', rule: { type: 'mirror', preset: 'B' }, prompt: 'Fix the pattern so the top half mirrors the bottom half.', hint: 'Look for the tiles that differ across the middle.' },
  { id: 'sy-rot-3', tier: 'medium', rule: { type: 'rotation', order: 3 }, prompt: 'Pick a shape that fits itself 3 times in one full turn.', hint: 'It matches itself every 120°.' },
  { id: 'sy-fix-both', tier: 'medium', rule: { type: 'mirror', preset: 'C' }, prompt: 'Fix the pattern so it is symmetric both ways (left-right and top-bottom).', hint: 'Two mirror lines: every tile needs a match in each direction.' },
  // Hard: combine ideas
  { id: 'sy-lines-eq-rot', tier: 'hard', rule: { type: 'lines-equal-rotation' }, prompt: 'Pick a shape whose number of lines of symmetry equals its order of rotation (at least 2).', hint: 'Regular shapes have the same number of each. Rectangles and rhombuses have 2 and 2.' },
  { id: 'sy-rot-no-lines', tier: 'hard', rule: { type: 'rotation-no-lines', order: 2 }, prompt: 'Pick a shape with rotational symmetry of order 2 but no lines of symmetry.', hint: 'Turn it half way and it fits, but no fold works.' },
  { id: 'sy-lines-5', tier: 'hard', rule: { type: 'lines', count: 5 }, prompt: 'Pick a shape with exactly 5 lines of symmetry.', hint: 'A regular shape with 5 sides.' },
  { id: 'sy-fix-diagonal', tier: 'hard', rule: { type: 'mirror', preset: 'D' }, prompt: 'Fix the pattern so it mirrors across the diagonal from top left to bottom right.', hint: 'A tile at column x, row y must match the tile at column y, row x.' },
]
