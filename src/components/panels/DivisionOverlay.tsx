import './place-value.css'
import { checkSentence, describe, equation, type DivisionState } from '../../data/division'

/** The division in numbers: the equation, the multiplication that checks it, and a plain-words summary. */
export function DivisionOverlay({ state }: { state: DivisionState }) {
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Division in numbers">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Division</span>
        <code className="formula-overlay__formula">{equation(state)}</code>
        <span className="formula-overlay__working">{describe(state)}</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Check with multiplication</span>
        <code className="formula-overlay__formula">{checkSentence(state)}</code>
      </div>
    </aside>
  )
}
