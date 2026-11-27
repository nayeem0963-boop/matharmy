import { BADGE_IDS, evaluateBadges } from '../data/badges'
import { TIERS, type Tier } from '../data/challenges'
import type { MathModuleId } from '../data/mathModules'

/**
 * Learner progress saved in localStorage.
 *
 * The payload is versioned so new fields can be added and old saves migrated.
 * Loading never throws: missing, corrupted or partially-valid data is sanitised
 * field by field, and storage that is unavailable (private mode, blocked
 * cookies, quota) falls back to in-memory progress.
 *
 * History:
 *   v1: solved challenge IDs per module, sound preference, last view.
 *   v2: + selected difficulty tier, current/best streak per module, earned badges.
 */
export const PROGRESS_STORAGE_KEY = 'matharmy:progress'
export const PROGRESS_VERSION = 2

export type ProgressView = 'welcome' | MathModuleId

export interface ModuleProgress {
  /** IDs of challenges solved at least once (stars = unique solves). */
  solved: string[]
  /** Difficulty tier the learner last picked for this module's quiz. */
  tier: Tier
  /** Solves in a row without skipping (resets on skip). */
  streak: number
  bestStreak: number
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION
  modules: Record<MathModuleId, ModuleProgress>
  /** Earned badge ID → time it was earned (ms since epoch). */
  badges: Record<string, number>
  soundOn: boolean
  lastView: ProgressView
  updatedAt: number
}

const MODULE_IDS: MathModuleId[] = ['fractions', 'geometry', 'number-sense']
const VIEWS: ProgressView[] = ['welcome', ...MODULE_IDS]

const defaultModule = (): ModuleProgress => ({ solved: [], tier: 'easy', streak: 0, bestStreak: 0 })

export function defaultProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    modules: { fractions: defaultModule(), geometry: defaultModule(), 'number-sense': defaultModule() },
    badges: {},
    soundOn: true,
    lastView: 'welcome',
    updatedAt: 0,
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const count = (v: unknown, max = 9999) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0

/**
 * Turn any parsed value (v1 save, hand-edited, corrupted) into a valid current
 * state. v1 has no tier/streak/badge fields, so those take their defaults; badges
 * already deserved by the saved solves are granted (silently) right after.
 */
export function migrateProgress(raw: unknown): ProgressState {
  const state = defaultProgress()
  if (!isRecord(raw)) return state
  if (isRecord(raw.modules)) {
    for (const id of MODULE_IDS) {
      const m = raw.modules[id]
      if (!isRecord(m)) continue
      const target = state.modules[id]
      if (Array.isArray(m.solved)) {
        const ids = m.solved.filter((s): s is string => typeof s === 'string' && s.length > 0 && s.length < 64)
        target.solved = [...new Set(ids)].slice(0, 200)
      }
      if (typeof m.tier === 'string' && (TIERS as string[]).includes(m.tier)) target.tier = m.tier as Tier
      target.streak = count(m.streak)
      target.bestStreak = Math.max(count(m.bestStreak), target.streak)
    }
  }
  if (isRecord(raw.badges)) {
    for (const [id, at] of Object.entries(raw.badges)) {
      if (BADGE_IDS.includes(id) && typeof at === 'number' && Number.isFinite(at)) state.badges[id] = at
    }
  }
  if (typeof raw.soundOn === 'boolean') state.soundOn = raw.soundOn
  if (typeof raw.lastView === 'string' && (VIEWS as string[]).includes(raw.lastView)) {
    state.lastView = raw.lastView as ProgressView
  }
  if (typeof raw.updatedAt === 'number' && Number.isFinite(raw.updatedAt)) state.updatedAt = raw.updatedAt
  return awardBadges(state, state.updatedAt)
}

/** Add any newly deserved badges (stamped with `now`); returns the same object when nothing changed. */
export function awardBadges(state: ProgressState, now = Date.now()): ProgressState {
  const ctx = {
    solved: {
      fractions: state.modules.fractions.solved,
      geometry: state.modules.geometry.solved,
      'number-sense': state.modules['number-sense'].solved,
    },
    bestStreak: Math.max(...MODULE_IDS.map((m) => state.modules[m].bestStreak)),
  }
  const fresh = evaluateBadges(ctx).filter((id) => !(id in state.badges))
  if (fresh.length === 0) return state
  const badges = { ...state.badges }
  for (const id of fresh) badges[id] = now
  return { ...state, badges }
}

function storage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null // access itself can throw when storage is blocked
  }
}

export function loadProgress(): ProgressState {
  try {
    const text = storage()?.getItem(PROGRESS_STORAGE_KEY)
    return text ? migrateProgress(JSON.parse(text)) : defaultProgress()
  } catch {
    return defaultProgress()
  }
}

export function saveProgress(state: ProgressState): void {
  try {
    storage()?.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(state))
  } catch {
    // Quota exceeded / storage blocked: keep playing with in-memory progress.
  }
}

export function clearProgress(): void {
  try {
    storage()?.removeItem(PROGRESS_STORAGE_KEY)
  } catch {
    // ignore
  }
}
