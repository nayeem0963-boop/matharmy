import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { GRID, tenthsOf } from '../../data/decimals'
import { prefersReducedMotion } from '../../utils/reducedMotion'

interface DecimalSceneProps {
  /** Shaded squares, 0 to 100. */
  squares: number
  color?: string
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const PITCH = 1.1
const TILE = 1
const RAISED = 0.7
const FLAT = 0.1
const HUNDREDTH_COLOR = '#fde047'
const EMPTY_COLOR = '#334155'

/**
 * The hundred grid: ten columns of ten squares. Squares are shaded column by
 * column from the left, so each full column is one tenth. The squares of the
 * unfinished column are the hundredths, in yellow.
 */
export function DecimalScene({ squares, color = '#e879f9', burstKey = 0 }: DecimalSceneProps) {
  const mesh = useRef<THREE.InstancedMesh>(null)
  // On a short stage (phones) the readout strip covers the bottom, so draw the grid smaller and higher.
  const compact = useThree((s) => s.size.height < 450)
  const current = useRef(new Float32Array(GRID).fill(FLAT))
  const target = useMemo(() => {
    const t = new Float32Array(GRID)
    for (let i = 0; i < GRID; i++) t[i] = i < squares ? RAISED : FLAT
    return t
  }, [squares])
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const geometry = useMemo(() => new THREE.BoxGeometry(TILE, 1, TILE), [])
  useEffect(() => () => geometry.dispose(), [geometry])
  const material = useMemo(() => new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.05 }), [])
  useEffect(() => () => material.dispose(), [material])
  const groundGeometry = useMemo(() => new THREE.PlaneGeometry(40, 40), [])
  useEffect(() => () => groundGeometry.dispose(), [groundGeometry])
  const groundMaterial = useMemo(() => new THREE.ShadowMaterial({ opacity: 0.3 }), [])
  useEffect(() => () => groundMaterial.dispose(), [groundMaterial])

  const write = () => {
    const m = mesh.current
    if (!m) return
    for (let i = 0; i < GRID; i++) {
      const col = Math.floor(i / 10)
      const row = i % 10 // row 0 is the bottom of the column, nearest the camera
      const h = current.current[i]
      dummy.position.set((col - 4.5) * PITCH, h / 2, (4.5 - row) * PITCH)
      dummy.scale.set(0.94, h, 0.94)
      dummy.updateMatrix()
      m.setMatrixAt(i, dummy.matrix)
    }
    m.count = GRID
    m.instanceMatrix.needsUpdate = true
  }

  // Colours: full columns are tenths, the unfinished column is hundredths, the rest is empty.
  useLayoutEffect(() => {
    const m = mesh.current
    if (!m) return
    const tenths = new THREE.Color(color)
    const hundredths = new THREE.Color(HUNDREDTH_COLOR)
    const empty = new THREE.Color(EMPTY_COLOR)
    const fullColumns = tenthsOf(squares) * 10
    for (let i = 0; i < GRID; i++) m.setColorAt(i, i >= squares ? empty : i < fullColumns ? tenths : hundredths)
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [squares, color])

  useLayoutEffect(() => {
    if (prefersReducedMotion()) {
      current.current.set(target)
      write()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `write` only reads refs
  }, [target])

  useFrame((_, delta) => {
    let moving = false
    for (let i = 0; i < GRID; i++) {
      const diff = target[i] - current.current[i]
      if (Math.abs(diff) > 0.003) {
        current.current[i] = THREE.MathUtils.damp(current.current[i], target[i], 14, delta)
        moving = true
      } else if (diff !== 0) current.current[i] = target[i]
    }
    if (moving || mesh.current?.count === 0) write()
  })

  return (
    <group scale={compact ? 0.68 : 1} position={[0, 0, compact ? -1.6 : 0]}>
      <instancedMesh ref={mesh} args={[geometry, material, GRID]} castShadow receiveShadow />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow geometry={groundGeometry} material={groundMaterial} />
      <ParticleBurst trigger={burstKey} position={[0, 2.5, 0]} color={color} />
    </group>
  )
}

export default DecimalScene
