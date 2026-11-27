import {
  PLACE_INFO,
  PLACES,
  expandedForm,
  numberToWords,
  placeValueTotal,
  type PlaceValueCounts,
} from '../../data/placeValue'
import './place-value.css'

/** Live number readout drawn over the corner of the 3D stage. */
export function NumberSenseOverlay({ counts }: { counts: PlaceValueCounts }) {
  const total = placeValueTotal(counts)
  const standard = counts.tens <= 9 && counts.ones <= 9
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Number built from blocks">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Number</span>
        <span className="number-readout">{total}</span>
        <span className="formula-overlay__working">{numberToWords(total)}</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Expanded form</span>
        <code className="formula-overlay__formula">{expandedForm(counts)}</code>
        <span className="place-chips">
          {PLACES.map((p) => (
            <span key={p} className="place-chip" style={{ color: PLACE_INFO[p].color }}>
              {counts[p]} × {PLACE_INFO[p].value}
            </span>
          ))}
        </span>
        {!standard && (
          <span className="formula-overlay__note">Not standard form: you can regroup!</span>
        )}
      </div>
    </aside>
  )
}
