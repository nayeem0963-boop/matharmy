import type { ReactNode } from 'react'
import type { MathModuleId } from '../data/mathModules'
import type { useProgress } from '../hooks/useProgress'

export type ProgressApi = ReturnType<typeof useProgress>

/**
 * What one module hands the Academy shell. The state lives in the module's own
 * hook (so it survives switching tabs, as it always has); the shell only places
 * the two React nodes: the sidebar controls and the 3D stage.
 */
export interface ModuleRuntime {
  /** Controls shown in the sidebar under the module's title. */
  panel: ReactNode
  /** The 3D stage (lazy-loaded; wrap-free, the shell provides Suspense). */
  stage: ReactNode
  /** Challenges solved (saved progress) and available, for the welcome cards. */
  stars: number
  total: number
}

export type ModuleRuntimes = Record<MathModuleId, ModuleRuntime>
