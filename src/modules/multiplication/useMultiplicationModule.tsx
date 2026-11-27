import { useCallback, useState } from 'react'
import { MultiplicationOverlay } from '../../components/panels/MultiplicationOverlay'
import { MultiplicationPanel } from '../../components/panels/MultiplicationPanel'
import { ARRAY_MAX, ARRAY_MIN, DEFAULT_ARRAY } from '../../data/multiplication'
import { getModule } from '../../data/mathModules'
import { arrayLabel } from '../../data/sceneLabels'
import { multiplicationSet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime, playClick } from '../../utils/soundEffects'
import { ArrayScene, MathCanvas } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

const clamp = (n: number) => Math.min(ARRAY_MAX, Math.max(ARRAY_MIN, Math.floor(n)))

/** Multiplication Arrays: state, quiz wiring, sidebar controls and 3D stage. */
export function useMultiplicationModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('multiplication')
  const [array, setArray] = useState(DEFAULT_ARRAY)
  const [counted, setCounted] = useState(0)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  // Changing the array keeps the counted rows within it.
  const change = (next: Partial<typeof DEFAULT_ARRAY>) => {
    const rows = clamp(next.rows ?? array.rows)
    const cols = clamp(next.cols ?? array.cols)
    setArray({ rows, cols })
    setCounted((c) => Math.min(c, rows))
  }

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'multiplication',
    challenges: multiplicationSet.challenges,
    enabled: quizOn,
    isSolved: (c) => multiplicationSet.isSolved(c, array),
    onCelebrate: celebrate,
    progress,
  })

  const { rows, cols } = array
  return {
    stars: quiz.score,
    total: multiplicationSet.challenges.length,
    panel: (
      <MultiplicationPanel
        rows={rows}
        cols={cols}
        counted={counted}
        onRows={(n) => change({ rows: n })}
        onCols={(n) => change({ cols: n })}
        onCounted={(n) => setCounted(Math.min(rows, Math.max(0, n)))}
        onSwap={() => {
          change({ rows: cols, cols: rows })
        }}
        quizOn={quizOn}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="multiplication"
          resetKey="multiplication"
          cameraPosition={[0, 9, 10]}
          maxDistance={30}
          label={arrayLabel(rows, cols, counted)}
        >
          <ArrayScene
            rows={rows}
            cols={cols}
            counted={counted}
            color={color}
            burstKey={burst}
            onCountRows={(n) => {
              playClick()
              setCounted(Math.min(rows, n))
            }}
          />
        </MathCanvas>
        <MultiplicationOverlay rows={rows} cols={cols} counted={counted} />
      </>
    ),
  }
}
