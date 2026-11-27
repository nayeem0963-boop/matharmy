import './place-value.css'
import './coordinates.css'
import {
  BASE_TRIANGLE,
  TRIANGLE_NAMES,
  locationText,
  moveText,
  pairText,
  type Move,
  type PlaneMode,
  type Vec,
} from '../../data/coordinatePlane'

interface PlaneOverlayProps {
  mode: PlaneMode
  point: Vec
  triangle: Vec[]
  history: Move[]
}

/** Plot mode: the ordered pair and where it is. Move mode: the corners now, and the moves made. */
export function PlaneOverlay({ mode, point, triangle, history }: PlaneOverlayProps) {
  if (mode === 'plot') {
    return (
      <aside className="formula-overlay" aria-live="polite" aria-label="Point in numbers">
        <div className="formula-overlay__block">
          <span className="formula-overlay__label">Point</span>
          <code className="formula-overlay__formula">{pairText(point)}</code>
          <span className="plane-note">{locationText(point)}</span>
        </div>
        <div className="formula-overlay__block">
          <span className="formula-overlay__label">How far</span>
          <span className="plane-note">
            {point.x === 0 ? 'On the y-axis (x is 0)' : `${Math.abs(point.x)} ${point.x > 0 ? 'right' : 'left'} of the y-axis`}
          </span>
          <span className="plane-note">
            {point.y === 0 ? 'On the x-axis (y is 0)' : `${Math.abs(point.y)} ${point.y > 0 ? 'above' : 'below'} the x-axis`}
          </span>
        </div>
      </aside>
    )
  }
  const recent = history.slice(-5)
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Triangle corners">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Corners now (start)</span>
        <dl className="plane-corners">
          {triangle.map((c, i) => (
            <div key={i} style={{ display: 'contents' }}>
              <dt>{TRIANGLE_NAMES[i]}</dt>
              <dd>
                {pairText(c)} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>from {pairText(BASE_TRIANGLE[i])}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Moves so far</span>
        {recent.length === 0 ? (
          <span className="plane-note">None yet</span>
        ) : (
          <ol className="plane-history">
            {recent.map((m, i) => (
              <li key={i}>{moveText(m)}</li>
            ))}
          </ol>
        )}
      </div>
    </aside>
  )
}
