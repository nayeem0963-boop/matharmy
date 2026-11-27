import './place-value.css'
import {
  HUNDREDTHS_MAX,
  TENTHS_MAX,
  fromDigits,
  hundredthsOf,
  tenthsOf,
  type DecimalChallenge,
} from '../../data/decimals'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface DecimalPanelProps {
  squares: number
  onSquares: (n: number) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: DecimalChallenge
  quiz: QuizStatus
}

export function DecimalPanel({ squares, onSquares, quizOn, onQuizChange, challenge, quiz }: DecimalPanelProps) {
  const t = tenthsOf(squares)
  const h = hundredthsOf(squares)
  return (
    <div className="controls">
      <Stepper label="Tenths" value={t} min={0} max={TENTHS_MAX} onChange={(n) => onSquares(fromDigits(n, h))} />
      <Stepper
        label="Hundredths"
        value={h}
        min={0}
        max={HUNDREDTHS_MAX}
        onChange={(n) => onSquares(fromDigits(t, n))}
      />
      <p className="hint">
        The whole is 100 squares. A column of 10 squares is one tenth (0.1 = 10%). Each single square is one hundredth
        (0.01 = 1%).
      </p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
