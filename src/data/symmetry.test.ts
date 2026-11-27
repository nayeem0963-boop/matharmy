import { describe, expect, it } from 'vitest'
import {
  DEFAULT_CELLS,
  DEFAULT_SHAPE,
  GRID,
  MIN_FILLED,
  PRESETS,
  SHAPES,
  emptyCells,
  filledCount,
  getShape,
  isSymSolved,
  isSymmetric,
  linesText,
  mirrorOf,
  mismatches,
  modeOfChallenge,
  offTiles,
  rotationText,
  symChallenges,
  type Axis,
  type Cells,
  type PresetId,
  type ShapeId,
} from './symmetry'
import { TIERS, challengesForTier } from './challenges'

const AXES: Axis[] = ['vertical', 'horizontal', 'diagonal']
// round, and turn -0 into 0, so equal points make equal keys
const n4 = (n: number) => (Math.round(n * 1e4) / 1e4 + 0).toFixed(4)

describe('shapes', () => {
  it('has twelve shapes with unique ids', () => {
    expect(SHAPES).toHaveLength(12)
    expect(new Set(SHAPES.map((s) => s.id)).size).toBe(12)
  })
  it('known lines of symmetry and orders of rotation', () => {
    const t = (id: ShapeId) => [getShape(id).lines, getShape(id).rotation]
    expect(t('square')).toEqual([4, 4])
    expect(t('rectangle')).toEqual([2, 2])
    expect(t('rhombus')).toEqual([2, 2])
    expect(t('parallelogram')).toEqual([0, 2])
    expect(t('equilateral')).toEqual([3, 3])
    expect(t('isosceles')).toEqual([1, 1])
    expect(t('scalene')).toEqual([0, 1])
    expect(t('kite')).toEqual([1, 1])
    expect(t('trapezoid')).toEqual([1, 1])
    expect(t('pentagon')).toEqual([5, 5])
    expect(t('hexagon')).toEqual([6, 6])
    expect(t('circle')).toEqual(['infinite', 'infinite'])
  })
  it('the lines drawn match the count', () => {
    for (const s of SHAPES) {
      if (s.lines === 'infinite') expect(s.lineAngles).toEqual([])
      else expect(s.lineAngles, s.id).toHaveLength(s.lines)
    }
  })
  it('regular polygons have n distinct lines and n corners at equal distance', () => {
    for (const id of ['equilateral', 'pentagon', 'hexagon'] as const) {
      const s = getShape(id)
      expect(new Set(s.lineAngles.map((a) => a.toFixed(6))).size).toBe(s.lines)
      const radii = s.corners.map((c) => Math.hypot(c.x, c.y))
      for (const r of radii) expect(r).toBeCloseTo(2, 10)
    }
  })
  it('each drawn line really is a line of symmetry: reflecting every corner gives the same set of corners', () => {
    const key = (p: { x: number; y: number }) => `${n4(p.x)},${n4(p.y)}`
    for (const s of SHAPES.filter((x) => x.corners.length)) {
      for (const angle of s.lineAngles) {
        const a = (angle * Math.PI) / 180
        const cos2 = Math.cos(2 * a)
        const sin2 = Math.sin(2 * a)
        const reflected = s.corners.map((p) => ({ x: p.x * cos2 + p.y * sin2, y: p.x * sin2 - p.y * cos2 }))
        expect(new Set(reflected.map(key)), `${s.id} ${angle}°`).toEqual(new Set(s.corners.map(key)))
      }
    }
  })
  it('each stated order of rotation really fits: turning the corners by 360/order gives the same set', () => {
    const key = (p: { x: number; y: number }) => `${n4(p.x)},${n4(p.y)}`
    for (const s of SHAPES.filter((x) => x.corners.length && typeof x.rotation === 'number')) {
      const a = (2 * Math.PI) / (s.rotation as number)
      const turned = s.corners.map((p) => ({ x: p.x * Math.cos(a) - p.y * Math.sin(a), y: p.x * Math.sin(a) + p.y * Math.cos(a) }))
      expect(new Set(turned.map(key)), s.id).toEqual(new Set(s.corners.map(key)))
    }
  })
  it('shapes with no line of symmetry are not accidentally symmetric about a coordinate axis', () => {
    for (const id of ['scalene', 'parallelogram'] as const) {
      const s = getShape(id)
      const key = (p: { x: number; y: number }) => `${p.x.toFixed(3)},${p.y.toFixed(3)}`
      for (const f of [(p: { x: number; y: number }) => ({ x: -p.x, y: p.y }), (p: { x: number; y: number }) => ({ x: p.x, y: -p.y })]) {
        expect(new Set(s.corners.map(f).map(key))).not.toEqual(new Set(s.corners.map(key)))
      }
    }
  })
  it('words', () => {
    expect(linesText(getShape('square'))).toBe('4 lines of symmetry')
    expect(linesText(getShape('kite'))).toBe('1 line of symmetry')
    expect(linesText(getShape('scalene'))).toBe('No lines of symmetry')
    expect(linesText(getShape('circle'))).toBe('Infinitely many lines of symmetry')
    expect(rotationText(getShape('square'))).toBe('Fits itself every 90° (order 4)')
    expect(rotationText(getShape('equilateral'))).toBe('Fits itself every 120° (order 3)')
    expect(rotationText(getShape('kite'))).toBe('Only fits itself after a full turn (order 1)')
    expect(rotationText(getShape('circle'))).toBe('Fits itself after any turn')
  })
})

