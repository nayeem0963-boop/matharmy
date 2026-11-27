import { SceneHtml } from '../canvas/SceneHtml'
import { ParticleBurst } from '../canvas/ParticleBurst'
import { VALUE_MAX, formatStat, meanOf } from '../../data/dataGraphs'
import '../panels/data-graphs.css'

interface DataSceneProps {
  categories: string[]
  values: number[]
  showMean: boolean
  /** Increment to fire a celebration burst. */
  burstKey?: number
}

const BAR_WIDTH = 1.1
const SPACING = 1.7
const MAX_HEIGHT = 4
const MIN_HEIGHT = 0.06
const SHIFT_X = -1
const BAR_COLORS = ['#f87171', '#fbbf24', '#4ade80', '#38bdf8', '#c084fc']

/**
 * A bar graph: one bar per category, labelled with its name and count. An
 * optional orange line marks the mean, so the learner can see what "sharing out
 * equally" means.
 */
export function DataScene({ categories, values, showMean, burstKey = 0 }: DataSceneProps) {
  const mid = (values.length - 1) / 2
  const unit = MAX_HEIGHT / VALUE_MAX
  const mean = meanOf(values)
  const width = values.length * SPACING
  return (
    <group>
      {values.map((v, i) => {
        const h = Math.max(MIN_HEIGHT, v * unit)
        const x = (i - mid) * SPACING + SHIFT_X
        return (
          <group key={i}>
            <mesh position={[x, h / 2, 0]} scale={[1, h, 1]} castShadow receiveShadow>
              <boxGeometry args={[BAR_WIDTH, 1, BAR_WIDTH]} />
              <meshStandardMaterial color={BAR_COLORS[i % BAR_COLORS.length]} roughness={0.35} metalness={0.1} />
            </mesh>
            <SceneHtml position={[x, h + 0.55, 0]} center>
              <div className="bar-label">
                <span className="bar-label__name">{categories[i]}</span>
                <strong>{v}</strong>
              </div>
            </SceneHtml>
          </group>
        )
      })}
      {showMean && (
        <group>
          <mesh position={[SHIFT_X, mean * unit, 0.7]}>
            <boxGeometry args={[width, 0.05, 0.05]} />
            <meshStandardMaterial color="#fb923c" emissive="#fb923c" emissiveIntensity={0.5} />
          </mesh>
          <SceneHtml position={[SHIFT_X + width / 2 + 0.7, mean * unit, 0.7]} center>
            <div className="bar-label bar-label--mean">mean {formatStat(mean)}</div>
          </SceneHtml>
        </group>
      )}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <shadowMaterial opacity={0.35} />
      </mesh>
      <ParticleBurst trigger={burstKey} position={[SHIFT_X, MAX_HEIGHT + 1, 0]} color="#38bdf8" />
    </group>
  )
}

export default DataScene
