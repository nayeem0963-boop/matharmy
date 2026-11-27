import './place-value.css'
import {
  DIVISOR_MAX,
  DIVISOR_MIN,
  MODE_LABELS,
  TOTAL_MAX,
  TOTAL_MIN,
  type DivisionChallenge,
  type DivisionMode,
  type DivisionState,
} from '../../data/division'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface DivisionPanelProps {
  state: DivisionState
  onMode: (mode: DivisionMode) => void
  onTotal: (n: number) => void
  onDivisor: (n: number) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: DivisionChallenge
  quiz: QuizStatus
}

export function DivisionPanel({ state, onMode, onTotal, onDivisor, quizOn, onQuizChange, challenge, quiz }: DivisionPanelProps) {
  const sharing = state.mode === 'share'
  return (
    <div className="controls">
      <div className="shape-picker" role="group" aria-label="How to divide">
        {(Object.keys(MODE_LABELS) as DivisionMode[]).map((m) => (
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
      <Stepper label="Cubes" value={state.total} min={TOTAL_MIN} max={TOTAL_MAX} onChange={onTotal} />
      <Stepper
        label={sharing ? 'Number of groups' : 'Size of each group'}
        value={state.divisor}
        min={DIVISOR_MIN}
        max={DIVISOR_MAX}
        onChange={onDivisor}
      />
      <p className="hint">
        {sharing
          ? 'Sharing: each group gets the same number. Cubes that cannot be shared evenly are left over (red).'
          : 'Grouping: make as many full groups as you can. Cubes that do not fill a group are left over (red).'}
      </p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
