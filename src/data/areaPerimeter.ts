import type { Tier } from './challenges'

/**
 * Area and Perimeter on a unit grid. A shape is a set of unit squares. Area is
 * how many squares it covers; perimeter is how many unit edges lie on its
 * boundary. Two shapes: a rectangle, and an L-shape (a rectangle with a
 * rectangular notch cut from one corner), where cutting the corner takes away
 * area but leaves the perimeter unchanged.
 */
export type AreaShape = 'rect' | 'l'

export const SIDE_MIN = 1
export const SIDE_MAX = 12

export const SHAPE_LABELS: Record<AreaShape, string> = { rect: 'Rectangle', l: 'L-shape' }

export interface AreaState {
  shape: AreaShape
  w: number
  h: number
  /** Size of the notch cut from the top-right corner (L-shape only). */
  nw: number
  nh: number
}

/** Where a learner starts: 6 × 4 (area 24, perimeter 20). Does not solve the first challenge of any tier. */
export const DEFAULT_AREA: AreaState = { shape: 'rect', w: 6, h: 4, nw: 2, nh: 2 }

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.floor(n)))

/** Make a state valid: sides in range, an L-shape at least 2 × 2, a notch that leaves an L. */
export function validState(s: AreaState): AreaState {
  const min = s.shape === 'l' ? 2 : SIDE_MIN
  const w = clamp(s.w, min, SIDE_MAX)
  const h = clamp(s.h, min, SIDE_MAX)
  return { shape: s.shape, w, h, nw: clamp(s.nw, 1, Math.max(1, w - 1)), nh: clamp(s.nh, 1, Math.max(1, h - 1)) }
}

/** A unit square, column x (0 = left) and row y (0 = bottom). */
export interface Cell {
  x: number
  y: number
}

export function cellsOf(s: AreaState): Cell[] {
  const cells: Cell[] = []
  for (let y = 0; y < s.h; y++)
    for (let x = 0; x < s.w; x++) {
      const inNotch = s.shape === 'l' && x >= s.w - s.nw && y >= s.h - s.nh
      if (!inNotch) cells.push({ x, y })
    }
  return cells
}

/** One unit of boundary: the edge of cell (x, y) on a given side. */
export interface Edge {
  x: number
  y: number
  side: 'left' | 'right' | 'bottom' | 'top'
}

export function boundaryEdges(cells: Cell[]): Edge[] {
  const has = new Set(cells.map((c) => `${c.x},${c.y}`))
  const edges: Edge[] = []
  for (const { x, y } of cells) {
    if (!has.has(`${x - 1},${y}`)) edges.push({ x, y, side: 'left' })
    if (!has.has(`${x + 1},${y}`)) edges.push({ x, y, side: 'right' })
    if (!has.has(`${x},${y - 1}`)) edges.push({ x, y, side: 'bottom' })
    if (!has.has(`${x},${y + 1}`)) edges.push({ x, y, side: 'top' })
  }
  return edges
}

export const areaOf = (s: AreaState) => (s.shape === 'rect' ? s.w * s.h : s.w * s.h - s.nw * s.nh)
/** An L-shape has the same perimeter as the rectangle around it. */
export const perimeterOf = (s: AreaState) => 2 * (s.w + s.h)

/** "6 × 4 = 24" or "6 × 5 − 2 × 2 = 26" */
export const areaWorking = (s: AreaState) =>
  s.shape === 'rect' ? `${s.w} × ${s.h} = ${areaOf(s)}` : `${s.w} × ${s.h} − ${s.nw} × ${s.nh} = ${areaOf(s)}`

/** "2 × (6 + 4) = 20" */
export const perimeterWorking = (s: AreaState) => `2 × (${s.w} + ${s.h}) = ${perimeterOf(s)}`

/** Largest area a rectangle with this perimeter can have inside the side limits (0 if none fits). */
export function maxAreaForPerimeter(perimeter: number): number {
  let best = 0
  for (let w = SIDE_MIN; w <= SIDE_MAX; w++) {
    const h = perimeter / 2 - w
    if (Number.isInteger(h) && h >= SIDE_MIN && h <= SIDE_MAX) best = Math.max(best, w * h)
  }
  return best
}

/** Smallest perimeter of a rectangle with this area inside the side limits (Infinity if none fits). */
export function minPerimeterForArea(area: number): number {
  let best = Infinity
  for (let w = SIDE_MIN; w <= SIDE_MAX; w++) {
    const h = area / w
    if (Number.isInteger(h) && h >= SIDE_MIN && h <= SIDE_MAX) best = Math.min(best, 2 * (w + h))
  }
  return best
}

/* ---------- Challenges ---------- */

