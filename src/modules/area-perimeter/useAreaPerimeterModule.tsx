import { useCallback, useState } from 'react'
import { AreaOverlay } from '../../components/panels/AreaOverlay'
import { AreaPanel } from '../../components/panels/AreaPanel'
import { DEFAULT_AREA, validState, type AreaShape, type AreaState } from '../../data/areaPerimeter'
import { getModule } from '../../data/mathModules'
import { areaLabel } from '../../data/sceneLabels'
import { areaSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { AreaScene, MathCanvas } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/** Area and Perimeter: state, quiz wiring, sidebar controls and 3D stage. */
export function useAreaPerimeterModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('area-perimeter')
  const [raw, setRaw] = useState<AreaState>(DEFAULT_AREA)
  const [showArea, setShowArea] = useState(true)
  const [showPerimeter, setShowPerimeter] = useState(true)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)
  const shape = validState(raw)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'area-perimeter',
    challenges: areaSet.challenges,
    enabled: quizOn,
    isSolved: (c) => areaSet.isSolved(c, shape),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: areaSet.challenges.length,
    panel: (
      <AreaPanel
        shape={shape}
        showArea={showArea}
        showPerimeter={showPerimeter}
        onShape={(k: AreaShape) => setRaw((s) => validState({ ...s, shape: k }))}
        onSide={(key, n) => setRaw((s) => validState({ ...validState(s), [key]: n }))}
        onShowArea={setShowArea}
        onShowPerimeter={setShowPerimeter}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="area-perimeter"
          resetKey="area-perimeter"
          cameraPosition={[0, 12, 8.5]}
          maxDistance={32}
          label={areaLabel(shape, showArea, showPerimeter)}
        >
          <AreaScene shape={shape} showArea={showArea} showPerimeter={showPerimeter} color={color} burstKey={burst} />
        </MathCanvas>
        <AreaOverlay shape={shape} />
      </>
    ),
  }
}
