import { useCallback, useState } from 'react'
import { FractionsPanel, MAX_DENOMINATOR } from '../../components/panels/FractionsPanel'
import { fractionSet } from '../../engine/challengeSets'
import { getModule } from '../../data/mathModules'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { MathCanvas, FractionBlocksScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'


/** Fractions: state, quiz wiring, sidebar controls and 3D stage. */
export function useFractionsModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('fractions')
  const [numerator, setNumerator] = useState(3)
  const [denominator, setDenominator] = useState(4)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const changeDenominator = (next: number) => {
    const d = Math.min(MAX_DENOMINATOR, Math.max(1, next))
    setDenominator(d)
    setNumerator((n) => Math.min(n, d * 2))
  }
  const changeNumerator = (next: number) => setNumerator(Math.min(denominator * 2, Math.max(0, next)))

  const celebrate = useCallback(() => {
    playChime()
    setBurst((b) => b + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'fractions',
    challenges: fractionSet.challenges,
    enabled: quizOn,
    isSolved: (c) => fractionSet.isSolved(c, { numerator, denominator }),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: fractionSet.challenges.length,
    panel: (
      <FractionsPanel
        numerator={numerator}
        denominator={denominator}
        onNumeratorChange={changeNumerator}
        onDenominatorChange={changeDenominator}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <MathCanvas key="fractions" resetKey="fractions">
        <FractionBlocksScene
          numerator={numerator}
          denominator={denominator}
          color={color}
          onSelectNumerator={changeNumerator}
          burstKey={burst}
        />
      </MathCanvas>
    ),
  }
}
