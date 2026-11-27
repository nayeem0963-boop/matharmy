import './place-value.css'
import './angles.css'
import {
  KIND_HINTS,
  KIND_NAMES,
  classify,
  completeTurnOf,
  complementOf,
  supplementOf,
  turnFraction,
} from '../../data/angles'

/** The angle named, with its partners and its share of a full turn. */
export function AngleOverlay({ angle }: { angle: number }) {
  const kind = classify(angle)
  const comp = complementOf(angle)
  const supp = supplementOf(angle)
  const turn = completeTurnOf(angle)
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Angle in numbers">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Angle</span>
        <span className="number-readout">{angle}°</span>
        <span className="angle-name">{KIND_NAMES[kind]}</span>
        <span className="formula-overlay__working">{KIND_HINTS[kind]}</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Partners</span>
        <span className="formula-overlay__working">
          {comp !== null ? `Adds to 90° with ${comp}°` : 'No partner for 90°'}
        </span>
        <span className="formula-overlay__working">
          {supp !== null ? `Adds to 180° with ${supp}°` : 'No partner for 180°'}
        </span>
        <span className="formula-overlay__working">
          {turn !== null ? `Adds to 360° with ${turn}°` : 'A whole turn'}
        </span>
        <span className="formula-overlay__working">{turnFraction(angle)} of a full turn</span>
      </div>
    </aside>
  )
}