describe('the mirror grid', () => {
  it('mirror tiles', () => {
    expect(mirrorOf(1, 2, 'vertical')).toEqual([4, 2])
    expect(mirrorOf(1, 2, 'horizontal')).toEqual([1, 3])
    expect(mirrorOf(1, 2, 'diagonal')).toEqual([2, 1])
    for (const a of AXES) for (let x = 0; x < GRID; x++) for (let y = 0; y < GRID; y++) {
      const [mx, my] = mirrorOf(x, y, a)
      expect(mirrorOf(mx, my, a)).toEqual([x, y]) // mirroring twice comes home
    }
  })
  it('an empty or full grid is symmetric every way', () => {
    for (const a of AXES) {
      expect(mismatches(emptyCells(), a)).toEqual([])
      expect(mismatches(new Array(GRID * GRID).fill(true), a)).toEqual([])
    }
  })
  it('counts each mismatched pair once', () => {
    const cells = emptyCells()
    cells[0] = true // top-left on; its vertical mirror (top-right) is off
    expect(mismatches(cells, 'vertical')).toEqual([[0, 0]])
    expect(offTiles(cells, ['vertical'])).toEqual(new Set([0, GRID - 1]))
  })
  it('a tile on the diagonal has no pair, so it never causes a mismatch', () => {
    const cells = emptyCells()
    cells[2 * GRID + 2] = true
    expect(mismatches(cells, 'diagonal')).toEqual([])
  })
  it('the free-play pattern is not symmetric any way', () => {
    for (const a of AXES) expect(mismatches(DEFAULT_CELLS, a).length, a).toBeGreaterThan(0)
  })
})

