import type { GeometryChallenge } from '../../data/challenges'
import {
  DIMENSION_MAX,
  DIMENSION_MIN,
  DIMENSION_STEP,
  shapes,
} from '../../data/geometryShapes'
import type { ShapeDimensionsState } from '../../hooks/useShapeDimensions'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface GeometryPanelProps {
  geometry: ShapeDimensionsState
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: GeometryChallenge
  quiz: QuizStatus
}

export function GeometryPanel({
  geometry,
  quizOn,
  onQuizChange,
  challenge,
  quiz,
}: GeometryPanelProps) {
  const { shape, shapeId, setShapeId, rawDimensions, setDimension, showNet, setShowNet } = geometry

  return (
    <div className="controls">
      <div className="shape-picker" role="group" aria-label="Shape">
        {shapes.map((s) => (
          <button
            key={s.id}
            type="button"
            className="shape-picker__btn"
            aria-pressed={s.id === shapeId}
            onClick={() => {
              playClick()
              setShapeId(s.id)
            }}
          >
            {s.name}
          </button>
        ))}
      </div>

      {shape.controls.map((c) => (
        <Stepper
          key={`${shapeId}-${c.key}`}
          label={c.label}
          symbol={c.symbol}
          value={rawDimensions[c.key]}
          min={DIMENSION_MIN}
          max={DIMENSION_MAX}
          step={DIMENSION_STEP}
          onChange={(v) => setDimension(c.key, v)}
        />
      ))}

      <Toggle
        label={shape.hasNet ? 'Unfold into net' : 'Unfold into net (n/a for sphere)'}
        checked={showNet}
        onChange={setShowNet}
      />

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && (
        <ChallengeCard
          prompt={challenge.prompt}
          hint={challenge.hint}
          quiz={quiz}
        />
      )}
    </div>
  )
}
