import { useEffect } from 'react'
import { getBadge } from '../../data/badges'
import { playFanfare } from '../../utils/soundEffects'

const SHOW_MS = 3800

/**
 * "Badge unlocked" toast. Plays a short fanfare once, dismisses itself after a
 * few seconds (timer cleared on unmount) and can be closed early.
 */
export function BadgeToast({ badgeId, onDone }: { badgeId: string; onDone: () => void }) {
  const badge = getBadge(badgeId)

  useEffect(() => {
    playFanfare()
    const id = window.setTimeout(onDone, SHOW_MS)
    return () => window.clearTimeout(id)
  }, [onDone])

  if (!badge) return null
  return (
    <div className="badge-toast" role="status" aria-live="polite">
      <span className="badge-toast__icon" aria-hidden="true">
        {badge.icon}
      </span>
      <span className="badge-toast__text">
        <span className="badge-toast__eyebrow">Badge unlocked!</span>
        <strong>{badge.title}</strong>
        <span className="badge-toast__desc">{badge.description}</span>
      </span>
      <button type="button" className="badge-toast__close" onClick={onDone} aria-label="Dismiss">
        ×
      </button>
    </div>
  )
}
