import { useCallback, useEffect, useState } from 'react'
import { mathModules, type MathModuleId } from '../data/mathModules'

/** What the Academy is showing: the welcome page or one module. */
export type View = 'welcome' | MathModuleId

/**
 * Hash routes, so every module has a link and the browser back button works
 * without a server or a router dependency:
 *   #/  (or no hash)  -> welcome     #/fractions  #/geometry  #/number-sense
 * Anything unrecognised falls back to the welcome page.
 */
export function viewFromHash(hash: string): View {
  const id = /^#\/?([a-z0-9-]+)\/?$/.exec(hash)?.[1]
  return mathModules.find((m) => m.id === id)?.id ?? 'welcome'
}

export const hashForView = (view: View) => (view === 'welcome' ? '#/' : `#/${view}`)

/**
 * Current view synced with `location.hash`. `onChange` fires for every change the
 * learner makes (tab, link, back/forward button), not for the initial view.
 */
export function useHashView(onChange?: (view: View) => void): [View, (view: View) => void] {
  const [view, setView] = useState<View>(() => viewFromHash(window.location.hash))

  useEffect(() => {
    const onHashChange = () => {
      const next = viewFromHash(window.location.hash)
      setView(next)
      onChange?.(next)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [onChange])

  const navigate = useCallback(
    (next: View) => {
      setView(next)
      const hash = hashForView(next)
      // Changing the hash adds a history entry (so Back works). The resulting
      // hashchange event just re-applies the view that is already set.
      if (window.location.hash !== hash) window.location.hash = hash
      onChange?.(next)
    },
    [onChange],
  )

  return [view, navigate]
}
