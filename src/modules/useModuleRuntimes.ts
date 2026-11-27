import { useAddSubtractModule } from './add-subtract/useAddSubtractModule'
import { useDivisionModule } from './division/useDivisionModule'
import { useFractionsModule } from './fractions/useFractionsModule'
import { useGeometryModule } from './geometry/useGeometryModule'
import { useMultiplicationModule } from './multiplication/useMultiplicationModule'
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
  const addSubtract = useAddSubtractModule(progress)
  const multiplication = useMultiplicationModule(progress)
  const division = useDivisionModule(progress)
  return { fractions, geometry, 'number-sense': numberSense, 'add-subtract': addSubtract, multiplication, division }
}
