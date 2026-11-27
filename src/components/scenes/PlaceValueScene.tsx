import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber'

import * as THREE from 'three'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import {
  PLACE_INFO,
  PLACE_LIMITS,
  REGROUP_FLIGHT_SECONDS,
  REGROUP_SPECS,
  REGROUP_STAGGER_SECONDS,
  REGROUP_TOTAL_SECONDS,
  type Place,
  type PlaceValueCounts,
  type RegroupEvent,
} from '../../data/placeValue'
import { playPop } from '../../utils/soundEffects'

interface PlaceValueSceneProps {
  counts: PlaceValueCounts
  /** Increment to fire a celebration burst. */
  burstKey?: number
  /** The trade that produced `counts`, if any. A new id triggers the animation. */
  regroup?: RegroupEvent | null
}

/* Regroup animation tuning (seconds come from placeValue so audio stays in sync). */
const ARC_HEIGHT = 3.5
const SQUASH = 0.3

/** One unit cube flying from its old slot to its new one. */
interface Move {
  index: number // instance index in the new layout
  fromX: number
  fromY: number
  fromZ: number
  toX: number
  toY: number
  toZ: number
  delay: number
  fromColor: THREE.Color
  toColor: THREE.Color
}

interface RegroupAnimation {
  moves: Move[]
  time: number
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2)

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

/* Layout in "unit cube" units. Regions are fixed so blocks never jump around. */
const CUBE = 0.92 // visible size of one unit cube (gaps reveal the units)
const PITCH = 1.25 // spacing between rods / loose ones
const HUNDREDS_X0 = 0
const TENS_X0 = 12
const ONES_X0 = 26
const DEPTH = 10
const CENTER_X = 15.5
const CENTER_Z = DEPTH / 2
const SCALE = 0.27

const MAX_INSTANCES =
  PLACE_LIMITS.hundreds * 100 + PLACE_LIMITS.tens * 10 + PLACE_LIMITS.ones

interface Block {
  place: Place
  /** First instance index and number of unit cubes in this block. */
  start: number
  size: number
}

interface Layout {
  positions: Float32Array // xyz per instance
  blocks: Block[]
  blockOf: Int32Array // instance index -> block index
  count: number
}

function buildLayout({ hundreds, tens, ones }: PlaceValueCounts): Layout {
  const positions = new Float32Array(MAX_INSTANCES * 3)
  const blockOf = new Int32Array(MAX_INSTANCES)
  const blocks: Block[] = []
  let n = 0
  const push = (x: number, y: number, z: number) => {
    positions[n * 3] = x
    positions[n * 3 + 1] = y
    positions[n * 3 + 2] = z
    blockOf[n] = blocks.length - 1
    n++
  }

  // Hundreds: 10×10 flats stacked into a pile.
  for (let k = 0; k < hundreds; k++) {
    blocks.push({ place: 'hundreds', start: n, size: 100 })
    for (let i = 0; i < 10; i++)
      for (let j = 0; j < 10; j++) push(HUNDREDS_X0 + i + 0.5, k + 0.5, j + 0.5)
  }
  // Tens: rods lying along z, side by side; a second layer above for 10+.
  for (let r = 0; r < tens; r++) {
    blocks.push({ place: 'tens', start: n, size: 10 })
    const layer = Math.floor(r / 10)
    const x = TENS_X0 + (r % 10) * PITCH + 0.5
    for (let j = 0; j < 10; j++) push(x, layer + 0.5, j + 0.5)
  }
  // Ones: ten-frames (2 columns × 5 rows); a second frame beside the first.
  for (let o = 0; o < ones; o++) {
    blocks.push({ place: 'ones', start: n, size: 1 })
    const frame = Math.floor(o / 10)
    const i = o % 10
    const x = ONES_X0 + frame * 2.75 + Math.floor(i / 5) * PITCH + 0.5
    const z = 2 + (i % 5) * PITCH + 0.5
    push(x, 0.5, z)
  }
  return { positions, blocks, blockOf, count: n }
}

const cubeIndices = (blocks: Block[]) =>
  blocks.flatMap((b) => Array.from({ length: b.size }, (_, k) => b.start + k))

/**
 * Pair up the unit cubes that a trade moved: the last N blocks of the source
 * place in the old layout become the last M blocks of the target place in the
 * new one, cube for cube (rod r ↔ flat row r, so flats split into rods cleanly).
 */
