import { OPERATION_SYMBOL, type Operation, type WorkingStep } from '../../data/addSubtract'
import { numberToWords, placeValueTotal, type PlaceValueCounts } from '../../data/placeValue'

interface AddSubtractOverlayProps {
  op: Operation
  a: number
  b: number
  counts: PlaceValueCounts
  /** The worked column method. Left out in challenge mode so it does not give the answer away. */
  working?: WorkingStep[]
}

/** Equation, what is on the mat right now, and (while exploring) the column method. */
export function AddSubtractOverlay({ op, a, b, counts, working }: AddSubtractOverlayProps) {
  const total = placeValueTotal(counts)
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Sum and blocks on the mat">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Sum</span>
        <code className="formula-overlay__formula">
          {a} {OPERATION_SYMBOL[op]} {b}
        </code>
        <span className="formula-overlay__working">On the mat: {numberToWords(total)}</span>
        <span className="number-readout">{total}</span>
      </div>
      {working && (
        <div className="formula-overlay__block">
          <span className="formula-overlay__label">Column method</span>
          <ol className="working-steps">
            {working.map((s) => (
              <li key={s.place}>
                <span className="working-steps__place">{s.place}</span> {s.text}
              </li>
            ))}
          </ol>
        </div>
      )}
    </aside>
  )
}
