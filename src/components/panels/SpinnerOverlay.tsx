import './integers.css'
import './place-value.css'
import './probability.css'
import {
  COLOURS,
  COLOUR_HEX,
  percentText,
  probabilityFraction,
  probabilityOf,
  likelihoodOf,
  totalSectors,
  type Sectors,
  type Tally,
} from '../../data/probability'

const NAMES = { red: 'Red', blue: 'Blue', green: 'Green' } as const

/** Theory (from the sectors) next to experiment (from the spins), one row per colour. */
export function SpinnerOverlay({ sectors, tally, spins }: { sectors: Sectors; tally: Tally; spins: number }) {
  const total = totalSectors(sectors)
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Chances and results">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">{total === 0 ? 'Add some sectors' : `Chance (${total} sectors)`}</span>
        <ul className="chance-rows">
          {COLOURS.map((c) => {
            const p = probabilityOf(c, sectors)
            return (
              <li key={c}>
                <span className="chance-rows__dot" style={{ background: COLOUR_HEX[c] }} aria-hidden="true" />
                <span className="chance-rows__main">
                  {NAMES[c]}: {total === 0 ? '—' : `${probabilityFraction(c, sectors)} = ${percentText(p)}`}
                  <span className="chance-rows__sub">{total === 0 ? '' : likelihoodOf(p)}</span>
                </span>
              </li>
            )
          })}
        </ul>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">{spins === 0 ? 'Spins' : `After ${spins} ${spins === 1 ? 'spin' : 'spins'}`}</span>
        {spins === 0 ? (
          <span className="int-note">No spins yet</span>
        ) : (
          <ul className="chance-rows">
            {COLOURS.map((c) => (
              <li key={c}>
                <span className="chance-rows__dot" style={{ background: COLOUR_HEX[c] }} aria-hidden="true" />
                <span className="chance-rows__main">
                  {NAMES[c]}: {tally[c]} ({percentText(tally[c] / spins)})
                </span>
              </li>
            ))}
          </ul>
        )}
        {spins >= 100 && <span className="int-note int-note--more">More spins bring the results closer to the chances.</span>}
      </div>
    </aside>
  )
}
