import './integers.css'
import {
  LINE_MAX,
  LINE_MIN,
  MODE_LABELS,
  OP_LABELS,
  OPERAND_MAX,
  OPERAND_MIN,
  type IntChallenge,
  type IntMode,
  type IntOp,
  type IntState,
} from '../../data/integers'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface IntegerPanelProps {
  state: IntState
  showOpposite: boolean
  quizOn: boolean
  onMode: (mode: IntMode) => void
  onChange: (next: Partial<IntState>) => void
  onShowOpposite: (on: boolean) => void
  onQuizChange: (on: boolean) => void
  challenge: IntChallenge
  quiz: QuizStatus
}

export function IntegerPanel({ state, showOpposite, quizOn, onMode, onChange, onShowOpposite, onQuizChange, challenge, quiz }: IntegerPanelProps) {
  return (
    <div className="controls">
      {quizOn ? (
        <p className="hint" aria-live="polite">
          This challenge uses the {state.mode === 'line' ? 'number line' : 'add and subtract'} view.
        </p>
      ) : (
        <div className="shape-picker" role="group" aria-label="View">
          {(Object.keys(MODE_LABELS) as IntMode[]).map((m) => (
            <button
              key={m}
              type="button"
              className="shape-picker__btn"
              aria-pressed={m === state.mode}
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

      {state.mode === 'line' ? (
        <>
          <Stepper label="Point A" value={state.p} min={LINE_MIN} max={LINE_MAX} onChange={(n) => onChange({ p: n })} />
          <Stepper label="Point B" value={state.q} min={LINE_MIN} max={LINE_MAX} onChange={(n) => onChange({ q: n })} />
          <Toggle label="Show the opposite of A" checked={showOpposite} onChange={onShowOpposite} />
          <p className="hint">Left of zero is negative, right is positive. The further right, the greater the number.</p>
        </>
      ) : (
        <>
          <Stepper label="Start at" value={state.a} min={OPERAND_MIN} max={OPERAND_MAX} onChange={(n) => onChange({ a: n })} />
          <div className="shape-picker" role="group" aria-label="Operation">
            {(Object.keys(OP_LABELS) as IntOp[]).map((o) => (
              <button
                key={o}
                type="button"
                className="shape-picker__btn"
                aria-pressed={o === state.op}
                onClick={() => {
                  playClick()
                  onChange({ op: o })
                }}
              >
                {OP_LABELS[o]}
              </button>
            ))}
          </div>
          <Stepper label="Number" value={state.b} min={OPERAND_MIN} max={OPERAND_MAX} onChange={(n) => onChange({ b: n })} />
          <p className="hint">Adding moves right. Subtracting moves left, unless the number is negative: then it moves right.</p>
        </>
      )}

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
