import { lazy } from 'react'

// Everything that pulls in three / @react-three/* loads on demand, so the
// initial bundle is only React + the UI shell. Scenes are declared here, apart
// from the module hooks, so each stays its own lazy chunk.
export const MathCanvas = lazy(() => import('../components/canvas/MathCanvas'))
export const FractionBlocksScene = lazy(() => import('../components/scenes/FractionBlocksScene'))
export const GeometryExplorerScene = lazy(() => import('../components/scenes/GeometryExplorerScene'))
export const PlaceValueScene = lazy(() => import('../components/scenes/PlaceValueScene'))
