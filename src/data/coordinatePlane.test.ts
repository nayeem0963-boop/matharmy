import { describe, expect, it } from 'vitest'
import {
  BASE_TRIANGLE,
  DEFAULT_POINT,
  PLANE_MAX,
  PLANE_MIN,
  clampCoord,
  freshTriangle,
  inPlane,
  isPlaneSolved,
  locationText,
  modeOfChallenge,
  moveText,
  moveTriangle,
  pairText,
  planeChallenges,
  quadrantOf,
  runMoves,
  same,
  type Move,
  type Vec,
} from './coordinatePlane'
import { TIERS, challengesForTier } from './challenges'

const v = (x: number, y: number): Vec => ({ x, y })

describe('points and quadrants', () => {
  it('quadrants', () => {
    expect([quadrantOf(v(1, 1)), quadrantOf(v(-1, 1)), quadrantOf(v(-1, -1)), quadrantOf(v(1, -1))]).toEqual(['I', 'II', 'III', 'IV'])
    expect(quadrantOf(v(0, 3))).toBeNull()
    expect(quadrantOf(v(0, 0))).toBeNull()
  })
  it('names where a point is', () => {
    expect(locationText(v(2, 3))).toBe('quadrant I')
    expect(locationText(v(4, 0))).toBe('on the x-axis')
    expect(locationText(v(0, -2))).toBe('on the y-axis')
    expect(locationText(v(0, 0))).toBe('the origin')
  })
  it('formats and compares', () => {
    expect(pairText(v(-3, 2))).toBe('(-3, 2)')
    expect(same(v(1, 2), v(1, 2))).toBe(true)
    expect(same(v(1, 2), v(2, 1))).toBe(false)
  })
  it('the plane is -6 to 6', () => {
    expect([PLANE_MIN, PLANE_MAX]).toEqual([-6, 6])
    expect(inPlane(v(6, -6))).toBe(true)
    expect(inPlane(v(7, 0))).toBe(false)
    expect([clampCoord(-9), clampCoord(2.6), clampCoord(40)]).toEqual([-6, 3, 6])
  })
})

describe('moving the triangle', () => {
  const tri = BASE_TRIANGLE
  it('slides', () => {
    expect(moveTriangle(tri, { type: 'slide', dx: 2, dy: -1 })).toEqual([v(3, 0), v(5, 0), v(3, 2)])
  })
  it('flips', () => {
    expect(moveTriangle(tri, { type: 'flip-x' })).toEqual([v(1, -1), v(3, -1), v(1, -3)])
    expect(moveTriangle(tri, { type: 'flip-y' })).toEqual([v(-1, 1), v(-3, 1), v(-1, 3)])
  })
  it('turns about the origin', () => {
    expect(moveTriangle(tri, { type: 'turn', quarter: 1 })).toEqual([v(-1, 1), v(-1, 3), v(-3, 1)])
    expect(moveTriangle(tri, { type: 'turn', quarter: -1 })).toEqual([v(1, -1), v(1, -3), v(3, -1)])
    expect(moveTriangle(tri, { type: 'turn', quarter: 2 })).toEqual([v(-1, -1), v(-3, -1), v(-1, -3)])
  })
  it('four quarter turns bring it home; a flip twice does too', () => {
    const turn: Move = { type: 'turn', quarter: 1 }
    expect(runMoves([turn, turn, turn, turn])).toEqual(BASE_TRIANGLE)
    expect(runMoves([{ type: 'flip-x' }, { type: 'flip-x' }])).toEqual(BASE_TRIANGLE)
    expect(runMoves([{ type: 'turn', quarter: 1 }, { type: 'turn', quarter: -1 }])).toEqual(BASE_TRIANGLE)
  })
  it('turns and flips keep the shape the same size (distances are preserved)', () => {
    const d = (a: Vec, b: Vec) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2
    for (const m of [{ type: 'flip-x' }, { type: 'flip-y' }, { type: 'turn', quarter: 1 }, { type: 'turn', quarter: 2 }] as Move[]) {
      const out = moveTriangle(tri, m)!
      expect([d(out[0], out[1]), d(out[1], out[2]), d(out[0], out[2])]).toEqual([d(tri[0], tri[1]), d(tri[1], tri[2]), d(tri[0], tri[2])])
    }
  })
  it('refuses a move that would leave the plane', () => {
    expect(moveTriangle(tri, { type: 'slide', dx: 4, dy: 0 })).toBeNull() // B would be at x = 7
    expect(runMoves([{ type: 'slide', dx: 3, dy: 0 }, { type: 'slide', dx: 1, dy: 0 }])).toBeNull()
  })
  it('does not change the starting triangle', () => {
    const before = JSON.stringify(BASE_TRIANGLE)
    moveTriangle(BASE_TRIANGLE, { type: 'flip-x' })
    expect(JSON.stringify(BASE_TRIANGLE)).toBe(before)
    const f = freshTriangle()
    f.tri[0].x = 99
    expect(BASE_TRIANGLE[0].x).toBe(1)
  })
  it('describes moves in words', () => {
    expect(moveText({ type: 'slide', dx: 2, dy: 0 })).toBe('Slide 2 right')
    expect(moveText({ type: 'slide', dx: -1, dy: 3 })).toBe('Slide 1 left and 3 up')
    expect(moveText({ type: 'slide', dx: 0, dy: -2 })).toBe('Slide 2 down')
    expect(moveText({ type: 'turn', quarter: 1 })).toBe('Turn 90° left')
    expect(moveText({ type: 'turn', quarter: -1 })).toBe('Turn 90° right')
    expect(moveText({ type: 'turn', quarter: 2 })).toBe('Turn 180°')
    expect(moveText({ type: 'flip-y' })).toBe('Flip over the y-axis')
  })
})

