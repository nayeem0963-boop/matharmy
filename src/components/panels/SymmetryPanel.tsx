import './symmetry.css'
import {
  AXIS_LABELS,
  MODE_LABELS,
  SHAPES,
  type Axis,
  type ShapeId,
  type SymChallenge,
  type SymMode,
} from '../../data/symmetry'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Toggle } from '../ui/Toggle'

interface SymmetryPanelProps {
  mode: SymMode
  shapeId: ShapeId
  axis: Axis
  quizOn: boolean
  onMode: (mode: SymMode) => void
  onShape: (id: ShapeId) => void
  onAxis: (axis: Axis) => void
  onReset: () => void
  onClear: () => void
  onQuizChange: (on: boolean) => void
  challenge: SymChallenge
  quiz: QuizStatus
}

export function SymmetryPanel({ mode, shapeId, axis, quizOn, onMode, onShape, onAxis, onReset, onClear, onQuizChange, challenge, quiz }: SymmetryPanelProps) {
  return (
    <div className="controls">
      {quizOn ? (
        <p className="hint" aria-live="polite">
          This challenge uses the {mode === 'shapes' ? 'shapes' : 'mirror pattern'} view.
        </p>
      ) : (
        <div className="shape-picker" role="group" aria-label="View">
          {(Object.keys(MODE_LABELS) as SymMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className="shape-picker__btn"
              aria-pressed={m === mode}
              onClick={() => {
                playClick()
                onMode(m)
              }}
            >
              {MODE_LABELS[m]}
            </button>
          ))}
        </div>
      )}

      {mode === 'shapes' ? (
        <>
          <div className="shape-grid" role="group" aria-label="Shape">
            {SHAPES.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={s.id === shapeId}
                onClick={() => {
                  playClick()
                  onShape(s.id)
                }}
              >
                {s.name}
              </button>
            ))}
          </div>
          <p className="hint">Yellow lines are lines of symmetry: fold along one and both halves match.</p>
        </>
      ) : (
        <>
          {!quizOn && (
            <div className="shape-picker" role="group" aria-label="Mirror line">
              {(Object.keys(AXIS_LABELS) as Axis[]).map((a) => (
                <button
                  key={a}
                  type="button"
                  className="shape-picker__btn"
                  aria-pressed={a === axis}
                  onClick={() => {
                    playClick()
                    onAxis(a)
                  }}
                >
                  {AXIS_LABELS[a]}
                </button>
              ))}
            </div>
          )}
          <div className="sym-actions">
            <button type="button" onClick={() => { playClick(); onReset() }}>
              Start again
            </button>
            <button type="button" onClick={() => { playClick(); onClear() }}>
              Clear all tiles
            </button>
          </div>
          <p className="hint">Click a tile to turn it on or off. Red tiles have no match across the yellow mirror line.</p>
        </>
      )}

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
