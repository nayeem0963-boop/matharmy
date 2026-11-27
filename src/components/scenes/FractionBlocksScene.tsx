import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { playPop } from '../../utils/soundEffects'

interface FractionBlocksSceneProps {
  numerator: number
  denominator: number
  color?: string
  /** Called with a new numerator when a block is clicked. */
  onSelectNumerator?: (numerator: number) => void
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const BAR_LENGTH = 6
const BAR_HEIGHT = 0.8
const BAR_DEPTH = 1.2
const GAP = 0.08
const ROW_SPACING = 1.6
const EMPTY_COLOR = '#334155'

/**
 * Renders a fraction as one or more bars, each split into `denominator`
 * blocks. The first `numerator` blocks are filled. Improper fractions
 * produce extra bars (wholes) stacked behind the first.
 */
export function FractionBlocksScene({
  numerator,
  denominator,
  color = '#f59e0b',
  onSelectNumerator,
  burstKey = 0,
}: FractionBlocksSceneProps) {
  const safeDen = Math.max(1, Math.floor(denominator))
  const safeNum = Math.max(0, Math.floor(numerator))
  const wholes = Math.max(1, Math.ceil(safeNum / safeDen))
  const blockWidth = (BAR_LENGTH - GAP * (safeDen - 1)) / safeDen

  // One shared geometry and two shared materials for every block. They are
  // passed in as props, so R3F does not own them: dispose them ourselves.
  const geometry = useMemo(
    () => new THREE.BoxGeometry(blockWidth, BAR_HEIGHT, BAR_DEPTH),
    [blockWidth],
  )
  useEffect(() => () => geometry.dispose(), [geometry])

  const filledMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.1 }),
    [color],
  )
  useEffect(() => () => filledMaterial.dispose(), [filledMaterial])

  const emptyMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: EMPTY_COLOR,
        roughness: 0.8,
        transparent: true,
        opacity: 0.45,
      }),
    [],
  )
  useEffect(() => () => emptyMaterial.dispose(), [emptyMaterial])

  const groundGeometry = useMemo(() => new THREE.PlaneGeometry(30, 30), [])
  useEffect(() => () => groundGeometry.dispose(), [groundGeometry])
  const groundMaterial = useMemo(
    () => new THREE.ShadowMaterial({ opacity: 0.35 }),
    [],
  )
  useEffect(() => () => groundMaterial.dispose(), [groundMaterial])

  const blocks = useMemo(() => {
    const list: { key: string; index: number; position: [number, number, number] }[] = []
    const startX = -BAR_LENGTH / 2 + blockWidth / 2
    const startZ = ((wholes - 1) * ROW_SPACING) / 2
    for (let w = 0; w < wholes; w++) {
      for (let i = 0; i < safeDen; i++) {
        list.push({
          key: `${w}-${i}`,
          index: w * safeDen + i,
          position: [startX + i * (blockWidth + GAP), BAR_HEIGHT / 2, startZ - w * ROW_SPACING],
        })
      }
    }
    return list
  }, [wholes, safeDen, blockWidth])

  return (
    <group>
      {blocks.map((b) => (
        <FractionBlock
          key={b.key}
          position={b.position}
          geometry={geometry}
          material={b.index < safeNum ? filledMaterial : emptyMaterial}
          onClick={
            onSelectNumerator ? () => onSelectNumerator(b.index + 1) : undefined
          }
        />
      ))}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        geometry={groundGeometry}
        material={groundMaterial}
      />
      <ParticleBurst trigger={burstKey} position={[0, BAR_HEIGHT + 0.6, 0]} color={color} />
    </group>
  )
}

export default FractionBlocksScene

interface FractionBlockProps {
  position: [number, number, number]
  geometry: THREE.BufferGeometry
  material: THREE.Material
  onClick?: () => void
}

function FractionBlock({ position, geometry, material, onClick }: FractionBlockProps) {
  const ref = useRef<THREE.Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const restY = position[1]

  // Reset the cursor if this block unmounts while hovered.
  useEffect(() => {
    if (!hovered) return
    document.body.style.cursor = 'pointer'
    return () => {
      document.body.style.cursor = ''
    }
  }, [hovered])

  useFrame((_, delta) => {
    const mesh = ref.current
    if (!mesh) return
    const targetY = hovered ? restY + 0.25 : restY
    mesh.position.y = THREE.MathUtils.damp(mesh.position.y, targetY, 10, delta)
  })

  return (
    <mesh
      ref={ref}
      position={position}
      geometry={geometry}
      material={material}
      castShadow
      receiveShadow
      onPointerOver={(e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        if (!hovered) playPop()
        setHovered(true)
      }}
      onPointerOut={() => setHovered(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        onClick?.()
      }}
    />
  )
}
