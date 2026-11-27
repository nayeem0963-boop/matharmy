import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Edges } from '@react-three/drei'
import * as THREE from 'three'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import {
  getShape,
  triangleSide,
  type Dimensions,
  type ShapeId,
} from '../../data/geometryShapes'
import { playPop } from '../../utils/soundEffects'

interface GeometryExplorerSceneProps {
  shapeId: ShapeId
  /** Effective dimensions (cube already has width = height = depth). */
  dimensions: Dimensions
  showNet: boolean
  color?: string
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

/** World units per shape unit, so a 6-unit net still fits the view. */
const SCALE = 0.45
const HALF_PI = Math.PI / 2
const EDGE_COLOR = '#0f172a'

type Progress = RefObject<number>
const lerp = THREE.MathUtils.lerp

export function GeometryExplorerScene({
  shapeId,
  dimensions,
  showNet,
  color = '#22c55e',
  burstKey = 0,
}: GeometryExplorerSceneProps) {
  const shape = getShape(shapeId)
  const unfold = showNet && shape.hasNet
  const progress = useRef(0)
  const [hovered, setHovered] = useState(false)

  // One material shared by every face of every shape. Passed as a prop, so we own disposal.
  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        roughness: 0.45,
        metalness: 0.05,
        side: THREE.DoubleSide,
        polygonOffset: true,
        polygonOffsetFactor: 1,
        polygonOffsetUnits: 1,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useEffect(() => {
    material.color.set(color)
    material.emissive.set(hovered ? color : '#000000')
    material.emissiveIntensity = hovered ? 0.25 : 0
  }, [material, color, hovered])

  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((_, delta) => {
    const target = unfold ? 1 : 0
    const next = THREE.MathUtils.damp(progress.current, target, 4, delta)
    progress.current = Math.abs(next - target) < 1e-3 ? target : next
  })

  const { width, height, depth } = dimensions
  // Highest point of the shape; unfolded nets lie flat on the ground.
  const shapeTop = shapeId === 'sphere' ? width * 2 : unfold ? 1 : height
  const labelY = shapeTop * SCALE + 0.7

  const onOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    if (!hovered) playPop()
    setHovered(true)
  }
  const onOut = () => setHovered(false)

  return (
    <group>
      <group scale={SCALE} onPointerOver={onOver} onPointerOut={onOut}>
        {(shapeId === 'cube' || shapeId === 'rectangular-prism') && (
          <BoxNet l={width} h={height} w={depth} progress={progress} material={material} />
        )}
        {shapeId === 'triangular-prism' && (
          <TriangularPrismNet b={width} h={height} l={depth} progress={progress} material={material} />
        )}
        {shapeId === 'cylinder' && (
          <CylinderNet r={width} h={height} progress={progress} material={material} />
        )}
        {shapeId === 'sphere' && (
          <mesh position={[0, width, 0]} material={material} castShadow>
            <sphereGeometry args={[width, 48, 32]} />
          </mesh>
        )}
      </group>

      <SceneHtml position={[0, labelY, 0]} center>
        <div className="scene-label">
          <strong>{shape.name}</strong>
          <span>
            {shape.faces} {shape.faces === 1 ? 'face' : 'faces'}
            {shape.faceNote ? ` (${shape.faceNote})` : ''} · {shape.edges} edges ·{' '}
            {shape.vertices} vertices
          </span>
          {showNet && !shape.hasNet && (
            <span className="scene-label__note">A sphere can’t be flattened into a net.</span>
          )}
        </div>
      </SceneHtml>

      <ParticleBurst trigger={burstKey} position={[0, labelY - 0.4, 0]} color="#fde047" />

      <gridHelper args={[24, 24, '#334155', '#1e293b']} position={[0, -0.001, 0]} />
    </group>
  )
}

export default GeometryExplorerScene

interface NetProps {
  progress: Progress
  material: THREE.Material
}

/**
 * Cube / rectangular prism as six hinged faces.
 * The bottom face stays on the ground; four sides fall outward around their
 * bottom edges and the top face swings out from the front face.
 * l = x extent, h = y extent, w = z extent.
 */
