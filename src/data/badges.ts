import { fractionChallenges, geometryChallenges, type Tier } from './challenges'
import type { MathModuleId } from './mathModules'
import { numberSenseChallenges } from './placeValue'

/** Every challenge list, keyed by module (used for tier lookups and "solve all" badges). */
export const MODULE_CHALLENGES: Record<MathModuleId, { id: string; tier: Tier }[]> = {
  fractions: fractionChallenges,
  geometry: geometryChallenges,
  'number-sense': numberSenseChallenges,
}

/** What badge rules can look at (derived from saved progress). */
export interface BadgeContext {
  solved: Record<MathModuleId, string[]>
  /** Best streak reached in any module. */
  bestStreak: number
}

export interface BadgeDef {
  id: string
  icon: string
  title: string
  description: string
  earned: (ctx: BadgeContext) => boolean
}

const MODULES = Object.keys(MODULE_CHALLENGES) as MathModuleId[]

const solvedIn = (ctx: BadgeContext, module: MathModuleId, tier?: Tier) =>
  MODULE_CHALLENGES[module].filter((c) => (!tier || c.tier === tier) && ctx.solved[module].includes(c.id)).length

const allIn = (ctx: BadgeContext, module: MathModuleId, tier?: Tier) =>
  solvedIn(ctx, module, tier) === MODULE_CHALLENGES[module].filter((c) => !tier || c.tier === tier).length

const totalSolved = (ctx: BadgeContext, tier?: Tier) => MODULES.reduce((n, m) => n + solvedIn(ctx, m, tier), 0)

// IDs are stable: earned badges are stored in saved progress.
export const BADGES: BadgeDef[] = [
  {
    id: 'first-steps',
    icon: '🎯',
    title: 'First Steps',
    description: 'Solve your first challenge.',
    earned: (c) => totalSolved(c) >= 1,
  },
  {
    id: 'fraction-finder',
    icon: '🍕',
    title: 'Fraction Finder',
    description: 'Solve every Easy fraction challenge.',
    earned: (c) => allIn(c, 'fractions', 'easy'),
  },
  {
    id: 'fraction-master',
    icon: '🥧',
    title: 'Fraction Master',
    description: 'Solve all fraction challenges.',
    earned: (c) => allIn(c, 'fractions'),
  },
  {
    id: 'shape-shifter',
    icon: '🔷',
    title: 'Shape Shifter',
    description: 'Solve 3 geometry challenges.',
    earned: (c) => solvedIn(c, 'geometry') >= 3,
  },
  {
    id: 'geometry-master',
    icon: '📐',
    title: 'Geometry Master',
    description: 'Solve all geometry challenges.',
    earned: (c) => allIn(c, 'geometry'),
  },
  {
    id: 'place-value-pro',
    icon: '🧮',
    title: 'Place Value Pro',
    description: 'Solve all Number Sense challenges.',
    earned: (c) => allIn(c, 'number-sense'),
  },
  {
    id: 'hot-streak',
    icon: '🔥',
    title: 'Hot Streak',
    description: 'Solve 3 challenges in a row without skipping.',
    earned: (c) => c.bestStreak >= 3,
  },
  {
    id: 'unstoppable',
    icon: '⚡',
    title: 'Unstoppable',
    description: 'Solve 5 challenges in a row without skipping.',
    earned: (c) => c.bestStreak >= 5,
  },
  {
    id: 'hard-mode-hero',
    icon: '🏅',
    title: 'Hard Mode Hero',
    description: 'Solve 3 Hard challenges.',
    earned: (c) => totalSolved(c, 'hard') >= 3,
  },
  {
    id: 'matharmy-general',
    icon: '⭐',
    title: 'MathArmy General',
    description: 'Solve every challenge in every module.',
    earned: (c) => MODULES.every((m) => allIn(c, m)),
  },
]

export const BADGE_IDS = BADGES.map((b) => b.id)
export const getBadge = (id: string) => BADGES.find((b) => b.id === id)

/** IDs of all badges whose rule is currently met. */
export const evaluateBadges = (ctx: BadgeContext) => BADGES.filter((b) => b.earned(ctx)).map((b) => b.id)
