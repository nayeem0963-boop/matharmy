import './place-value.css'
import './multiplication.css'
import { factFamily, productOf, repeatedAddition, skipCount } from '../../data/multiplication'

interface MultiplicationOverlayProps {
  rows: number
  cols: number
  counted: number
}

/** The array in numbers: the product, repeated addition, skip counting and the fact family. */
export function MultiplicationOverlay({ rows, cols, counted }: MultiplicationOverlayProps) {
  const total = productOf(rows, cols)
  const counts = skipCount(cols, counted)
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Array in numbers">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Array</span>
        <code className="formula-overlay__formula">
          {rows} × {cols}
        </code>
        <span className="number-readout">{total}</span>
        <span className="formula-overlay__working">{repeatedAddition(rows, cols)}</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">{counted > 0 ? `Counting ${counted} row${counted === 1 ? '' : 's'}` : 'Fact family'}</span>
        {counted > 0 ? (
          <span className="skip-count">{counts.join(', ')}</span>
        ) : (
          <ul className="fact-family">
            {factFamily(rows, cols).map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  )
}