function computeMoves(prev: Layout, next: Layout, event: RegroupEvent): Move[] | null {
  const spec = REGROUP_SPECS[event.kind]
  const oldBlocks = prev.blocks.filter((b) => b.place === spec.from).slice(-spec.fromBlocks)
  const newBlocks = next.blocks.filter((b) => b.place === spec.to).slice(-spec.toBlocks)
  const oldIdx = cubeIndices(oldBlocks)
  const newIdx = cubeIndices(newBlocks)
  if (oldIdx.length === 0 || oldIdx.length !== newIdx.length) return null

  // Stagger by the smaller block (each one cube, or each ten rod): always 10 groups.
  const groupSize = Math.min(oldBlocks[0].size, newBlocks[0].size)
  const fromColor = new THREE.Color(PLACE_INFO[spec.from].color)
  const toColor = new THREE.Color(PLACE_INFO[spec.to].color)
  return newIdx.map((index, k) => {
    const o = oldIdx[k] * 3
    const n = index * 3
    return {
      index,
      fromX: prev.positions[o],
      fromY: prev.positions[o + 1],
      fromZ: prev.positions[o + 2],
      toX: next.positions[n],
      toY: next.positions[n + 1],
      toZ: next.positions[n + 2],
      delay: Math.floor(k / groupSize) * REGROUP_STAGGER_SECONDS,
      fromColor,
      toColor,
    }
  })
}

const REGION_LABEL_X: Record<Place, number> = {
  hundreds: HUNDREDS_X0 + 5,
  tens: TENS_X0 + 6,
  ones: ONES_X0 + 2.5,
}

/** World-space width the camera must always show (all three regions + labels). */
const FIT_WIDTH = (ONES_X0 + 6) * SCALE + 0.8
const FIT_DEPTH = (DEPTH + 3) * SCALE
const VIEW_DIRECTION = new THREE.Vector3(0, 0.62, 0.78).normalize()

/**
 * Places the camera so the whole place-value mat fits the canvas at any aspect
 * ratio. Re-runs only when the canvas is resized, so user orbiting is kept otherwise.
 */
function useFitCamera() {
  const camera = useThree((s) => s.camera)
  const width = useThree((s) => s.size.width)
  const height = useThree((s) => s.size.height)
  const controls = useThree((s) => s.controls) as { target?: THREE.Vector3; update?: () => void } | null

  useEffect(() => {
    if (!(camera instanceof THREE.PerspectiveCamera) || width === 0 || height === 0) return
    const halfV = THREE.MathUtils.degToRad(camera.fov / 2)
    const aspect = width / height
    const distForWidth = FIT_WIDTH / 2 / (Math.tan(halfV) * aspect)
    const distForDepth = FIT_DEPTH / 2 / Math.tan(halfV)
    const dist = Math.max(distForWidth, distForDepth) * 1.05
    camera.position.copy(VIEW_DIRECTION).multiplyScalar(dist)
    camera.lookAt(0, 0, 0)
    if (controls?.target) {
      controls.target.set(0, 0, 0)
      controls.update?.()
    }
  }, [camera, controls, width, height])
}

