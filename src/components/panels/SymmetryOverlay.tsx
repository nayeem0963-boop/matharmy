import './place-value.css'
import './integers.css'
import './symmetry.css'
import {
  AXIS_LABELS,
  filledCount,
  getShape,
  linesText,
  rotationText,
  type Axis,
  type Cells,
  type ShapeId,
  type SymMode,
} from '../../data/symmetry'

interface SymmetryOverlayProps {
  mode: SymMode
  shapeId: ShapeId
  cells: Cells
  axes: Axis[]
  /** Number of tile pairs with no match across the mirror line(s). */
  badPairs: number
}

/** Shapes: the name, the lines and the turns. Mirror: how close the pattern is to symmetric. */
export function SymmetryOverlay({ mode, shapeId, cells, axes, badPairs }: SymmetryOverlayProps) {
  if (mode === 'shapes') {
    const s = getShape(shapeId)
    return (
      <aside className="formula-overlay" aria-live="polite" aria-label="Symmetry of the shape">
        <div className="formula-overlay__block">
          <span className="formula-overlay__label">Shape</span>
          <code className="formula-overlay__formula">{s.name}</code>
        </div>
        <div className="formula-overlay__block">
          <span className="int-note">{linesText(s)}</span>
          <span className="int-note">{rotationText(s)}</span>
          <span className="int-note int-note--more">The yellow lines are the folds that make both halves match.</span>
        </div>
      </aside>
    )
  }
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Symmetry of the pattern">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Mirror line{axes.length > 1 ? 's' : ''}</span>
        <code className="formula-overlay__formula">{axes.map((a) => AXIS_LABELS[a].toLowerCase()).join(' and ')}</code>
        <span className="int-note">{filledCount(cells)} tiles on</span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Match</span>
        {badPairs === 0 ? (
          <span className="sym-ok">Symmetric!</span>
        ) : (
          <span className="sym-bad">
            {badPairs} {badPairs === 1 ? 'pair does' : 'pairs do'} not match
          </span>
        )}
        <span className="int-note int-note--more">Red tiles have no match across the line.</span>
      </div>
    </aside>
  )
}
