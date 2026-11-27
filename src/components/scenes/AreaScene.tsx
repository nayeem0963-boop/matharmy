import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { SIDE_MAX, boundaryEdges, cellsOf, type AreaState } from '../../data/areaPerimeter'
import { prefersReducedMotion } from '../../utils/reducedMotion'

interface AreaSceneProps {
  /** A valid shape (see `validState`). */
  shape: AreaState
  showArea: boolean
  showPerimeter: boolean
  color?: string
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const FIT = 11 // longest side of the picture, in world units
const POP_SECONDS = 0.28
const EDGE_COLOR = '#fb923c'
const MAX_TILES = SIDE_MAX * SIDE_MAX
const MAX_EDGES = 4 * SIDE_MAX + 16 // an L-shape's boundary equals its bounding box's

const easeOutBack = (t: number) => {
  const c = 1.70158
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2
}

/**
 * The shape as flat unit tiles (area) with its boundary drawn as unit edges
 * (perimeter). Seen from above: the tiles are what you count for area, the
 * edges are what you count for perimeter.
 */
export function AreaScene({ shape, showArea, showPerimeter, color = '#818cf8', burstKey = 0 }: AreaSceneProps) {
  const tileMesh = useRef<THREE.InstancedMesh>(null)
  const edgeMesh = useRef<THREE.InstancedMesh>(null)
  const pop = useRef(1)
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const geometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const tileMaterial = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.05 }), [])
  useEffect(() => () => tileMaterial.dispose(), [tileMaterial])
  const edgeMaterial = useMemo(() => new THREE.MeshStandardMaterial({ color: EDGE_COLOR, roughness: 0.3, emissive: EDGE_COLOR, emissiveIntensity: 0.25 }), [])
  useEffect(() => () => edgeMaterial.dispose(), [edgeMaterial])
  const groundGeometry = useMemo(() => new THREE.PlaneGeometry(60, 60), [])
  useEffect(() => () => groundGeometry.dispose(), [groundGeometry])
  const groundMaterial = useMemo(() => new THREE.ShadowMaterial({ opacity: 0.3 }), [])
  useEffect(() => () => groundMaterial.dispose(), [groundMaterial])

  const layout = useMemo(() => {
    const cells = cellsOf(shape)
    const edges = boundaryEdges(cells)
    const s = Math.min(1, FIT / Math.max(shape.w, shape.h))
    const cx = (x: number) => (x - (shape.w - 1) / 2) * s
    const cz = (y: number) => ((shape.h - 1) / 2 - y) * s // row 0 is the bottom, nearest the camera
    const tiles = cells.map((c) => ({ x: cx(c.x), z: cz(c.y) }))
    const thick = 0.14 * s
    const edgeSlots = edges.map((e) => {
      const x = cx(e.x)
      const z = cz(e.y)
      switch (e.side) {
        case 'left': return { x: x - 0.5 * s, z, sx: thick, sz: s + thick }
        case 'right': return { x: x + 0.5 * s, z, sx: thick, sz: s + thick }
        case 'bottom': return { x, z: z + 0.5 * s, sx: s + thick, sz: thick }
        case 'top': return { x, z: z - 0.5 * s, sx: s + thick, sz: thick }
      }
    })
    return { s, tiles, edgeSlots }
  }, [shape])

  const write = (grow: number) => {
    const { s, tiles, edgeSlots } = layout
    const t = tileMesh.current
    if (t) {
      tiles.forEach((c, i) => {
        dummy.position.set(c.x, 0.08 * s, c.z)
        dummy.scale.set(0.94 * s * grow, 0.16 * s * grow, 0.94 * s * grow)
        dummy.updateMatrix()
        t.setMatrixAt(i, dummy.matrix)
      })
      t.count = showArea ? tiles.length : 0
      t.instanceMatrix.needsUpdate = true
    }
    const e = edgeMesh.current
    if (e) {
      edgeSlots.forEach((slot, i) => {
        dummy.position.set(slot.x, 0.22 * s, slot.z)
        dummy.scale.set(slot.sx * grow, 0.3 * s * grow, slot.sz * grow)
        dummy.updateMatrix()
        e.setMatrixAt(i, dummy.matrix)
      })
      e.count = showPerimeter ? edgeSlots.length : 0
      e.instanceMatrix.needsUpdate = true
    }
  }

  useLayoutEffect(() => {
    const t = tileMesh.current
    if (t) {
      const base = new THREE.Color(color)
      const alt = new THREE.Color(color).offsetHSL(0, 0, 0.06)
      layout.tiles.forEach((_, i) => t.setColorAt(i, (i + Math.floor(i / shape.w)) % 2 ? alt : base)) // checkerboard: easier to count
      if (t.instanceColor) t.instanceColor.needsUpdate = true
    }
    if (prefersReducedMotion()) {
      pop.current = 1
      write(1)
    } else {
      pop.current = 0
      write(0.01)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `write` only reads layout and the toggles
  }, [layout, showArea, showPerimeter, color])

  useFrame((_, delta) => {
    if (pop.current >= 1) return
    pop.current = Math.min(1, pop.current + delta / POP_SECONDS)
    write(Math.max(0.01, easeOutBack(pop.current)))
  })

  return (
    <group>
      <instancedMesh ref={tileMesh} args={[geometry, tileMaterial, MAX_TILES]} castShadow receiveShadow />
      <instancedMesh ref={edgeMesh} args={[geometry, edgeMaterial, MAX_EDGES]} castShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={groundGeometry} material={groundMaterial} />
      <ParticleBurst trigger={burstKey} position={[0, 2, 0]} color={color} />
    </group>
  )
}

export default AreaScene
