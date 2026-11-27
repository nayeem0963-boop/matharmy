import { describe, expect, it } from 'vitest'
import {
  DIMENSION_MAX,
  DIMENSION_MIN,
  computeMetrics,
  effectiveDimensions,
  formatNumber,
  getShape,
  shapes,
  triangleSide,
  type Dimensions,
} from './geometryShapes'

const dims = (width: number, height: number, depth: number): Dimensions => ({ width, height, depth })

describe('shape definitions', () => {
  it('has the five solids with unique ids', () => {
    expect(shapes.map((s) => s.id)).toEqual([
      'cube', 'rectangular-prism', 'sphere', 'cylinder', 'triangular-prism',
    ])
  })

  it('face/edge/vertex counts are correct and satisfy Euler for polyhedra', () => {
    expect(getShape('cube')).toMatchObject({ faces: 6, edges: 12, vertices: 8 })
    expect(getShape('rectangular-prism')).toMatchObject({ faces: 6, edges: 12, vertices: 8 })
    expect(getShape('triangular-prism')).toMatchObject({ faces: 5, edges: 9, vertices: 6 })
    for (const id of ['cube', 'rectangular-prism', 'triangular-prism'] as const) {
      const s = getShape(id)
      expect(s.vertices - s.edges + s.faces, id).toBe(2)
    }
    expect(getShape('sphere')).toMatchObject({ faces: 1, edges: 0, vertices: 0, hasNet: false })
    expect(getShape('cylinder')).toMatchObject({ faces: 3, edges: 2, vertices: 0, hasNet: true })
  })

  it('falls back to the first shape for an unknown id', () => {
    expect(getShape('nope' as never).id).toBe('cube')
  })

  it('dimension range is 1 to 6', () => {
    expect([DIMENSION_MIN, DIMENSION_MAX]).toEqual([1, 6])
  })
})

describe('effectiveDimensions', () => {
  it('makes a cube use one edge for all three dimensions', () => {
    expect(effectiveDimensions('cube', dims(3, 2, 5))).toEqual(dims(3, 3, 3))
  })
  it('leaves other shapes unchanged', () => {
    expect(effectiveDimensions('rectangular-prism', dims(3, 2, 5))).toEqual(dims(3, 2, 5))
  })
})

describe('computeMetrics', () => {
  it('cube', () => {
    const m = computeMetrics('cube', dims(3, 3, 3))
    expect(m.volume).toBe(27)
    expect(m.surfaceArea).toBe(54)
    expect(m.volumeFormula).toBe('V = a³')
    expect(m.volumeWorking).toBe('3³ = 27')
    expect(m.areaWorking).toBe('6 × 3² = 54')
  })

  it('cube with half units', () => {
    expect(computeMetrics('cube', dims(1.5, 1.5, 1.5)).volume).toBeCloseTo(3.375, 10)
    expect(computeMetrics('cube', dims(4, 4, 4)).surfaceArea).toBe(96)
  })

  it('rectangular prism uses width=length, depth=width, height=height', () => {
    const m = computeMetrics('rectangular-prism', dims(2, 4, 3)) // l=2, h=4, w=3
    expect(m.volume).toBe(24)
    expect(m.surfaceArea).toBe(52)
    expect(m.volumeWorking).toBe('2 × 3 × 4 = 24')
    expect(m.areaWorking).toBe('2(6 + 8 + 12) = 52')
  })

  it('sphere', () => {
    const m = computeMetrics('sphere', dims(3, 3, 3))
    expect(m.volume).toBeCloseTo(36 * Math.PI, 10)
    expect(m.surfaceArea).toBeCloseTo(36 * Math.PI, 10)
  })

  it('cylinder', () => {
    const m = computeMetrics('cylinder', dims(2, 4, 2))
    expect(m.volume).toBeCloseTo(16 * Math.PI, 10)
    expect(m.surfaceArea).toBeCloseTo(2 * Math.PI * 4 + 2 * Math.PI * 2 * 4, 10)
  })

  it('triangular prism', () => {
    // b=6, h=4, l=5: slant side = sqrt(3^2 + 4^2) = 5, volume = 1/2*6*4*5 = 60
    const m = computeMetrics('triangular-prism', dims(6, 4, 5))
    expect(triangleSide(6, 4)).toBeCloseTo(5, 10)
    expect(m.volume).toBe(60)
    // two triangles (2 x 12) + three rectangles (5 x 6, 5 x 5, 5 x 5) = 24 + 80
    expect(m.surfaceArea).toBeCloseTo(104, 10)
  })

  it('every shape returns finite positive values across the whole slider range', () => {
    for (const s of shapes) {
      for (let a = DIMENSION_MIN; a <= DIMENSION_MAX; a += 0.5) {
        for (let b = DIMENSION_MIN; b <= DIMENSION_MAX; b += 0.5) {
          const m = computeMetrics(s.id, effectiveDimensions(s.id, dims(a, b, a)))
          expect(Number.isFinite(m.volume) && m.volume > 0, `${s.id} ${a} ${b}`).toBe(true)
          expect(Number.isFinite(m.surfaceArea) && m.surfaceArea > 0).toBe(true)
        }
      }
    }
  })

  it('volume grows with every dimension', () => {
    const small = computeMetrics('rectangular-prism', dims(2, 2, 2)).volume
    expect(computeMetrics('rectangular-prism', dims(3, 2, 2)).volume).toBeGreaterThan(small)
    expect(computeMetrics('rectangular-prism', dims(2, 3, 2)).volume).toBeGreaterThan(small)
    expect(computeMetrics('rectangular-prism', dims(2, 2, 3)).volume).toBeGreaterThan(small)
  })
})

describe('formatNumber', () => {
  it('prints integers plainly and trims decimals to 2 places', () => {
    expect(formatNumber(27)).toBe('27')
    expect(formatNumber(3.375)).toBe('3.38')
    expect(formatNumber(2.5)).toBe('2.5')
    expect(formatNumber(50.2654824574)).toBe('50.27')
  })
})
