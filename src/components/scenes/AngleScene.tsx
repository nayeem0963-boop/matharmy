import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { angleFromPoint } from '../../data/angles'
import '../panels/angles.css'

interface AngleSceneProps {
  angle: number
  color?: string
  /** Click the protractor to point the ray there. */
  onPick?: (angle: number) => void
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const RADIUS = 5
const RAY_THICK = 0.09
const TICK_EVERY = 10
const toRad = (deg: number) => (deg * Math.PI) / 180

/**
 * A flat protractor seen from above. The baseline ray is fixed and points right;
 * the second ray and the shaded sector show the angle, measured counterclockwise.
 * Clicking anywhere on the protractor points the ray there.
 */
export function AngleScene({ angle, color = '#fb923c', onPick, burstKey = 0 }: AngleSceneProps) {
  const ticks = useRef<THREE.InstancedMesh>(null)
  // On a short stage (phones) the readout strip covers the bottom, so draw the protractor smaller and higher.
  const compact = useThree((s) => s.size.height < 450)
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const tickCount = 360 / TICK_EVERY

  const tickGeometry = useMemo(() => new THREE.BoxGeometry(1, 0.04, 0.04), [])
  useEffect(() => () => tickGeometry.dispose(), [tickGeometry])
  const tickMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#94a3b8' }), [])
  useEffect(() => () => tickMaterial.dispose(), [tickMaterial])
  const discGeometry = useMemo(() => new THREE.CircleGeometry(RADIUS + 0.4, 96), [])
  useEffect(() => () => discGeometry.dispose(), [discGeometry])
  const discMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.9 }), [])
  useEffect(() => () => discMaterial.dispose(), [discMaterial])

  // Tick marks every 10°, longer at 30° and 90° multiples.
  useLayoutEffect(() => {
    const m = ticks.current
    if (!m) return
    for (let i = 0; i < tickCount; i++) {
      const deg = i * TICK_EVERY
      const len = deg % 90 === 0 ? 0.7 : deg % 30 === 0 ? 0.45 : 0.25
      const r = RADIUS - len / 2 + 0.2
      dummy.position.set(Math.cos(toRad(deg)) * r, 0.03, -Math.sin(toRad(deg)) * r)
      dummy.rotation.set(0, toRad(deg), 0)
      dummy.scale.set(len, 1, 1)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [dummy, tickCount])

  const rad = toRad(angle)
  const label = (deg: number, r: number) => [Math.cos(toRad(deg)) * r, 0.2, -Math.sin(toRad(deg)) * r] as const

  return (
    <group scale={compact ? 0.8 : 1} position={[0, 0, compact ? -2.3 : 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} geometry={discGeometry} material={discMaterial} receiveShadow />
      <instancedMesh ref={ticks} args={[tickGeometry, tickMaterial, tickCount]} />

      {/* The angle: a shaded sector from the baseline to the moving ray */}
      {angle > 0 && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <circleGeometry args={[RADIUS * 0.62, 72, 0, rad]} />
          <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Baseline (fixed) */}
      <mesh position={[RADIUS / 2, 0.08, 0]}>
        <boxGeometry args={[RADIUS, RAY_THICK, RAY_THICK]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>
      {/* Moving ray */}
      <group rotation={[0, rad, 0]}>
        <mesh position={[RADIUS / 2, 0.1, 0]}>
          <boxGeometry args={[RADIUS, RAY_THICK * 1.3, RAY_THICK * 1.3]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} roughness={0.3} />
        </mesh>
      </group>
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.16, 24, 16]} />
        <meshStandardMaterial color="#f8fafc" />
      </mesh>

      {[0, 90, 180, 270].map((d) => (
        <SceneHtml key={d} position={[...label(d, RADIUS + 0.95)]} center>
          <div className="angle-label">{d}°</div>
        </SceneHtml>
      ))}
      {angle > 0 && angle < 360 && (
        <SceneHtml position={[...label(angle / 2, RADIUS * 0.45)]} center>
          <div className="angle-label angle-label--main">{angle}°</div>
        </SceneHtml>
      )}

      {/* Invisible click target over the protractor */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.2, 0]}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => (document.body.style.cursor = '')}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          onPick?.(angleFromPoint(e.point.x, e.point.z))
        }}
      >
        <circleGeometry args={[RADIUS + 1, 64]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <ParticleBurst trigger={burstKey} position={[0, 2.5, 0]} color={color} />
    </group>
  )
}

export default AngleScene
