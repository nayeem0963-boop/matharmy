import { useCallback, useState } from 'react'
import { SymmetryOverlay } from '../../components/panels/SymmetryOverlay'
import { SymmetryPanel } from '../../components/panels/SymmetryPanel'
import { getModule } from '../../data/mathModules'
import { symmetryLabel } from '../../data/sceneLabels'
import {
  DEFAULT_CELLS,
  DEFAULT_SHAPE,
  PRESETS,
  emptyCells,
  mismatches,
  modeOfChallenge,
  offTiles,
  symChallenges,
  type Axis,
  type Cells,
  type ShapeId,
  type SymMode,
} from '../../data/symmetry'
import { symmetrySet } from '../../engine/challengeSets'
import { useModuleQuiz } from '../../hooks/useModuleQuiz'
import { playChime, playClick } from '../../utils/soundEffects'
import { MathCanvas, SymmetryScene } from '../shared'
import type { ModuleRuntime, ProgressApi } from '../types'

/** The pattern a practice starts from: the free-play picture, or a challenge's almost-symmetric one. */
function startCells(key: string): Cells {
  const challenge = symChallenges.find((c) => c.id === key)
  return challenge && challenge.rule.type === 'mirror' ? [...PRESETS[challenge.rule.preset].start] : [...DEFAULT_CELLS]
}

/**
 * Symmetry: a shape picker and a mirror pattern. The pattern belongs to one
 * practice at a time (free play, or one challenge), so each challenge starts
 * from its own almost-symmetric picture.
 */
export function useSymmetryModule(progress: ProgressApi): ModuleRuntime {
  const { color } = getModule('symmetry')
  const [freeMode, setFreeMode] = useState<SymMode>('shapes')
  const [shapeId, setShapeId] = useState<ShapeId>(DEFAULT_SHAPE)
  const [axis, setAxis] = useState<Axis>('vertical')
  const [saved, setSaved] = useState<{ key: string; cells: Cells } | null>(null)
  const [quizOn, setQuizOn] = useState(false)
  const [burst, setBurst] = useState(0)

  const cellsFor = useCallback((key: string): Cells => (saved && saved.key === key ? saved.cells : startCells(key)), [saved])

  const celebrate = useCallback(() => {
    playChime()
    setBurst((n) => n + 1)
  }, [])
  const { challenge, quiz } = useModuleQuiz({
    module: 'symmetry',
    challenges: symmetrySet.challenges,
    enabled: quizOn,
    isSolved: (c) => symmetrySet.isSolved(c, { shapeId, cellsFor }),
    onCelebrate: celebrate,
    progress,
  })

  const mode: SymMode = quizOn ? modeOfChallenge(challenge) : freeMode
  const key = quizOn ? challenge.id : 'free'
  const cells = cellsFor(key)
  const axes: Axis[] = quizOn && challenge.rule.type === 'mirror' ? PRESETS[challenge.rule.preset].axes : [axis]
  const off = offTiles(cells, axes)
  const badPairs = axes.reduce((n, a) => n + mismatches(cells, a).length, 0)

  const toggle = (i: number) => {
    playClick()
    setSaved({ key, cells: cells.map((v, j) => (j === i ? !v : v)) })
  }

  return {
    stars: quiz.score,
    total: symmetrySet.challenges.length,
    panel: (
      <SymmetryPanel
        mode={mode}
        shapeId={shapeId}
        axis={axis}
        quizOn={quizOn}
        onMode={setFreeMode}
        onShape={setShapeId}
        onAxis={setAxis}
        onReset={() => setSaved({ key, cells: startCells(key) })}
        onClear={() => setSaved({ key, cells: emptyCells() })}
        onQuizChange={setQuizOn}
        challenge={challenge}
        quiz={quiz}
      />
    ),
    stage: (
      <>
        <MathCanvas
          key="symmetry"
          resetKey="symmetry"
          cameraPosition={[0, 11, 6.5]}
          maxDistance={30}
          label={symmetryLabel(mode, shapeId, cells, axes, badPairs)}
        >
          <SymmetryScene
            mode={mode}
            shapeId={shapeId}
            cells={cells}
            axes={axes}
            off={off}
            color={color}
            onToggle={toggle}
            burstKey={burst}
          />
        </MathCanvas>
        <SymmetryOverlay mode={mode} shapeId={shapeId} cells={cells} axes={axes} badPairs={badPairs} />
      </>
    ),
  }
}
