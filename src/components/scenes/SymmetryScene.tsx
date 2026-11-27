import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree, type ThreeEvent } from '@react-three/fiber'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { GRID, getShape, type Axis, type Cells, type ShapeId, type SymMode } from '../../data/symmetry'

interface SymmetrySceneProps {
  mode: SymMode
  shapeId: ShapeId
  cells: Cells
  axes: Axis[]
  /** Tiles that have no match across a mirror line (shown in red). */
  off: Set<number>
  color?: string
  onToggle?: (index: number) => void
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const PITCH = 1.1
const TILE = 1
const SIDE = GRID * PITCH
const toRad = (d: number) => (d * Math.PI) / 180

/**
 * Shapes: the shape flat on the ground with each line of symmetry drawn through it.
 * Mirror: a 6 × 6 grid of tiles, raised when on, red where a tile has no match
 * across the mirror line(s), which are drawn in yellow.
 */
export function SymmetryScene({ mode, shapeId, cells, axes, off, color = '#34d399', onToggle, burstKey = 0 }: SymmetrySceneProps) {
  const compact = useThree((s) => s.size.height < 450)
  const shape = getShape(shapeId)

  const tileGeometry = useMemo(() => new THREE.BoxGeometry(TILE, 1, TILE), [])
  useEffect(() => () => tileGeometry.dispose(), [tileGeometry])
  const materials = useMemo(
    () => ({
      on: new THREE.MeshStandardMaterial({ color, roughness: 0.4 }),
      bad: new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.4 }),
      empty: new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.8 }),
      missing: new THREE.MeshStandardMaterial({ color: '#7f1d1d', roughness: 0.8 }),
    }),
    [color],
  )
  useEffect(() => () => Object.values(materials).forEach((m) => m.dispose()), [materials])
  const lineMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#fde047' }), [])
  useEffect(() => () => lineMaterial.dispose(), [lineMaterial])

  const polygon = useMemo(() => {
    if (shape.corners.length === 0) return new THREE.CircleGeometry(2, 64).rotateX(-Math.PI / 2)
    const g = new THREE.ShapeGeometry(new THREE.Shape(shape.corners.map((c) => new THREE.Vector2(c.x, c.y))))
    g.rotateX(-Math.PI / 2)
    return g
  }, [shape])
  useEffect(() => () => polygon.dispose(), [polygon])

  // The circle's lines: a handful, to suggest "all of them".
  const angles = shape.lines === 'infinite' ? [0, 22.5, 45, 67.5, 90, 112.5, 135, 157.5] : shape.lineAngles

  return (
    <group scale={compact ? 0.85 : 1} position={[0, 0, compact ? -0.8 : 0]}>
      {mode === 'shapes' ? (
        <group>
          <mesh geometry={polygon} position={[0, 0.05, 0]}>
            <meshBasicMaterial color={color} transparent opacity={0.85} side={THREE.DoubleSide} />
          </mesh>
          {angles.map((a) => (
            <mesh key={a} rotation={[0, toRad(a), 0]} position={[0, 0.12, 0]} material={lineMaterial}>
              <boxGeometry args={[5.2, 0.04, 0.07]} />
            </mesh>
          ))}
          {shape.corners.map((c, i) => (
            <mesh key={i} position={[c.x, 0.12, -c.y]}>
              <sphereGeometry args={[0.1, 16, 8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
          <mesh position={[0, 0.14, 0]}>
            <sphereGeometry args={[0.1, 16, 8]} />
            <meshStandardMaterial color="#fde047" />
          </mesh>
        </group>
      ) : (
        <group>
          {cells.map((on, i) => {
            const x = i % GRID
            const y = Math.floor(i / GRID)
            const bad = off.has(i)
            const h = on ? 0.55 : 0.12
            const material = on ? (bad ? materials.bad : materials.on) : bad ? materials.missing : materials.empty
            return (
              <mesh
                key={i}
                geometry={tileGeometry}
                material={material}
                position={[(x - (GRID - 1) / 2) * PITCH, h / 2, (y - (GRID - 1) / 2) * PITCH]}
                scale={[0.94, h, 0.94]}
                castShadow
                onClick={(e: ThreeEvent<MouseEvent>) => {
                  e.stopPropagation()
                  onToggle?.(i)
                }}
                onPointerOver={() => (document.body.style.cursor = 'pointer')}
                onPointerOut={() => (document.body.style.cursor = '')}
              />
            )
          })}
          {axes.map((axis) => (
            <mesh
              key={axis}
              position={[0, 0.75, 0]}
              rotation={[0, axis === 'vertical' ? Math.PI / 2 : axis === 'horizontal' ? 0 : -Math.PI / 4, 0]}
              material={lineMaterial}
            >
              <boxGeometry args={[axis === 'diagonal' ? SIDE * 1.42 : SIDE + 0.6, 0.05, 0.07]} />
            </mesh>
          ))}
        </group>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
      <ParticleBurst trigger={burstKey} position={[0, 2.5, 0]} color={color} />
    </group>
  )
}

export default SymmetryScene
