import {
  PLACE_INFO,
  PLACE_LIMITS,
  PLACES,
  REGROUP_KINDS,
  REGROUP_SPECS,
  regroupBlocker,
  type NumberSenseChallenge,
  type Place,
  type PlaceValueCounts,
  type RegroupKind,
} from '../../data/placeValue'
import { ChallengeCard, type QuizStatus } from '../ui/ChallengeCard'
import { Stepper } from '../ui/Stepper'
import { Toggle } from '../ui/Toggle'

interface NumberSensePanelProps {
  counts: PlaceValueCounts
  onCountChange: (place: Place, value: number) => void
  onClear: () => void
  onRegroup: (kind: RegroupKind) => void
  quizOn: boolean
  onQuizChange: (on: boolean) => void
  challenge: NumberSenseChallenge
  quiz: QuizStatus
}

export function NumberSensePanel({
  counts,
  onCountChange,
  onClear,
  onRegroup,
  quizOn,
  onQuizChange,
  challenge,
  quiz,
}: NumberSensePanelProps) {
  return (
    <div className="controls">
      {PLACES.map((place) => (
        <Stepper
          key={place}
          label={PLACE_INFO[place].label}
          value={counts[place]}
          min={0}
          max={PLACE_LIMITS[place]}
          onChange={(v) => onCountChange(place, v)}
        />
      ))}
      <p className="hint">
        Tens and ones can go past 9. Twelve tens is still 120, just not in standard form.
        Hover a block to see its size.
      </p>

      <fieldset className="regroup">
        <legend className="regroup__legend">Trade blocks (regroup)</legend>
        <div className="regroup__grid">
          {REGROUP_KINDS.map((kind) => {
            const blocker = regroupBlocker(counts, kind)
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
                <span className="regroup__icon" aria-hidden="true">
                  {spec.bundle ? '⇧' : '⇩'}
                </span>
                {spec.label}
              </button>
            )
          })}
        </div>
        <p className="hint">The number never changes when you trade, only how it's built.</p>
      </fieldset>

      <button type="button" className="text-button" onClick={onClear}>
        Clear all blocks
      </button>

      <Toggle label="Challenge mode" checked={quizOn} onChange={onQuizChange} />
      {quizOn && (
        <ChallengeCard
          prompt={challenge.prompt}
          hint={challenge.hint}
          quiz={quiz}
        />
      )}
    </div>
  )
}
