import { useCallback, useState } from 'react'
import { GeometryFormulaOverlay } from '../../components/panels/GeometryFormulaOverlay'
import { GeometryPanel } from '../../components/panels/GeometryPanel'
import { geometryChallenges } from '../../data/challenges'
import { getModule } from '../../data/mathModules'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { useShapeDimensions } from '../../hooks/useShapeDimensions'
import { playChime } from '../../utils/soundEffects'
import { MathCanvas, GeometryExplorerScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'


/** Geometry 3D Explorer: state, quiz wiring, sidebar controls and 3D stage. */
export function useGeometryModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('geometry')
  const geometry = useShapeDimensions('cube')
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((b) => b + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'geometry',
    challenges: geometryChallenges,
    enabled: quizOn,
    isSolved: (c) =>
      c.check({ shapeId: geometry.shapeId, dimensions: geometry.dimensions, metrics: geometry.metrics }),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: geometryChallenges.length,
    panel: (
      <GeometryPanel geometry={geometry} quizOn={quizOn} onQuizChange={setQuizOn} challenge={challenge} quiz={quiz} />
    ),
    stage: (
      <>
        <MathCanvas key="geometry" resetKey="geometry" cameraPosition={[4.5, 5, 7.5]} maxDistance={24}>
          <GeometryExplorerScene
            shapeId={geometry.shapeId}
            dimensions={geometry.dimensions}
            showNet={geometry.showNet}
            color={color}
            burstKey={burst}
          />
        </MathCanvas>
        <GeometryFormulaOverlay shape={geometry.shape} metrics={geometry.metrics} />
      </>
    ),
  }
}
