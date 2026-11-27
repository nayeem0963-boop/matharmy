import { useMemo } from 'react'
import * as THREE from 'three'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'

interface PatternSceneProps {
  /** The terms to draw, one bar each. */
  terms: number[]
  color?: string
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const BAR_WIDTH = 0.9
const SPACING = 1.5
const MAX_HEIGHT = 4
const MIN_HEIGHT = 0.3
/** Shift left so the tallest bar clears the readout card in the top-right corner. */
const SHIFT_X = -1.4

const format = (n: number) => n.toLocaleString('en-US')

/**
 * A sequence as bars: height is the value, so adding gives even steps up and
 * multiplying curves upward. Each bar is labelled with its term number and value.
 */
export function PatternScene({ terms, color = '#fb7185', burstKey = 0 }: PatternSceneProps) {
  const max = Math.max(...terms, 1)
  const colors = useMemo(
    () => terms.map((_, i) => new THREE.Color(color).offsetHSL(0, 0, i * 0.035 - 0.05)),
    [terms, color],
  )
  const mid = (terms.length - 1) / 2

  return (
    <group>
      {terms.map((value, i) => {
        const h = Math.max(MIN_HEIGHT, (value / max) * MAX_HEIGHT)
        const x = (i - mid) * SPACING + SHIFT_X
        return (
          <group key={i}>
            <mesh position={[x, h / 2, 0]} scale={[1, h, 1]} castShadow receiveShadow>
              <boxGeometry args={[BAR_WIDTH, 1, BAR_WIDTH]} />
              <meshStandardMaterial color={colors[i]} roughness={0.35} metalness={0.1} />
            </mesh>
            <SceneHtml position={[x, h + 0.55, 0]} center>
              <div className="pattern-label">
                <span className="pattern-label__term">term {i + 1}</span>
                <strong>{format(value)}</strong>
              </div>
            </SceneHtml>
          </group>
        )
      })}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
      <ParticleBurst trigger={burstKey} position={[0, MAX_HEIGHT + 1, 0]} color={color} />
    </group>
  )
}

export default PatternScene
