import type { CSSProperties } from 'react'
import { BADGES } from '../../data/badges'
import { mathModules, upcomingModules, type MathModule, type MathModuleId } from '../../data/mathModules'

interface WelcomePanelProps {
  onSelect: (id: MathModuleId) => void
  /** Challenges solved per module (saved progress). */
  stars: Record<MathModuleId, number>
  /** Challenges available per module. */
  totals: Record<MathModuleId, number>
  /** Earned badge ID → time earned. */
  earnedBadges: Record<string, number>
  onResetProgress: () => void
  /** The module the learner was last using, offered as a shortcut (hidden when absent). */
  continueModule?: MathModule | null
}

/** Sidebar content for the landing view: intro, module cards, badges. */
export function WelcomePanel({
  onSelect,
  stars,
  totals,
  earnedBadges,
  onResetProgress,
  continueModule,
}: WelcomePanelProps) {
  const totalStars = Object.values(stars).reduce((a, b) => a + b, 0)
  const earnedCount = BADGES.filter((b) => b.id in earnedBadges).length
  const confirmReset = () => {
    if (
      window.confirm('Reset all stars, streaks, difficulty choices and badges on this device? This cannot be undone.')
    ) {
      onResetProgress()
    }
  }
  return (
    <div className="welcome">
      <p className="panel__eyebrow">Welcome, cadet</p>
      <h1 className="panel__title welcome__title">
        Math<span className="welcome__accent">Army</span>
      </h1>
      <p className="panel__text">
        Hands-on 3D math missions. Build fractions from blocks, unfold solids into nets and
        trade tens for ones, with Captain Hexa-Cubie cheering you on.
      </p>

      {continueModule && (
        <button
          type="button"
          className="welcome__continue"
          style={{ '--card-color': continueModule.color } as CSSProperties}
          onClick={() => onSelect(continueModule.id)}
        >
          Continue: {continueModule.title} <span aria-hidden="true">→</span>
        </button>
      )}

      <h2 className="welcome__heading">Choose a mission</h2>
      <div className="module-cards">
        {mathModules.map((m) => (
          <button
            key={m.id}
            type="button"
            className="module-card"
            style={{ '--card-color': m.color } as CSSProperties}
            onClick={() => onSelect(m.id)}
            disabled={m.status !== 'available'}
          >
            <span className="module-card__dot" aria-hidden="true" />
            <span className="module-card__body">
              <span className="module-card__title">{m.title}</span>
              <span className="module-card__tagline">{m.tagline}</span>
            </span>
            <span className="module-card__meta">
              {m.gradeBand}
              <span
                className={`module-card__stars${stars[m.id] > 0 ? ' module-card__stars--earned' : ''}`}
                aria-label={`${stars[m.id]} of ${totals[m.id]} challenges solved`}
              >
                ★ {stars[m.id]}/{totals[m.id]}
              </span>
            </span>
            <span className="module-card__arrow" aria-hidden="true">
              →
            </span>
          </button>
        ))}
      </div>

      <h2 className="welcome__heading">
        Badges <span className="welcome__count">{earnedCount}/{BADGES.length}</span>
      </h2>
      <ul className="badge-grid">
        {BADGES.map((b) => {
          const earned = b.id in earnedBadges
          return (
            <li
              key={b.id}
              className={`badge-tile${earned ? ' badge-tile--earned' : ''}`}
              title={earned ? `${b.title}: ${b.description}` : `Locked: ${b.description}`}
            >
              <span className="badge-tile__icon" aria-hidden="true">
                {earned ? b.icon : '🔒'}
              </span>
              <span className="badge-tile__title">{b.title}</span>
              <span className="visually-hidden">{earned ? 'Earned.' : `Locked. ${b.description}`}</span>
            </li>
          )
        })}
      </ul>

      <h2 className="welcome__heading">Coming soon</h2>
      <ul className="upcoming">
        {upcomingModules.map((u) => (
          <li key={u.title} className="upcoming__item" style={{ '--card-color': u.color } as CSSProperties}>
            <span className="module-card__dot" aria-hidden="true" />
            <span>
              <strong>{u.title}</strong>
              <span className="upcoming__tagline">{u.tagline}</span>
            </span>
          </li>
        ))}
      </ul>

      <p className="hint">Tip: click the Captain to say hi.</p>
      {totalStars > 0 && (
        <button type="button" className="text-button" onClick={confirmReset}>
          Reset progress ({totalStars} ★ saved on this device)
        </button>
      )}
    </div>
  )
}
