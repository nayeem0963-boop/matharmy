import { useCallback, useState } from 'react'
import { IntegerOverlay } from '../../components/panels/IntegerOverlay'
import { IntegerPanel } from '../../components/panels/IntegerPanel'
import { DEFAULT_INT, clampLine, clampOperand, modeOfChallenge, type IntMode, type IntState } from '../../data/integers'
import { getModule } from '../../data/mathModules'
import { integerLabel } from '../../data/sceneLabels'
import { integerSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { MathCanvas, NumberLineScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/** Integers and Number Lines: state, quiz wiring, sidebar controls and 3D stage. */
export function useIntegersModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('integers')
  const [free, setFree] = useState<IntState>(DEFAULT_INT)
  const [showOpposite, setShowOpposite] = useState(false)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'integers',
    challenges: integerSet.challenges,
    enabled: quizOn,
    isSolved: (c) => integerSet.isSolved(c, free),
    onCelebrate: celebrate,
    progress,
  })

  // A challenge chooses the view it needs; the learner's numbers stay as they are.
  const state: IntState = quizOn ? { ...free, mode: modeOfChallenge(challenge) } : free

  const change = (next: Partial<IntState>) =>
    setFree((s) => {
      const merged = { ...s, ...next }
      return { ...merged, p: clampLine(merged.p), q: clampLine(merged.q), a: clampOperand(merged.a), b: clampOperand(merged.b) }
    })

  return {
    stars: quiz.score,
    total: integerSet.challenges.length,
    panel: (
      <IntegerPanel
        state={state}
        showOpposite={showOpposite}
        quizOn={quizOn}
        onMode={(mode: IntMode) => change({ mode })}
        onChange={change}
        onShowOpposite={setShowOpposite}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="integers"
          resetKey="integers"
          cameraPosition={[0, 3.5, 13]}
          maxDistance={30}
          label={integerLabel(state)}
        >
          <NumberLineScene
            mode={state.mode}
            p={state.p}
            q={state.q}
            a={state.a}
            op={state.op}
            b={state.b}
            showOpposite={showOpposite}
            color={color}
            burstKey={burst}
          />
        </MathCanvas>
        <IntegerOverlay state={state} />
      </>
    ),
  }
}
