import { useCallback, useState } from 'react'
import { DivisionOverlay } from '../../components/panels/DivisionOverlay'
import { DivisionPanel } from '../../components/panels/DivisionPanel'
import {
  DEFAULT_DIVISION,
  DIVISOR_MAX,
  DIVISOR_MIN,
  TOTAL_MAX,
  TOTAL_MIN,
  layoutOf,
  type DivisionState,
} from '../../data/division'
import { divisionLabel } from '../../data/sceneLabels'
import { divisionSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { DivisionScene, MathCanvas } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.floor(n)))

/** Division and Grouping: state, quiz wiring, sidebar controls and 3D stage. */
export function useDivisionModule(progress: ProgressApi): ModuleRuntime {
  const [state, setState] = useState<DivisionState>(DEFAULT_DIVISION)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'division',
    challenges: divisionSet.challenges,
    enabled: quizOn,
    isSolved: (c) => divisionSet.isSolved(c, state),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: divisionSet.challenges.length,
    panel: (
      <DivisionPanel
        state={state}
        onMode={(mode) => setState((s) => ({ ...s, mode }))}
        onTotal={(n) => setState((s) => ({ ...s, total: clamp(n, TOTAL_MIN, TOTAL_MAX) }))}
        onDivisor={(n) => setState((s) => ({ ...s, divisor: clamp(n, DIVISOR_MIN, DIVISOR_MAX) }))}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="division"
          resetKey="division"
          cameraPosition={[0, 10, 11]}
          maxDistance={32}
          label={divisionLabel(state)}
        >
          <DivisionScene layout={layoutOf(state)} burstKey={burst} />
        </MathCanvas>
        <DivisionOverlay state={state} />
      </>
    ),
  }
}
