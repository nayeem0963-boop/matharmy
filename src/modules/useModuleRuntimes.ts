import { useFractionsModule } from './fractions/useFractionsModule'
import { useGeometryModule } from './geometry/useGeometryModule'
import { useNumberSenseModule } from './number-sense/useNumberSenseModule'
import type { ModuleRuntimes, ProgressApi } from './types'

/**
 * Runs every module's hook, in a fixed order, so each keeps its state while the
 * learner switches tabs. Adding a module: write its `useXModule` hook, add its
 * id to `MathModuleId` / `mathModules`, and add one line here.
 */
export function useModuleRuntimes(progress: ProgressApi): ModuleRuntimes {
  const fractions = useFractionsModule(progress)
  const geometry = useGeometryModule(progress)
  const numberSense = useNumberSenseModule(progress)
  return { fractions, geometry, 'number-sense': numberSense }
}
