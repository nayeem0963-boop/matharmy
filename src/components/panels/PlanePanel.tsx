import './coordinates.css'
import { MODE_LABELS, PLANE_MAX, PLANE_MIN, type Move, type PlaneChallenge, type PlaneMode, type Vec } from '../../data/coordinatePlane'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface PlanePanelProps {
  mode: PlaneMode
  point: Vec
  quizOn: boolean
  onMode: (mode: PlaneMode) => void
  onPoint: (p: Vec) => void
  canMove: (m: Move) => boolean
  onMove: (m: Move) => void
  onReset: () => void
  onQuizChange: (on: boolean) => void
  challenge: PlaneChallenge
  quiz: QuizStatus
}

const SLIDES: { cls: string; label: string; arrow: string; move: Move }[] = [
  { cls: 'up', label: 'Slide up 1', arrow: '↑', move: { type: 'slide', dx: 0, dy: 1 } },
  { cls: 'left', label: 'Slide left 1', arrow: '←', move: { type: 'slide', dx: -1, dy: 0 } },
  { cls: 'right', label: 'Slide right 1', arrow: '→', move: { type: 'slide', dx: 1, dy: 0 } },
  { cls: 'down', label: 'Slide down 1', arrow: '↓', move: { type: 'slide', dx: 0, dy: -1 } },
]
const ACTIONS: { label: string; move: Move }[] = [
  { label: 'Flip over the x-axis', move: { type: 'flip-x' } },
  { label: 'Flip over the y-axis', move: { type: 'flip-y' } },
  { label: 'Turn 90° left', move: { type: 'turn', quarter: 1 } },
  { label: 'Turn 90° right', move: { type: 'turn', quarter: -1 } },
  { label: 'Turn 180°', move: { type: 'turn', quarter: 2 } },
]

export function PlanePanel({ mode, point, quizOn, onMode, onPoint, canMove, onMove, onReset, onQuizChange, challenge, quiz }: PlanePanelProps) {
  const act = (m: Move) => {
    playClick()
    onMove(m)
  }
  return (
    <div className="controls">
      {quizOn ? (
        <p className="hint" aria-live="polite">
          This challenge is about {mode === 'plot' ? 'a point' : 'the triangle'}.
        </p>
      ) : (
        <div className="shape-picker" role="group" aria-label="What to do">
          {(Object.keys(MODE_LABELS) as PlaneMode[]).map((m) => (
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

      {mode === 'plot' ? (
        <>
          <Stepper label="x (across)" value={point.x} min={PLANE_MIN} max={PLANE_MAX} onChange={(n) => onPoint({ ...point, x: n })} />
          <Stepper label="y (up)" value={point.y} min={PLANE_MIN} max={PLANE_MAX} onChange={(n) => onPoint({ ...point, y: n })} />
          <p className="hint">Tip: click the plane to put the point there. Always say x first, then y.</p>
        </>
      ) : (
        <>
          <div className="move-pad" role="group" aria-label="Slide the triangle">
            {SLIDES.map((s) => (
              <button
                key={s.cls}
                type="button"
                className={`move-pad__${s.cls}`}
                aria-label={s.label}
                disabled={!canMove(s.move)}
                title={canMove(s.move) ? s.label : 'It would leave the plane'}
                onClick={() => act(s.move)}
              >
                {s.arrow}
              </button>
            ))}
          </div>
          <div className="move-actions" role="group" aria-label="Flip or turn the triangle">
            {ACTIONS.map((a) => (
              <button key={a.label} type="button" disabled={!canMove(a.move)} onClick={() => act(a.move)}>
                {a.label}
              </button>
            ))}
            <button type="button" onClick={() => { playClick(); onReset() }}>
              Start over
            </button>
          </div>
          <p className="hint">The faint grey triangle is where it started. Turns are about the origin (0, 0).</p>
        </>
      )}

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
