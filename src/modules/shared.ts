import { lazy } from 'react'

// Everything that pulls in three / @react-three/* loads on demand, so the
// initial bundle is only React + the UI shell. Scenes are declared here, apart
// from the module hooks, so each stays its own lazy chunk.
export const MathCanvas = lazy(() => import('../components/canvas/MathCanvas'))
export const FractionBlocksScene = lazy(() => import('../components/scenes/FractionBlocksScene'))
export const GeometryExplorerScene = lazy(() => import('../components/scenes/GeometryExplorerScene'))
export const PlaceValueScene = lazy(() => import('../components/scenes/PlaceValueScene'))
export const ArrayScene = lazy(() => import('../components/scenes/ArrayScene'))
export const DivisionScene = lazy(() => import('../components/scenes/DivisionScene'))
export const PatternScene = lazy(() => import('../components/scenes/PatternScene'))
export const AreaScene = lazy(() => import('../components/scenes/AreaScene'))
export const DecimalScene = lazy(() => import('../components/scenes/DecimalScene'))
export const DataScene = lazy(() => import('../components/scenes/DataScene'))
export const AngleScene = lazy(() => import('../components/scenes/AngleScene'))
