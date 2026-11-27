/** Decimals and Percentages through the real App (scenes mocked). */
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
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const overlay = () => screen.findByLabelText('Amount as decimal, fraction and percent')
const card = () => document.querySelector('.challenge') as HTMLElement
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  window.location.hash = '#/decimals'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Decimals and Percentages' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.decimals = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Decimals and Percentages: explore', () => {
  it('starts at 42 squares: 0.42, 42/100 = 21/50, 42%', async () => {
    await open()
    const o = await overlay()
    expect(o.querySelector('.number-readout')?.textContent).toBe('0.42')
    expect(o.textContent).toContain('4 tenths and 2 hundredths')
    expect(o.textContent).toContain('42/100 = 21/50')
    expect(o.textContent).toContain('42%')
  })

  it('tenths and hundredths build the amount', async () => {
    await open()
    slide('Tenths', 7)
    slide('Hundredths', 5)
    const o = await overlay()
    expect(o.querySelector('.number-readout')?.textContent).toBe('0.75')
    expect(o.textContent).toContain('75/100 = 3/4')
    expect(o.textContent).toContain('75%')
  })

  it('a whole is 1, 100% and 10 tenths, with no hundredths on top', async () => {
    await open()
    slide('Hundredths', 7)
    slide('Tenths', 10)
    const o = await overlay()
    expect(o.querySelector('.number-readout')?.textContent).toBe('1')
    expect(o.textContent).toContain('100%')
    expect(o.textContent).toContain('1 whole')
    expect((screen.getByLabelText('Hundredths') as HTMLInputElement).value).toBe('0')
  })

  it('nothing shaded reads as 0', async () => {
    await open()
    slide('Tenths', 0)
    slide('Hundredths', 0)
    const o = await overlay()
    expect(o.querySelector('.number-readout')?.textContent).toBe('0')
    expect(o.textContent).toContain('nothing shaded')
    expect(o.textContent).toContain('0%')
  })

  it('describes the grid in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /100 squares in 10 columns, with 42 shaded.*0\.42 as a decimal, 21\/50 as a fraction and 42% as a percent/ })).toBeTruthy()
  })
})

describe('Decimals and Percentages: challenges', () => {
  it('solves "show 0.5" with five tenths', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Show 0.5')
    slide('Tenths', 5)
    expect(card().classList.contains('challenge--solved')).toBe(false) // 5 tenths and 2 hundredths = 0.52
    slide('Hundredths', 0)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.decimals.solved).toEqual(['d-dec-0-5'])
    expect(saved().xp).toBe(10)
  })

  it('percent and fraction challenges accept the same amount', async () => {
    seed(['d-dec-0-5'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Show 25%')
    slide('Tenths', 2)
    slide('Hundredths', 5)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a "between" challenge accepts any amount strictly between', async () => {
    seed(['d-dec-0-35', 'd-pct-85', 'd-frac-3-4'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('between 0.4 and 0.5')
    slide('Tenths', 4)
    slide('Hundredths', 0)
    expect(card().classList.contains('challenge--solved')).toBe(false) // 0.40 is not between
    slide('Hundredths', 6) // the default 0.42 would already have counted; 0.46 after a real change
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a hard comparison across forms: greater than 3/8, less than 0.4', async () => {
    seed(['d-between-0-7-3-4'], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('greater than 3/8')
    slide('Tenths', 3)
    slide('Hundredths', 7)
    expect(card().classList.contains('challenge--solved')).toBe(false) // 0.37 is below 3/8 = 0.375
    slide('Hundredths', 8)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(30)
  })

  it('a challenge the default already satisfies still needs a real solve', async () => {
    seed(['d-dec-0-5', 'd-pct-25', 'd-frac-3-10', 'd-dec-0-07', 'd-dec-0-35', 'd-pct-85', 'd-frac-3-4'], 'medium')
    await open()
    await challengeOn()
    // 0.42 is already between 0.4 and 0.5, but it has to be seen unsolved first
    expect(card().textContent).toContain('between 0.4 and 0.5')
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Decimals and Percentages: welcome and Captain', () => {
  it('has its own welcome card', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: /Decimals and Percentages/ })).toBeTruthy()
  })
  it('the Captain gives a decimals tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/column is a tenth|same amount/i)
  })
})
