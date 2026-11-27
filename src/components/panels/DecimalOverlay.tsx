import './place-value.css'
import './decimals.css'
import { decimalText, decimalTwoPlaces, fractionText, percentText, placeWords, simplestFraction } from '../../data/decimals'

/** One amount, three ways: decimal, fraction and percent, with the place-value words. */
export function DecimalOverlay({ squares }: { squares: number }) {
  const { num, den } = simplestFraction(squares)
  const fractionIsHundredths = den === 100
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Amount as decimal, fraction and percent">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Decimal</span>
        <span className="number-readout">{decimalText(squares)}</span>
        <span className="formula-overlay__working">{placeWords(squares)}</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Fraction</span>
        <code className="formula-overlay__formula">
          {squares}/100{fractionIsHundredths || squares === 0 || squares === 100 ? '' : ` = ${fractionText(squares)}`}
        </code>
        <span className="formula-overlay__label">Percent</span>
        <code className="formula-overlay__formula decimal-percent">{percentText(squares)}</code>
        <span className="formula-overlay__working">
          {decimalTwoPlaces(squares)} = {num === 0 ? '0' : `${num}/${den}`}
        </span>
      </div>
    </aside>
  )
}
