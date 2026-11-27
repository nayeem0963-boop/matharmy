/** Division and Grouping through the real App (scenes mocked). */
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
vi.mock('./components/scenes/FractionBlocksScene', () => ({ default: () => null }))
vi.mock('./components/scenes/GeometryExplorerScene', () => ({ default: () => null }))
vi.mock('./components/scenes/PlaceValueScene', () => ({ default: () => null }))
vi.mock('./components/scenes/ArrayScene', () => ({ default: () => null }))
vi.mock('./components/scenes/DivisionScene', () => ({ default: () => null }))
vi.mock('./components/scenes/CaptainHexaCubieScene', () => ({ default: () => null }))

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const overlay = () => screen.findByLabelText('Division in numbers')
const card = () => document.querySelector('.challenge') as HTMLElement
const mode = (name: string) => userEvent.click(screen.getByRole('button', { name }))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  window.location.hash = '#/division'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Division and Grouping' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.division = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Division and Grouping: explore', () => {
  it('starts with 20 shared into 3 groups: 6 each, 2 left over', async () => {
    await open()
    const o = await overlay()
    expect(o.textContent).toContain('20 ÷ 3 = 6 r 2')
    expect(o.textContent).toContain('6 × 3 + 2 = 20')
    expect(o.textContent).toContain('20 cubes shared into 3 groups: 6 in each, 2 left over')
  })

  it('updates as the numbers change', async () => {
    await open()
    slide('Cubes', 24)
    slide('Number of groups', 4)
    expect((await overlay()).textContent).toContain('24 ÷ 4 = 6')
    expect((await overlay()).textContent).toContain('none left over')
  })

  it('switching to grouping relabels the control and re-reads the same numbers', async () => {
    await open()
    await mode('Make groups of')
    expect(screen.getByLabelText('Size of each group')).toBeTruthy()
    expect((await overlay()).textContent).toContain('20 cubes in groups of 3: 6 groups, 2 left over')
  })

  it('says when there are too few cubes for even one group', async () => {
    await open()
    slide('Cubes', 2)
    slide('Number of groups', 5)
    expect((await overlay()).textContent).toContain('cannot give each of 5 groups even one')
  })

  it('stays within the limits', async () => {
    await open()
    slide('Cubes', 50)
    expect(screen.getByRole('button', { name: 'Increase Cubes' })).toHaveProperty('disabled', true)
    slide('Number of groups', 2)
    expect(screen.getByRole('button', { name: 'Decrease Number of groups' })).toHaveProperty('disabled', true)
  })

  it('describes the scene in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /Cubes laid out in rows.*20 cubes shared into 3 groups/ })).toBeTruthy()
  })
})

describe('Division and Grouping: challenges', () => {
  it('solves the first easy challenge only with the right mode and numbers', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Share 12 cubes equally into 3 groups')
    slide('Cubes', 12)
    expect(card().classList.contains('challenge--solved')).toBe(true) // 12 shared into 3 (defaults: share, 3)
    expect(saved().modules.division.solved).toEqual(['d-share-12-3'])
    expect(saved().xp).toBe(10)
  })

  it('the wrong mode does not count', async () => {
    seed(['d-share-12-3'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('groups of 5 from 15')
    slide('Cubes', 15)
    slide('Number of groups', 5) // still sharing, not grouping
    expect(card().classList.contains('challenge--solved')).toBe(false)
    await mode('Make groups of')
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a result challenge accepts the total that gives the quotient and remainder', async () => {
    seed(['d-share-12-3', 'd-group-15-5', 'd-share-10-2', 'd-group-8-4', 'd-share-13-4'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('3 groups and 2 left over')
    await mode('Make groups of')
    slide('Size of each group', 5)
    slide('Cubes', 17)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(20) // a medium solve (seeded solves carry no XP of their own)
  })

  it('a challenge the default state already satisfies still needs a real solve', async () => {
    seed(['d-share-12-3', 'd-group-15-5', 'd-share-10-2', 'd-group-8-4'], 'medium')
    await open()
    await challengeOn()
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Division and Grouping: welcome and Captain', () => {
  it('has its own welcome card', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: /Division and Grouping/ })).toBeTruthy()
  })
  it('the Captain gives a division tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/multiplication|Leftovers/i)
  })
})
