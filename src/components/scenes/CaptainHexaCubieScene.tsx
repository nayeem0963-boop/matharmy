import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Edges, Float, Line, RoundedBox, Sparkles, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { SceneHtml } from '../canvas/SceneHtml'
import { useReducedMotion } from '../../utils/reducedMotion'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { playHello, playPop } from '../../utils/soundEffects'
import './captain.css'

/* ------------------------------------------------------------------ */
/* Palette (from the concept art)                                      */
/* ------------------------------------------------------------------ */
const BODY_TOP = '#2fe3f7'
const BODY_BOTTOM = '#9d4cf5'
const BODY_BASE = '#6d28d9'
const CAP_BAND = '#5b6b7a'
const BRIM = '#334155'
const GOLD = '#fbbf24'
const VISOR_PINK = '#f0abfc'
const NEON_CYAN = '#67e8f9'
const STEEL = '#c3cbd6'
const IRIS = '#3b3f9e'

const GREETINGS = [
  "Hi, cadet! I'm Captain Hexa-Cubie.",
  'Ready for a math mission?',
  'Fractions are just fair shares!',
  'A cube has 6 faces. I checked.',
  '10 ones make a ten. Teamwork!',
  'Pick a module and let’s march!',
]

/* ------------------------------------------------------------------ */
/* Procedural canvas textures (no font or image downloads)             */
/* ------------------------------------------------------------------ */
interface Glyph {
  text: string
  color: string
}

