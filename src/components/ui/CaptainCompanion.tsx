import { useEffect } from 'react'
import type { CaptainMessage } from '../../hooks/useCaptainReactions'

const SHOW_MS = 4500

interface CaptainCompanionProps {
  message: CaptainMessage | null
  /** Tapping the Captain asks for a tip. */
  onTap: () => void
  onHide: () => void
}

/**
 * A small 2D Captain Hexa-Cubie that sits in the corner of a module. He talks
 * when something happens (a solve, a badge, a level-up) or when tapped. Pure
 * SVG/CSS, so it costs nothing next to the 3D scene.
 */
export function CaptainCompanion({ message, onTap, onHide }: CaptainCompanionProps) {
  useEffect(() => {
    if (!message) return
    const id = window.setTimeout(onHide, SHOW_MS)
    return () => window.clearTimeout(id)
  }, [message, onHide])

  const happy = message !== null
  return (
    <div className="captain">
      <button
        type="button"
        className={`captain__avatar${happy ? ' captain__avatar--happy' : ''}`}
        onClick={onTap}
        aria-label="Captain Hexa-Cubie: tap for a tip"
      >
        <svg viewBox="0 0 64 64" width="52" height="52" aria-hidden="true">
          <defs>
            <linearGradient id="captain-body" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#2fe3f7" />
              <stop offset="1" stopColor="#9d4cf5" />
            </linearGradient>
          </defs>
          <rect x="10" y="20" width="44" height="38" rx="10" fill="url(#captain-body)" />
          <rect x="14" y="10" width="36" height="12" rx="6" fill="#5b6b7a" />
          <path d="M32 3l2.4 5 5.4.6-4 3.6 1.2 5.3L32 14.7 27 17.5l1.2-5.3-4-3.6 5.4-.6z" fill="#fbbf24" />
          <rect x="16" y="29" width="32" height="14" rx="6" fill="#1e1b4b" opacity="0.85" />
          <circle cx="25" cy="36" r="3.4" fill="#fff" />
          <circle cx="39" cy="36" r="3.4" fill="#fff" />
          <circle cx="25.6" cy="36.4" r="1.7" fill="#3b3f9e" />
          <circle cx="39.6" cy="36.4" r="1.7" fill="#3b3f9e" />
          <path
            d={happy ? 'M25 48q7 8 14 0' : 'M26 48q6 5 12 0'}
            stroke="#1e1b4b"
            strokeWidth="2.4"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      </button>
      {message && (
        <p className={`captain__bubble captain__bubble--${message.kind}`} key={message.id} role="status">
          {message.text}
        </p>
      )}
    </div>
  )
}
