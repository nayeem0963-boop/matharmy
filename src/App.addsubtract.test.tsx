/** Add & Subtract through the real App (scenes mocked). */
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PROGRESS_STORAGE_KEY, defaultProgress, type ProgressState } from './utils/progressStore'

vi.mock('./components/canvas/MathCanvas', () => ({
  default: ({ children }: { children?: unknown }) => <div data-testid="canvas">{children as never}</div>,
}))
vi.mock('./components/scenes/FractionBlocksScene', () => ({ default: () => null }))
vi.mock('./components/scenes/GeometryExplorerScene', () => ({ default: () => null }))
vi.mock('./components/scenes/PlaceValueScene', () => ({ default: () => null }))
vi.mock('./components/scenes/CaptainHexaCubieScene', () => ({ default: () => null }))

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const btn = (name: string | RegExp) => screen.getByRole('button', { name }) as HTMLButtonElement
const click = (name: string | RegExp) => userEvent.click(btn(name))
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const mat = async () => (await screen.findByLabelText('Sum and blocks on the mat')).querySelector('.number-readout')!.textContent
const card = () => document.querySelector('.challenge') as HTMLElement

const open = async () => {
  window.location.hash = '#/add-subtract'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Add & Subtract' })
  await mat()
}

describe('Add & Subtract: explore', () => {
  it('starts with 27 + 15 and shows the first number on the mat', async () => {
    await open()
    expect(await mat()).toBe('27')
    const o = screen.getByLabelText('Sum and blocks on the mat')
    expect(o.textContent).toContain('27 + 15')
    expect(o.textContent).toContain('7 + 5 = 12: write 2, carry 1 ten') // column method
  })

  it('adds one place at a time and needs a trade before it is in standard form', async () => {
    await open()
    await click('Add 5 ones')
    expect(await mat()).toBe('32')
    await click('Add 1 tens')
    expect(await mat()).toBe('42')
    expect(screen.queryByLabelText('Hundreds')).toBeNull() // blocks are changed by the steps, not by steppers
    expect(btn(/Add 5 ones/).disabled).toBe(true) // each place once
    expect(btn(/Add 5 ones/).getAttribute('aria-label')).toContain('Already done')
  })

  it('subtraction explains why it is blocked, then allows it after borrowing', async () => {
    await open()
    await click('Subtract (−)')
    slide('First number', 52)
    slide('Second number', 27)
    expect(btn(/Take away 7 ones/).disabled).toBe(true)
    expect(btn(/Take away 7 ones/).getAttribute('aria-label')).toContain('Not enough ones')
    await click('1 ten → 10 ones')
    expect(await mat()).toBe('52') // regrouping never changes the number
    await click('Take away 7 ones')
    await click('Take away 2 tens')
    expect(await mat()).toBe('25')
  })

  it('keeps the second number from exceeding the first when subtracting', async () => {
    await open()
    await click('Subtract (−)')
    slide('First number', 20)
    expect((screen.getByLabelText('Second number') as HTMLInputElement).max).toBe('20')
  })

  it('changing a number or starting over gives a fresh mat', async () => {
    await open()
    await click('Add 5 ones')
    expect(await mat()).toBe('32')
    await click('Start over')
    expect(await mat()).toBe('27')
    await click('Add 5 ones')
    slide('Second number', 16)
    expect(await mat()).toBe('27')
  })
})

describe('Add & Subtract: challenges', () => {
  it('starts with the easy challenge and fixes the numbers', async () => {
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().textContent).toContain('23 + 14')
    expect(screen.queryByLabelText('First number')).toBeNull()
    expect(screen.getByLabelText('Sum and blocks on the mat').textContent).not.toContain('Column method')
  })

  it('solves an easy sum, saves the star and XP', async () => {
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    await click('Add 4 ones')
    expect(card().classList.contains('challenge--solved')).toBe(false)
    await click('Add 1 tens')
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['add-subtract'].solved).toEqual(['as-add-23-14'])
    expect(saved().xp).toBe(10)
  })

  it('a medium sum is only solved after the trade', async () => {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ ...defaultProgress(), modules: { ...defaultProgress().modules, 'add-subtract': { solved: ['as-add-23-14', 'as-sub-45-32', 'as-add-31-42', 'as-sub-68-25'], tier: 'medium', streak: 0, bestStreak: 0 } } }),
    )
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().textContent).toContain('27 + 15')
    await click('Add 5 ones')
    await click('Add 1 tens')
    expect(card().classList.contains('challenge--solved')).toBe(false) // 12 ones
    await click('10 ones → 1 ten')
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['add-subtract'].solved).toContain('as-add-27-15')
    expect(saved().xp).toBe(20)
  })

  it('a borrow challenge cannot be done without breaking a ten', async () => {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ ...defaultProgress(), modules: { ...defaultProgress().modules, 'add-subtract': { solved: ['as-add-27-15'], tier: 'medium', streak: 0, bestStreak: 0 } } }),
    )
    await open()
    await userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
    expect(card().textContent).toContain('52 − 27')
    expect(btn(/Take away 7 ones/).disabled).toBe(true)
    await click('1 ten → 10 ones')
    await click('Take away 7 ones')
    await click('Take away 2 tens')
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('shows the module on the welcome page with its stars and a new badge', async () => {
    window.location.hash = ''
    render(<App />)
    expect(await screen.findAllByLabelText('0 of 12 challenges solved')).toHaveLength(4) // one card per module
    expect(screen.getByText('Add & Subtract Pro')).toBeTruthy()
    const cards = within(document.querySelector('.module-cards') as HTMLElement).getAllByRole('button')
    expect(cards.map((c) => c.textContent)).toEqual(expect.arrayContaining([expect.stringContaining('Add & Subtract')]))
  })
})