describe('challenges', () => {
  it('keeps the saved-progress id list unchanged', () => {
    expect(planeChallenges.map((c) => c.id)).toEqual([
      'cp-point-3-2', 'cp-quad-2', 'cp-axis-x', 'cp-point-neg',
      'cp-quad-3', 'cp-reflect-y', 'cp-sum-zero', 'cp-slide-a',
      'cp-flip-x', 'cp-turn-90', 'cp-flip-slide', 'cp-corner-a-neg',
    ])
  })
  it('has 4 per tier and unique ids', () => {
    for (const t of TIERS) expect(challengesForTier(planeChallenges, t)).toHaveLength(4)
    expect(new Set(planeChallenges.map((c) => c.id)).size).toBe(planeChallenges.length)
  })
  it('point challenges use plot mode; triangle challenges use move mode', () => {
    const modes = Object.fromEntries(planeChallenges.map((c) => [c.id, modeOfChallenge(c)]))
    expect(modes['cp-point-3-2']).toBe('plot')
    expect(modes['cp-slide-a']).toBe('move')
    expect(modes['cp-flip-x']).toBe('move')
  })

  const view = (point: Vec, tri: Vec[] = BASE_TRIANGLE) => ({ point, triangleFor: () => tri })
  it('every point challenge can be solved by some point on the plane', () => {
    for (const c of planeChallenges.filter((x) => modeOfChallenge(x) === 'plot')) {
      let found = false
      for (let x = PLANE_MIN; x <= PLANE_MAX && !found; x++)
        for (let y = PLANE_MIN; y <= PLANE_MAX && !found; y++) if (isPlaneSolved(c, view(v(x, y)))) found = true
      expect(found, c.id).toBe(true)
    }
  })
  it('every triangle challenge can be solved by a sequence of moves, and the stated moves work', () => {
    const solutions: Record<string, Move[]> = {
      'cp-slide-a': [{ type: 'slide', dx: 3, dy: 2 }],
      'cp-flip-x': [{ type: 'flip-x' }],
      'cp-turn-90': [{ type: 'turn', quarter: 1 }],
      'cp-flip-slide': [{ type: 'flip-y' }, { type: 'slide', dx: 2, dy: 0 }],
      'cp-corner-a-neg': [{ type: 'slide', dx: -3, dy: -4 }],
    }
    const moveChallenges = planeChallenges.filter((x) => modeOfChallenge(x) === 'move')
    expect(Object.keys(solutions).sort()).toEqual(moveChallenges.map((c) => c.id).sort())
    for (const c of moveChallenges) {
      const tri = runMoves(solutions[c.id])
      expect(tri, c.id).not.toBeNull()
      expect(isPlaneSolved(c, view(DEFAULT_POINT, tri!)), c.id).toBe(true)
    }
  })
  it('point rules', () => {
    const by = Object.fromEntries(planeChallenges.map((c) => [c.id, c]))
    expect(isPlaneSolved(by['cp-point-3-2'], view(v(3, 2)))).toBe(true)
    expect(isPlaneSolved(by['cp-point-3-2'], view(v(2, 3)))).toBe(false) // x and y not swapped
    expect(isPlaneSolved(by['cp-quad-2'], view(v(-4, 5)))).toBe(true)
    expect(isPlaneSolved(by['cp-quad-2'], view(v(0, 5)))).toBe(false) // on an axis
    expect(isPlaneSolved(by['cp-axis-x'], view(v(-3, 0)))).toBe(true)
    expect(isPlaneSolved(by['cp-axis-x'], view(v(0, 0)))).toBe(false) // the origin does not count
    expect(isPlaneSolved(by['cp-sum-zero'], view(v(2, -2)))).toBe(true)
    expect(isPlaneSolved(by['cp-sum-zero'], view(v(0, 0)))).toBe(false)
    expect(isPlaneSolved(by['cp-sum-zero'], view(v(2, 2)))).toBe(false)
  })
  it('triangle rules need every corner, not just one', () => {
    const by = Object.fromEntries(planeChallenges.map((c) => [c.id, c]))
    expect(isPlaneSolved(by['cp-flip-x'], view(DEFAULT_POINT, moveTriangle(BASE_TRIANGLE, { type: 'flip-y' })!))).toBe(false)
    const slid = runMoves([{ type: 'slide', dx: 2, dy: 0 }])!
    expect(isPlaneSolved(by['cp-corner-a-neg'], view(DEFAULT_POINT, slid))).toBe(false)
  })
  it('the starting point and triangle do not already solve the first challenge of any tier', () => {
    for (const t of TIERS) {
      const first = challengesForTier(planeChallenges, t)[0]
      expect(isPlaneSolved(first, view(DEFAULT_POINT, BASE_TRIANGLE)), first.id).toBe(false)
    }
  })
})
