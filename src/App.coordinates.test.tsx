/** Coordinate Plane through the real App (scenes mocked). */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PROGRESS_STORAGE_KEY, defaultProgress, type ProgressState } from './utils/progressStore'

vi.mock('./components/canvas/MathCanvas', () => ({
  default: ({ children, label }: { children?: unknown; label?: string }) => (
    <div data-testid="canvas" role="group" aria-label={label}>
      {children as never}
    </div>
  ),
}))
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'DataScene', 'AngleScene', 'PlaneScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const setCoord = (label: string, n: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(n) } })
const plot = (x: number, y: number) => {
  setCoord('x (across)', x)
  setCoord('y (up)', y)
}
const point = () => screen.findByLabelText('Point in numbers')
const corners = () => screen.findByLabelText('Triangle corners')
const card = () => document.querySelector('.challenge') as HTMLElement
const btn = (name: string | RegExp) => screen.getByRole('button', { name }) as HTMLButtonElement
const click = (name: string | RegExp) => userEvent.click(btn(name))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  window.location.hash = '#/coordinate-plane'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Coordinate Plane' })
  await point()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules['coordinate-plane'] = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Coordinate Plane: plot a point', () => {
  it('starts at (2, 3) in quadrant I, with distances from the axes', async () => {
    await open()
    const o = await point()
    expect(o.textContent).toContain('(2, 3)')
    expect(o.textContent).toContain('quadrant I')
    expect(o.textContent).toContain('2 right of the y-axis')
    expect(o.textContent).toContain('3 above the x-axis')
  })

  it('names the quadrant, axes and origin', async () => {
    await open()
    const loc = async () => (await point()).textContent
    plot(-4, 5)
    expect(await loc()).toContain('quadrant II')
    plot(-1, -1)
    expect(await loc()).toContain('quadrant III')
    plot(3, -2)
    expect(await loc()).toContain('quadrant IV')
    plot(5, 0)
    expect(await loc()).toContain('on the x-axis')
    plot(0, -3)
    expect(await loc()).toContain('on the y-axis')
    plot(0, 0)
    expect(await loc()).toContain('the origin')
  })

  it('stays inside -6 to 6', async () => {
    await open()
    setCoord('x (across)', 6)
    expect(btn('Increase x (across)').disabled).toBe(true)
    setCoord('y (up)', -6)
    expect(btn('Decrease y (up)').disabled).toBe(true)
  })

  it('describes the plane in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /coordinate plane seen from above.*A point at \(2, 3\), quadrant I/ })).toBeTruthy()
  })
})

describe('Coordinate Plane: move the triangle', () => {
  const toMove = async () => {
    await open()
    await click('Move a shape')
    await corners()
  }

  it('shows the corners and where they started', async () => {
    await toMove()
    const o = await corners()
    expect(o.textContent).toContain('(1, 1)')
    expect(o.textContent).toContain('(3, 1)')
    expect(o.textContent).toContain('(1, 3)')
    expect(o.textContent).toContain('None yet')
  })

  it('slides, flips and turns, and keeps a history', async () => {
    await toMove()
    await click('Slide right 1')
    await click('Slide up 1')
    let o = await corners()
    expect(o.textContent).toContain('(2, 2)') // A
    expect(o.textContent).toContain('Slide 1 right')
    await click('Start over')
    await click('Flip over the x-axis')
    o = await corners()
    expect(o.textContent).toContain('(1, -1)')
    expect(o.textContent).toContain('Flip over the x-axis')
    await click('Start over')
    await click('Turn 90° left')
    o = await corners()
    expect(o.textContent).toContain('(-1, 1)')
    expect(o.textContent).toContain('(-1, 3)')
    expect(o.textContent).toContain('(-3, 1)')
  })

  it('disables a move that would leave the plane, with a reason', async () => {
    await toMove()
    for (let i = 0; i < 3; i++) await click('Slide right 1') // B reaches x = 6
    expect(btn('Slide right 1').disabled).toBe(true)
    expect(btn('Slide right 1').title).toBe('It would leave the plane')
    await click('Slide left 1')
    expect(btn('Slide right 1').disabled).toBe(false)
  })

  it('start over puts the triangle back', async () => {
    await toMove()
    await click('Turn 180°')
    await click('Start over')
    const o = await corners()
    expect(o.textContent).toContain('None yet')
    expect(o.querySelector('dd')?.textContent).toContain('(1, 1)')
  })
})

describe('Coordinate Plane: challenges', () => {
  it('plot challenges: "(3, 2)" is not "(2, 3)"', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Plot the point (3, 2)')
    plot(2, 3)
    expect(card().classList.contains('challenge--solved')).toBe(false) // x and y swapped
    plot(3, 2)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['coordinate-plane'].solved).toEqual(['cp-point-3-2'])
    expect(saved().xp).toBe(10)
  })

  it('a quadrant challenge accepts any point in it, but not one on an axis', async () => {
    seed(['cp-point-3-2'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('quadrant II')
    plot(0, 4)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    plot(-2, 4)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a triangle challenge switches to move mode and starts from the original triangle', async () => {
    seed(['cp-quad-3', 'cp-reflect-y', 'cp-sum-zero'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('corner A is at (4, 3)')
    expect(screen.getByRole('group', { name: 'Slide the triangle' })).toBeTruthy() // move controls, not the point steppers
    expect(screen.queryByLabelText('x (across)')).toBeNull()
    for (let i = 0; i < 3; i++) await click('Slide right 1')
    expect(card().classList.contains('challenge--solved')).toBe(false)
    for (let i = 0; i < 2; i++) await click('Slide up 1')
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(20)
  })

  it('a hard challenge needs every corner: flip over the x-axis', async () => {
    seed([], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Flip the triangle over the x-axis')
    await click('Flip over the y-axis') // wrong flip
    expect(card().classList.contains('challenge--solved')).toBe(false)
    await click('Start over')
    await click('Flip over the x-axis')
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(30)
  })

  it('a challenge the starting point already satisfies still needs a real solve', async () => {
    seed(['cp-point-3-2', 'cp-quad-2', 'cp-axis-x', 'cp-point-neg'], 'medium')
    await open()
    await challengeOn()
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Coordinate Plane: welcome page and Captain', () => {
  it('is the last teaser to become real: the Coming soon list is gone', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('heading', { name: 'Coming soon' })).toBeNull()
    expect(document.querySelector('.upcoming')).toBeNull()
    const cards = [...document.querySelectorAll('.module-card')]
    expect(cards.some((c) => c.textContent?.includes('Plot, slide, flip and turn'))).toBe(true)
  })
  it('the Captain gives a coordinates tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/x first|flip changes a sign/i)
  })
})