export function PlaceValueScene({ counts, burstKey = 0, regroup = null }: PlaceValueSceneProps) {
  useFitCamera()
  const meshRef = useRef<THREE.InstancedMesh>(null)
  const [hoveredBlock, setHoveredBlock] = useState<number | null>(null)
  const layout = useMemo(() => buildLayout(counts), [counts])

  // Shared geometry + material owned by this component.
  const geometry = useMemo(() => new THREE.BoxGeometry(CUBE, CUBE, CUBE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const material = useMemo(
    () => new THREE.MeshStandardMaterial({ roughness: 0.5, metalness: 0.05 }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])

  const prevLayout = useRef<Layout | null>(null)
  const handledRegroupId = useRef<number | null>(regroup?.id ?? null)
  const anim = useRef<RegroupAnimation | null>(null)

  // Write instance transforms whenever the counts change. If the change came
  // from a new trade, start the moved cubes at their old slots and animate.
  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const m = new THREE.Matrix4()
    for (let i = 0; i < layout.count; i++) {
      m.makeTranslation(
        layout.positions[i * 3],
        layout.positions[i * 3 + 1],
        layout.positions[i * 3 + 2],
      )
      mesh.setMatrixAt(i, m)
    }

    anim.current = null
    if (regroup && regroup.id !== handledRegroupId.current && prevLayout.current) {
      handledRegroupId.current = regroup.id
      const moves = prefersReducedMotion() ? null : computeMoves(prevLayout.current, layout, regroup)
      if (moves) {
        for (const mv of moves) {
          m.makeTranslation(mv.fromX, mv.fromY, mv.fromZ)
          mesh.setMatrixAt(mv.index, m)
        }
        anim.current = { moves, time: 0 }
      }
    }
    prevLayout.current = layout

    mesh.count = layout.count
    mesh.instanceMatrix.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [layout, regroup])

  // Fly moved cubes along an arc, squashing slightly mid-flight and shifting
  // colour from the old place value to the new one.
  const tmp = useMemo(
    () => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), s: new THREE.Vector3(), c: new THREE.Color() }),
    [],
  )
  useFrame((_, delta) => {
    const a = anim.current
    const mesh = meshRef.current
    if (!a || !mesh) return
    a.time += Math.min(delta, 1 / 30)
    const done = a.time >= REGROUP_TOTAL_SECONDS
    for (const mv of a.moves) {
      const local = done ? 1 : THREE.MathUtils.clamp((a.time - mv.delay) / REGROUP_FLIGHT_SECONDS, 0, 1)
      const e = easeInOutCubic(local)
      const lift = Math.sin(Math.PI * e) * ARC_HEIGHT
      tmp.p.set(
        THREE.MathUtils.lerp(mv.fromX, mv.toX, e),
        THREE.MathUtils.lerp(mv.fromY, mv.toY, e) + lift,
        THREE.MathUtils.lerp(mv.fromZ, mv.toZ, e),
      )
      tmp.s.setScalar(1 - SQUASH * Math.sin(Math.PI * e))
      tmp.m.compose(tmp.p, tmp.q, tmp.s)
      mesh.setMatrixAt(mv.index, tmp.m)
      tmp.c.copy(mv.fromColor).lerp(mv.toColor, e)
      mesh.setColorAt(mv.index, tmp.c)
    }
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    if (done) {
      anim.current = null
      mesh.computeBoundingSphere()
    }
  })

  // Colour by place value; brighten the hovered block.
  useLayoutEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const base = {
      hundreds: new THREE.Color(PLACE_INFO.hundreds.color),
      tens: new THREE.Color(PLACE_INFO.tens.color),
      ones: new THREE.Color(PLACE_INFO.ones.color),
    }
    const white = new THREE.Color('#ffffff')
    const c = new THREE.Color()
    layout.blocks.forEach((b, bi) => {
      c.copy(base[b.place])
      if (bi === hoveredBlock) c.lerp(white, 0.35)
      for (let i = b.start; i < b.start + b.size; i++) mesh.setColorAt(i, c)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [layout, hoveredBlock])

  // Clear a stale hover when blocks are removed, and reset the cursor on unmount.
  const activeHover = hoveredBlock !== null && hoveredBlock < layout.blocks.length ? hoveredBlock : null
  useEffect(() => {
    if (activeHover === null) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [activeHover])

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (e.instanceId === undefined) return
    const block = layout.blockOf[e.instanceId]
    if (block !== hoveredBlock) {
      playPop()
      setHoveredBlock(block)
    }
  }

  const hoveredInfo = activeHover !== null ? layout.blocks[activeHover] : null

  return (
    <group>
      <group scale={SCALE}>
        <group position={[-CENTER_X, 0, -CENTER_Z]}>
          <instancedMesh
            ref={meshRef}
            args={[geometry, material, MAX_INSTANCES]}
            castShadow
            receiveShadow
            frustumCulled={false}
            onPointerMove={onMove}
            onPointerOut={() => setHoveredBlock(null)}
          />
          {(Object.keys(REGION_LABEL_X) as Place[]).map((place) => (
            <SceneHtml
              key={place}
              position={[REGION_LABEL_X[place], 0, DEPTH + 1.6]}
              center
             
            >
              <div className="scene-label scene-label--compact">
                <strong style={{ color: PLACE_INFO[place].color }}>
                  {counts[place]}{' '}
                  {counts[place] === 1 ? PLACE_INFO[place].singular : PLACE_INFO[place].label.toLowerCase()}
                </strong>
                <span>= {counts[place] * PLACE_INFO[place].value}</span>
              </div>
            </SceneHtml>
          ))}
        </group>
      </group>

      {hoveredInfo && (
        <SceneHtml position={[0, 2.2, 0]} center>
          <div className="scene-label">
            <strong>
              1 {PLACE_INFO[hoveredInfo.place].singular} = {hoveredInfo.size}{' '}
              {hoveredInfo.size === 1 ? 'unit' : 'units'}
            </strong>
          </div>
        </SceneHtml>
      )}

      <ParticleBurst trigger={burstKey} position={[0, 1.6, 0]} color="#93c5fd" />
      <gridHelper args={[24, 24, '#334155', '#1e293b']} position={[0, -0.001, 0]} />
    </group>
  )
}

export default PlaceValueScene
