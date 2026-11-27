import './place-value.css'
import './multiplication.css'
import { ARRAY_MAX, ARRAY_MIN, type ArrayChallenge } from '../../data/multiplication'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface MultiplicationPanelProps {
  rows: number
  cols: number
  counted: number
  onRows: (n: number) => void
  onCols: (n: number) => void
  onCounted: (n: number) => void
  onSwap: () => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: ArrayChallenge
  quiz: QuizStatus
}

export function MultiplicationPanel({
  rows, cols, counted, onRows, onCols, onCounted, onSwap, quizOn, onQuizChange, challenge, quiz,
}: MultiplicationPanelProps) {
  return (
    <div className="controls">
      <Stepper label="Rows" value={rows} min={ARRAY_MIN} max={ARRAY_MAX} onChange={onRows} />
      <Stepper label="Columns" value={cols} min={ARRAY_MIN} max={ARRAY_MAX} onChange={onCols} />
      <Stepper label="Rows counted" value={counted} min={0} max={rows} onChange={onCounted} />
      <p className="hint">Tip: click a cube to count up to its row. Counting by {cols}s is skip counting.</p>

      <button
        type="button"
        className="regroup__btn regroup__btn--bundle swap-btn"
        onClick={() => {
          playClick()
          onSwap()
        }}
      >
        <span className="regroup__icon" aria-hidden="true">⇄</span>
        Swap rows and columns ({rows} × {cols} → {cols} × {rows})
      </button>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
