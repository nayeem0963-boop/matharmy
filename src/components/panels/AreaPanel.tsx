import './place-value.css'
import {
  SHAPE_LABELS,
  SIDE_MAX,
  SIDE_MIN,
  type AreaChallenge,
  type AreaShape,
  type AreaState,
} from '../../data/areaPerimeter'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface AreaPanelProps {
  shape: AreaState
  showArea: boolean
  showPerimeter: boolean
  onShape: (shape: AreaShape) => void
  onSide: (key: 'w' | 'h' | 'nw' | 'nh', n: number) => void
  onShowArea: (on: boolean) => void
  onShowPerimeter: (on: boolean) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: AreaChallenge
  quiz: QuizStatus
}

export function AreaPanel({
  shape, showArea, showPerimeter, onShape, onSide, onShowArea, onShowPerimeter, quizOn, onQuizChange, challenge, quiz,
}: AreaPanelProps) {
  const isL = shape.shape === 'l'
  const sideMin = isL ? 2 : SIDE_MIN
  return (
    <div className="controls">
      <div className="shape-picker" role="group" aria-label="Shape">
        {(Object.keys(SHAPE_LABELS) as AreaShape[]).map((k) => (
          <button
            key={k}
            type="button"
            className="shape-picker__btn"
            aria-pressed={k === shape.shape}
            onClick={() => {
              playClick()
              onShape(k)
            }}
          >
            {SHAPE_LABELS[k]}
          </button>
        ))}
      </div>
      <Stepper label={isL ? 'Box width' : 'Width'} value={shape.w} min={sideMin} max={SIDE_MAX} onChange={(n) => onSide('w', n)} />
      <Stepper label={isL ? 'Box height' : 'Height'} value={shape.h} min={sideMin} max={SIDE_MAX} onChange={(n) => onSide('h', n)} />
      {isL && (
        <>
          <Stepper label="Notch width" value={shape.nw} min={1} max={shape.w - 1} onChange={(n) => onSide('nw', n)} />
          <Stepper label="Notch height" value={shape.nh} min={1} max={shape.h - 1} onChange={(n) => onSide('nh', n)} />
        </>
      )}
      <Toggle label="Show area tiles" checked={showArea} onChange={onShowArea} />
      <Toggle label="Show perimeter edges" checked={showPerimeter} onChange={onShowPerimeter} />
      <p className="hint">
        Area counts the squares inside. Perimeter counts the edges around the outside (orange).
      </p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
