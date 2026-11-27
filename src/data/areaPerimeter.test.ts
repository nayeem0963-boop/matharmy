import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AREA,
  SIDE_MAX,
  SIDE_MIN,
  areaChallenges,
  areaOf,
  areaWorking,
  boundaryEdges,
  cellsOf,
  isAreaSolved,
  maxAreaForPerimeter,
  minPerimeterForArea,
  perimeterOf,
  perimeterWorking,
  validState,
  type AreaShape,
  type AreaState,
} from './areaPerimeter'
import { TIERS, challengesForTier } from './challenges'

const rect = (w: number, h: number): AreaState => ({ shape: 'rect', w, h, nw: 1, nh: 1 })
const ell = (w: number, h: number, nw: number, nh: number): AreaState => ({ shape: 'l', w, h, nw, nh })

describe('area and perimeter', () => {
  it('rectangles', () => {
    expect(areaOf(rect(6, 4))).toBe(24)
    expect(perimeterOf(rect(6, 4))).toBe(20)
    expect(areaWorking(rect(6, 4))).toBe('6 × 4 = 24')
    expect(perimeterWorking(rect(6, 4))).toBe('2 × (6 + 4) = 20')
  })
  it('L-shapes lose area but not perimeter', () => {
    const s = ell(6, 5, 2, 2)
    expect(areaOf(s)).toBe(26)
    expect(perimeterOf(s)).toBe(22)
    expect(areaWorking(s)).toBe('6 × 5 − 2 × 2 = 26')
  })
  it('counting the squares and boundary edges agrees with the formulas, for every shape', () => {
    for (const shape of ['rect', 'l'] as AreaShape[])
      for (let w = 2; w <= SIDE_MAX; w++)
        for (let h = 2; h <= SIDE_MAX; h += 3)
          for (let nw = 1; nw < w; nw += 2)
            for (let nh = 1; nh < h; nh += 2) {
              const s: AreaState = { shape, w, h, nw, nh }
              const cells = cellsOf(s)
              expect(cells.length, JSON.stringify(s)).toBe(areaOf(s))
              expect(boundaryEdges(cells).length, JSON.stringify(s)).toBe(perimeterOf(s))
            }
  })
  it('a 1 × 1 square has area 1 and perimeter 4', () => {
    expect(cellsOf(rect(1, 1))).toHaveLength(1)
    expect(boundaryEdges(cellsOf(rect(1, 1)))).toHaveLength(4)
  })
  it('the notch is cut from the top-right corner', () => {
    const cells = cellsOf(ell(4, 3, 2, 1))
    expect(cells.some((c) => c.x === 3 && c.y === 2)).toBe(false) // top-right cell removed
    expect(cells.some((c) => c.x === 2 && c.y === 2)).toBe(false)
    expect(cells.some((c) => c.x === 1 && c.y === 2)).toBe(true)
    expect(cells.some((c) => c.x === 3 && c.y === 1)).toBe(true)
  })
})

describe('validState', () => {
  it('clamps sides and keeps L-shapes at least 2 × 2 with a notch that leaves an L', () => {
    expect(validState(rect(0, 99))).toMatchObject({ w: SIDE_MIN, h: SIDE_MAX })
    expect(validState(ell(1, 1, 5, 5))).toMatchObject({ w: 2, h: 2, nw: 1, nh: 1 })
    expect(validState(ell(5, 4, 9, 9))).toMatchObject({ nw: 4, nh: 3 })
    expect(validState(ell(5, 4, 0, 0))).toMatchObject({ nw: 1, nh: 1 })
  })
})

