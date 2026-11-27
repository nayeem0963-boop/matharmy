/** Area and Perimeter through the real App (scenes mocked). */
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
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const overlay = () => screen.findByLabelText('Area and perimeter in numbers')
const card = () => document.querySelector('.challenge') as HTMLElement
const shape = (name: string) => userEvent.click(screen.getByRole('button', { name }))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
const readouts = async () => [...(await overlay()).querySelectorAll('.number-readout')].map((e) => e.textContent)

const open = async () => {
  window.location.hash = '#/area-perimeter'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Area and Perimeter' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules['area-perimeter'] = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Area and Perimeter: explore', () => {
  it('starts as a 6 × 4 rectangle: area 24, perimeter 20, with the working', async () => {
    await open()
    const o = await overlay()
    expect(await readouts()).toEqual(['24 square units', '20 units'])
    expect(o.textContent).toContain('6 × 4 = 24')
    expect(o.textContent).toContain('2 × (6 + 4) = 20')
  })

  it('updates as the sides change', async () => {
    await open()
    slide('Width', 3)
    slide('Height', 3)
    expect(await readouts()).toEqual(['9 square units', '12 units'])
  })

  it('an L-shape loses area but keeps the perimeter of its box', async () => {
    await open()
    slide('Width', 6)
    slide('Height', 5)
    expect((await readouts())[1]).toBe('22 units')
    await shape('L-shape')
    slide('Notch width', 2)
    slide('Notch height', 2)
    const o = await overlay()
    expect(await readouts()).toEqual(['26 square units', '22 units'])
    expect(o.textContent).toContain('6 × 5 − 2 × 2 = 26')
    expect(o.textContent).toContain('perimeter stays the same')
  })

  it('switching to an L-shape relabels the sides, and keeps the notch smaller than the box', async () => {
    await open()
    await shape('L-shape')
    expect(screen.getByLabelText('Box width')).toBeTruthy()
    expect((screen.getByLabelText('Notch width') as HTMLInputElement).max).toBe('5') // box width 6
    slide('Box width', 3)
    expect((screen.getByLabelText('Notch width') as HTMLInputElement).max).toBe('2')
  })

  it('a 1-wide rectangle becomes at least 2 wide when it turns into an L-shape', async () => {
    await open()
    slide('Width', 1)
    await shape('L-shape')
    expect((screen.getByLabelText('Box width') as HTMLInputElement).value).toBe('2')
  })

  it('has switches for showing the area tiles and the perimeter edges', async () => {
    await open()
    const area = screen.getByRole('switch', { name: 'Show area tiles' })
    expect(area.getAttribute('aria-checked')).toBe('true')
    await userEvent.click(area)
    expect(area.getAttribute('aria-checked')).toBe('false')
    expect(screen.getByRole('switch', { name: 'Show perimeter edges' }).getAttribute('aria-checked')).toBe('true')
  })

  it('describes the shape in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /rectangle 6 wide and 4 tall.*Area 24 square units, perimeter 20 units/ })).toBeTruthy()
  })
})

describe('Area and Perimeter: challenges', () => {
  it('solves an exact rectangle only with the right sides', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('3 wide and 4 tall')
    slide('Width', 4)
    slide('Height', 3)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Width', 3)
    slide('Height', 4)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['area-perimeter'].solved).toEqual(['a-rect-3-4'])
    expect(saved().xp).toBe(10)
  })

  it('an L-shape challenge needs the L-shape', async () => {
    seed(['a-both-12-14', 'a-both-16-20'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('L-shape with an area of 26')
    slide('Width', 12)
    slide('Height', 2)
    expect(card().classList.contains('challenge--solved')).toBe(false) // a 12 × 2 rectangle has area 24; not an L anyway
    await shape('L-shape')
    slide('Box width', 6)
    slide('Box height', 5)
    slide('Notch width', 2)
    slide('Notch height', 2)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(20)
  })

  it('"largest area" needs the best rectangle, not just a good one', async () => {
    seed(['a-both-35-24'], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('largest area')
    slide('Width', 6)
    slide('Height', 4) // perimeter 20, area 24
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Width', 5)
    slide('Height', 5)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a challenge the default shape already satisfies still needs a real solve', async () => {
    seed(['a-rect-3-4', 'a-area-15', 'a-perim-12', 'a-rect-5-5'], 'medium')
    await open()
    await challengeOn()
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Area and Perimeter: welcome and Captain', () => {
  it('has its own welcome card', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: /Area and Perimeter/ })).toBeTruthy()
  })
  it('the Captain gives an area tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/tiles inside|Cut a corner/i)
  })
})
