import './place-value.css'
import './patterns.css'
import { TERMS_SHOWN, nthTermRule, ruleSentence, termAt, termWorking, termsOf, type PatternState } from '../../data/patterns'

interface PatternOverlayProps {
  pattern: PatternState
  /** The term number the learner is looking up. */
  findN: number
}

const format = (n: number) => n.toLocaleString('en-US')

/** The sequence in numbers: its terms, the rule, and any term worked out. */
export function PatternOverlay({ pattern, findN }: PatternOverlayProps) {
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Pattern in numbers">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Pattern</span>
        <span className="pattern-terms">
          {termsOf(pattern, TERMS_SHOWN).map(format).join(', ')}, …
        </span>
        <span className="formula-overlay__working">{ruleSentence(pattern)}</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Term {findN}</span>
        <span className="number-readout">{format(termAt(pattern, findN))}</span>
        <code className="formula-overlay__formula">{nthTermRule(pattern)}</code>
        <span className="formula-overlay__working">{termWorking(pattern, findN)}</span>
      </div>
    </aside>
  )
}
