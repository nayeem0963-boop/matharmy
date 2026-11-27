import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { BASE_TRIANGLE, PLANE_MAX, PLANE_MIN, TRIANGLE_NAMES, clampCoord, pairText, type PlaneMode, type Vec } from '../../data/coordinatePlane'
import '../panels/coordinates.css'

interface PlaneSceneProps {
  mode: PlaneMode
  point: Vec
  triangle: Vec[]
  color?: string
  /** Click the plane to put the point there (plot mode). */
  onPick?: (p: Vec) => void
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const SPAN = PLANE_MAX - PLANE_MIN
const toWorld = (v: Vec) => [v.x, 0, -v.y] as const // y is up the screen, so away from the viewer
const TICKS = [-6, -4, -2, 2, 4, 6]
const TICKS_COMPACT = [-6, -3, 3, 6] // fewer numbers on a small stage

/** A flat triangle in the plane, as a geometry (x, y) -> (x, -z). */
function triangleGeometry(tri: Vec[]) {
  const shape = new THREE.Shape(tri.map((v) => new THREE.Vector2(v.x, v.y)))
  const g = new THREE.ShapeGeometry(shape)
  g.rotateX(-Math.PI / 2)
  return g
}

/**
 * The coordinate plane seen from above: a grid with brighter axes and numbered
 * ticks, then either a plotted point (with guide lines to the axes) or a
 * triangle (with a faint copy of where it started).
 */
export function PlaneScene({ mode, point, triangle, color = '#a78bfa', onPick, burstKey = 0 }: PlaneSceneProps) {
  // On a short stage (phones) the readout strip covers the bottom, so draw the plane smaller and higher.
  const compact = useThree((s) => s.size.height < 450)

  const lineGeometry = useMemo(() => new THREE.BoxGeometry(1, 0.02, 0.02), [])
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry])
  const gridMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#334155' }), [])
  useEffect(() => () => gridMaterial.dispose(), [gridMaterial])
  const axisMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#e2e8f0' }), [])
  useEffect(() => () => axisMaterial.dispose(), [axisMaterial])
  const guideMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fde047' }), [])
  useEffect(() => () => guideMaterial.dispose(), [guideMaterial])

  const triGeometry = useMemo(() => triangleGeometry(triangle), [triangle])
  useEffect(() => () => triGeometry.dispose(), [triGeometry])
  const ghostGeometry = useMemo(() => triangleGeometry(BASE_TRIANGLE), [])
  useEffect(() => () => ghostGeometry.dispose(), [ghostGeometry])

  const lines = Array.from({ length: SPAN + 1 }, (_, i) => PLANE_MIN + i)

  return (
    <group scale={compact ? 0.62 : 1} position={[0, 0, compact ? -1.8 : 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
        <planeGeometry args={[SPAN + 1.2, SPAN + 1.2]} />
        <meshStandardMaterial color="#0f172a" roughness={1} />
      </mesh>

      {lines.map((n) => (
        <group key={n}>
          <mesh geometry={lineGeometry} material={n === 0 ? axisMaterial : gridMaterial} position={[0, 0, n]} scale={[SPAN, n === 0 ? 3 : 1, n === 0 ? 3 : 1]} />
          <mesh geometry={lineGeometry} material={n === 0 ? axisMaterial : gridMaterial} position={[n, 0, 0]} rotation={[0, Math.PI / 2, 0]} scale={[SPAN, n === 0 ? 3 : 1, n === 0 ? 3 : 1]} />
        </group>
      ))}

      {(compact ? TICKS_COMPACT : TICKS).map((n) => (
        <group key={n}>
          <SceneHtml position={[n, 0.1, 0.45]} center>
            <div className="plane-label">{n}</div>
          </SceneHtml>
          <SceneHtml position={[-0.5, 0.1, -n]} center>
            <div className="plane-label">{n}</div>
          </SceneHtml>
        </group>
      ))}
      <SceneHtml position={[PLANE_MAX + 0.8, 0.1, 0]} center>
        <div className="plane-label">x</div>
      </SceneHtml>
      <SceneHtml position={[0, 0.1, -(PLANE_MAX + 0.8)]} center>
        <div className="plane-label">y</div>
      </SceneHtml>

      {mode === 'plot' && (
        <group>
          {/* Guide lines from the point to the axes: across, then up */}
          {point.x !== 0 && (
            <mesh geometry={lineGeometry} material={guideMaterial} position={[point.x / 2, 0.06, -point.y]} scale={[Math.abs(point.x), 3, 3]} />
          )}
          {point.y !== 0 && (
            <mesh geometry={lineGeometry} material={guideMaterial} position={[0, 0.06, -point.y / 2]} rotation={[0, Math.PI / 2, 0]} scale={[Math.abs(point.y), 3, 3]} />
          )}
          <mesh position={[...toWorld(point)]} castShadow>
            <sphereGeometry args={[0.28, 32, 16]} />
            <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.5} />
          </mesh>
          <SceneHtml position={[point.x, 0.9, -point.y]} center>
            <div className="plane-label plane-label--point">{pairText(point)}</div>
          </SceneHtml>
        </group>
      )}

      {mode === 'move' && (
        <group>
          <mesh geometry={ghostGeometry} position={[0, 0.02, 0]}>
            <meshBasicMaterial color="#94a3b8" transparent opacity={0.22} side={THREE.DoubleSide} />
          </mesh>
          <mesh geometry={triGeometry} position={[0, 0.05, 0]}>
            <meshBasicMaterial color={color} transparent opacity={0.8} side={THREE.DoubleSide} />
          </mesh>
          {triangle.map((c, i) => (
            <group key={i}>
              <mesh position={[...toWorld(c)]}>
                <sphereGeometry args={[0.16, 24, 12]} />
                <meshStandardMaterial color="#f8fafc" />
              </mesh>
              <SceneHtml position={[c.x, 0.7, -c.y]} center>
                <div className="plane-label plane-label--corner">
                  {TRIANGLE_NAMES[i]} {pairText(c)}
                </div>
              </SceneHtml>
            </group>
          ))}
        </group>
      )}

      {/* Invisible click target over the plane */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.2, 0]}
        onPointerOver={() => mode === 'plot' && (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (mode !== 'plot') return
          // The scene group may be scaled on short stages, so convert back to plane units.
          const local = e.object.parent ? e.object.parent.worldToLocal(e.point.clone()) : e.point
          onPick?.({ x: clampCoord(local.x), y: clampCoord(-local.z) })
        }}
      >
        <planeGeometry args={[SPAN + 1.2, SPAN + 1.2]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ParticleBurst trigger={burstKey} position={[0, 2.5, 0]} color={color} />
    </group>
  )
}

export default PlaneScene
