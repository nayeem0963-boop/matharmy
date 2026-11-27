import type { Tier } from './challenges'

/** XP for the first solve of a challenge. Replays give nothing (stars work the same way). */
export const XP_BY_TIER: Record<Tier, number> = { easy: 10, medium: 20, hard: 30 }

/** Total XP needed to *reach* a level (level 1 starts at 0): 0, 50, 150, 300, 500, 750, ... */
export const xpToReach = (level: number) => 25 * (level - 1) * level

export const MAX_LEVEL = 50

export interface LevelProgress {
  level: number
  /** XP earned since the start of this level. */
  into: number
  /** XP between this level and the next (0 at the maximum level). */
  span: number
}

export function levelFromXp(xp: number): LevelProgress {
  const total = Math.max(0, Math.floor(Number.isFinite(xp) ? xp : 0))
  let level = 1
  while (level < MAX_LEVEL && total >= xpToReach(level + 1)) level++
  const start = xpToReach(level)
  return { level, into: total - start, span: level >= MAX_LEVEL ? 0 : xpToReach(level + 1) - start }
}
