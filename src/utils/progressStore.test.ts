import { afterEach, describe, expect, it, vi } from 'vitest'
import { fractionChallenges } from '../data/challenges'
import {
  PROGRESS_STORAGE_KEY,
  PROGRESS_VERSION,
  awardBadges,
  clearProgress,
  defaultProgress,
  loadProgress,
  migrateProgress,
  saveProgress,
} from './progressStore'

afterEach(() => vi.restoreAllMocks())

describe('defaultProgress', () => {
  it('is an empty, current-version state', () => {
    const p = defaultProgress()
    expect(p.version).toBe(PROGRESS_VERSION)
    expect(PROGRESS_VERSION).toBe(3)
    expect(p.badges).toEqual({})
    expect(p.xp).toBe(0)
    expect(p.missions).toEqual({})
    expect(p.lessons).toEqual({})
    expect(p.soundOn).toBe(true)
    expect(p.lastView).toBe('welcome')
    for (const m of Object.values(p.modules)) expect(m).toEqual({ solved: [], tier: 'easy', streak: 0, bestStreak: 0 })
    expect(Object.keys(p.modules)).toEqual(['fractions', 'geometry', 'number-sense', 'add-subtract', 'multiplication', 'division', 'patterns', 'area-perimeter', 'decimals', 'data-graphs', 'angles', 'coordinate-plane', 'integers', 'probability'])
  })
  it('returns a fresh object every call', () => {
    expect(defaultProgress()).not.toBe(defaultProgress())
    expect(defaultProgress().modules.fractions).not.toBe(defaultProgress().modules.fractions)
  })
  it('uses the original storage key', () => {
    expect(PROGRESS_STORAGE_KEY).toBe('matharmy:progress')
  })
})

