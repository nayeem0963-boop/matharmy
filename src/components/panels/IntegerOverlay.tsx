import './place-value.css'
import './integers.css'
import {
  absOf,
  compareText,
  compareWords,
  distanceBetween,
  bracketed,
  expressionText,
  moveWords,
  oppositeOf,
  placeText,
  signed,
  type IntState,
} from '../../data/integers'

/** Line view: both points, their absolute values, opposites and how far apart. Move view: the working and the move in words. */
export function IntegerOverlay({ state }: { state: IntState }) {
  if (state.mode === 'move') {
    return (
      <aside className="formula-overlay" aria-live="polite" aria-label="Addition or subtraction in numbers">
        <div className="formula-overlay__block">
          <span className="formula-overlay__label">Working</span>
          <code className="formula-overlay__formula">{expressionText(state)}</code>
          <span className="int-note">{moveWords(state)}</span>
        </div>
      </aside>
    )
  }
  const { p, q } = state
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Two numbers on the line">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">A</span>
        <code className="formula-overlay__formula">{signed(p)}</code>
        <span className="int-note">{placeText(p)}</span>
        <span className="int-note int-note--more">
          |A| = {absOf(p)}, opposite {signed(oppositeOf(p))}
        </span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">B</span>
        <code className="formula-overlay__formula">{signed(q)}</code>
        <span className="int-note">{compareText(p, q)}</span>
        <span className="int-note int-note--more">{compareWords(p, q)}</span>
        <span className="int-note">
          {distanceBetween(p, q)} apart: {signed(Math.max(p, q))} − {bracketed(Math.min(p, q))}
        </span>
      </div>
    </aside>
  )
}