export type AreaRule =
  | { type: 'exact-rect'; w: number; h: number }
  | { type: 'rect-area'; area: number }
  | { type: 'rect-perimeter'; perimeter: number }
  | { type: 'rect-both'; area: number; perimeter: number }
  | { type: 'l-area'; area: number }
  | { type: 'l-perimeter'; perimeter: number }
  | { type: 'l-both'; area: number; perimeter: number }
  /** A rectangle with this perimeter and the largest area that perimeter allows. */
  | { type: 'max-area'; perimeter: number }
  /** A rectangle with this area and the smallest perimeter that area allows. */
  | { type: 'min-perimeter'; area: number }

export interface AreaChallenge {
  id: string
  tier: Tier
  rule: AreaRule
  prompt: string
  hint: string
}

export function isAreaSolved(c: AreaChallenge, raw: AreaState): boolean {
  const s = validState(raw)
  const rect = s.shape === 'rect'
  const a = areaOf(s)
  const p = perimeterOf(s)
  const r = c.rule
  switch (r.type) {
    case 'exact-rect':
      return rect && s.w === r.w && s.h === r.h
    case 'rect-area':
      return rect && a === r.area
    case 'rect-perimeter':
      return rect && p === r.perimeter
    case 'rect-both':
      return rect && a === r.area && p === r.perimeter
    case 'l-area':
      return !rect && a === r.area
    case 'l-perimeter':
      return !rect && p === r.perimeter
    case 'l-both':
      return !rect && a === r.area && p === r.perimeter
    case 'max-area':
      return rect && p === r.perimeter && a === maxAreaForPerimeter(r.perimeter)
    case 'min-perimeter':
      return rect && a === r.area && p === minPerimeterForArea(r.area)
  }
}

// IDs are stable: they are stored in saved progress.
export const areaChallenges: AreaChallenge[] = [
  // Easy: build a rectangle, or hit one measurement
  { id: 'a-rect-3-4', tier: 'easy', rule: { type: 'exact-rect', w: 3, h: 4 }, prompt: 'Build a rectangle that is 3 wide and 4 tall.', hint: 'Its area is 3 × 4 = 12 square units.' },
  { id: 'a-area-15', tier: 'easy', rule: { type: 'rect-area', area: 15 }, prompt: 'Make a rectangle with an area of 15.', hint: 'Which two numbers multiply to 15?' },
  { id: 'a-perim-12', tier: 'easy', rule: { type: 'rect-perimeter', perimeter: 12 }, prompt: 'Make a rectangle with a perimeter of 12.', hint: 'Width + height must be 6. Try 2 and 4.' },
  { id: 'a-rect-5-5', tier: 'easy', rule: { type: 'exact-rect', w: 5, h: 5 }, prompt: 'Build a square with sides of 5.', hint: 'A square has equal sides.' },
  // Medium: hit area and perimeter together, first L-shapes
  { id: 'a-both-12-14', tier: 'medium', rule: { type: 'rect-both', area: 12, perimeter: 14 }, prompt: 'Make a rectangle with area 12 and perimeter 14.', hint: 'Width + height = 7, and width × height = 12.' },
  { id: 'a-both-16-20', tier: 'medium', rule: { type: 'rect-both', area: 16, perimeter: 20 }, prompt: 'Make a rectangle with area 16 and perimeter 20.', hint: 'Width + height = 10. Which pair multiplies to 16?' },
  { id: 'a-l-area-26', tier: 'medium', rule: { type: 'l-area', area: 26 }, prompt: 'Make an L-shape with an area of 26.', hint: 'The box around it minus the notch: 6 × 5 − 2 × 2 = 26.' },
  { id: 'a-l-perim-22', tier: 'medium', rule: { type: 'l-perimeter', perimeter: 22 }, prompt: 'Make an L-shape with a perimeter of 22.', hint: 'An L-shape has the same perimeter as the box around it: width + height = 11.' },
  // Hard: largest / smallest, two measurements on an L-shape
  { id: 'a-max-area-20', tier: 'hard', rule: { type: 'max-area', perimeter: 20 }, prompt: 'Using a perimeter of 20, make the rectangle with the largest area.', hint: 'The closer to a square, the more area for the same fence.' },
  { id: 'a-min-perim-36', tier: 'hard', rule: { type: 'min-perimeter', area: 36 }, prompt: 'Using an area of 36, make the rectangle with the smallest perimeter.', hint: 'Compare 4 × 9, 3 × 12 and 6 × 6.' },
  { id: 'a-both-35-24', tier: 'hard', rule: { type: 'rect-both', area: 35, perimeter: 24 }, prompt: 'Make a rectangle with area 35 and perimeter 24.', hint: 'Width + height = 12, and 5 × 7 = 35.' },
  { id: 'a-l-both-30-26', tier: 'hard', rule: { type: 'l-both', area: 30, perimeter: 26 }, prompt: 'Make an L-shape with area 30 and perimeter 26.', hint: 'Box width + height = 13. Then cut a notch to leave 30.' },
]