describe('largest area / smallest perimeter', () => {
  it('a square is best', () => {
    expect(maxAreaForPerimeter(20)).toBe(25)
    expect(minPerimeterForArea(36)).toBe(24)
    expect(minPerimeterForArea(24)).toBe(20) // 4 × 6
  })
  it('respects the side limit', () => {
    expect(maxAreaForPerimeter(48)).toBe(144)
    expect(minPerimeterForArea(13)).toBe(Infinity) // 1 × 13 does not fit, 13 is prime
    expect(maxAreaForPerimeter(3)).toBe(0) // odd perimeters are impossible
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(areaChallenges.map((c) => c.id)).toEqual([
      'a-rect-3-4', 'a-area-15', 'a-perim-12', 'a-rect-5-5',
      'a-both-12-14', 'a-both-16-20', 'a-l-area-26', 'a-l-perim-22',
      'a-max-area-20', 'a-min-perim-36', 'a-both-35-24', 'a-l-both-30-26',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(areaChallenges, t)).toHaveLength(4)
    expect(new Set(areaChallenges.map((c) => c.id)).size).toBe(areaChallenges.length)
  })
  it('every challenge can be solved inside the limits', () => {
    for (const c of areaChallenges) {
      let found = false
      for (const shape of ['rect', 'l'] as AreaShape[])
        for (let w = SIDE_MIN; w <= SIDE_MAX && !found; w++)
          for (let h = SIDE_MIN; h <= SIDE_MAX && !found; h++)
            for (let nw = 1; nw <= SIDE_MAX && !found; nw++)
              for (let nh = 1; nh <= SIDE_MAX && !found; nh++)
                if (isAreaSolved(c, { shape, w, h, nw, nh })) found = true
      expect(found, c.id).toBe(true)
    }
  })
  it('exact rectangles need the orientation and the shape', () => {
    const c = areaChallenges.find((x) => x.id === 'a-rect-3-4')!
    expect(isAreaSolved(c, rect(3, 4))).toBe(true)
    expect(isAreaSolved(c, rect(4, 3))).toBe(false)
    expect(isAreaSolved(c, ell(3, 4, 1, 1))).toBe(false)
  })
  it('area and perimeter rules accept any rectangle that fits', () => {
    expect(isAreaSolved(areaChallenges.find((x) => x.id === 'a-area-15')!, rect(5, 3))).toBe(true)
    expect(isAreaSolved(areaChallenges.find((x) => x.id === 'a-perim-12')!, rect(1, 5))).toBe(true)
    expect(isAreaSolved(areaChallenges.find((x) => x.id === 'a-perim-12')!, rect(2, 5))).toBe(false)
    const both = areaChallenges.find((x) => x.id === 'a-both-12-14')!
    expect(isAreaSolved(both, rect(3, 4))).toBe(true)
    expect(isAreaSolved(both, rect(2, 6))).toBe(false) // area 12 but perimeter 16
  })
  it('L-shape rules need an L-shape', () => {
    const c = areaChallenges.find((x) => x.id === 'a-l-area-26')!
    expect(isAreaSolved(c, ell(6, 5, 2, 2))).toBe(true)
    expect(isAreaSolved(c, rect(13, 2))).toBe(false)
    const p = areaChallenges.find((x) => x.id === 'a-l-perim-22')!
    expect(isAreaSolved(p, ell(6, 5, 3, 1))).toBe(true) // perimeter ignores the notch
    expect(isAreaSolved(p, rect(6, 5))).toBe(false)
    const both = areaChallenges.find((x) => x.id === 'a-l-both-30-26')!
    expect(isAreaSolved(both, ell(7, 6, 4, 3))).toBe(true) // 42 − 12 = 30, perimeter 26
    expect(isAreaSolved(both, ell(7, 6, 3, 3))).toBe(false)
  })
  it('largest-area and smallest-perimeter need the best rectangle, not just a good one', () => {
    const max = areaChallenges.find((x) => x.id === 'a-max-area-20')!
    expect(isAreaSolved(max, rect(5, 5))).toBe(true)
    expect(isAreaSolved(max, rect(6, 4))).toBe(false) // perimeter 20, area 24 is not the largest
    const min = areaChallenges.find((x) => x.id === 'a-min-perim-36')!
    expect(isAreaSolved(min, rect(6, 6))).toBe(true)
    expect(isAreaSolved(min, rect(4, 9))).toBe(false)
  })
  it('the default shape does not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(areaChallenges, t)[0]
      expect(isAreaSolved(first, DEFAULT_AREA), first.id).toBe(false)
    }
  })
})