function BoxNet({ l, h, w, progress, material }: NetProps & { l: number; h: number; w: number }) {
  const front = useRef<THREE.Group>(null)
  const back = useRef<THREE.Group>(null)
  const right = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const top = useRef<THREE.Group>(null)

  useFrame(() => {
    const a = HALF_PI * progress.current
    if (front.current) front.current.rotation.x = a
    if (back.current) back.current.rotation.x = -a
    if (right.current) right.current.rotation.z = -a
    if (left.current) left.current.rotation.z = a
    if (top.current) top.current.rotation.x = a
  })

  return (
    <group>
      <Face material={material} position={[0, 0, 0]} rotation={[-HALF_PI, 0, 0]} size={[l, w]} />

      <group ref={front} position={[0, 0, w / 2]}>
        <Face material={material} position={[0, h / 2, 0]} size={[l, h]} />
        <group ref={top} position={[0, h, 0]}>
          <Face material={material} position={[0, 0, -w / 2]} rotation={[-HALF_PI, 0, 0]} size={[l, w]} />
        </group>
      </group>
      <group ref={back} position={[0, 0, -w / 2]}>
        <Face material={material} position={[0, h / 2, 0]} size={[l, h]} />
      </group>
      <group ref={right} position={[l / 2, 0, 0]}>
        <Face material={material} position={[0, h / 2, 0]} rotation={[0, HALF_PI, 0]} size={[w, h]} />
      </group>
      <group ref={left} position={[-l / 2, 0, 0]}>
        <Face material={material} position={[0, h / 2, 0]} rotation={[0, HALF_PI, 0]} size={[w, h]} />
      </group>
    </group>
  )
}

/**
 * Triangular prism lying on a rectangular face. b = triangle base (x),
 * h = triangle height (y), l = prism length (z).
 */
function TriangularPrismNet({
  b,
  h,
  l,
  progress,
  material,
}: NetProps & { b: number; h: number; l: number }) {
  const s = triangleSide(b, h)
  const lean = Math.atan2(b / 2, h) // slanted faces lean inward by this angle
  const right = useRef<THREE.Group>(null)
  const left = useRef<THREE.Group>(null)
  const front = useRef<THREE.Group>(null)
  const back = useRef<THREE.Group>(null)

  const triangle = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute(
      'position',
      new THREE.Float32BufferAttribute([-b / 2, 0, 0, b / 2, 0, 0, 0, h, 0], 3),
    )
    g.computeVertexNormals()
    return g
  }, [b, h])
  useEffect(() => () => triangle.dispose(), [triangle])

  useFrame(() => {
    const t = progress.current
    if (right.current) right.current.rotation.z = lerp(lean, -HALF_PI, t)
    if (left.current) left.current.rotation.z = lerp(-lean, HALF_PI, t)
    if (front.current) front.current.rotation.x = HALF_PI * t
    if (back.current) back.current.rotation.x = -HALF_PI * t
  })

  return (
    <group>
      <Face material={material} position={[0, 0, 0]} rotation={[-HALF_PI, 0, 0]} size={[b, l]} />
      <group ref={right} position={[b / 2, 0, 0]} rotation={[0, 0, lean]}>
        <Face material={material} position={[0, s / 2, 0]} rotation={[0, HALF_PI, 0]} size={[l, s]} />
      </group>
      <group ref={left} position={[-b / 2, 0, 0]} rotation={[0, 0, -lean]}>
        <Face material={material} position={[0, s / 2, 0]} rotation={[0, HALF_PI, 0]} size={[l, s]} />
      </group>
      <group ref={front} position={[0, 0, l / 2]}>
        <mesh geometry={triangle} material={material} castShadow>
          <Edges color={EDGE_COLOR} />
        </mesh>
      </group>
      <group ref={back} position={[0, 0, -l / 2]}>
        <mesh geometry={triangle} material={material} castShadow>
          <Edges color={EDGE_COLOR} />
        </mesh>
      </group>
    </group>
  )
}

const CYLINDER_SEGMENTS = 64

/** Portion of the unfold spent unrolling; the rest lays the flat net on the ground. */
const UNROLL_PHASE = 0.6

