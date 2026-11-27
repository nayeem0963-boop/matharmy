import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { TOTAL_MAX, type DivisionLayout } from '../../data/division'
import { prefersReducedMotion } from '../../utils/reducedMotion'

interface DivisionSceneProps {
  layout: DivisionLayout
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const CUBE = 0.86
const GAP_BEFORE_LEFTOVER = 0.8
const POP_SECONDS = 0.28
const FIT = 9.5 // longest side of the picture, in world units (keeps the 49-in-groups-of-2 case on screen)
const LEFTOVER_COLOR = '#f87171'
// One colour per group, cycling, so the groups can be told apart.
const GROUP_COLORS = ['#38bdf8', '#a3e635', '#fbbf24', '#c084fc', '#2dd4bf', '#fb923c', '#f472b6', '#60a5fa', '#4ade80', '#facc15']

const easeOutBack = (t: number) => {
  const c = 1.70158
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}

/**
 * Cubes laid out as one row per group, plus a separate row for what is left over.
 * Sharing and grouping draw the same picture: they differ only in which number
 * is the number of rows.
 */
export function DivisionScene({ layout, burstKey = 0 }: DivisionSceneProps) {
  const { groups, perGroup, leftOver } = layout
  const mesh = useRef<THREE.InstancedMesh>(null)
  const pop = useRef(1)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const geometry = useMemo(() => new THREE.BoxGeometry(CUBE, CUBE, CUBE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.1 }), [])
  useEffect(() => () => material.dispose(), [material])
  const groundGeometry = useMemo(() => new THREE.PlaneGeometry(60, 60), [])
  useEffect(() => () => groundGeometry.dispose(), [groundGeometry])
  const groundMaterial = useMemo(() => new THREE.ShadowMaterial({ opacity: 0.35 }), [])
  useEffect(() => () => groundMaterial.dispose(), [groundMaterial])

  // World positions of every cube: group rows first, then the left-over row.
  const slots = useMemo(() => {
    const width = Math.max(perGroup, leftOver, 1)
    const depth = groups + (leftOver > 0 ? GAP_BEFORE_LEFTOVER : 0)
    const scale = Math.min(1, FIT / Math.max(width, depth + 1))
    const out: { x: number; z: number; color: string; scale: number }[] = []
    const z0 = -(depth - 1) / 2
    for (let g = 0; g < groups; g++)
      for (let k = 0; k < perGroup; k++)
        out.push({ x: (k - (perGroup - 1) / 2) * scale, z: (z0 + g) * scale, color: GROUP_COLORS[g % GROUP_COLORS.length], scale })
    for (let k = 0; k < leftOver; k++)
      out.push({ x: (k - (leftOver - 1) / 2) * scale, z: (z0 + groups - 1 + 1 + GAP_BEFORE_LEFTOVER) * scale, color: LEFTOVER_COLOR, scale })
    return out
  }, [groups, perGroup, leftOver])

  const write = (grow: number) => {
    const m = mesh.current
    if (!m) return
    slots.forEach((s, i) => {
      dummy.position.set(s.x, (CUBE * s.scale) / 2, s.z)
      dummy.scale.setScalar(s.scale * grow)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    })
    m.count = slots.length
    m.instanceMatrix.needsUpdate = true
  }

  useLayoutEffect(() => {
    const m = mesh.current
    if (m) {
      slots.forEach((s, i) => m.setColorAt(i, new THREE.Color(s.color)))
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
    if (prefersReducedMotion()) {
      pop.current = 1
      write(1)
    } else {
      pop.current = 0
      write(0.01)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `write` only reads `slots`
  }, [slots])

  useFrame((_, delta) => {
    if (pop.current >= 1) return
    pop.current = Math.min(1, pop.current + delta / POP_SECONDS)
    write(Math.max(0.01, easeOutBack(pop.current)))
  })

  return (
    <group>
      <instancedMesh ref={mesh} args={[geometry, material, TOTAL_MAX]} castShadow receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={groundGeometry} material={groundMaterial} />
      <ParticleBurst trigger={burstKey} position={[0, 2.5, 0]} color="#a3e635" />
    </group>
  )
}

export default DivisionScene
