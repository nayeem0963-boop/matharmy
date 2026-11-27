import './angles.css'
import { ANGLE_MAX, ANGLE_MIN, type AngleChallenge } from '../../data/angles'
import { playClick } from '../../utils/soundEffects'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

const JUMPS = [45, 90, 180, 270, 360]

interface AnglePanelProps {
  angle: number
  onAngle: (n: number) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: AngleChallenge
  quiz: QuizStatus
}

export function AnglePanel({ angle, onAngle, quizOn, onQuizChange, challenge, quiz }: AnglePanelProps) {
  return (
    <div className="controls">
      <Stepper label="Angle (degrees)" value={angle} min={ANGLE_MIN} max={ANGLE_MAX} onChange={onAngle} />
      <div className="angle-jumps" role="group" aria-label="Jump to an angle">
        {JUMPS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => {
              playClick()
              onAngle(d)
            }}
          >
            {d}°
          </button>
        ))}
      </div>
      <p className="hint">
        Tip: click the protractor to point the ray there (it snaps to 5°). Use the − and + buttons for single degrees.
      </p>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && <ChallengeCard prompt={challenge.prompt} hint={challenge.hint} quiz={quiz} />}
    </div>
  )
}
