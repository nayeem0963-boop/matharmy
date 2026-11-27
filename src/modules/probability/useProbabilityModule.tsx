import { useCallback, useMemo, useState } from 'react'
import { SpinnerOverlay } from '../../components/panels/SpinnerOverlay'
import { SpinnerPanel } from '../../components/panels/SpinnerPanel'
import {
  DEFAULT_SPINNER,
  SPINS_MAX,
  clampSectors,
  sectorOfSpin,
  tallyOf,
  type Colour,
  type SpinnerState,
} from '../../data/probability'
import { spinnerLabel } from '../../data/sceneLabels'
import { spinnerSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime } from '../../utils/soundEffects'
import { MathCanvas, SpinnerScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/**
 * Probability: the wheel and its spins. The spins come from a seeded stream (a
 * fresh seed each visit), so the same spins can be replayed from the seed and the
 * count; changing the wheel starts a fresh run.
 */
export function useProbabilityModule(progress: ProgressApi): ModuleRuntime {
  const [state, setState] = useState<SpinnerState>(DEFAULT_SPINNER)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 2 ** 32))
  const [spinKey, setSpinKey] = useState(0)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'probability',
    challenges: spinnerSet.challenges,
    enabled: quizOn,
    isSolved: (c) => spinnerSet.isSolved(c, state),
    onCelebrate: celebrate,
    progress,
  })

  const tally = useMemo(() => tallyOf(seed, state.spins, state), [seed, state])
  const lastSector = state.spins > 0 ? sectorOfSpin(seed, state.spins - 1, state) : null

  const setSectors = (colour: Colour, n: number) => {
    setState((s) => ({ ...s, [colour]: clampSectors(n), spins: 0 }))
    setSeed(Math.floor(Math.random() * 2 ** 32)) // a new wheel gets a fresh run of spins
  }
  const spin = (times: number) => {
    setState((s) => ({ ...s, spins: Math.min(SPINS_MAX, s.spins + times) }))
    setSpinKey((k) => k + 1)
  }

  return {
    stars: quiz.score,
    total: spinnerSet.challenges.length,
    panel: (
      <SpinnerPanel
        state={state}
        onSectors={setSectors}
        onSpin={spin}
        onClear={() => setState((s) => ({ ...s, spins: 0 }))}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="probability"
          resetKey="probability"
          cameraPosition={[0, 9, 8]}
          maxDistance={30}
          label={spinnerLabel(state, tally)}
        >
          <SpinnerScene
            sectors={state}
            tally={tally}
            spins={state.spins}
            lastSector={lastSector}
            spinKey={spinKey}
            burstKey={burst}
          />
        </MathCanvas>
        <SpinnerOverlay sectors={state} tally={tally} spins={state.spins} />
      </>
    ),
  }
}