/** 256×128 transparent texture with a neon-glow glyph. */
function makeGlyphTexture({ text, color }: Glyph) {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.font = `800 ${text.length > 2 ? 72 : 92}px system-ui, "Segoe UI", Roboto, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = color
    ctx.shadowBlur = 18
    ctx.fillStyle = color
    ctx.fillText(text, 128, 70)
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(255,255,255,0.85)'
    ctx.fillText(text, 128, 70)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/** Several glyph textures owned by the caller; all disposed on unmount. */
function useGlyphTextures(glyphs: Glyph[]) {
  const key = glyphs.map((g) => g.text + g.color).join('|')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const textures = useMemo(() => glyphs.map(makeGlyphTexture), [key])
  useEffect(() => () => textures.forEach((t) => t.dispose()), [textures])
  return textures
}

/** Soft purple/blue nebula painted on a canvas, used on an inside-out sphere. */
function useNebulaTexture() {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 512
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.fillStyle = '#070b1a'
      ctx.fillRect(0, 0, 1024, 512)
      const blobs: [number, number, number, string][] = [
        [500, 220, 280, 'rgba(124, 58, 237, 0.7)'],
        [640, 300, 230, 'rgba(217, 70, 239, 0.55)'],
        [360, 330, 220, 'rgba(37, 99, 235, 0.6)'],
        [560, 140, 160, 'rgba(34, 211, 238, 0.35)'],
        [180, 200, 240, 'rgba(14, 165, 233, 0.35)'],
        [860, 230, 260, 'rgba(236, 72, 153, 0.4)'],
        [760, 120, 140, 'rgba(250, 204, 21, 0.15)'],
      ]
      for (const [x, y, r, c] of blobs) {
        const g = ctx.createRadialGradient(x, y, 0, x, y, r)
        g.addColorStop(0, c)
        g.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, 1024, 512)
      }
    }
    const t = new THREE.CanvasTexture(canvas)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  }, [])
  useEffect(() => () => texture.dispose(), [texture])
  return texture
}

function makeStarShape(outer: number, inner: number, points = 5) {
  const shape = new THREE.Shape()
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2
    if (i === 0) shape.moveTo(Math.cos(a) * r, Math.sin(a) * r)
    else shape.lineTo(Math.cos(a) * r, Math.sin(a) * r)
  }
  shape.closePath()
  return shape
}

/** Rounded rectangle outline in the XY plane (for the front goggle rims). */
function roundedRectXY(hw: number, hh: number, radius: number, segments = 6): [number, number, number][] {
  const pts: [number, number, number][] = []
  const corners: [number, number, number][] = [
    [hw - radius, hh - radius, 0],
    [-(hw - radius), hh - radius, Math.PI / 2],
    [-(hw - radius), -(hh - radius), Math.PI],
    [hw - radius, -(hh - radius), (3 * Math.PI) / 2],
  ]
  for (const [cx, cy, start] of corners) {
    for (let i = 0; i <= segments; i++) {
      const a = start + (i / segments) * (Math.PI / 2)
      pts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, 0])
    }
  }
  pts.push(pts[0])
  return pts
}
/* ------------------------------------------------------------------ */
/* Captain proportions: everything below is placed relative to these   */
/* ------------------------------------------------------------------ */
const BODY_W = 1.7
const BODY_H = 1.52
const BODY_D = 1.62
const BODY_R = 0.34 // bevel radius; flat part of each face = size/2 - BODY_R
const FRONT_Z = BODY_D / 2
const FACE_Y = 0.095 // centre of the goggle / eyes on the front face
const EYE_X = 0.235
const EYE_R = 0.155 // eye white radius (iris, pupil and highlights scale from it)
const MOUTH_Y = -0.25 // smile arc spans MOUTH_Y down to MOUTH_Y - 0.09
// Flat part of the front face is ±0.51 wide and ±0.42 tall; the goggle (plus its
// rim) stays inside that with margin, so nothing crowds the bevelled edges.
const GOGGLE_HW = 0.44
const GOGGLE_HH = 0.24
/** Bezel depth; starts slightly inside the face so its edges meet the bevel. */
// Shallow enough that, seen from the ~25° camera, the top bezel does not hide
// the eyes; still deeper than the eye highlights (≈0.075 off the face).
const GOGGLE_DEPTH = 0.1
const CAP_BAND_R = 0.5 // fits inside the flat top face (half-width 0.51)
const CAP_SINK = 0.07 // how far the band sits into the top face (hides any gap)
const HAND_X = BODY_W / 2 + 0.5
const HAND_Y = -0.2
const HAND_Z = 0.2
const HAND_SCALE = 0.82

/**
 * Square-ish frame around the whole face (goggle + smile), drawn on the flat
 * front face just inside its edge: ±0.5 wide, ±0.405 tall, centred at y = 0.
 * Clearances: goggle rim → frame ≈ 0.04–0.05, smile → frame ≈ 0.04.
 */
const FACE_FRAME = roundedRectXY(0.5, 0.405, 0.05)
const FACE_FRAME_INNER = roundedRectXY(0.482, 0.387, 0.04)

const BAND_RIM = roundedRectXY(BODY_W / 2 + 0.025, BODY_D / 2 + 0.025, BODY_R)
const GOGGLE_OUTER = roundedRectXY(GOGGLE_HW + 0.02, GOGGLE_HH + 0.02, 0.1)
const GOGGLE_INNER = roundedRectXY(GOGGLE_HW - 0.04, GOGGLE_HH - 0.04, 0.07)

/* Cap gradient: indigo-slate at the band → bright silver at the top of the dome. */
const CAP_GRADIENT_LOW = new THREE.Color('#4a5788')
const CAP_GRADIENT_MID = new THREE.Color('#8fa3c7')
const CAP_GRADIENT_HIGH = new THREE.Color('#eef4fb')
const CAP_GRADIENT_Y: [number, number] = [0.17, 0.63] // cap-space heights (crown bottom → dome top)

function capGradientAt(y: number, out = new THREE.Color()) {
  const t = THREE.MathUtils.smoothstep(y, CAP_GRADIENT_Y[0], CAP_GRADIENT_Y[1])
  return t < 0.5
    ? out.copy(CAP_GRADIENT_LOW).lerp(CAP_GRADIENT_MID, t * 2)
    : out.copy(CAP_GRADIENT_MID).lerp(CAP_GRADIENT_HIGH, (t - 0.5) * 2)
}

/**
 * Bake the cap gradient into a geometry's vertex colours. `offsetY` / `scaleY`
 * map the geometry's local Y into cap space (mesh position / scale), so the
 * crown and dome share one continuous gradient.
 */
function applyCapGradient(geometry: THREE.BufferGeometry, offsetY: number, scaleY = 1) {
  const pos = geometry.getAttribute('position')
  const colors = new Float32Array(pos.count * 3)
  const c = new THREE.Color()
  for (let i = 0; i < pos.count; i++) {
    capGradientAt(offsetY + pos.getY(i) * scaleY, c)
    colors.set([c.r, c.g, c.b], i * 3)
  }
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2)

/**
 * Glyphs on the goggle glass, relative to its centre. They sit in the clear
 * channel between the eyes (eye inner edges are at ±(EYE_X - EYE_R) ≈ ±0.07),
 * so nothing overlaps the eyes or crowds the frame. w = plane width.
 */
const VISOR_GLYPHS: (Glyph & { x: number; y: number; w: number })[] = [
  { text: '¾', color: '#ffffff', x: 0, y: 0.135, w: 0.13 },
  { text: '+', color: VISOR_PINK, x: 0, y: -0.13, w: 0.11 },
]

const RING_GLYPHS: Glyph[] = [
  { text: 'π', color: NEON_CYAN },
  { text: '42', color: '#93c5fd' },
  { text: '∫', color: '#c4b5fd' },
  { text: '=', color: NEON_CYAN },
  { text: '1337', color: '#93c5fd' },
  { text: '+', color: '#c4b5fd' },
  { text: '√', color: NEON_CYAN },
  { text: '∑', color: '#93c5fd' },
  { text: '¾', color: '#c4b5fd' },
  { text: '∞', color: NEON_CYAN },
  { text: 'π', color: '#93c5fd' },
  { text: '42', color: '#c4b5fd' },
  { text: '=', color: NEON_CYAN },
  { text: '½', color: '#93c5fd' },
]
const RING_RADIUS = 2.2

/** Second, outer ring that counter-rotates for a busier holographic look. */
const OUTER_RING_GLYPHS: Glyph[] = [
  { text: '42', color: VISOR_PINK },
  { text: 'x²', color: '#fde68a' },
  { text: '1337', color: VISOR_PINK },
  { text: '÷', color: '#a5f3fc' },
  { text: 'θ', color: '#fde68a' },
  { text: '%', color: VISOR_PINK },
  { text: '∆', color: '#a5f3fc' },
  { text: '7', color: '#fde68a' },
  { text: '√2', color: VISOR_PINK },
  { text: '∫', color: '#a5f3fc' },
  { text: '=', color: '#fde68a' },
  { text: 'π', color: VISOR_PINK },
]
const OUTER_RING_RADIUS = 2.8

/** The two cubes the Captain holds (left, right). */
const HELD_CUBES = [
  { color: '#a5f3fc', glow: '#06b6d4', edge: '#ffffff' },
  { color: '#f5d0fe', glow: '#c026d3', edge: GOLD },
]

/* ------------------------------------------------------------------ */
/* Platform: dense micro-voxel deck on a thick dark stepped base with  */
/* recessed amber trim, turned 45° so a corner faces the viewer        */
/* ------------------------------------------------------------------ */
const GRID_N = 44
const GRID_STEP = 0.088
const GRID_CUBE = 0.078 // narrow gaps between tiles read as a fine tiled deck
const PLATFORM_Y = -1.5
const GRID_HALF = (GRID_N * GRID_STEP) / 2
/** Stepped dais in the middle that the crystal sits on: [half-size, top height]. */
const DAIS_STEPS: [number, number][] = [
  [0.62, 0.07],
  [0.36, 0.14],
]
const DAIS_TOP = DAIS_STEPS[DAIS_STEPS.length - 1][1]
/** Max height of the gentle swells across the deck (kept subtle). */
const DECK_RELIEF = 0.035
/** Deepest drop of the eroded rim tiles, quantised to RIM_STEP for a blocky look. */
const RIM_DROP = 0.16
const RIM_STEP = 0.026
const DECK_SURFACE = DECK_RELIEF + 0.006 // just above the tallest tile, for rings/lines

/* Base stack (y relative to the deck, top of tiles ≈ 0). */
const BASE_UPPER_HALF = GRID_HALF + 0.04

interface Voxel {
  p: THREE.Vector3
  h: number
  color: THREE.Color
}

function buildVoxels(): { solid: Voxel[]; lit: Voxel[] } {
  // Deterministic pseudo-random so the deck looks the same every visit.
  const rand = (k: number) => {
    const x = Math.sin(k * 127.1) * 43758.5453
    return x - Math.floor(x)
  }
  const slateCyan = new THREE.Color('#27476e')
  const softPurple = new THREE.Color('#4a3f7e')
  const daisTint = new THREE.Color('#3b6a92')
  const litColors = ['#22d3ee', '#7dd3fc', '#a5b4fc'].map((c) => new THREE.Color(c))
  const half = ((GRID_N - 1) * GRID_STEP) / 2
  const solid: Voxel[] = []
  const lit: Voxel[] = []
  let i = 0
  for (let gx = 0; gx < GRID_N; gx++) {
    for (let gz = 0; gz < GRID_N; gz++) {
      const x = gx * GRID_STEP - half
      const z = gz * GRID_STEP - half
      const box = Math.max(Math.abs(x), Math.abs(z))

      // Soft swells (layered sines) plus a little per-tile jitter → 0..1.
      const swell =
        0.5 +
        0.28 * Math.sin(x * 3.1 + 1.7) * Math.sin(z * 2.7 + 0.4) +
        0.14 * Math.sin((x + z) * 5.3 + 0.9)
      const n = THREE.MathUtils.clamp(swell * 0.8 + rand(i + 3) * 0.2, 0, 1)
      let top = n * DECK_RELIEF
      // Rim erosion: near the outer edge tiles drop in blocky, quantised steps so
      // their sides show (the cascading edge in the reference). Interior stays subtle.
      const rim = THREE.MathUtils.smoothstep(box / half, 0.8, 1)
      if (rim > 0) top -= Math.round((rand(i + 41) * 0.6 + 0.4) * rim * RIM_DROP / RIM_STEP) * RIM_STEP
      let onDais = false
      for (const [size, height] of DAIS_STEPS) {
        if (box < size) {
          top = height // dais steps stay perfectly flat for clean edges
          onDais = true
        }
      }
      const h = Math.max(top + 0.2, 0.05) / GRID_CUBE // reach down into the base
      const v = { p: new THREE.Vector3(x, top - (GRID_CUBE * h) / 2, z), h, color: new THREE.Color() }

      if (!onDais && rand(i + 13) > 0.984) {
        v.color.copy(litColors[Math.floor(rand(i + 29) * litColors.length)])
        lit.push(v)
      } else {
        // Cool slate-cyan → soft purple across the deck, lighter on raised tiles.
        const u = THREE.MathUtils.clamp((x + z) / (4 * half) + 0.5, 0, 1)
        v.color.copy(slateCyan).lerp(softPurple, THREE.MathUtils.smoothstep(u, 0.15, 0.9))
        if (onDais) v.color.lerp(daisTint, 0.6)
        v.color.multiplyScalar(0.78 + n * 0.34 + (rand(i + 21) - 0.5) * 0.12)
        solid.push(v)
      }
      i++
    }
  }
  return { solid, lit }
}

const squareOutline = (half: number) => roundedRectXY(half, half, 0.0005, 1)
const DAIS_OUTLINES = DAIS_STEPS.map(([size, height]) => ({ points: squareOutline(size), height }))
const DAIS_DIAMOND = squareOutline(DAIS_STEPS[0][0] + 0.07)

/** Canvas textures for the projector beam (fades upward) and the under-glow (radial). */
function useProjectorTextures() {
  const textures = useMemo(() => {
    const beamCanvas = document.createElement('canvas')
    beamCanvas.width = 4
    beamCanvas.height = 128
    const b = beamCanvas.getContext('2d')
    if (b) {
      const g = b.createLinearGradient(0, 128, 0, 0) // bottom → top
      g.addColorStop(0, 'rgba(165, 243, 252, 0.9)')
      g.addColorStop(0.35, 'rgba(34, 211, 238, 0.35)')
      g.addColorStop(1, 'rgba(34, 211, 238, 0)')
      b.fillStyle = g
      b.fillRect(0, 0, 4, 128)
    }
    const glowCanvas = document.createElement('canvas')
    glowCanvas.width = glowCanvas.height = 256
    const c = glowCanvas.getContext('2d')
    if (c) {
      const g = c.createRadialGradient(128, 128, 0, 128, 128, 128)
      g.addColorStop(0, 'rgba(56, 189, 248, 0.4)')
      g.addColorStop(0.45, 'rgba(99, 102, 241, 0.16)')
      g.addColorStop(1, 'rgba(0, 0, 0, 0)')
      c.fillStyle = g
      c.fillRect(0, 0, 256, 256)
    }
    const beam = new THREE.CanvasTexture(beamCanvas)
    const glow = new THREE.CanvasTexture(glowCanvas)
    return { beam, glow }
  }, [])
  useEffect(
    () => () => {
      textures.beam.dispose()
      textures.glow.dispose()
    },
    [textures],
  )
  return textures
}

/** One chamfered base tier: a square frustum, wider at the top, so its sides slope inward. */
interface TierSpec {
  topHalf: number
  bottomHalf: number
  top: number
  height: number
}

function ChamferTier({ tier, color }: { tier: TierSpec; color: string }) {
  // A 4-sided cylinder rotated 45° is a square frustum; radius = half-width × √2.
  return (
    <mesh position={[0, tier.top - tier.height / 2, 0]} rotation={[0, Math.PI / 4, 0]}>
      <cylinderGeometry args={[tier.topHalf * Math.SQRT2, tier.bottomHalf * Math.SQRT2, tier.height, 4, 1]} />
      <meshStandardMaterial color={color} metalness={0.65} roughness={0.3} flatShading />
    </mesh>
  )
}

/** Glowing line frame around a square at height y (deck edge / tier ledges). */
function EdgeFrame({ half, y, color, thickness = 0.022, opacity = 1 }: { half: number; y: number; color: string; thickness?: number; opacity?: number }) {
  return (
    <>
      {[0, 1, 2, 3].map((side) => (
        <group key={side} rotation={[0, (side * Math.PI) / 2, 0]}>
          <mesh position={[0, y, half]}>
            <boxGeometry args={[half * 2 + thickness, thickness, thickness]} />
            <meshBasicMaterial color={color} transparent={opacity < 1} opacity={opacity} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </>
  )
}

interface TraceSegment {
  x: number
  y: number
  w: number
  h: number
}

/**
 * Segmented "circuit trace" light bars along one side: horizontal runs with
 * gaps and small jogs between two levels, as in the reference. Deterministic.
 */
function buildTraces(length: number, seed: number): TraceSegment[] {
  const rand = (k: number) => {
    const x = Math.sin((k + seed * 31.7) * 91.3) * 43758.5453
    return x - Math.floor(x)
  }
  const segs: TraceSegment[] = []
  const thick = 0.026
  const jog = 0.05
  let x = -length / 2 + 0.06
  let level = 0
  let k = 0
  while (x < length / 2 - 0.12) {
    const run = Math.min(0.26 + rand(k++) * 0.6, length / 2 - 0.06 - x)
    segs.push({ x: x + run / 2, y: level, w: run, h: thick })
    x += run
    if (rand(k++) > 0.55) {
      const next = level === 0 ? jog : 0
      segs.push({ x, y: (level + next) / 2, w: thick, h: jog + thick })
      level = next
    } else {
      x += 0.07 + rand(k++) * 0.12 // gap
    }
  }
  return segs
}

/** Bright warm-gold light bars laid flat on a tier's sloped faces, with a soft glow halo. */
function GoldTraces({ tier, seed }: { tier: TierSpec; seed: number }) {
  const { core, glow } = useMemo(
    () => ({
      core: new THREE.MeshBasicMaterial({ color: '#ffd36b', toneMapped: false }),
      glow: new THREE.MeshBasicMaterial({
        color: '#f59e0b',
        transparent: true,
        opacity: 0.3,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        toneMapped: false,
      }),
    }),
    [],
  )
  useEffect(
    () => () => {
      core.dispose()
      glow.dispose()
    },
    [core, glow],
  )
  const inset = tier.topHalf - tier.bottomHalf
  const angle = Math.atan2(inset, tier.height) // face leans out at the top
  const midHalf = (tier.topHalf + tier.bottomHalf) / 2
  const midY = tier.top - tier.height / 2
  const length = tier.bottomHalf * 2 - 0.12 // fits the narrower bottom edge of the face
  const sides = useMemo(() => [0, 1, 2, 3].map((i) => buildTraces(length, seed + i)), [length, seed])
  return (
    <>
      {sides.map((segs, side) => (
        <group key={side} rotation={[0, (side * Math.PI) / 2, 0]}>
          <group position={[0, midY, midHalf]} rotation={[angle, 0, 0]}>
            {segs.map((sg, i) => (
              <group key={i} position={[sg.x, sg.y - 0.025, 0.006]}>
                <mesh material={core}>
                  <boxGeometry args={[sg.w, sg.h, 0.008]} />
                </mesh>
                <mesh material={glow} position={[0, 0, -0.002]}>
                  <boxGeometry args={[sg.w + 0.05, sg.h + 0.05, 0.002]} />
                </mesh>
              </group>
            ))}
          </group>
        </group>
      ))}
    </>
  )
}

const PROJECTOR_DASHES = 16

function CubeGridPlatform() {
  const reduced = useReducedMotion()
  const solidRef = useRef<THREE.InstancedMesh>(null)
  const litRef = useRef<THREE.InstancedMesh>(null)
  const dashRing = useRef<THREE.Group>(null)
  const beam = useRef<THREE.Mesh>(null)
  const voxels = useMemo(buildVoxels, [])
  const { beam: beamTexture, glow: glowTexture } = useProjectorTextures()
  const geometry = useMemo(() => new THREE.BoxGeometry(GRID_CUBE, GRID_CUBE, GRID_CUBE), [])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ metalness: 0.35, roughness: 0.45 }), [])
  const litMaterial = useMemo(() => new THREE.MeshBasicMaterial({ toneMapped: false }), [])
  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
      litMaterial.dispose()
    },
    [geometry, material, litMaterial],
  )

  useLayoutEffect(() => {
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    const s = new THREE.Vector3()
    const fill = (mesh: THREE.InstancedMesh | null, items: Voxel[]) => {
      if (!mesh) return
      items.forEach(({ p, h, color }, i) => {
        s.set(1, h, 1)
        m.compose(p, q, s)
        mesh.setMatrixAt(i, m)
        mesh.setColorAt(i, color)
      })
      mesh.instanceMatrix.needsUpdate = true
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    }
    fill(solidRef.current, voxels.solid)
    fill(litRef.current, voxels.lit)
  }, [voxels])

  // Slowly rotating projector ring and a gentle beam shimmer.
  useFrame((state) => {
    const t = reduced ? 0 : state.clock.elapsedTime
    if (dashRing.current) dashRing.current.rotation.z = t * 0.35
    if (beam.current) {
      const m = beam.current.material as THREE.MeshBasicMaterial
      m.opacity = 0.42 + Math.sin(t * 2.4) * 0.08
    }
  })

  // Chamfered base, top to bottom (deck tiles sit on top at y ≈ 0; the base starts
  // just below the deepest eroded rim tiles so their stepped sides stay visible).
  const tierA: TierSpec = { topHalf: BASE_UPPER_HALF, bottomHalf: BASE_UPPER_HALF - 0.13, top: -RIM_DROP - 0.01, height: 0.3 }
  const tierB: TierSpec = {
    topHalf: BASE_UPPER_HALF - 0.06, // wider than tierA's bottom → a visible ledge between the tiers
    bottomHalf: BASE_UPPER_HALF - 0.24,
    top: tierA.top - tierA.height,
    height: 0.28,
  }
  const foot: TierSpec = { topHalf: tierB.bottomHalf, bottomHalf: tierB.bottomHalf - 0.12, top: tierB.top - tierB.height, height: 0.1 }
  const baseBottom = foot.top - foot.height
  const beamHeight = 0.62

  return (
    <group position={[0, PLATFORM_Y, 0]} rotation={[0, Math.PI / 4, 0]}>
      {/* Dense micro-voxel deck */}
      <instancedMesh ref={solidRef} args={[geometry, material, voxels.solid.length]} receiveShadow />
      <instancedMesh ref={litRef} args={[geometry, litMaterial, voxels.lit.length]} />

      {/* Glowing gold line where the voxel deck meets the base */}
      <EdgeFrame half={BASE_UPPER_HALF + 0.004} y={tierA.top + 0.006} color="#ffd36b" thickness={0.024} />

      {/* Chamfered dark base: two sloped tiers with a ledge between them, and a small foot */}
      <ChamferTier tier={tierA} color="#1c2942" />
      <GoldTraces tier={tierA} seed={1} />
      <ChamferTier tier={tierB} color="#17223a" />
      <EdgeFrame half={tierB.topHalf + 0.003} y={tierB.top + 0.004} color={NEON_CYAN} thickness={0.012} opacity={0.6} />
      <GoldTraces tier={tierB} seed={7} />
      <ChamferTier tier={foot} color="#0f172a" />
      <EdgeFrame half={foot.bottomHalf + 0.002} y={baseBottom + 0.006} color="#f59e0b" thickness={0.016} opacity={0.8} />

      {/* Soft under-glow so the platform reads as floating */}
      <mesh position={[0, baseBottom - 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[BASE_UPPER_HALF * 4.2, BASE_UPPER_HALF * 4.2]} />
        <meshBasicMaterial
          map={glowTexture}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      {/* Dais: thin neon edge on each step + outer diamond */}
      {DAIS_OUTLINES.map(({ points, height }) => (
        <Line
          key={height}
          points={points}
          position={[0, height + 0.004, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          color="#a5f3fc"
          lineWidth={1.4}
          toneMapped={false}
        />
      ))}
      <Line
        points={DAIS_DIAMOND}
        position={[0, DECK_SURFACE, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        color={NEON_CYAN}
        lineWidth={2.2}
        toneMapped={false}
      />

      {/* Hologram projector: beam rising from the dais around the crystal */}
      <mesh ref={beam} position={[0, DAIS_TOP + beamHeight / 2, 0]}>
        <cylinderGeometry args={[0.5, 0.6, beamHeight, 48, 1, true]} />
        <meshBasicMaterial
          map={beamTexture}
          color={NEON_CYAN}
          transparent
          opacity={0.42}
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
      {/* Rotating dashed projector ring around the dais */}
      <group position={[0, DECK_SURFACE + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <group ref={dashRing}>
          {Array.from({ length: PROJECTOR_DASHES }, (_, i) => (
            <mesh key={i}>
              <ringGeometry
                args={[0.84, 0.88, 6, 1, (i / PROJECTOR_DASHES) * Math.PI * 2, (Math.PI * 2) / PROJECTOR_DASHES * 0.55]}
              />
              <meshBasicMaterial color={VISOR_PINK} transparent opacity={0.85} toneMapped={false} />
            </mesh>
          ))}
        </group>
      </group>

      {/* Holographic floor rings */}
      <mesh position={[0, DECK_SURFACE + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.33, 1.36, 128]} />
        <meshBasicMaterial color={NEON_CYAN} transparent opacity={0.85} toneMapped={false} />
      </mesh>
      <mesh position={[0, DECK_SURFACE + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.62, 1.635, 128]} />
        <meshBasicMaterial color="#60a5fa" transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* ------------------------------------------------------------------ */
/* Small floating holographic abacus panel                             */
/* ------------------------------------------------------------------ */
const PANEL_FRAME = roundedRectXY(0.36, 0.26, 0.05)
const BEAD_ROWS: { y: number; beads: number[]; color: string }[] = [
  { y: 0.14, beads: [-0.24, -0.16, -0.08, 0.16], color: VISOR_PINK },
  { y: 0, beads: [-0.24, -0.16, 0.08, 0.16, 0.24], color: NEON_CYAN },
  { y: -0.14, beads: [-0.24, 0.0, 0.08, 0.16], color: GOLD },
]

function AbacusPanel() {
  return (
    <Float speed={2} rotationIntensity={0.25} floatIntensity={0.6}>
      <group position={[2.05, 0.95, -0.35]} rotation={[0, -0.55, 0.06]} scale={0.85}>
        <mesh>
          <planeGeometry args={[0.72, 0.52]} />
          <meshBasicMaterial color="#1e3a8a" transparent opacity={0.35} side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
        </mesh>
        <Line points={PANEL_FRAME} color={NEON_CYAN} lineWidth={2} toneMapped={false} />
        {BEAD_ROWS.map((row) => (
          <group key={row.y} position={[0, row.y, 0.01]}>
            <mesh>
              <boxGeometry args={[0.62, 0.012, 0.012]} />
              <meshBasicMaterial color="#e2e8f0" transparent opacity={0.7} toneMapped={false} />
            </mesh>
            {row.beads.map((x) => (
              <mesh key={x} position={[x, 0, 0]} scale={[1, 0.8, 0.8]}>
                <sphereGeometry args={[0.034, 12, 10]} />
                <meshBasicMaterial color={row.color} toneMapped={false} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    </Float>
  )
}

/* ------------------------------------------------------------------ */
/* Scene                                                               */
/* ------------------------------------------------------------------ */
const JUMP_SECONDS = 0.8
const CHEER_MS = 1600

export function CaptainHexaCubieScene() {
  const reduced = useReducedMotion() // decorative motion (idle loops, hop/spin, sparkles) stops
  const [hovered, setHovered] = useState(false)
  const [cheering, setCheering] = useState(false)
  const [greeting, setGreeting] = useState(0)
  const [burst, setBurst] = useState(0)
  const happy = hovered || cheering

  const rig = useRef<THREE.Group>(null) // look-at + jump/spin
  const body = useRef<THREE.Group>(null) // breathing / squash
  const bodyMesh = useRef<THREE.Mesh>(null)
  const leftHand = useRef<THREE.Group>(null)
  const rightHand = useRef<THREE.Group>(null)
  const crystals = useRef<(THREE.Mesh | null)[]>([])
  const eyes = useRef<THREE.Group>(null)
  const irises = useRef<THREE.Group>(null)
  const mouth = useRef<THREE.Mesh>(null)
  const ring = useRef<THREE.Group>(null)
  const outerRing = useRef<THREE.Group>(null)
  const pyramid = useRef<THREE.Mesh>(null)

  const jump = useRef<number | null>(null)
  const yaw = useRef(0)
  const nextBlink = useRef(2)
  const blinkStart = useRef(-1)

  // Custom geometry + textures (disposed below). JSX geometries/materials are disposed by R3F.
  const starGeometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(makeStarShape(0.21, 0.09), {
      depth: 0.04,
      bevelEnabled: true,
      bevelThickness: 0.015,
      bevelSize: 0.012,
      bevelSegments: 2,
    })
    g.center()
    return g
  }, [])
  useEffect(() => () => starGeometry.dispose(), [starGeometry])
  const visorTextures = useGlyphTextures(VISOR_GLYPHS)
  const ringTextures = useGlyphTextures(RING_GLYPHS)
  const outerRingTextures = useGlyphTextures(OUTER_RING_GLYPHS)
  const nebula = useNebulaTexture()

  // Cyan → purple vertical gradient baked into the body's vertex colours.
  // Three stops with a fairly tight crossover keep the transition crisp and
  // saturated (a wide blend through a pale mid-tone is what looked washed out).
  useLayoutEffect(() => {
    const geometry = bodyMesh.current?.geometry
    if (!geometry) return
    geometry.computeBoundingBox()
    const box = geometry.boundingBox
    if (!box) return
    const pos = geometry.getAttribute('position')
    const colors = new Float32Array(pos.count * 3)
    const top = new THREE.Color(BODY_TOP)
    const mid = new THREE.Color(BODY_BOTTOM)
    const base = new THREE.Color(BODY_BASE)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) - box.min.y) / (box.max.y - box.min.y)
      // base (deep purple) → purple over the lowest fifth, then purple → cyan around the goggle line
      c.copy(base).lerp(mid, THREE.MathUtils.smoothstep(t, 0.0, 0.22))
      c.lerp(top, THREE.MathUtils.smoothstep(t, 0.34, 0.56))
      colors.set([c.r, c.g, c.b], i * 3)
    }
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  }, [])

  useEffect(() => {
    if (!cheering) return
    const id = window.setTimeout(() => setCheering(false), CHEER_MS)
    return () => window.clearTimeout(id)
  }, [cheering])

  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((state, delta) => {
    const t = reduced ? 0 : state.clock.elapsedTime
    const dt = Math.min(delta, 1 / 30)
    if (reduced) jump.current = null
    const damp = THREE.MathUtils.damp

    if (rig.current) {
      const targetYaw = state.pointer.x * 0.45
      const targetPitch = -state.pointer.y * 0.18
      rig.current.rotation.x = damp(rig.current.rotation.x, targetPitch, 4, dt)

      let hop = 0
      let spin = 0
      let squash = 0
      if (jump.current !== null) {
        jump.current += dt
        const p = Math.min(1, jump.current / JUMP_SECONDS)
        hop = Math.sin(Math.PI * p) * 0.75
        spin = easeInOut(p) * Math.PI * 2
        if (p < 0.12) squash = Math.sin((Math.PI * p) / 0.12) * 0.14
        else if (p > 0.88) squash = Math.sin((Math.PI * (p - 0.88)) / 0.12) * 0.14
        if (p >= 1) jump.current = null
      }
      rig.current.position.y = hop
      yaw.current = damp(yaw.current, targetYaw, 4, dt)
      rig.current.rotation.y = yaw.current + spin

      if (body.current) {
        const breathe = Math.sin(t * 2.2) * 0.018
        const side = 1 - breathe * 0.5 + squash * 0.5
        body.current.scale.set(side, 1 + breathe - squash, side)
      }
    }

    // Irises follow the pointer a little.
    if (irises.current) {
      irises.current.position.x = damp(irises.current.position.x, state.pointer.x * 0.035, 6, dt)
      irises.current.position.y = damp(irises.current.position.y, state.pointer.y * 0.03, 6, dt)
    }

    // Hands bob gently and in step, mirror-symmetric beside the cube (no orbit, so
    // they never drift into the ear pieces or the glyph rings). The right one
    // lifts a little and waves while he's happy.
    const bob = Math.sin(t * 1.8) * 0.05
    const sway = Math.sin(t * 1.3) * 0.06
    if (leftHand.current) {
      leftHand.current.position.set(-HAND_X, HAND_Y + bob, HAND_Z)
      leftHand.current.rotation.z = -sway
    }
    if (rightHand.current) {
      const targetY = HAND_Y + (happy ? 0.16 : bob)
      rightHand.current.position.set(HAND_X, damp(rightHand.current.position.y, targetY, 6, dt), HAND_Z)
      const waveZ = happy ? Math.sin(t * 10) * 0.35 : sway
      rightHand.current.rotation.z = damp(rightHand.current.rotation.z, waveZ, 10, dt)
    }
    crystals.current.forEach((c, i) => {
      if (!c) return
      c.rotation.y = t * (i ? -0.9 : 0.8)
      c.rotation.x = t * 0.5
    })

    if (ring.current) ring.current.rotation.y = t * 0.18
    if (outerRing.current) outerRing.current.rotation.y = -t * 0.11
    if (pyramid.current) pyramid.current.rotation.y = t * 0.4

    // Blink every few seconds (eyes become arcs while happy).
    if (eyes.current) {
      if (blinkStart.current < 0 && t > nextBlink.current) blinkStart.current = t
      let open = 1
      if (blinkStart.current >= 0) {
        const p = (t - blinkStart.current) / 0.16
        open = p >= 1 ? 1 : Math.abs(1 - 2 * p) * 0.9 + 0.1
        if (p >= 1) {
          blinkStart.current = -1
          nextBlink.current = t + 2.5 + Math.random() * 2.5
        }
      }
      eyes.current.scale.y = damp(eyes.current.scale.y, happy ? 1 : open, 30, dt)
    }

    if (mouth.current) {
      const target = cheering ? 1.5 : happy ? 1.25 : 1
      const s = damp(mouth.current.scale.x, target, 8, dt)
      mouth.current.scale.set(s, s, 1)
    }
  })

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!hovered) playPop()
    setHovered(true)
  }
  const onOut = () => setHovered(false)
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    jump.current = 0
    setCheering(true)
    setGreeting((g) => (g + 1) % GREETINGS.length)
    setBurst((b) => b + 1)
    playHello()
  }

  return (
    <group>
      {/* Backdrop: painted nebula sphere + procedural stars (no downloads) */}
      <mesh>
        <sphereGeometry args={[50, 32, 16]} />
        <meshBasicMaterial map={nebula} side={THREE.BackSide} depthWrite={false} toneMapped={false} />
      </mesh>
      <Stars radius={30} depth={18} count={2600} factor={3.5} saturation={0.5} fade speed={reduced ? 0 : 0.6} />
      {/* Drifting sparkles around the Captain (procedural shader points) */}
      <Sparkles count={70} scale={[6, 3.5, 5]} position={[0, 0.3, 0]} size={2.5} speed={reduced ? 0 : 0.35} opacity={0.8} color="#a5f3fc" />
      <Sparkles count={40} scale={[5, 3, 4]} position={[0, 0.5, 0]} size={3} speed={reduced ? 0 : 0.25} opacity={0.7} color="#f0abfc" />

      {/* Coloured rim lights stand in for an HDR environment */}
      <pointLight position={[-3, 1.5, 2]} intensity={11} color="#a855f7" />
      <pointLight position={[3, 0.5, 2.5]} intensity={10} color="#22d3ee" />
      {/* Back rim lights so the cube's bevels catch a clean edge against the dark sky */}
      <pointLight position={[-1.8, 1.6, -2.4]} intensity={9} distance={7} color="#67e8f9" />
      <pointLight position={[1.9, 0.4, -2.2]} intensity={8} distance={7} color="#c084fc" />
      <pointLight position={[0, 2.8, -1.2]} intensity={5} distance={6} color="#e0f2fe" />
      <pointLight position={[0, -0.4, 2]} intensity={2} color="#e879f9" />

      <Float speed={1.6} rotationIntensity={0.15} floatIntensity={0.45} floatingRange={[-0.06, 0.06]}>
        <group ref={rig} onPointerOver={onOver} onPointerOut={onOut} onClick={onClick}>
          <group ref={body}>
            {/* Body: chunky, slightly squat rounded cube with a cyan→purple gradient */}
            <RoundedBox ref={bodyMesh} args={[BODY_W, BODY_H, BODY_D]} radius={BODY_R} smoothness={6} castShadow>
              {/* Satin body: moderate roughness keeps colour saturated (no glare wash),
                  a softer clear-coat adds gloss without blowing out, and a cyan sheen
                  brightens the bevels at grazing angles as a rim accent. */}
              <meshPhysicalMaterial
                vertexColors
                metalness={0.12}
                roughness={0.34}
                clearcoat={0.55}
                clearcoatRoughness={0.28}
                sheen={0.6}
                sheenRoughness={0.35}
                sheenColor="#a5f3fc"
                specularIntensity={0.6}
              />
            </RoundedBox>

            {/* Eyes: sit on the front face, just behind the goggle glass */}
            <group ref={eyes} position={[0, FACE_Y - 0.025, FRONT_Z + 0.004]}>
              {[-EYE_X, EYE_X].map((x) =>
                happy ? (
                  <mesh key={x} position={[x, -0.04, 0.02]}>
                    <torusGeometry args={[EYE_R * 0.68, 0.032, 10, 28, Math.PI]} />
                    <meshBasicMaterial color="#1e1b4b" />
                  </mesh>
                ) : (
                  <mesh key={x} position={[x, 0, 0]} scale={[1, 1.16, 0.18]}>
                    <sphereGeometry args={[EYE_R, 28, 20]} />
                    <meshStandardMaterial color="#ffffff" roughness={0.2} />
                  </mesh>
                ),
              )}
              {!happy && (
                <group ref={irises}>
                  {[-EYE_X, EYE_X].map((x) => (
                    <group key={x} position={[x, -0.015, 0.025]}>
                      <mesh scale={[1, 1.15, 0.22]}>
                        <sphereGeometry args={[EYE_R * 0.74, 24, 18]} />
                        <meshStandardMaterial color={IRIS} emissive="#4338ca" emissiveIntensity={0.25} roughness={0.15} metalness={0.1} />
                      </mesh>
                      <mesh position={[0, -0.01, 0.02]} scale={[1, 1.15, 0.22]}>
                        <sphereGeometry args={[EYE_R * 0.4, 18, 14]} />
                        <meshBasicMaterial color="#0b1026" />
                      </mesh>
                      <mesh position={[EYE_R * 0.26, EYE_R * 0.36, 0.045]} scale={[1, 1, 0.5]}>
                        <sphereGeometry args={[EYE_R * 0.22, 12, 10]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                      </mesh>
                      <mesh position={[-EYE_R * 0.21, -EYE_R * 0.3, 0.045]} scale={[1, 1, 0.5]}>
                        <sphereGeometry args={[EYE_R * 0.1, 10, 8]} />
                        <meshBasicMaterial color="#ffffff" toneMapped={false} />
                      </mesh>
                    </group>
                  ))}
                </group>
              )}
              {happy &&
                [-0.36, 0.36].map((x) => (
                  <mesh key={x} position={[x, -0.16, 0.01]}>
                    <circleGeometry args={[0.055, 20]} />
                    <meshBasicMaterial color="#f472b6" transparent opacity={0.6} />
                  </mesh>
                ))}
            </group>

            {/* Smile, centred under the goggle on the flat part of the face */}
            <mesh ref={mouth} position={[0, MOUTH_Y, FRONT_Z + 0.006]} rotation={[0, 0, Math.PI]}>
              <torusGeometry args={[0.09, 0.025, 10, 24, Math.PI]} />
              <meshStandardMaterial color="#1e1b4b" roughness={0.6} />
            </mesh>

            {/* Crisp square frame around the face */}
            <Line points={FACE_FRAME} position={[0, 0, FRONT_Z + 0.003]} color="#a5f3fc" lineWidth={3} toneMapped={false} />
            <Line
              points={FACE_FRAME_INNER}
              position={[0, 0, FRONT_Z + 0.003]}
              color={VISOR_PINK}
              lineWidth={1.2}
              transparent
              opacity={0.6}
              toneMapped={false}
            />

            {/* Faint band wrapping the head at goggle height, joining the ear pieces */}
            <RoundedBox
              args={[BODY_W + 0.05, GOGGLE_HH * 2 - 0.04, BODY_D + 0.05]}
              radius={BODY_R}
              smoothness={4}
              position={[0, FACE_Y, 0]}
            >
              <meshStandardMaterial color={VISOR_PINK} emissive="#d946ef" emissiveIntensity={0.4} transparent opacity={0.1} depthWrite={false} />
            </RoundedBox>
            {[FACE_Y + GOGGLE_HH - 0.02, FACE_Y - GOGGLE_HH + 0.02].map((y) => (
              <Line
                key={y}
                points={BAND_RIM}
                position={[0, y, 0]}
                rotation={[-Math.PI / 2, 0, 0]}
                color={VISOR_PINK}
                lineWidth={1.5}
                transparent
                opacity={0.7}
                toneMapped={false}
              />
            ))}

            {/* Goggle seated on the face: bezel walls from the face to the glass */}
            <group position={[0, FACE_Y, FRONT_Z - 0.01]}>
              {[
                [0, GOGGLE_HH, GOGGLE_HW * 2 + 0.04, 0.04],
                [0, -GOGGLE_HH, GOGGLE_HW * 2 + 0.04, 0.04],
                [GOGGLE_HW, 0, 0.04, GOGGLE_HH * 2],
                [-GOGGLE_HW, 0, 0.04, GOGGLE_HH * 2],
              ].map(([x, y, w, h], i) => (
                <RoundedBox key={i} args={[w, h, GOGGLE_DEPTH]} radius={0.015} smoothness={2} position={[x, y, GOGGLE_DEPTH / 2]}>
                  <meshStandardMaterial color="#f5d0fe" emissive="#e879f9" emissiveIntensity={0.7} metalness={0.2} roughness={0.3} />
                </RoundedBox>
              ))}
              {/* Glass */}
              <mesh position={[0, 0, GOGGLE_DEPTH - 0.005]}>
                <planeGeometry args={[GOGGLE_HW * 2, GOGGLE_HH * 2]} />
                <meshStandardMaterial
                  color={VISOR_PINK}
                  emissive="#e879f9"
                  emissiveIntensity={happy ? 0.7 : 0.4}
                  transparent
                  opacity={0.2}
                  depthWrite={false}
                  roughness={0.05}
                />
              </mesh>
              {/* Neon double rim on the glass edge */}
              <Line points={GOGGLE_OUTER} position={[0, 0, GOGGLE_DEPTH + 0.004]} color="#f5d0fe" lineWidth={4} toneMapped={false} />
              <Line points={GOGGLE_INNER} position={[0, 0, GOGGLE_DEPTH + 0.004]} color={NEON_CYAN} lineWidth={2} toneMapped={false} />
              {/* Math glyphs on the glass, kept inside the frame */}
              {VISOR_GLYPHS.map((g, i) => (
                <mesh key={i} position={[g.x, g.y, GOGGLE_DEPTH + 0.008]}>
                  <planeGeometry args={[g.w, g.w / 2]} />
                  <meshBasicMaterial map={visorTextures[i]} transparent depthWrite={false} toneMapped={false} />
                </mesh>
              ))}
            </group>

            {/* Ear pieces mounted flush on the side faces */}
            {[-1, 1].map((side) => (
              <group key={side} position={[side * (BODY_W / 2 + 0.04), FACE_Y, 0]} rotation={[0, 0, Math.PI / 2]}>
                <mesh>
                  <cylinderGeometry args={[0.24, 0.24, 0.1, 36]} />
                  <meshStandardMaterial color={STEEL} metalness={0.6} roughness={0.3} />
                </mesh>
                <mesh position={[0, -side * 0.055, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.18, 0.032, 12, 48]} />
                  <meshBasicMaterial color={NEON_CYAN} toneMapped={false} />
                </mesh>
                <mesh position={[0, -side * 0.052, 0]} rotation={[side * Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.12, 32]} />
                  <meshBasicMaterial color="#0e7490" transparent opacity={0.85} toneMapped={false} />
                </mesh>
              </group>
            ))}

            {/* Peaked officer cap, seated on the flat top face (band slightly sunk in) */}
            <group position={[0, BODY_H / 2 - CAP_SINK, 0]} rotation={[-0.05, 0, 0.08]}>
              {/* Band: fits the flat part of the top face */}
              <mesh position={[0, 0.085, 0]}>
                <cylinderGeometry args={[CAP_BAND_R, CAP_BAND_R + 0.01, 0.17, 48]} />
                <meshPhysicalMaterial color={CAP_BAND} metalness={0.3} roughness={0.4} clearcoat={0.4} />
              </mesh>
              {/* Crown flaring gently, still within the cube's footprint */}
              <mesh position={[0, 0.33, -0.03]} castShadow>
                <cylinderGeometry args={[0.8, CAP_BAND_R, 0.32, 56, 8]} onUpdate={(g) => applyCapGradient(g, 0.33)} />
                <meshPhysicalMaterial
                  vertexColors
                  metalness={0.3}
                  roughness={0.32}
                  clearcoat={0.8}
                  clearcoatRoughness={0.2}
                  emissive="#64748b"
                  emissiveIntensity={0.12}
                />
              </mesh>
              {/* Rounded, puffy rim around the top edge */}
              <mesh position={[0, 0.49, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[0.76, 0.065, 16, 72]} />
                {/* The rim sits at cap height ≈ 0.49, so it takes that point of the gradient */}
                <meshPhysicalMaterial color={capGradientAt(0.49)} metalness={0.3} roughness={0.3} clearcoat={0.8} clearcoatRoughness={0.2} />
              </mesh>
              {/* Domed top */}
              <mesh position={[0, 0.5, -0.03]} scale={[0.77, 0.13, 0.77]}>
                <sphereGeometry
                  args={[1, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2]}
                  onUpdate={(g) => applyCapGradient(g, 0.5, 0.13)}
                />
                <meshPhysicalMaterial
                  vertexColors
                  metalness={0.3}
                  roughness={0.28}
                  clearcoat={0.9}
                  clearcoatRoughness={0.15}
                  emissive="#94a3b8"
                  emissiveIntensity={0.15}
                />
              </mesh>
              {/* Short peak, ending above the front face (not over the goggle) */}
              <mesh position={[0, 0.02, 0.18]} rotation={[0.12, 0, 0]} scale={[1, 1, 0.72]}>
                <cylinderGeometry args={[0.6, 0.6, 0.045, 48, 1, false, -Math.PI / 2, Math.PI]} />
                <meshPhysicalMaterial color={BRIM} metalness={0.3} roughness={0.2} clearcoat={1} clearcoatRoughness={0.1} />
              </mesh>
              {/* Gold cord above the peak */}
              <mesh position={[0, 0.17, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                <torusGeometry args={[CAP_BAND_R + 0.02, 0.02, 8, 48, Math.PI]} />
                <meshStandardMaterial color={GOLD} metalness={0.6} roughness={0.3} emissive="#b45309" emissiveIntensity={0.3} />
              </mesh>
              {/* Big star emblem on the crown front */}
              <mesh geometry={starGeometry} position={[0, 0.33, 0.69]} rotation={[-0.5, 0, 0]}>
                <meshStandardMaterial color={GOLD} emissive="#f59e0b" emissiveIntensity={happy ? 0.9 : 0.5} metalness={0.6} roughness={0.22} />
              </mesh>
            </group>
          </group>

          {/* Compact magnetic hands, mirror-symmetric beside the cube, each holding a glowing cube */}
          {[leftHand, rightHand].map((ref, i) => {
            const side = i === 0 ? -1 : 1
            const inner = -side // direction toward the body
            const cube = HELD_CUBES[i]
            return (
              <group key={i} ref={ref} position={[side * HAND_X, HAND_Y, HAND_Z]} scale={HAND_SCALE}>
                <group rotation={[0.35, 0, inner * 0.15]}>
                  {/* Magnetic glow ring at the wrist */}
                  <mesh position={[0, -0.2, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.2, 0.025, 10, 40]} />
                    <meshBasicMaterial color={NEON_CYAN} transparent opacity={0.85} toneMapped={false} />
                  </mesh>
                  {/* Cuff */}
                  <RoundedBox args={[0.34, 0.16, 0.28]} radius={0.06} smoothness={2} position={[0, -0.11, -0.06]}>
                    <meshStandardMaterial color="#8f99a8" metalness={0.5} roughness={0.35} />
                  </RoundedBox>
                  {/* Palm plate */}
                  <RoundedBox args={[0.42, 0.1, 0.36]} radius={0.05} smoothness={3} castShadow>
                    <meshStandardMaterial color={STEEL} metalness={0.5} roughness={0.33} />
                  </RoundedBox>
                  <mesh position={[0, 0.053, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <circleGeometry args={[0.11, 32]} />
                    <meshBasicMaterial color={cube.glow} transparent opacity={0.8} toneMapped={false} />
                  </mesh>
                  {/* Three short rounded fingers curling up */}
                  {[-0.135, 0, 0.135].map((fx) => (
                    <group key={fx} position={[fx, 0.01, 0.18]}>
                      <RoundedBox args={[0.11, 0.085, 0.14]} radius={0.04} smoothness={2} position={[0, 0.02, 0.05]} rotation={[-0.3, 0, 0]}>
                        <meshStandardMaterial color="#b4bdc9" metalness={0.5} roughness={0.33} />
                      </RoundedBox>
                      <RoundedBox args={[0.1, 0.075, 0.11]} radius={0.035} smoothness={2} position={[0, 0.085, 0.13]} rotation={[-0.95, 0, 0]}>
                        <meshStandardMaterial color="#c7cfd9" metalness={0.5} roughness={0.33} />
                      </RoundedBox>
                    </group>
                  ))}
                  {/* Thumb on the inner side */}
                  <group position={[inner * 0.23, 0.02, 0.02]} rotation={[0, 0, inner * 0.55]}>
                    <RoundedBox args={[0.09, 0.18, 0.1]} radius={0.04} smoothness={2} position={[0, 0.09, 0]}>
                      <meshStandardMaterial color="#c7cfd9" metalness={0.5} roughness={0.33} />
                    </RoundedBox>
                  </group>
                  {/* Held cube, hovering above the palm */}
                  <group position={[0, 0.25, 0.03]}>
                    <RoundedBox
                      ref={(m: THREE.Mesh | null) => {
                        crystals.current[i] = m
                      }}
                      args={[0.24, 0.24, 0.24]}
                      radius={0.04}
                      smoothness={3}
                    >
                      <meshStandardMaterial
                        color={cube.color}
                        emissive={cube.glow}
                        emissiveIntensity={0.75}
                        metalness={0.1}
                        roughness={0.15}
                        transparent
                        opacity={0.85}
                      />
                      <Edges color={cube.edge} threshold={30} />
                    </RoundedBox>
                    <pointLight intensity={1.2} distance={1.2} color={cube.glow} />
                  </group>
                </group>
              </group>
            )
          })}
        </group>
      </Float>

      {/* Orbiting holographic ring of math symbols */}
      <group position={[0, 0.0, 0]} rotation={[0.28, 0, -0.07]}>
        <group ref={ring}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[RING_RADIUS, 0.014, 8, 160]} />
            <meshBasicMaterial color={NEON_CYAN} transparent opacity={0.8} toneMapped={false} />
          </mesh>
          {/* Fainter inner echo ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, -0.08, 0]}>
            <torusGeometry args={[RING_RADIUS - 0.18, 0.008, 6, 160]} />
            <meshBasicMaterial color={VISOR_PINK} transparent opacity={0.45} toneMapped={false} />
          </mesh>
          {RING_GLYPHS.map((_, i) => {
            const a = (i / RING_GLYPHS.length) * Math.PI * 2
            return (
              <sprite key={i} position={[Math.cos(a) * RING_RADIUS, 0.14, Math.sin(a) * RING_RADIUS]} scale={[0.62, 0.31, 1]}>
                <spriteMaterial map={ringTextures[i]} transparent depthWrite={false} toneMapped={false} />
              </sprite>
            )
          })}
        </group>
      </group>

      {/* Outer counter-rotating glyph ring: steeper tilt so its front passes low,
          below the Captain's face, and its back rises behind the cap */}
      <group position={[0, -0.1, -0.2]} rotation={[0.42, 0, 0.1]}>
        <group ref={outerRing}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[OUTER_RING_RADIUS, 0.01, 6, 180]} />
            <meshBasicMaterial color={VISOR_PINK} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {OUTER_RING_GLYPHS.map((_, i) => {
            const a = (i / OUTER_RING_GLYPHS.length) * Math.PI * 2 + 0.2
            return (
              <sprite
                key={i}
                position={[Math.cos(a) * OUTER_RING_RADIUS, 0.12, Math.sin(a) * OUTER_RING_RADIUS]}
                scale={[0.5, 0.25, 1]}
              >
                <spriteMaterial map={outerRingTextures[i]} transparent opacity={0.85} depthWrite={false} toneMapped={false} />
              </sprite>
            )
          })}
        </group>
      </group>

      {/* Inverted crystal pyramid between the Captain and the floor */}
      {/* Tip rests on the dais (PLATFORM_Y + DAIS_TOP); cone is 0.52 tall */}
      <mesh ref={pyramid} position={[0, PLATFORM_Y + DAIS_TOP + 0.26, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.5, 0.52, 4]} />
        <meshStandardMaterial color={NEON_CYAN} emissive="#06b6d4" emissiveIntensity={0.9} transparent opacity={0.4} depthWrite={false} />
        <Edges color="#cffafe" />
      </mesh>
      <pointLight position={[0, -1.05, 0.4]} intensity={2.5} distance={3} color={NEON_CYAN} />

      <AbacusPanel />

      <CubeGridPlatform />

      {/* Speech bubble */}
      <SceneHtml position={[0, 1.95, 0]} center>
        <div className="speech-bubble" aria-live="polite">
          {GREETINGS[greeting]}
        </div>
      </SceneHtml>

      <ParticleBurst trigger={reduced ? 0 : burst} position={[0, 1.3, 0]} color="#f0abfc" count={140} />
    </group>
  )
}

export default CaptainHexaCubieScene
