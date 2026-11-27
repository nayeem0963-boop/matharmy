import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'
import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { LINE_MAX, LINE_MIN, oppositeOf, resultOf, signed, type IntOp } from '../../data/integers'
import '../panels/integers.css'

interface NumberLineSceneProps {
  mode: 'line' | 'move'
  p: number
  q: number
  a: number
  op: IntOp
  b: number
  /** Line view: show A's opposite as a ghost marker. */
  showOpposite: boolean
  color?: string
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const UNIT = 0.62
const X = (n: number) => n * UNIT
const HALF = (LINE_MAX - LINE_MIN) / 2 // 10
const LABELLED = [-10, -5, 0, 5, 10]
const TICKS = Array.from({ length: LINE_MAX - LINE_MIN + 1 }, (_, i) => LINE_MIN + i)

/**
 * A number line from -10 to 10 with the negative side tinted red and the positive
 * side blue. The line view marks two points (A, B) and, optionally, A's opposite;
 * the move view draws the hop from the start to where the addition or subtraction
 * lands.
 */
export function NumberLineScene({ mode, p, q, a, op, b, showOpposite, color = '#06b6d4', burstKey = 0 }: NumberLineSceneProps) {
  // On a short stage (phones) draw it a little smaller so both ends and the labels fit.
  const compact = useThree((s) => s.size.height < 450 || s.size.width < 500)

  const result = resultOf({ a, op, b })
  const step = op === 'add' ? b : -b

  // The hop arc from the start to the result, rising with the length of the move.
  const arc = useMemo(() => {
    if (step === 0) return null
    const x0 = X(a)
    const x1 = X(result)
    const height = 0.6 + Math.min(Math.abs(step), 10) * 0.22
    return new THREE.QuadraticBezierCurve3(new THREE.Vector3(x0, 0.2, 0), new THREE.Vector3((x0 + x1) / 2, height * 2, 0), new THREE.Vector3(x1, 0.2, 0))
  }, [a, result, step])
  const tube = useMemo(() => (arc ? new THREE.TubeGeometry(arc, 40, 0.07, 8, false) : null), [arc])
  useEffect(() => () => tube?.dispose(), [tube])

  const lineGeometry = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  useEffect(() => () => lineGeometry.dispose(), [lineGeometry])
  const tickMaterial = useMemo(() => new THREE.MeshBasicMaterial({ color: '#94a3b8' }), [])
  useEffect(() => () => tickMaterial.dispose(), [tickMaterial])

  const moveColor = step > 0 ? '#4ade80' : '#f87171'
  const apexX = (X(a) + X(result)) / 2
  const apexY = arc ? arc.getPoint(0.5).y + 0.5 : 0

  const marker = (value: number, c: string, label: string, cls: string, key: string, ghost = false) => (
    <group key={key}>
      <mesh position={[X(value), 0.45, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.9, 24]} />
        <meshStandardMaterial color={c} transparent={ghost} opacity={ghost ? 0.35 : 1} roughness={0.35} />
      </mesh>
      <SceneHtml position={[X(value), 1.35, 0]} center>
        <div className={`line-label ${cls}`}>{label}</div>
      </SceneHtml>
    </group>
  )

  return (
    <group scale={compact ? 0.85 : 1} position={[0, compact ? 0.9 : -0.6, 0]}>
      {/* Negative and positive halves */}
      <mesh position={[X(-HALF / 2) - 0.1, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[X(HALF) + 0.9, 1.6]} />
        <meshBasicMaterial color="#7f1d1d" transparent opacity={0.35} />
      </mesh>
      <mesh position={[X(HALF / 2) + 0.1, -0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[X(HALF) + 0.9, 1.6]} />
        <meshBasicMaterial color="#1e3a8a" transparent opacity={0.35} />
      </mesh>

      {/* The line and its ticks */}
      <mesh geometry={lineGeometry} material={tickMaterial} position={[0, 0.03, 0]} scale={[X(HALF * 2) + 0.9, 0.06, 0.07]} />
      {TICKS.map((n) => {
        const big = n % 5 === 0
        return <mesh key={n} geometry={lineGeometry} material={tickMaterial} position={[X(n), 0.03, 0]} scale={[0.045, big ? 0.06 : 0.04, big ? 0.7 : 0.4]} />
      })}
      {LABELLED.map((n) => (
        <SceneHtml key={n} position={[X(n), 0.05, 0.85]} center>
          <div className="line-label">{signed(n)}</div>
        </SceneHtml>
      ))}

      {mode === 'line' && (
        <group>
          {/* Distance from zero for A */}
          {p !== 0 && <mesh geometry={lineGeometry} position={[X(p) / 2, 0.1, 0]} scale={[Math.abs(X(p)), 0.1, 0.16]}>
            <meshBasicMaterial color={color} />
          </mesh>}
          {marker(p, '#22d3ee', `A ${signed(p)}`, 'line-label--a', 'A')}
          {marker(q, '#fb923c', `B ${signed(q)}`, 'line-label--b', 'B')}
          {showOpposite && p !== 0 && marker(oppositeOf(p), '#94a3b8', `−A ${signed(oppositeOf(p))}`, 'line-label--ghost', 'opp', true)}
          {/* The gap between A and B, drawn above the line */}
          {p !== q && (
            <group>
              <mesh geometry={lineGeometry} position={[(X(p) + X(q)) / 2, 2.1, 0]} scale={[Math.abs(X(p) - X(q)), 0.05, 0.05]}>
                <meshBasicMaterial color="#fde047" />
              </mesh>
              <SceneHtml position={[(X(p) + X(q)) / 2, 2.55, 0]} center>
                <div className="line-label line-label--move">{Math.abs(p - q)} apart</div>
              </SceneHtml>
            </group>
          )}
        </group>
      )}

      {mode === 'move' && (
        <group>
          {/* The stretch of line that is travelled */}
          {step !== 0 && <mesh geometry={lineGeometry} position={[(X(a) + X(result)) / 2, 0.1, 0]} scale={[Math.abs(X(result) - X(a)), 0.1, 0.16]}>
            <meshBasicMaterial color={moveColor} />
          </mesh>}
          {marker(a, '#22d3ee', `start ${signed(a)}`, 'line-label--a', 'start')}
          {marker(result, '#fde047', `lands ${signed(result)}`, 'line-label--move', 'end')}
          {tube && (
            <group>
              <mesh geometry={tube}>
                <meshStandardMaterial color={moveColor} emissive={moveColor} emissiveIntensity={0.35} />
              </mesh>
              <mesh position={[X(result), 0.3, 0]} rotation={[0, 0, step > 0 ? -Math.PI / 2 : Math.PI / 2]}>
                <coneGeometry args={[0.2, 0.45, 20]} />
                <meshStandardMaterial color={moveColor} emissive={moveColor} emissiveIntensity={0.35} />
              </mesh>
              <SceneHtml position={[apexX, apexY, 0]} center>
                <div className="line-label line-label--move">
                  {step > 0 ? `${Math.abs(step)} right →` : `← ${Math.abs(step)} left`}
                </div>
              </SceneHtml>
            </group>
          )}
        </group>
      )}
      <ParticleBurst trigger={burstKey} position={[0, 3, 0]} color={color} />
    </group>
  )
}

export default NumberLineScene
