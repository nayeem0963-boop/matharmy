import { useCallback, useState } from 'react'
import { PatternOverlay } from '../../components/panels/PatternOverlay'
import { PatternPanel } from '../../components/panels/PatternPanel'
import { getModule } from '../../data/mathModules'
import {
  DEFAULT_PATTERN,
  FIND_MAX,
  FIND_MIN,
  START_MAX,
  START_MIN,
  clampStep,
  termsOf,
  type PatternKind,
  type PatternState,
} from '../../data/patterns'
import { patternLabel } from '../../data/sceneLabels'
import { patternSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { MathCanvas, PatternScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, Math.floor(n)))

/** Patterns and Sequences: state, quiz wiring, sidebar controls and 3D stage. */
export function usePatternsModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('patterns')
  const [pattern, setPattern] = useState<PatternState>(DEFAULT_PATTERN)
  const [findN, setFindN] = useState(10)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'patterns',
    challenges: patternSet.challenges,
    enabled: quizOn,
    isSolved: (c) => patternSet.isSolved(c, pattern),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: patternSet.challenges.length,
    panel: (
      <PatternPanel
        pattern={pattern}
        findN={findN}
        onKind={(kind: PatternKind) => setPattern((p) => ({ kind, start: p.start, step: clampStep(kind, p.step) }))}
        onStart={(n) => setPattern((p) => ({ ...p, start: clamp(n, START_MIN, START_MAX) }))}
        onStep={(n) => setPattern((p) => ({ ...p, step: clampStep(p.kind, n) }))}
        onFindN={(n) => setFindN(clamp(n, FIND_MIN, FIND_MAX))}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="patterns"
          resetKey="patterns"
          cameraPosition={[0, 4.5, 13.5]}
          maxDistance={30}
          label={patternLabel(pattern, findN)}
        >
          <PatternScene terms={termsOf(pattern)} color={color} burstKey={burst} />
        </MathCanvas>
        <PatternOverlay pattern={pattern} findN={findN} />
      </>
    ),
  }
}
