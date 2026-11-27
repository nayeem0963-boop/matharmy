import './area.css'
import './place-value.css'
import { areaOf, areaWorking, perimeterOf, perimeterWorking, type AreaState } from '../../data/areaPerimeter'

/** Area and perimeter in numbers, with the working. */
export function AreaOverlay({ shape }: { shape: AreaState }) {
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label="Area and perimeter in numbers">
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Area (tiles inside)</span>
        <span className="number-readout">
          {areaOf(shape)} <small>square units</small>
        </span>
        <code className="formula-overlay__formula">{areaWorking(shape)}</code>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Perimeter (edges around)</span>
        <span className="number-readout area-perimeter">
          {perimeterOf(shape)} <small>units</small>
        </span>
        <code className="formula-overlay__formula">{perimeterWorking(shape)}</code>
        {shape.shape === 'l' && (
          <span className="formula-overlay__working">Cutting a corner takes away area, but the perimeter stays the same as the box around it.</span>
        )}
      </div>
    </aside>
  )
}
