import { useCallback, useState } from 'react'
import { AngleOverlay } from '../../components/panels/AngleOverlay'
import { AnglePanel } from '../../components/panels/AnglePanel'
import { DEFAULT_ANGLE, clampAngle } from '../../data/angles'
import { getModule } from '../../data/mathModules'
import { angleLabel } from '../../data/sceneLabels'
import { angleSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime, playClick } from '../../utils/soundEffects'
import { AngleScene, MathCanvas } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/** Angles: state, quiz wiring, sidebar controls and 3D stage. */
export function useAnglesModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('angles')
  const [state, setState] = useState(DEFAULT_ANGLE)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'angles',
    challenges: angleSet.challenges,
    enabled: quizOn,
    isSolved: (c) => angleSet.isSolved(c, state),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: angleSet.challenges.length,
    panel: (
      <AnglePanel
        angle={state.angle}
        onAngle={(n) => setState({ angle: clampAngle(n) })}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="angles"
          resetKey="angles"
          cameraPosition={[0, 15, 6.5]}
          maxDistance={30}
          label={angleLabel(state.angle)}
        >
          <AngleScene
            angle={state.angle}
            color={color}
            burstKey={burst}
            onPick={(a) => {
              playClick()
              setState({ angle: clampAngle(a) })
            }}
          />
        </MathCanvas>
        <AngleOverlay angle={state.angle} />
      </>
    ),
  }
}