describe('mirror challenge patterns', () => {
  const ids = Object.keys(PRESETS) as PresetId[]
  it('each target is symmetric in its axes, and each start is not', () => {
    for (const id of ids) {
      const p = PRESETS[id]
      expect(isSymmetric(p.target, p.axes), `${id} target`).toBe(true)
      expect(isSymmetric(p.start, p.axes), `${id} start`).toBe(false)
      expect(filledCount(p.target), id).toBeGreaterThanOrEqual(MIN_FILLED)
    }
  })
  it('each start differs from its target by a few tiles (2 or 3)', () => {
    for (const id of ids) {
      const p = PRESETS[id]
      const diff = p.start.filter((v, i) => v !== p.target[i]).length
      expect(diff, id).toBeGreaterThanOrEqual(2)
      expect(diff, id).toBeLessThanOrEqual(3)
    }
  })
  it('the "both ways" pattern is symmetric both ways, not only one', () => {
    const c = PRESETS.C
    expect(isSymmetric(c.target, ['vertical'])).toBe(true)
    expect(isSymmetric(c.target, ['horizontal'])).toBe(true)
    expect(isSymmetric(c.start, ['vertical', 'horizontal'])).toBe(false)
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(symChallenges.map((c) => c.id)).toEqual([
      'sy-lines-4', 'sy-lines-1', 'sy-lines-0', 'sy-lines-inf',
      'sy-fix-vertical', 'sy-fix-across', 'sy-rot-3', 'sy-fix-both',
      'sy-lines-eq-rot', 'sy-rot-no-lines', 'sy-lines-5', 'sy-fix-diagonal',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(symChallenges, t)).toHaveLength(4)
    expect(new Set(symChallenges.map((c) => c.id)).size).toBe(symChallenges.length)
  })
  it('shape challenges are solved by at least one shape; mirror challenges by their target pattern', () => {
    for (const c of symChallenges) {
      if (modeOfChallenge(c) === 'shapes') {
        const hits = SHAPES.filter((s) => isSymSolved(c, { shapeId: s.id, cellsFor: () => emptyCells() }))
        expect(hits.length, c.id).toBeGreaterThan(0)
      } else {
        const rule = c.rule as { type: 'mirror'; preset: PresetId }
        expect(isSymSolved(c, { shapeId: 'square', cellsFor: () => PRESETS[rule.preset].target }), c.id).toBe(true)
      }
    }
  })
  it('the intended shapes solve the shape challenges', () => {
    const by = Object.fromEntries(symChallenges.map((c) => [c.id, c]))
    const solves = (id: string, shapeId: ShapeId) => isSymSolved(by[id], { shapeId, cellsFor: () => emptyCells() })
    expect(solves('sy-lines-4', 'square')).toBe(true)
    expect(solves('sy-lines-4', 'rectangle')).toBe(false)
    expect(solves('sy-lines-1', 'kite')).toBe(true)
    expect(solves('sy-lines-1', 'circle')).toBe(false)
    expect(solves('sy-lines-0', 'parallelogram')).toBe(true)
    expect(solves('sy-lines-0', 'square')).toBe(false)
    expect(solves('sy-lines-inf', 'circle')).toBe(true)
    expect(solves('sy-rot-3', 'equilateral')).toBe(true)
    expect(solves('sy-rot-3', 'isosceles')).toBe(false)
    expect(solves('sy-lines-eq-rot', 'hexagon')).toBe(true)
    expect(solves('sy-lines-eq-rot', 'rectangle')).toBe(true)
    expect(solves('sy-lines-eq-rot', 'kite')).toBe(false) // 1 and 1, but at least 2 needed
    expect(solves('sy-lines-eq-rot', 'circle')).toBe(false) // infinite, not a number
    expect(solves('sy-rot-no-lines', 'parallelogram')).toBe(true)
    expect(solves('sy-rot-no-lines', 'rectangle')).toBe(false) // order 2 but it has lines
    expect(solves('sy-lines-5', 'pentagon')).toBe(true)
  })
  it('a mirror challenge is not solved by an empty grid, a mirror-only start, or the wrong axis', () => {
    const by = Object.fromEntries(symChallenges.map((c) => [c.id, c]))
    const view = (cells: Cells) => ({ shapeId: 'square' as const, cellsFor: () => cells })
    expect(isSymSolved(by['sy-fix-vertical'], view(emptyCells()))).toBe(false) // symmetric but proves nothing
    expect(isSymSolved(by['sy-fix-vertical'], view(PRESETS.A.start))).toBe(false)
    expect(isSymSolved(by['sy-fix-vertical'], view(PRESETS.B.target))).toBe(false) // symmetric across, not up-and-down
    expect(isSymSolved(by['sy-fix-across'], view(PRESETS.A.target))).toBe(false) // symmetric up-and-down, not across
    expect(isSymSolved(by['sy-fix-both'], view(PRESETS.A.target))).toBe(false) // only one way
    expect(isSymSolved(by['sy-fix-both'], view(PRESETS.C.target))).toBe(true)
  })
  it('the default shape and free pattern do not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(symChallenges, t)[0]
      expect(isSymSolved(first, { shapeId: DEFAULT_SHAPE, cellsFor: () => DEFAULT_CELLS }), first.id).toBe(false)
    }
  })
})
