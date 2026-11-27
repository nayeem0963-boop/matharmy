/** Multiplication Arrays through the real App (scenes mocked). */
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
vi.mock('./components/scenes/CaptainHexaCubieScene', () => ({ default: () => null }))

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const overlay = () => screen.findByLabelText('Array in numbers')
const card = () => document.querySelector('.challenge') as HTMLElement
const product = async () => (await overlay()).querySelector('.number-readout')!.textContent

const open = async () => {
  window.location.hash = '#/multiplication'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Multiplication Arrays' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.multiplication = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Multiplication Arrays: explore', () => {
  it('starts at 3 × 5 with the product, repeated addition and fact family', async () => {
    await open()
    const o = await overlay()
    expect(o.textContent).toContain('3 × 5')
    expect(await product()).toBe('15')
    expect(o.textContent).toContain('5 + 5 + 5 = 15')
    expect(o.textContent).toContain('15 ÷ 3 = 5')
    expect(o.textContent).toContain('5 × 3 = 15')
  })

  it('updates as rows and columns change', async () => {
    await open()
    slide('Rows', 4)
    slide('Columns', 6)
    expect(await product()).toBe('24')
    expect((await overlay()).textContent).toContain('6 + 6 + 6 + 6 = 24')
  })

  it('swaps rows and columns (order does not matter)', async () => {
    await open()
    slide('Rows', 2)
    slide('Columns', 7)
    await userEvent.click(screen.getByRole('button', { name: /Swap rows and columns \(2 × 7 → 7 × 2\)/ }))
    expect((screen.getByLabelText('Rows') as HTMLInputElement).value).toBe('7')
    expect((screen.getByLabelText('Columns') as HTMLInputElement).value).toBe('2')
    expect(await product()).toBe('14')
  })

  it('skip counts the rows being counted', async () => {
    await open()
    slide('Columns', 4)
    slide('Rows counted', 3)
    const o = await overlay()
    expect(o.textContent).toContain('Counting 3 rows')
    expect(o.textContent).toContain('4, 8, 12')
  })

  it('keeps the counted rows within the array when rows shrink', async () => {
    await open()
    slide('Rows', 6)
    slide('Rows counted', 5)
    slide('Rows', 2)
    expect((screen.getByLabelText('Rows counted') as HTMLInputElement).value).toBe('2')
  })

  it('stays within 1 to 10', async () => {
    await open()
    slide('Rows', 10)
    expect(screen.getByRole('button', { name: 'Increase Rows' })).toHaveProperty('disabled', true)
    slide('Columns', 1)
    expect(screen.getByRole('button', { name: 'Decrease Columns' })).toHaveProperty('disabled', true)
  })

  it('describes the array in words for screen readers', async () => {
    await open()
    expect(
      await screen.findByRole('group', { name: /3 rows of 5, 15 cubes in all, showing 3 times 5 equals 15/ }),
    ).toBeTruthy()
  })
})

describe('Multiplication Arrays: challenges', () => {
  it('starts on the first easy challenge and needs the right orientation', async () => {
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().textContent).toContain('2 rows of 3')
    slide('Rows', 3)
    slide('Columns', 2) // 3 × 2: right product, wrong orientation
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Rows', 2)
    slide('Columns', 3)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.multiplication.solved).toEqual(['m-exact-2-3'])
    expect(saved().xp).toBe(10)
  })

  it('a product challenge accepts any array with the right shape', async () => {
    seed(['m-exact-2-3', 'm-exact-4-5', 'm-rows-6-2', 'm-square-9'], 'medium')
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().textContent).toContain('12 with 3 rows')
    slide('Rows', 3)
    slide('Columns', 4)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(20)
  })

  it('a hard condition: more columns than rows', async () => {
    seed(['m-exact-7-8'], 'hard')
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().textContent).toContain('36 with more columns than rows')
    slide('Rows', 9)
    slide('Columns', 4)
    expect(card().classList.contains('challenge--solved')).toBe(false) // 9 × 4 has more rows
    await userEvent.click(screen.getByRole('button', { name: /Swap rows and columns/ }))
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a challenge the default array already satisfies still needs a real solve', async () => {
    seed(['m-exact-2-3', 'm-exact-4-5', 'm-rows-6-2', 'm-square-9'], 'medium')
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().classList.contains('challenge--solved')).toBe(false)
    expect(saved().modules.multiplication.solved).toHaveLength(4)
  })
})

describe('Multiplication Arrays: welcome page and Captain', () => {
  it('the teaser became a real card, and the Coming soon list no longer lists it', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: /Multiplication Arrays/ })).toBeTruthy()
    // every teaser has become a real module, so there is no "Coming soon" list left
    expect(document.querySelector('.upcoming')).toBeNull()
  })

  it('the Captain gives a multiplication tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/Swap rows|skip count/i)
  })
})
