import {
  OPERAND_MAX,
  OPERATION_SYMBOL,
  digitsOf,
  partBlocker,
  type AddSubtractChallenge,
  type Mat,
  type Operation,
  type Part,
} from '../../data/addSubtract'
import { REGROUP_KINDS, REGROUP_SPECS, regroupBlocker, type RegroupKind } from '../../data/placeValue'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface AddSubtractPanelProps {
  op: Operation
  a: number
  b: number
  mat: Mat
  quizOn: boolean
  onOperation: (op: Operation) => void
  onA: (n: number) => void
  onB: (n: number) => void
  onPart: (part: Part) => void
  onRegroup: (kind: RegroupKind) => void
  onRestart: () => void
  onQuizChange: (on: boolean) => void
  challenge: AddSubtractChallenge
  prompt: string
  quiz: QuizStatus
}

const OPERATIONS: { op: Operation; label: string }[] = [
  { op: 'add', label: 'Add (+)' },
  { op: 'subtract', label: 'Subtract (−)' },
]

export function AddSubtractPanel({
  op, a, b, mat, quizOn, onOperation, onA, onB, onPart, onRegroup, onRestart, onQuizChange, challenge, prompt, quiz,
}: AddSubtractPanelProps) {
  const digits = digitsOf(b)
  const verb = op === 'add' ? 'Add' : 'Take away'
  return (
    <div className="controls">
      {quizOn ? (
        <p className="hint" aria-live="polite">
          Numbers are set by the challenge: <strong>{a} {OPERATION_SYMBOL[op]} {b}</strong>
        </p>
      ) : (
        <>
          <div className="shape-picker" role="group" aria-label="Operation">
            {OPERATIONS.map((o) => (
              <button
                key={o.op}
                type="button"
                className="shape-picker__btn"
                aria-pressed={o.op === op}
                onClick={() => {
                  playClick()
                  onOperation(o.op)
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
          <Stepper label="First number" value={a} min={0} max={OPERAND_MAX} onChange={onA} />
          <Stepper label="Second number" value={b} min={0} max={op === 'subtract' ? a : OPERAND_MAX} onChange={onB} />
        </>
      )}

      <fieldset className="regroup">
        <legend className="regroup__legend">
          {verb} {b}, one place at a time
        </legend>
        <div className="regroup__grid">
          {(['ones', 'tens'] as const).map((part) => {
            const blocker = partBlocker(mat, op, b, part)
            const amount = digits[part]
            const label = `${verb} ${amount} ${part}`
            return (
              <button
                key={part}
                type="button"
                className="regroup__btn regroup__btn--bundle"
                disabled={blocker !== null}
                aria-label={blocker ? `${label} (${blocker})` : label}
                title={blocker ?? undefined}
                onClick={() => onPart(part)}
              >
                <span className="regroup__icon" aria-hidden="true">{mat.done[part] ? '✓' : op === 'add' ? '+' : '−'}</span>
                {label}
              </button>
            )
          })}
        </div>
        <p className="hint">
          {op === 'add'
            ? 'Ten ones make a ten: trade them in when you have 10 or more.'
            : 'Not enough ones? Break a ten into ten ones, then take away.'}
        </p>
      </fieldset>

      <fieldset className="regroup">
        <legend className="regroup__legend">Trade blocks (regroup)</legend>
        <div className="regroup__grid">
          {REGROUP_KINDS.map((kind) => {
            const blocker = regroupBlocker(mat.counts, kind)
            const spec = REGROUP_SPECS[kind]
            return (
              <button
                key={kind}
                type="button"
                className={`regroup__btn regroup__btn--${spec.bundle ? 'bundle' : 'break'}`}
                disabled={blocker !== null}
                aria-label={blocker ? `${spec.label} (${blocker})` : spec.label}
                title={blocker ?? (spec.bundle ? 'Bundle into a bigger block' : 'Break into smaller blocks')}
                onClick={() => onRegroup(kind)}
              >
                <span className="regroup__icon" aria-hidden="true">{spec.bundle ? '⇧' : '⇩'}</span>
                {spec.label}
              </button>
            )
          })}
        </div>
      </fieldset>

      <button type="button" className="text-button" onClick={onRestart}>
        Start over
      </button>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
