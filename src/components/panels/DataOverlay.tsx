import './place-value.css'
import './data-graphs.css'
import { formatStat, meanOf, medianOf, modeOf, rangeOf, tallestIndex, totalOf, type Topic } from '../../data/dataGraphs'

/** The graph as a data set: what its five counts add up to, and the usual summaries. */
export function DataOverlay({ topic, values }: { topic: Topic; values: number[] }) {
  const mode = modeOf(values)
  const tallest = tallestIndex(values)
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Statistics of the graph">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">{topic.question}</span>
        <span className="number-readout">{totalOf(values)}</span>
        <span className="formula-overlay__working">votes in total</span>
      </div>
      <div className="formula-overlay__block">
        <dl className="stats-list">
          <dt>Mean</dt>
          <dd>{formatStat(meanOf(values))}</dd>
          <dt>Median</dt>
          <dd>{formatStat(medianOf(values))}</dd>
          <dt>Mode</dt>
          <dd>{mode === null ? 'none' : mode}</dd>
          <dt>Range</dt>
          <dd>{rangeOf(values)}</dd>
          <dt>Tallest</dt>
          <dd>{tallest === null ? 'tie' : topic.categories[tallest]}</dd>
        </dl>
      </div>
    </aside>
  )
}
