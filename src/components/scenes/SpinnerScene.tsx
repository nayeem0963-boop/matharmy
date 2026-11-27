import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import {
  COLOURS,
  COLOUR_HEX,
  colourOfSector,
  percentText,
  probabilityOf,
  totalSectors,
  type Sectors,
  type Tally,
} from '../../data/probability'
import { prefersReducedMotion } from '../../utils/reducedMotion'
import '../panels/probability.css'

interface SpinnerSceneProps {
  sectors: Sectors
  tally: Tally
  spins: number
  /** The sector the latest spin landed on, or null before any spin. */
  lastSector: number | null
  /** Changes with every spin action, so the wheel turns even if it lands on the same sector. */
  spinKey: number
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const RADIUS = 2.0
const WHEEL_X = -2.3
const BAR_X0 = 1.0
const BAR_GAP = 1.1
const BAR_MAX_HEIGHT = 3.2
const TAU = Math.PI * 2

/**
 * The wheel on the left and a bar for each colour on the right. A small bar
 * marker shows how many spins the theory expects for that colour, so the
 * learner sees the experiment settle onto the theory as the spins grow.
 */
export function SpinnerScene({ sectors, tally, spins, lastSector, spinKey, burstKey = 0 }: SpinnerSceneProps) {
  const wheel = useRef<THREE.Group>(null)
  const rot = useRef(0)
  const target = useRef(0)
  const compact = useThree((s) => s.size.height < 450)

  const total = totalSectors(sectors)
  const slice = total > 0 ? TAU / total : 0

  // Turn the wheel so the landed sector sits under the pointer at the top (-z).
  useEffect(() => {
    if (lastSector === null || total === 0) return
    const centre = (lastSector + 0.5) * slice
    const base = Math.PI / 2 - centre
    const delta = (((rot.current - base) % TAU) + TAU) % TAU
    target.current = prefersReducedMotion() ? rot.current - delta : rot.current - delta - 2 * TAU
    if (prefersReducedMotion()) {
      rot.current = target.current
      if (wheel.current) wheel.current.rotation.y = rot.current
    }
  }, [lastSector, spinKey, slice, total])

  useFrame((_, dt) => {
    if (!wheel.current) return
    const d = target.current - rot.current
    if (Math.abs(d) > 1e-3) rot.current = THREE.MathUtils.damp(rot.current, target.current, 3.2, dt)
    else rot.current = target.current
    wheel.current.rotation.y = rot.current
  })

  const sectorColours = useMemo(
    () => Array.from({ length: total }, (_, i) => COLOUR_HEX[colourOfSector(i, sectors)]),
    [total, sectors],
  )

  const expected = COLOURS.map((c) => probabilityOf(c, sectors) * spins)
  const top = Math.max(1, ...COLOURS.map((c) => tally[c]), ...expected)
  const unit = BAR_MAX_HEIGHT / top

  return (
    <group scale={compact ? 0.8 : 1} position={[compact ? 0 : -1.2, 0, compact ? -0.8 : 0]}>
      {/* The wheel */}
      <group position={[WHEEL_X, 0.05, 0.4]}>
        <group ref={wheel}>
          {total === 0 ? (
            <mesh rotation={[-Math.PI / 2, 0, 0]}>
              <circleGeometry args={[RADIUS, 48]} />
              <meshStandardMaterial color="#1e293b" />
            </mesh>
          ) : (
            sectorColours.map((c, i) => (
              <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001 * i, 0]} receiveShadow>
                <circleGeometry args={[RADIUS, 24, i * slice, slice * 0.985]} />
                <meshStandardMaterial color={c} roughness={0.5} side={THREE.DoubleSide} />
              </mesh>
            ))
          )}
        </group>
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.2, 24]} />
          <meshStandardMaterial color="#f8fafc" />
        </mesh>
        {/* The pointer, fixed at the top, tip towards the wheel */}
        <mesh position={[0, 0.25, -RADIUS - 0.25]} rotation={[Math.PI / 2, 0, 0]}>
          <coneGeometry args={[0.28, 0.7, 24]} />
          <meshStandardMaterial color="#fde047" emissive="#fde047" emissiveIntensity={0.4} />
        </mesh>
      </group>

      {/* Bars: what happened, with a marker for what the theory expects */}
      {COLOURS.map((c, i) => {
        const x = BAR_X0 + i * BAR_GAP
        const h = Math.max(0.05, tally[c] * unit)
        const eh = expected[i] * unit
        return (
          <group key={c}>
            <mesh position={[x, h / 2, 0.4]} scale={[1, h, 1]} castShadow>
              <boxGeometry args={[0.8, 1, 0.8]} />
              <meshStandardMaterial color={COLOUR_HEX[c]} roughness={0.4} />
            </mesh>
            {spins > 0 && (
              <mesh position={[x, eh, 0.4 + 0.45]}>
                <boxGeometry args={[1.0, 0.06, 0.08]} />
                <meshBasicMaterial color="#fde047" />
              </mesh>
            )}
            <SceneHtml position={[x, Math.max(h, eh) + 0.55, 0.4]} center>
              <div className="spin-label">
                {tally[c]}
                <small>{spins > 0 ? percentText(tally[c] / spins) : c}</small>
              </div>
            </SceneHtml>
          </group>
        )
      })}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <shadowMaterial opacity={0.3} />
      </mesh>
      <ParticleBurst trigger={burstKey} position={[0, 3, 0]} color="#fde047" />
    </group>
  )
}

export default SpinnerScene
