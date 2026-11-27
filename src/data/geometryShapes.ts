export type ShapeId =
  | 'cube'
  | 'rectangular-prism'
  | 'sphere'
  | 'cylinder'
  | 'triangular-prism'

export type DimensionKey = 'width' | 'height' | 'depth'

export interface Dimensions {
  width: number
  height: number
  depth: number
}

export interface DimensionControl {
  key: DimensionKey
  label: string
  symbol: string
}

export interface ShapeDefinition {
  id: ShapeId
  name: string
  /** Which of width / height / depth the shape uses, and what they mean. */
  controls: DimensionControl[]
  faces: number
  edges: number
  vertices: number
  /** Extra wording for curved surfaces. */
  faceNote?: string
  hasNet: boolean
}

export const DIMENSION_MIN = 1
export const DIMENSION_MAX = 6
export const DIMENSION_STEP = 0.5

export const shapes: ShapeDefinition[] = [
  {
    id: 'cube',
    name: 'Cube',
    controls: [{ key: 'width', label: 'Edge', symbol: 'a' }],
    faces: 6,
    edges: 12,
    vertices: 8,
    hasNet: true,
  },
  {
    id: 'rectangular-prism',
    name: 'Rectangular Prism',
    controls: [
      { key: 'width', label: 'Length', symbol: 'l' },
      { key: 'depth', label: 'Width', symbol: 'w' },
      { key: 'height', label: 'Height', symbol: 'h' },
    ],
    faces: 6,
    edges: 12,
    vertices: 8,
    hasNet: true,
  },
  {
    id: 'sphere',
    name: 'Sphere',
    controls: [{ key: 'width', label: 'Radius', symbol: 'r' }],
    faces: 1,
    edges: 0,
    vertices: 0,
    faceNote: 'curved surface',
    hasNet: false,
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    controls: [
      { key: 'width', label: 'Radius', symbol: 'r' },
      { key: 'height', label: 'Height', symbol: 'h' },
    ],
    faces: 3,
    edges: 2,
    vertices: 0,
    faceNote: '2 flat + 1 curved',
    hasNet: true,
  },
  {
    id: 'triangular-prism',
    name: 'Triangular Prism',
    controls: [
      { key: 'width', label: 'Base', symbol: 'b' },
      { key: 'height', label: 'Triangle height', symbol: 'h' },
      { key: 'depth', label: 'Length', symbol: 'l' },
    ],
    faces: 5,
    edges: 9,
    vertices: 6,
    hasNet: true,
  },
]

export const getShape = (id: ShapeId): ShapeDefinition =>
  shapes.find((s) => s.id === id) ?? shapes[0]

/** Cube uses a single edge length for all three dimensions. */
export function effectiveDimensions(id: ShapeId, d: Dimensions): Dimensions {
  return id === 'cube' ? { width: d.width, height: d.width, depth: d.width } : d
}

export interface ShapeMetrics {
  volume: number
  surfaceArea: number
  volumeFormula: string
  volumeWorking: string
  areaFormula: string
  areaWorking: string
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/\.?0+$/, ''))

/** Slant side of the isosceles triangle with base b and height h. */
export const triangleSide = (b: number, h: number) => Math.sqrt((b / 2) ** 2 + h ** 2)

export function computeMetrics(id: ShapeId, d: Dimensions): ShapeMetrics {
  switch (id) {
    case 'cube': {
      const a = d.width
      const volume = a ** 3
      const surfaceArea = 6 * a ** 2
      return {
        volume,
        surfaceArea,
        volumeFormula: 'V = a³',
        volumeWorking: `${fmt(a)}³ = ${fmt(volume)}`,
        areaFormula: 'A = 6a²',
        areaWorking: `6 × ${fmt(a)}² = ${fmt(surfaceArea)}`,
      }
    }
    case 'rectangular-prism': {
      const l = d.width
      const w = d.depth
      const h = d.height
      const volume = l * w * h
      const surfaceArea = 2 * (l * w + l * h + w * h)
      return {
        volume,
        surfaceArea,
        volumeFormula: 'V = l × w × h',
        volumeWorking: `${fmt(l)} × ${fmt(w)} × ${fmt(h)} = ${fmt(volume)}`,
        areaFormula: 'A = 2(lw + lh + wh)',
        areaWorking: `2(${fmt(l * w)} + ${fmt(l * h)} + ${fmt(w * h)}) = ${fmt(surfaceArea)}`,
      }
    }
    case 'sphere': {
      const r = d.width
      const volume = (4 / 3) * Math.PI * r ** 3
      const surfaceArea = 4 * Math.PI * r ** 2
      return {
        volume,
        surfaceArea,
        volumeFormula: 'V = ⁴⁄₃ πr³',
        volumeWorking: `⁴⁄₃ × π × ${fmt(r)}³ ≈ ${fmt(volume)}`,
        areaFormula: 'A = 4πr²',
        areaWorking: `4 × π × ${fmt(r)}² ≈ ${fmt(surfaceArea)}`,
      }
    }
    case 'cylinder': {
      const r = d.width
      const h = d.height
      const volume = Math.PI * r ** 2 * h
      const surfaceArea = 2 * Math.PI * r ** 2 + 2 * Math.PI * r * h
      return {
        volume,
        surfaceArea,
        volumeFormula: 'V = πr²h',
        volumeWorking: `π × ${fmt(r)}² × ${fmt(h)} ≈ ${fmt(volume)}`,
        areaFormula: 'A = 2πr² + 2πrh',
        areaWorking: `2π(${fmt(r)})² + 2π(${fmt(r)})(${fmt(h)}) ≈ ${fmt(surfaceArea)}`,
      }
    }
    case 'triangular-prism': {
      const b = d.width
      const h = d.height
      const l = d.depth
      const s = triangleSide(b, h)
      const volume = 0.5 * b * h * l
      const surfaceArea = b * h + l * (b + 2 * s)
      return {
        volume,
        surfaceArea,
        volumeFormula: 'V = ½ × b × h × l',
        volumeWorking: `½ × ${fmt(b)} × ${fmt(h)} × ${fmt(l)} = ${fmt(volume)}`,
        areaFormula: 'A = bh + l(b + 2s)',
        areaWorking: `${fmt(b * h)} + ${fmt(l)}(${fmt(b)} + 2 × ${fmt(s)}) ≈ ${fmt(surfaceArea)}`,
      }
    }
  }
}

export const formatNumber = fmt
