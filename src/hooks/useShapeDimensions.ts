import { useCallback, useMemo, useState } from 'react'
import {
  DIMENSION_MAX,
  DIMENSION_MIN,
  computeMetrics,
  effectiveDimensions,
  getShape,
  type DimensionKey,
  type Dimensions,
  type ShapeId,
} from '../data/geometryShapes'

const clamp = (v: number) => Math.min(DIMENSION_MAX, Math.max(DIMENSION_MIN, v))

/** State for the Geometry Explorer: selected shape, dimensions, net view and live metrics. */
export function useShapeDimensions(initialShape: ShapeId = 'cube') {
  const [shapeId, setShapeId] = useState<ShapeId>(initialShape)
  const [rawDimensions, setRawDimensions] = useState<Dimensions>({ width: 3, height: 2, depth: 2 })
  const [showNet, setShowNet] = useState(false)

  const shape = getShape(shapeId)
  const dimensions = useMemo(
    () => effectiveDimensions(shapeId, rawDimensions),
    [shapeId, rawDimensions],
  )
  const metrics = useMemo(() => computeMetrics(shapeId, dimensions), [shapeId, dimensions])

  const setDimension = useCallback((key: DimensionKey, value: number) => {
    setRawDimensions((d) => ({ ...d, [key]: clamp(value) }))
  }, [])

  return {
    shapeId,
    shape,
    setShapeId,
    dimensions,
    rawDimensions,
    setDimension,
    showNet,
    setShowNet,
    metrics,
  }
}

export type ShapeDimensionsState = ReturnType<typeof useShapeDimensions>
