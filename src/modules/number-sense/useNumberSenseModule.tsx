import { useCallback, useState } from 'react'
import { NumberSenseOverlay } from '../../components/panels/NumberSenseOverlay'
import { NumberSensePanel } from '../../components/panels/NumberSensePanel'
import {
  PLACE_LIMITS,
  REGROUP_SPECS,
  REGROUP_TOTAL_SECONDS,
  applyRegroup,
  isNumberSenseSolved,
  numberSenseChallenges,
  type Place,
  type PlaceValueCounts,
  type RegroupEvent,
  type RegroupKind,
} from '../../data/placeValue'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playBreak, playBundle, playChime } from '../../utils/soundEffects'
import { MathCanvas, PlaceValueScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'


/** Number Sense: state, quiz wiring, sidebar controls and 3D stage. */
export function useNumberSenseModule(progress: ProgressApi): ModuleRuntime {
  const [counts, setCounts] = useState<PlaceValueCounts>({ hundreds: 1, tens: 2, ones: 3 })
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)
  const [regroup, setRegroup] = useState<RegroupEvent | null>(null)

  const setCount = (place: Place, value: number) =>
    setCounts((c) => ({ ...c, [place]: Math.min(PLACE_LIMITS[place], Math.max(0, value)) }))
  const regroupPlace = (kind: RegroupKind) => {
    const next = applyRegroup(counts, kind)
    if (!next) return
    setCounts(next)
    setRegroup((r) => ({ id: (r?.id ?? 0) + 1, kind }))
    if (REGROUP_SPECS[kind].bundle) playBundle(REGROUP_TOTAL_SECONDS)
    else playBreak(REGROUP_TOTAL_SECONDS)
  }

  const celebrate = useCallback(() => {
    playChime()
    setBurst((b) => b + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'number-sense',
    challenges: numberSenseChallenges,
    enabled: quizOn,
    isSolved: (c) => isNumberSenseSolved(c, counts),
    onCelebrate: celebrate,
    progress,
  })

  return {
    stars: quiz.score,
    total: numberSenseChallenges.length,
    panel: (
      <NumberSensePanel
        counts={counts}
        onCountChange={setCount}
        onClear={() => setCounts({ hundreds: 0, tens: 0, ones: 0 })}
        onRegroup={regroupPlace}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas key="number-sense" resetKey="number-sense" cameraPosition={[0, 6.5, 8.5]} maxDistance={32}>
          <PlaceValueScene counts={counts} burstKey={burst} regroup={regroup} />
        </MathCanvas>
        <NumberSenseOverlay counts={counts} />
      </>
    ),
  }
}
