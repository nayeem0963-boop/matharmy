import './patterns.css'
import {
  FIND_MAX,
  FIND_MIN,
  KIND_LABELS,
  START_MAX,
  START_MIN,
  STEP_RANGE,
  type PatternChallenge,
  type PatternKind,
  type PatternState,
} from '../../data/patterns'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface PatternPanelProps {
  pattern: PatternState
  findN: number
  onKind: (kind: PatternKind) => void
  onStart: (n: number) => void
  onStep: (n: number) => void
  onFindN: (n: number) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: PatternChallenge
  quiz: QuizStatus
}

export function PatternPanel({ pattern, findN, onKind, onStart, onStep, onFindN, quizOn, onQuizChange, challenge, quiz }: PatternPanelProps) {
  const range = STEP_RANGE[pattern.kind]
  return (
    <div className="controls">
      <div className="shape-picker" role="group" aria-label="Kind of pattern">
        {(Object.keys(KIND_LABELS) as PatternKind[]).map((k) => (
          <button
            key={k}
            type="button"
            className="shape-picker__btn"
            aria-pressed={k === pattern.kind}
            onClick={() => {
              playClick()
              onKind(k)
            }}
          >
            {KIND_LABELS[k]}
          </button>
        ))}
      </div>
      <Stepper label="Start at" value={pattern.start} min={START_MIN} max={START_MAX} onChange={onStart} />
      <Stepper
        label={pattern.kind === 'add' ? 'Add' : 'Multiply by'}
        value={pattern.step}
        min={range.min}
        max={range.max}
        onChange={onStep}
      />
      <Stepper label="Find term number" value={findN} min={FIND_MIN} max={FIND_MAX} onChange={onFindN} />
      <p className="hint">
        The bars show the first 6 terms. Use "Find term number" to jump ahead without counting.
      </p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
