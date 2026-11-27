import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { ARRAY_MAX } from '../../data/multiplication'
import { playPop } from '../../utils/soundEffects'
import { prefersReducedMotion } from '../../utils/reducedMotion'

interface ArraySceneProps {
  rows: number
  cols: number
  /** How many rows (from the top) are highlighted while counting. */
  counted: number
  color?: string
  /** Click a cube to count up to its row. */
  onCountRows?: (rows: number) => void
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const CUBE = 0.86
const PITCH = 1
const COUNT_COLOR = '#fde047'
const POP_SECONDS = 0.28
const MAX_CUBES = ARRAY_MAX * ARRAY_MAX

const easeOutBack = (t: number) => {
  const c = 1.70158
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}

/**
 * A rows x columns array of cubes, one instanced mesh. Cubes pop in when the
 * array changes; rows being counted are highlighted.
 */
export function ArrayScene({ rows, cols, counted, color = '#f472b6', onCountRows, burstKey = 0 }: ArraySceneProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  const pop = useRef(1) // 0..1 progress of the pop-in; 1 = finished
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const geometry = useMemo(() => new THREE.BoxGeometry(CUBE, CUBE, CUBE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), [])
  useEffect(() => () => material.dispose(), [material])
  const groundGeometry = useMemo(() => new THREE.PlaneGeometry(40, 40), [])
  useEffect(() => () => groundGeometry.dispose(), [groundGeometry])
  const groundMaterial = useMemo(() => new THREE.ShadowMaterial({ opacity: 0.35 }), [])
  useEffect(() => () => groundMaterial.dispose(), [groundMaterial])

  const write = (scale: number) => {
    const m = mesh.current
    if (!m) return
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        dummy.position.set((c - (cols - 1) / 2) * PITCH, CUBE / 2, (r - (rows - 1) / 2) * PITCH)
        dummy.scale.setScalar(scale)
        dummy.updateMatrix()
        m.setMatrixAt(r * cols + c, dummy.matrix)
      }
    }
    m.count = rows * cols
    m.instanceMatrix.needsUpdate = true
  }

  // New array: lay it out and start the pop-in (or show it at once with reduced motion).
  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      pop.current = 1
      write(1)
    } else {
      pop.current = 0
      write(0.01)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `write` only reads rows/cols
  }, [rows, cols])

  // Colour rows being counted.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const base = new THREE.Color(color)
    const hi = new THREE.Color(COUNT_COLOR)
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) m.setColorAt(r * cols + c, r < counted ? hi : base)
    }
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [rows, cols, counted, color])

  useFrame((_, delta) => {
    if (pop.current >= 1) return
    pop.current = Math.min(1, pop.current + delta / POP_SECONDS)
    write(Math.max(0.01, easeOutBack(pop.current)))
  })

  useEffect(() => {
    return () => {
      document.body.style.cursor = ''
    }
  }, [])

  return (
    <group>
      <instancedMesh
        ref={mesh}
        args={[geometry, material, MAX_CUBES]}
        castShadow
        receiveShadow
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
          playPop()
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
        onClick={(e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation()
          if (e.instanceId === undefined) return
          onCountRows?.(Math.floor(e.instanceId / cols) + 1)
        }}
      />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={groundGeometry} material={groundMaterial} />
      <ParticleBurst trigger={burstKey} position={[0, 2.5, 0]} color={color} />
    </group>
  )
}

export default ArrayScene
