import type { Tier } from './challenges'

/**
 * The Coordinate Plane, four quadrants, whole numbers from -6 to 6. Two ways in:
 * plot a single point, or move a triangle with slides, flips and turns.
 */
export const PLANE_MIN = -6
export const PLANE_MAX = 6

export interface Vec {
  x: number
  y: number
}

export type PlaneMode = 'plot' | 'move'
export const MODE_LABELS: Record<PlaneMode, string> = { plot: 'Plot a point', move: 'Move a shape' }

export const inPlane = (v: Vec) => v.x >= PLANE_MIN && v.x <= PLANE_MAX && v.y >= PLANE_MIN && v.y <= PLANE_MAX
export const clampCoord = (n: number) => Math.min(PLANE_MAX, Math.max(PLANE_MIN, Math.round(n)))
export const same = (a: Vec, b: Vec) => a.x === b.x && a.y === b.y
export const pairText = (v: Vec) => `(${v.x}, ${v.y})`

/** Where a learner starts plotting. Chosen so it does not already solve the first challenge of any tier. */
export const DEFAULT_POINT: Vec = { x: 2, y: 3 }

/** The shape that is moved: a right triangle with corners A, B and C. */
export const BASE_TRIANGLE: Vec[] = [
  { x: 1, y: 1 },
  { x: 3, y: 1 },
  { x: 1, y: 3 },
]
export const TRIANGLE_NAMES = ['A', 'B', 'C']

/* ---------- Quadrants and axes ---------- */

export type Quadrant = 'I' | 'II' | 'III' | 'IV'

/** The quadrant of a point, or null when it is on an axis. */
export function quadrantOf(v: Vec): Quadrant | null {
  if (v.x > 0 && v.y > 0) return 'I'
  if (v.x < 0 && v.y > 0) return 'II'
  if (v.x < 0 && v.y < 0) return 'III'
  if (v.x > 0 && v.y < 0) return 'IV'
  return null
}

/** "quadrant II", "on the x-axis", "on the y-axis" or "the origin". */
export function locationText(v: Vec): string {
  const q = quadrantOf(v)
  if (q) return `quadrant ${q}`
  if (v.x === 0 && v.y === 0) return 'the origin'
  return v.y === 0 ? 'on the x-axis' : 'on the y-axis'
}

/* ---------- Moving the triangle ---------- */

export type Move =
  | { type: 'slide'; dx: number; dy: number }
  | { type: 'flip-x' } // reflect over the x-axis: (x, y) -> (x, -y)
  | { type: 'flip-y' } // reflect over the y-axis: (x, y) -> (-x, y)
  | { type: 'turn'; quarter: 1 | -1 | 2 } // counterclockwise quarter turns about the origin

export const MOVE_LABELS = {
  'flip-x': 'Flip over the x-axis',
  'flip-y': 'Flip over the y-axis',
} as const

const apply = (v: Vec, m: Move): Vec => {
  switch (m.type) {
    case 'slide':
      return { x: v.x + m.dx, y: v.y + m.dy }
    case 'flip-x':
      return { x: v.x, y: -v.y }
    case 'flip-y':
      return { x: -v.x, y: v.y }
    case 'turn':
      return m.quarter === 1 ? { x: -v.y, y: v.x } : m.quarter === -1 ? { x: v.y, y: -v.x } : { x: -v.x, y: -v.y }
  }
}

/** Plain words for a move, used in the history list. */
export function moveText(m: Move): string {
  switch (m.type) {
    case 'slide': {
      const parts = [
        m.dx ? `${Math.abs(m.dx)} ${m.dx > 0 ? 'right' : 'left'}` : '',
        m.dy ? `${Math.abs(m.dy)} ${m.dy > 0 ? 'up' : 'down'}` : '',
      ].filter(Boolean)
      return `Slide ${parts.join(' and ')}`
    }
    case 'flip-x':
      return 'Flip over the x-axis'
    case 'flip-y':
      return 'Flip over the y-axis'
    case 'turn':
      return m.quarter === 2 ? 'Turn 180°' : m.quarter === 1 ? 'Turn 90° left' : 'Turn 90° right'
  }
}

/** The corners after a move, or null when a corner would leave the plane. */
export function moveTriangle(tri: Vec[], m: Move): Vec[] | null {
  const next = tri.map((v) => apply(v, m))
  return next.every(inPlane) ? next : null
}

/** The corners after a list of moves (null if any step leaves the plane). */
export function runMoves(moves: Move[], start: Vec[] = BASE_TRIANGLE): Vec[] | null {
  let tri: Vec[] | null = start
  for (const m of moves) {
    tri = tri && moveTriangle(tri, m)
    if (!tri) return null
  }
  return tri
}

/** The triangle with its history, as kept for one practice (or free-play) session. */
export interface TriangleState {
  tri: Vec[]
  history: Move[]
}
export const freshTriangle = (): TriangleState => ({ tri: BASE_TRIANGLE.map((v) => ({ ...v })), history: [] })

/* ---------- Challenges ---------- */

