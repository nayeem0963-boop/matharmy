import { BADGE_IDS, MODULE_CHALLENGES, evaluateBadges } from '../data/badges'
import { TIERS, type Tier } from '../data/challenges'
import { mathModules, type MathModuleId } from '../data/mathModules'
import { XP_BY_TIER } from '../data/xp'

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
 *   v3: + xp, and empty containers for missions and lessons (no UI uses them yet).
 *       v1 and v2 saves upgrade in place: nothing is lost, and xp is worked out
 *       from the challenges already solved.
 */
export const PROGRESS_STORAGE_KEY = 'matharmy:progress'
export const PROGRESS_VERSION = 3

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

/** Progress through a mission (an ordered set of steps). Reserved for the mission system. */
export interface MissionProgress {
  /** IDs of steps finished so far. */
  steps: string[]
  /** Time the whole mission was completed (ms since epoch), once it is. */
  completedAt?: number
}

/** A finished lesson. Reserved for the lesson system. */
export interface LessonProgress {
  completedAt: number
}

export interface ProgressState {
  version: typeof PROGRESS_VERSION
  modules: Record<MathModuleId, ModuleProgress>
  /** Earned badge ID → time it was earned (ms since epoch). */
  badges: Record<string, number>
  /** Total experience points. The level is derived from this (`levelFromXp`). */
  xp: number
  /** Mission ID → progress. Empty until missions exist. */
  missions: Record<string, MissionProgress>
  /** Lesson ID → completion. Empty until lessons exist. */
  lessons: Record<string, LessonProgress>
  soundOn: boolean
  lastView: ProgressView
  updatedAt: number
}

const MODULE_IDS: MathModuleId[] = mathModules.map((m) => m.id)
const VIEWS: ProgressView[] = ['welcome', ...MODULE_IDS]

const defaultModule = (): ModuleProgress => ({ solved: [], tier: 'easy', streak: 0, bestStreak: 0 })

export function defaultProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    modules: Object.fromEntries(MODULE_IDS.map((id) => [id, defaultModule()])) as Record<MathModuleId, ModuleProgress>,
    badges: {},
    xp: 0,
    missions: {},
    lessons: {},
    soundOn: true,
    lastView: 'welcome',
    updatedAt: 0,
  }
}

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
const count = (v: unknown, max = 9999) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(0, Math.floor(v))) : 0

const MAX_XP = 1_000_000
const MAX_RECORDS = 200
const validId = (s: unknown): s is string => typeof s === 'string' && s.length > 0 && s.length < 64

/** XP the challenges in `modules` are worth (first solves only). */
export function xpFromSolved(modules: Record<MathModuleId, ModuleProgress>): number {
  let xp = 0
  for (const id of MODULE_IDS) {
    for (const c of MODULE_CHALLENGES[id]) if (modules[id].solved.includes(c.id)) xp += XP_BY_TIER[c.tier]
  }
  return xp
}

function sanitizeMissions(raw: unknown): Record<string, MissionProgress> {
  const out: Record<string, MissionProgress> = {}
  if (!isRecord(raw)) return out
  for (const [id, m] of Object.entries(raw).slice(0, MAX_RECORDS)) {
    if (!validId(id) || !isRecord(m)) continue
    const steps = Array.isArray(m.steps) ? [...new Set(m.steps.filter(validId))].slice(0, MAX_RECORDS) : []
    out[id] = typeof m.completedAt === 'number' && Number.isFinite(m.completedAt) ? { steps, completedAt: m.completedAt } : { steps }
  }
  return out
}

function sanitizeLessons(raw: unknown): Record<string, LessonProgress> {
  const out: Record<string, LessonProgress> = {}
  if (!isRecord(raw)) return out
  for (const [id, l] of Object.entries(raw).slice(0, MAX_RECORDS)) {
    if (validId(id) && isRecord(l) && typeof l.completedAt === 'number' && Number.isFinite(l.completedAt)) {
      out[id] = { completedAt: l.completedAt }
    }
  }
  return out
}

/**
 * Turn any parsed value (v1 save, hand-edited, corrupted) into a valid current
 * state. Older saves lack newer fields, so those take their defaults (xp is worked
 * out from the saved solves); badges already deserved are granted (silently) right
 * after.
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
  state.xp =
    typeof raw.xp === 'number' && Number.isFinite(raw.xp)
      ? Math.min(MAX_XP, Math.max(0, Math.floor(raw.xp)))
      : xpFromSolved(state.modules)
  state.missions = sanitizeMissions(raw.missions)
  state.lessons = sanitizeLessons(raw.lessons)
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
    solved: Object.fromEntries(MODULE_IDS.map((id) => [id, state.modules[id].solved])) as Record<MathModuleId, string[]>,
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
