import { useCallback, useEffect, useRef, useState } from 'react'
import { MODULE_CHALLENGES } from '../data/badges'
import type { Tier } from '../data/challenges'
import type { MathModuleId } from '../data/mathModules'
import { XP_BY_TIER } from '../data/xp'
import {
  PROGRESS_STORAGE_KEY,
  awardBadges,
  clearProgress,
  defaultProgress,
  loadProgress,
  saveProgress,
  type ProgressState,
  type ProgressView,
} from '../utils/progressStore'

/**
 * Persistent learner progress. Saves on every change, stays in sync with other
 * open tabs via the `storage` event (listener removed on unmount), and queues
 * badges earned during this session for a "Badge unlocked" toast.
 */
export function useProgress() {
  const [progress, setProgress] = useState<ProgressState>(loadProgress)
  const [badgeQueue, setBadgeQueue] = useState<string[]>([])

  useEffect(() => {
    saveProgress(progress)
  }, [progress])

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === PROGRESS_STORAGE_KEY) setProgress(loadProgress())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Queue badges that appear after the initial load (badges granted while
  // loading/migrating an old save are not announced).
  const knownBadges = useRef(new Set(Object.keys(progress.badges)))
  useEffect(() => {
    const fresh = Object.keys(progress.badges).filter((id) => !knownBadges.current.has(id))
    if (fresh.length === 0) return
    fresh.forEach((id) => knownBadges.current.add(id))
    setBadgeQueue((q) => [...q, ...fresh])
  }, [progress.badges])

  const dismissBadge = useCallback(() => setBadgeQueue((q) => q.slice(1)), [])

  /** Record a solve: adds the challenge (once, with its XP) and grows the module's streak. */
  const recordSolve = useCallback((module: MathModuleId, challengeId: string) => {
    setProgress((p) => {
      const m = p.modules[module]
      const streak = m.streak + 1
      const firstSolve = !m.solved.includes(challengeId)
      const solved = firstSolve ? [...m.solved, challengeId] : m.solved
      const tier = MODULE_CHALLENGES[module].find((c) => c.id === challengeId)?.tier
      const next: ProgressState = {
        ...p,
        xp: firstSolve && tier ? p.xp + XP_BY_TIER[tier] : p.xp,
        modules: { ...p.modules, [module]: { ...m, solved, streak, bestStreak: Math.max(m.bestStreak, streak) } },
        updatedAt: Date.now(),
      }
      return awardBadges(next)
    })
  }, [])

  /** Skipping a challenge without solving it ends the streak. */
  const breakStreak = useCallback((module: MathModuleId) => {
    setProgress((p) =>
      p.modules[module].streak === 0
        ? p
        : { ...p, modules: { ...p.modules, [module]: { ...p.modules[module], streak: 0 } }, updatedAt: Date.now() },
    )
  }, [])

  const setTier = useCallback((module: MathModuleId, tier: Tier) => {
    setProgress((p) =>
      p.modules[module].tier === tier
        ? p
        : { ...p, modules: { ...p.modules, [module]: { ...p.modules[module], tier } }, updatedAt: Date.now() },
    )
  }, [])

  const setSoundOn = useCallback((soundOn: boolean) => {
    setProgress((p) => (p.soundOn === soundOn ? p : { ...p, soundOn, updatedAt: Date.now() }))
  }, [])

  const setLastView = useCallback((lastView: ProgressView) => {
    setProgress((p) => (p.lastView === lastView ? p : { ...p, lastView, updatedAt: Date.now() }))
  }, [])

  /** Clear stars, streaks, tiers and badges, keeping the learner's sound preference. */
  const resetProgress = useCallback(() => {
    clearProgress()
    knownBadges.current = new Set()
    setBadgeQueue([])
    setProgress((p) => ({ ...defaultProgress(), soundOn: p.soundOn, updatedAt: Date.now() }))
  }, [])

  return {
    progress,
    recordSolve,
    breakStreak,
    setTier,
    setSoundOn,
    setLastView,
    resetProgress,
    badgeQueue,
    dismissBadge,
  }
}