export type PlaneRule =
  | { type: 'point'; x: number; y: number }
  | { type: 'quadrant'; quadrant: Quadrant }
  | { type: 'axis'; axis: 'x' | 'y' }
  /** The two coordinates add up to zero, and it is not the origin. */
  | { type: 'sum-zero' }
  /** Corner A is at this point (after any moves). */
  | { type: 'corner-a'; x: number; y: number }
  /** All three corners are exactly here. */
  | { type: 'triangle'; corners: Vec[] }

export interface PlaneChallenge {
  id: string
  tier: Tier
  rule: PlaneRule
  prompt: string
  hint: string
}

/** Challenges about a point use plot mode; those about the triangle use move mode. */
export const modeOfChallenge = (c: PlaneChallenge): PlaneMode =>
  c.rule.type === 'corner-a' || c.rule.type === 'triangle' ? 'move' : 'plot'

/** What a challenge looks at: the plotted point, and the triangle as moved for that challenge. */
export interface PlaneView {
  point: Vec
  triangleFor: (challengeId: string) => Vec[]
}

export function isPlaneSolved(c: PlaneChallenge, view: PlaneView): boolean {
  const r = c.rule
  const p = view.point
  switch (r.type) {
    case 'point':
      return p.x === r.x && p.y === r.y
    case 'quadrant':
      return quadrantOf(p) === r.quadrant
    case 'axis':
      return r.axis === 'x' ? p.y === 0 && p.x !== 0 : p.x === 0 && p.y !== 0
    case 'sum-zero':
      return p.x + p.y === 0 && !(p.x === 0 && p.y === 0)
    case 'corner-a':
      return same(view.triangleFor(c.id)[0], { x: r.x, y: r.y })
    case 'triangle': {
      const tri = view.triangleFor(c.id)
      return r.corners.every((corner, i) => same(tri[i], corner))
    }
  }
}

// IDs are stable: they are stored in saved progress.
export const planeChallenges: PlaneChallenge[] = [
  // Easy: plot and name where a point is
  { id: 'cp-point-3-2', tier: 'easy', rule: { type: 'point', x: 3, y: 2 }, prompt: 'Plot the point (3, 2).', hint: 'x first (across), then y (up).' },
  { id: 'cp-quad-2', tier: 'easy', rule: { type: 'quadrant', quadrant: 'II' }, prompt: 'Plot any point in quadrant II.', hint: 'Quadrant II is top left: x is negative, y is positive.' },
  { id: 'cp-axis-x', tier: 'easy', rule: { type: 'axis', axis: 'x' }, prompt: 'Plot a point on the x-axis (not the origin).', hint: 'On the x-axis the height y is 0.' },
  { id: 'cp-point-neg', tier: 'easy', rule: { type: 'point', x: -4, y: -1 }, prompt: 'Plot the point (−4, −1).', hint: 'Both numbers are negative: left 4, down 1.' },
  // Medium: quadrants, reflections as coordinates, a first slide
  { id: 'cp-quad-3', tier: 'medium', rule: { type: 'quadrant', quadrant: 'III' }, prompt: 'Plot any point in quadrant III.', hint: 'Quadrant III is bottom left: x and y are both negative.' },
  { id: 'cp-reflect-y', tier: 'medium', rule: { type: 'point', x: -3, y: 2 }, prompt: 'Plot the reflection of (3, 2) over the y-axis.', hint: 'A flip over the y-axis changes the sign of x.' },
  { id: 'cp-sum-zero', tier: 'medium', rule: { type: 'sum-zero' }, prompt: 'Plot a point whose coordinates add up to zero (not the origin).', hint: 'Try (2, −2) or (−5, 5): the numbers are opposites.' },
  { id: 'cp-slide-a', tier: 'medium', rule: { type: 'corner-a', x: 4, y: 3 }, prompt: 'Slide the triangle so that corner A is at (4, 3).', hint: 'A starts at (1, 1). Slide 3 right and 2 up.' },
  // Hard: flips, turns and corners
  { id: 'cp-flip-x', tier: 'hard', rule: { type: 'triangle', corners: [{ x: 1, y: -1 }, { x: 3, y: -1 }, { x: 1, y: -3 }] }, prompt: 'Flip the triangle over the x-axis.', hint: 'Every y changes sign; every x stays the same.' },
  { id: 'cp-turn-90', tier: 'hard', rule: { type: 'triangle', corners: [{ x: -1, y: 1 }, { x: -1, y: 3 }, { x: -3, y: 1 }] }, prompt: 'Turn the triangle 90° to the left (counterclockwise) about the origin.', hint: 'A quarter turn left sends (x, y) to (−y, x).' },
  { id: 'cp-flip-slide', tier: 'hard', rule: { type: 'triangle', corners: [{ x: 1, y: 1 }, { x: -1, y: 1 }, { x: 1, y: 3 }] }, prompt: 'Flip the triangle over the y-axis, then slide it 2 to the right.', hint: 'After the flip A is at (−1, 1). Then add 2 to every x.' },
  { id: 'cp-corner-a-neg', tier: 'hard', rule: { type: 'corner-a', x: -2, y: -3 }, prompt: 'Move the triangle so that corner A is at (−2, −3).', hint: 'Slide 3 left and 4 down, or use a flip and a slide.' },
]
