import { useCallback, useState } from 'react'
import { PlaneOverlay } from '../../components/panels/PlaneOverlay'
import { PlanePanel } from '../../components/panels/PlanePanel'
import {
  DEFAULT_POINT,
  clampCoord,
  freshTriangle,
  modeOfChallenge,
  moveTriangle,
  type Move,
  type PlaneMode,
  type TriangleState,
  type Vec,
} from '../../data/coordinatePlane'
import { getModule } from '../../data/mathModules'
import { planeLabel } from '../../data/sceneLabels'
import { planeSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime, playClick } from '../../utils/soundEffects'
import { MathCanvas, PlaneScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/**
 * Coordinate Plane: a plotted point and a movable triangle. The triangle belongs
 * to one practice at a time (free play, or one challenge), so each challenge
 * starts from the original triangle.
 */
export function useCoordinatePlaneModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('coordinate-plane')
  const [point, setPoint] = useState<Vec>(DEFAULT_POINT)
  const [freeMode, setFreeMode] = useState<PlaneMode>('plot')
  const [saved, setSaved] = useState<{ key: string; state: TriangleState } | null>(null)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const stateFor = useCallback(
    (key: string): TriangleState => (saved && saved.key === key ? saved.state : freshTriangle()),
    [saved],
  )

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'coordinate-plane',
    challenges: planeSet.challenges,
    enabled: quizOn,
    isSolved: (c) => planeSet.isSolved(c, { point, triangleFor: (id) => stateFor(id).tri }),
    onCelebrate: celebrate,
    progress,
  })

  const mode: PlaneMode = quizOn ? modeOfChallenge(challenge) : freeMode
  const key = quizOn ? challenge.id : 'free'
  const current = stateFor(key)

  const move = (m: Move) => {
    const tri = moveTriangle(current.tri, m)
    if (tri) setSaved({ key, state: { tri, history: [...current.history, m] } })
  }

  return {
    stars: quiz.score,
    total: planeSet.challenges.length,
    panel: (
      <PlanePanel
        mode={mode}
        point={point}
        quizOn={quizOn}
        onMode={setFreeMode}
        onPoint={(p) => setPoint({ x: clampCoord(p.x), y: clampCoord(p.y) })}
        canMove={(m) => moveTriangle(current.tri, m) !== null}
        onMove={move}
        onReset={() => setSaved({ key, state: freshTriangle() })}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="coordinate-plane"
          resetKey="coordinate-plane"
          cameraPosition={[0, 16.5, 5.5]}
          maxDistance={32}
          label={planeLabel(mode, point, current.tri)}
        >
          <PlaneScene
            mode={mode}
            point={point}
            triangle={current.tri}
            color={color}
            burstKey={burst}
            onPick={(p) => {
              playClick()
              setPoint(p)
            }}
          />
        </MathCanvas>
        <PlaneOverlay mode={mode} point={point} triangle={current.tri} history={current.history} />
      </>
    ),
  }
}