/**
 * Cylinder whose curved surface unrolls into a rectangle by straightening its
 * curvature (arc length is preserved), while both caps swing out on hinges.
 * The flat net then tips over onto the ground around its front-bottom edge.
 */
function CylinderNet({ r, h, progress, material }: NetProps & { r: number; h: number }) {
  const tilt = useRef<THREE.Group>(null)
  const lift = useRef<THREE.Group>(null)
  const topCap = useRef<THREE.Group>(null)
  const bottomCap = useRef<THREE.Group>(null)
  const lastT = useRef(-1)

  // Strip of width 2πr. We keep the flat u coordinates and bend them every frame.
  const { strip, flatU } = useMemo(() => {
    const g = new THREE.PlaneGeometry(2 * Math.PI * r, h, CYLINDER_SEGMENTS, 1)
    g.translate(0, h / 2, 0)
    const pos = g.getAttribute('position') as THREE.BufferAttribute
    const u = new Float32Array(pos.count)
    for (let i = 0; i < pos.count; i++) u[i] = pos.getX(i)
    return { strip: g, flatU: u }
  }, [r, h])
  useEffect(() => {
    lastT.current = -1 // force a re-bend for the new geometry
    return () => strip.dispose()
  }, [strip])

  useFrame(() => {
    const t = Math.min(1, progress.current / UNROLL_PHASE)
    const lay = THREE.MathUtils.clamp((progress.current - UNROLL_PHASE) / (1 - UNROLL_PHASE), 0, 1)
    if (topCap.current) topCap.current.rotation.x = HALF_PI * t
    if (bottomCap.current) bottomCap.current.rotation.x = -HALF_PI * t
    // Lift so the swinging bottom cap stays above the ground, then lay the net down.
    if (lift.current) lift.current.position.y = 2 * r * t
    if (tilt.current) {
      tilt.current.rotation.x = -HALF_PI * lay
      // Slide the laid-down net back so it is centred on the origin.
      tilt.current.position.z = r + ((h + 2 * r) / 2) * lay
    }
    if (t === lastT.current) return
    lastT.current = t

    const pos = strip.getAttribute('position') as THREE.BufferAttribute
    const k = 1 - t // curvature: 1 = rolled, 0 = flat
    for (let i = 0; i < pos.count; i++) {
      const u = flatU[i]
      if (k < 1e-3) {
        pos.setX(i, u)
        pos.setZ(i, r)
      } else {
        const R = r / k
        const angle = u / R
        pos.setX(i, R * Math.sin(angle))
        pos.setZ(i, r - R + R * Math.cos(angle))
      }
    }
    pos.needsUpdate = true
    strip.computeVertexNormals()
    strip.computeBoundingSphere()
  })

  return (
    // Tilt pivot sits on the ground under the strip's fixed front line (z = r).
    <group ref={tilt} position={[0, 0, r]}>
      <group ref={lift}>
        <group position={[0, 0, -r]}>
          <mesh geometry={strip} material={material} castShadow />
          <group ref={topCap} position={[0, h, r]}>
            <mesh position={[0, 0, -r]} rotation={[-HALF_PI, 0, 0]} material={material} castShadow>
              <circleGeometry args={[r, 48]} />
              <Edges color={EDGE_COLOR} />
            </mesh>
          </group>
          <group ref={bottomCap} position={[0, 0, r]}>
            <mesh position={[0, 0, -r]} rotation={[HALF_PI, 0, 0]} material={material} castShadow>
              <circleGeometry args={[r, 48]} />
              <Edges color={EDGE_COLOR} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  )
}

interface FaceProps {
  material: THREE.Material
  size: [number, number]
  position: [number, number, number]
  rotation?: [number, number, number]
}

/** A flat rectangular face with outlined edges. Its geometry is JSX, so R3F disposes it. */
function Face({ material, size, position, rotation = [0, 0, 0] }: FaceProps) {
  return (
    <mesh position={position} rotation={rotation} material={material} castShadow receiveShadow>
      <planeGeometry args={size} />
      <Edges color={EDGE_COLOR} />
    </mesh>
  )
}
