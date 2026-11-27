import type { FractionChallenge } from '../../data/challenges'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'
import './fractions.css'

export const MAX_DENOMINATOR = 12

interface FractionsPanelProps {
  numerator: number
  denominator: number
  onNumeratorChange: (n: number) => void
  onDenominatorChange: (d: number) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: FractionChallenge
  quiz: QuizStatus
}

export function FractionsPanel({
  numerator,
  denominator,
  onNumeratorChange,
  onDenominatorChange,
  quizOn,
  onQuizChange,
  challenge,
  quiz,
}: FractionsPanelProps) {
  const isEquivalent =
    quiz.solved && (numerator !== challenge.numerator || denominator !== challenge.denominator)

  return (
    <div className="controls">
      <div className="fraction-readout" aria-live="polite">
        <span>{numerator}</span>
        <span className="fraction-readout__bar" />
        <span>{denominator}</span>
      </div>
      <Stepper
        label="Numerator"
        value={numerator}
        min={0}
        max={denominator * 2}
        onChange={onNumeratorChange}
      />
      <Stepper
        label="Denominator"
        value={denominator}
        min={1}
        max={MAX_DENOMINATOR}
        onChange={onDenominatorChange}
      />
      <p className="hint">Tip: click a block to set the numerator. Drag to orbit.</p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && (
        <ChallengeCard
          prompt={
            <>
              Show <strong>{challenge.numerator}/{challenge.denominator}</strong> with the blocks.
            </>
          }
          hint="Any equivalent fraction counts too."
          solvedMessage={
            isEquivalent
              ? `Correct! ${numerator}/${denominator} = ${challenge.numerator}/${challenge.denominator}`
              : 'Correct! Nice work.'
          }
          quiz={quiz}
        />
      )}
    </div>
  )
}
