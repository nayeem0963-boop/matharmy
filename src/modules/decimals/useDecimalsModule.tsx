import { useCallback, useState } from 'react'
import { DecimalOverlay } from '../../components/panels/DecimalOverlay'
import { DecimalPanel } from '../../components/panels/DecimalPanel'
import { DEFAULT_DECIMAL, clampSquares } from '../../data/decimals'
import { getModule } from '../../data/mathModules'
import { decimalLabel } from '../../data/sceneLabels'
import { decimalSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { DecimalScene, MathCanvas } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/** Decimals and Percentages: state, quiz wiring, sidebar controls and 3D stage. */
export function useDecimalsModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('decimals')
  const [state, setState] = useState(DEFAULT_DECIMAL)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'decimals',
    challenges: decimalSet.challenges,
    enabled: quizOn,
    isSolved: (c) => decimalSet.isSolved(c, state),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: decimalSet.challenges.length,
    panel: (
      <DecimalPanel
        squares={state.squares}
        onSquares={(n) => setState({ squares: clampSquares(n) })}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="decimals"
          resetKey="decimals"
          cameraPosition={[0, 13, 9]}
          maxDistance={32}
          label={decimalLabel(state.squares)}
        >
          <DecimalScene squares={state.squares} color={color} burstKey={burst} />
        </MathCanvas>
        <DecimalOverlay squares={state.squares} />
      </>
    ),
  }
}
