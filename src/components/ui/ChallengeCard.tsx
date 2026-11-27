import type { ReactNode } from 'react'
import { TIERS, TIER_LABELS, type Tier } from '../../data/challenges'
import { playClick } from '../../utils/soundEffects'

/** Everything the quiz card needs about the current quiz state (built in App). */
export interface QuizStatus {
  solved: boolean
  /** Challenges solved in this module (all tiers). */
  score: number
  total: number
  tier: Tier
  /** Solved / total per tier, shown on the tier switch. */
  tierStats: Record<Tier, { solved: number; total: number }>
  /** Solves in a row without skipping. */
  streak: number
  onTierChange: (tier: Tier) => void
  onNext: () => void
}

interface ChallengeCardProps {
  prompt: ReactNode
  hint?: string
  solvedMessage?: string
  quiz: QuizStatus
}

export function ChallengeCard({ prompt, hint, solvedMessage, quiz }: ChallengeCardProps) {
  const { solved, score, total, tier, tierStats, streak, onTierChange, onNext } = quiz
  return (
    <section className={`challenge${solved ? ' challenge--solved' : ''}`} aria-live="polite">
      <header className="challenge__header">
        <span className="challenge__title">Quick Quiz</span>
        <span className="challenge__badges">
          {streak >= 2 && (
            <span className="challenge__streak" title="Solved in a row without skipping">
              🔥 {streak}
            </span>
          )}
          <span className="challenge__score" title="Challenges solved (saved on this device)">
            ★ {score}
            <span className="challenge__total">/{total}</span>
          </span>
        </span>
      </header>

      <div className="tier-switch" role="radiogroup" aria-label="Difficulty">
        {TIERS.map((t) => {
          const stats = tierStats[t]
          const done = stats.solved === stats.total
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={t === tier}
              className={`tier-switch__option tier-switch__option--${t}`}
              onClick={() => {
                if (t === tier) return
                playClick()
                onTierChange(t)
              }}
            >
              <span>{TIER_LABELS[t]}</span>
              <span className={`tier-switch__count${done ? ' tier-switch__count--done' : ''}`}>
                {done ? '✓' : `${stats.solved}/${stats.total}`}
              </span>
            </button>
          )
        })}
      </div>

      <p className="challenge__prompt">{prompt}</p>
      {solved ? (
        <p className="challenge__status">{solvedMessage ?? 'Correct! Nice work.'}</p>
      ) : (
        hint && <p className="challenge__hint">Hint: {hint}</p>
      )}
      <button
        type="button"
        className="challenge__next"
        title={solved ? undefined : 'Skipping ends your streak'}
        onClick={() => {
          playClick()
          onNext()
        }}
      >
        {solved ? 'Next challenge →' : 'Skip'}
      </button>
    </section>
  )
}
