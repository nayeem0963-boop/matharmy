import { levelFromXp } from '../../data/xp'

/**
 * Level and progress to the next level. Shown in the header once the learner has
 * earned some XP (so a first visit looks exactly as it always did).
 */
export function XpMeter({ xp }: { xp: number }) {
  if (xp <= 0) return null
  const { level, into, span } = levelFromXp(xp)
  const label = span > 0 ? `Level ${level}, ${into} of ${span} XP to the next level` : `Level ${level}, maximum level`
  return (
    <div className="xp-meter" role="status" aria-label={label} title={`${xp} XP in total`}>
      <span className="xp-meter__level">Lv {level}</span>
      <span className="xp-meter__bar" aria-hidden="true">
        <span className="xp-meter__fill" style={{ width: span > 0 ? `${Math.round((into / span) * 100)}%` : '100%' }} />
      </span>
      <span className="xp-meter__xp" aria-hidden="true">{xp} XP</span>
    </div>
  )
}