describe('migrateProgress', () => {
  it.each([null, undefined, 42, 'text', [], true])('falls back to defaults for %j', (junk) => {
    expect(migrateProgress(junk)).toEqual(defaultProgress())
  })

  it('upgrades a v1 save (no tier, streak or badges) and silently grants deserved badges', () => {
    const v1 = {
      version: 1,
      modules: {
        fractions: { solved: ['f-1-2', 'f-1-4', 'f-3-4', 'f-2-3'] },
        geometry: { solved: ['g-cube-27'] },
      },
      soundOn: false,
      lastView: 'geometry',
      updatedAt: 1234,
    }
    const p = migrateProgress(v1)
    expect(p.version).toBe(3)
    expect(p.xp).toBe(50) // 4 easy fractions + 1 easy geometry challenge, 10 XP each
    expect(p.modules.fractions).toEqual({
      solved: ['f-1-2', 'f-1-4', 'f-3-4', 'f-2-3'], tier: 'easy', streak: 0, bestStreak: 0,
    })
    expect(p.modules['number-sense'].solved).toEqual([])
    expect(p.soundOn).toBe(false)
    expect(p.lastView).toBe('geometry')
    expect(Object.keys(p.badges).sort()).toEqual(['first-steps', 'fraction-finder'])
    // badges are stamped with the save's own time, not "now"
    expect(p.badges['first-steps']).toBe(1234)
  })

  it('upgrades a valid v2 save to v3 without losing anything', () => {
    const v2 = {
      version: 2,
      modules: {
        fractions: { solved: ['f-1-2'], tier: 'hard', streak: 2, bestStreak: 2 },
        geometry: { solved: [], tier: 'medium', streak: 0, bestStreak: 0 },
        'number-sense': { solved: ['n-58'], tier: 'easy', streak: 1, bestStreak: 1 },
      },
      badges: { 'first-steps': 111 },
      soundOn: true,
      lastView: 'number-sense',
      updatedAt: 222,
    }
    // modules added later (Add & Subtract, Multiplication Arrays, Division, Patterns, Area, Decimals, Graphs, Angles, Coordinates, Integers, Probability) start empty
    expect(migrateProgress(v2)).toEqual({
      ...v2,
      version: 3,
      xp: 20,
      missions: {},
      lessons: {},
      modules: {
        ...v2.modules,
        'add-subtract': { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        multiplication: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        division: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        patterns: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        'area-perimeter': { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        decimals: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        'data-graphs': { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        angles: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        'coordinate-plane': { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        integers: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
        probability: { solved: [], tier: 'easy', streak: 0, bestStreak: 0 },
      },
    })
  })

  it('keeps a valid v3 save as-is, including its own xp', () => {
    const v3 = {
      ...defaultProgress(),
      modules: { ...defaultProgress().modules, fractions: { solved: ['f-1-2'], tier: 'easy', streak: 1, bestStreak: 1 } },
      badges: { 'first-steps': 5 },
      xp: 999, // not recomputed when present
      missions: { 'm-1': { steps: ['a', 'b'], completedAt: 9 }, 'm-2': { steps: [] } },
      lessons: { 'l-1': { completedAt: 7 } },
      updatedAt: 6,
    }
    expect(migrateProgress(v3)).toEqual(v3)
  })

  it('sanitises xp, missions and lessons', () => {
    const p = migrateProgress({
      xp: -5,
      missions: { ok: { steps: ['a', 'a', '', 3], completedAt: 'x' }, bad: 'nope', '': { steps: [] } },
      lessons: { ok: { completedAt: 3 }, bad: { completedAt: 'x' }, worse: 4 },
    })
    expect(p.xp).toBe(0)
    expect(p.missions).toEqual({ ok: { steps: ['a'] } })
    expect(p.lessons).toEqual({ ok: { completedAt: 3 } })
    expect(migrateProgress({ xp: 1e12 }).xp).toBe(1_000_000)
    expect(migrateProgress({ xp: 12.9 }).xp).toBe(12)
    expect(migrateProgress({ xp: 'lots' }).xp).toBe(0) // not a number: worked out from solves (none)
  })

  it('works out xp from every tier when it is missing', () => {
    const p = migrateProgress({
      modules: {
        fractions: { solved: ['f-1-2', 'f-2-5', 'f-5-4'] }, // easy + medium + hard
        geometry: { solved: ['g-sphere'] },
        'number-sense': { solved: ['no-such-id'] },
      },
    })
    expect(p.xp).toBe(10 + 20 + 30 + 10)
  })

  it('sanitises each field independently', () => {
    const p = migrateProgress({
      modules: {
        fractions: {
          solved: ['f-1-2', 'f-1-2', '', 5, null, 'x'.repeat(64), 'f-1-4'],
          tier: 'impossible',
          streak: -3,
          bestStreak: 'lots',
        },
        geometry: 'nonsense',
        bogus: { solved: ['a'] },
      },
      badges: { 'first-steps': 'yesterday', 'no-such-badge': 5, 'hot-streak': 9 },
      soundOn: 'yes',
      lastView: 'cooking',
      updatedAt: Infinity,
    })
    expect(p.modules.fractions.solved).toEqual(['f-1-2', 'f-1-4']) // deduped, bad entries dropped
    expect(p.modules.fractions.tier).toBe('easy')
    expect(p.modules.fractions.streak).toBe(0)
    expect(p.modules.fractions.bestStreak).toBe(0)
    expect(p.modules.geometry).toEqual({ solved: [], tier: 'easy', streak: 0, bestStreak: 0 })
    expect(p.badges['hot-streak']).toBe(9)
    expect(p.badges['no-such-badge']).toBeUndefined()
    expect(p.badges['first-steps']).not.toBe('yesterday')
    expect(p.soundOn).toBe(true)
    expect(p.lastView).toBe('welcome')
    expect(p.updatedAt).toBe(0)
  })

  it('caps counts, floors decimals and keeps bestStreak >= streak', () => {
    const p = migrateProgress({ modules: { fractions: { streak: 12.9, bestStreak: 3 } } })
    expect(p.modules.fractions.streak).toBe(12)
    expect(p.modules.fractions.bestStreak).toBe(12)
    expect(migrateProgress({ modules: { fractions: { streak: 1e9 } } }).modules.fractions.streak).toBe(9999)
  })

  it('limits solved ids to 200 per module', () => {
    const many = Array.from({ length: 300 }, (_, i) => `id-${i}`)
    expect(migrateProgress({ modules: { fractions: { solved: many } } }).modules.fractions.solved).toHaveLength(200)
  })

  it('does not share state between calls', () => {
    const a = migrateProgress(null)
    a.modules.fractions.solved.push('x')
    expect(migrateProgress(null).modules.fractions.solved).toEqual([])
  })
})

describe('awardBadges', () => {
  it('returns the same object when nothing is newly earned', () => {
    const s = defaultProgress()
    expect(awardBadges(s)).toBe(s)
  })

  it('adds newly earned badges with the given timestamp and does not re-stamp old ones', () => {
    const s = defaultProgress()
    s.modules.fractions.solved = ['f-1-2']
    const a = awardBadges(s, 100)
    expect(a).not.toBe(s)
    expect(a.badges).toEqual({ 'first-steps': 100 })
    expect(s.badges).toEqual({}) // input untouched
    expect(awardBadges(a, 999)).toBe(a)
  })

  it('uses the best streak across modules', () => {
    const s = defaultProgress()
    s.modules.geometry.bestStreak = 3
    expect(awardBadges(s, 5).badges['hot-streak']).toBe(5)
  })

  it('never removes a badge once earned', () => {
    const s = defaultProgress()
    s.badges = { 'hot-streak': 1 }
    expect(awardBadges(s, 2).badges['hot-streak']).toBe(1)
  })

  it('grants Fraction Master when all fractions are solved', () => {
    const s = defaultProgress()
    s.modules.fractions.solved = fractionChallenges.map((c) => c.id)
    expect(Object.keys(awardBadges(s).badges)).toEqual(
      expect.arrayContaining(['first-steps', 'fraction-finder', 'fraction-master']),
    )
  })
})

describe('load / save / clear', () => {
  it('returns defaults when nothing is saved', () => {
    expect(loadProgress()).toEqual(defaultProgress())
  })

  it('round-trips through localStorage', () => {
    const s = defaultProgress()
    s.modules.geometry.solved = ['g-sphere']
    s.xp = 10
    s.modules.geometry.tier = 'hard'
    s.lastView = 'geometry'
    s.updatedAt = 50
    saveProgress(s)
    expect(JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)).toMatchObject({ version: 3, xp: 10 })
    const loaded = loadProgress()
    expect(loaded.modules.geometry).toMatchObject({ solved: ['g-sphere'], tier: 'hard' })
    expect(loaded.lastView).toBe('geometry')
    expect(loaded.badges).toHaveProperty('first-steps')
  })

  it('survives corrupted JSON', () => {
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, '{not json')
    expect(loadProgress()).toEqual(defaultProgress())
  })

  it('loads a real v1 payload from storage', () => {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 1, modules: { 'number-sense': { solved: ['n-58'] } }, soundOn: true, lastView: 'welcome' }),
    )
    const p = loadProgress()
    expect(p.modules['number-sense'].solved).toEqual(['n-58'])
    expect(p.badges).toHaveProperty('first-steps')
  })

  it('clearProgress removes the saved record', () => {
    saveProgress(defaultProgress())
    clearProgress()
    expect(window.localStorage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
  })

  it('does not throw when storage is blocked or full', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('quota')
    })
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(loadProgress()).toEqual(defaultProgress())
    expect(() => saveProgress(defaultProgress())).not.toThrow()
    expect(() => clearProgress()).not.toThrow()
  })
})
