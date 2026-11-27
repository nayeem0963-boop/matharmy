import './probability.css'
import { COLOURS, SECTOR_MAX, SPINS_MAX, totalSectors, type Colour, type SpinnerChallenge, type SpinnerState } from '../../data/probability'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

const LABELS: Record<Colour, string> = { red: 'Red sectors', blue: 'Blue sectors', green: 'Green sectors' }

interface SpinnerPanelProps {
  state: SpinnerState
  onSectors: (colour: Colour, n: number) => void
  onSpin: (times: number) => void
  onClear: () => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: SpinnerChallenge
  quiz: QuizStatus
}

export function SpinnerPanel({ state, onSectors, onSpin, onClear, quizOn, onQuizChange, challenge, quiz }: SpinnerPanelProps) {
  const empty = totalSectors(state) === 0
  const full = state.spins >= SPINS_MAX
  const spin = (n: number) => () => {
    playClick()
    onSpin(n)
  }
  return (
    <div className="controls">
      {COLOURS.map((c) => (
        <Stepper key={c} label={LABELS[c]} value={state[c]} min={0} max={SECTOR_MAX} onChange={(n) => onSectors(c, n)} />
      ))}
      <div className="spin-buttons" role="group" aria-label="Spin the wheel">
        <button type="button" disabled={empty || full} onClick={spin(1)}>
          Spin once
        </button>
        <button type="button" disabled={empty || full} onClick={spin(10)}>
          Spin 10 times
        </button>
        <button type="button" disabled={empty || full} onClick={spin(100)}>
          Spin 100 times
        </button>
        <button
          type="button"
          disabled={state.spins === 0}
          onClick={() => {
            playClick()
            onClear()
          }}
        >
          Clear results
        </button>
      </div>
      <p className="hint">
        More sectors of a colour means a bigger chance. Changing the wheel starts the count again. {full ? 'That is the most spins the counter holds.' : ''}
      </p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
