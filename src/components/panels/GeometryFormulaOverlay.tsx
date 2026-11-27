import { formatNumber, type ShapeDefinition, type ShapeMetrics } from '../../data/geometryShapes'

interface GeometryFormulaOverlayProps {
  shape: ShapeDefinition
  metrics: ShapeMetrics
}

/** Live volume / surface-area readout drawn over the corner of the 3D stage. */
export function GeometryFormulaOverlay({ shape, metrics }: GeometryFormulaOverlayProps) {
  return (
    <aside className="formula-overlay" aria-live="polite" aria-label={`${shape.name} measurements`}>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Volume</span>
        <code className="formula-overlay__formula">{metrics.volumeFormula}</code>
        <span className="formula-overlay__working">{metrics.volumeWorking}</span>
        <span className="formula-overlay__value">
          {formatNumber(metrics.volume)} <small>units³</small>
        </span>
      </div>
      <div className="formula-overlay__block">
        <span className="formula-overlay__label">Surface area</span>
        <code className="formula-overlay__formula">{metrics.areaFormula}</code>
        <span className="formula-overlay__working">{metrics.areaWorking}</span>
        <span className="formula-overlay__value">
          {formatNumber(metrics.surfaceArea)} <small>units²</small>
        </span>
      </div>
    </aside>
  )
}
