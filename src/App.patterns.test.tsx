/** Patterns and Sequences through the real App (scenes mocked). */
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
vi.mock('./components/scenes/PatternScene', () => ({ default: () => null }))
vi.mock('./components/scenes/CaptainHexaCubieScene', () => ({ default: () => null }))

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const overlay = () => screen.findByLabelText('Pattern in numbers')
const card = () => document.querySelector('.challenge') as HTMLElement
const kind = (name: string) => userEvent.click(screen.getByRole('button', { name }))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  window.location.hash = '#/patterns'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Patterns and Sequences' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.patterns = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Patterns and Sequences: explore', () => {
  it('starts at 3, add 4: six terms, the rule and term 10', async () => {
    await open()
    const o = await overlay()
    expect(o.textContent).toContain('3, 7, 11, 15, 19, 23, …')
    expect(o.textContent).toContain('Start at 3, add 4 each time')
    expect(o.textContent).toContain('Term 10')
    expect(o.textContent).toContain('39')
    expect(o.textContent).toContain('3 + 4 × (n − 1)')
    expect(o.textContent).toContain('3 + 4 × 9 = 39')
  })

  it('updates as start, step and term number change', async () => {
    await open()
    slide('Start at', 5)
    slide('Add', 5)
    slide('Find term number', 4)
    const o = await overlay()
    expect(o.textContent).toContain('5, 10, 15, 20, 25, 30, …')
    expect(o.querySelector('.number-readout')?.textContent).toBe('20')
  })

  it('multiplying: relabels the step, keeps it within 2 to 5, and grows fast', async () => {
    await open()
    slide('Add', 9)
    await kind('Multiply each time')
    const step = screen.getByLabelText('Multiply by') as HTMLInputElement
    expect(step.min).toBe('2')
    expect(step.max).toBe('5')
    expect(step.value).toBe('5') // 9 does not exist for multiplying: clamped
    slide('Start at', 2)
    slide('Multiply by', 3)
    expect((await overlay()).textContent).toContain('2, 6, 18, 54, 162, 486, …')
  })

  it('large terms get thousands separators', async () => {
    await open()
    await kind('Multiply each time')
    slide('Start at', 20)
    slide('Multiply by', 5)
    slide('Find term number', 8)
    expect((await overlay()).querySelector('.number-readout')?.textContent).toBe('1,562,500')
  })

  it('describes the pattern in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /first 6 terms: 3, 7, 11, 15, 19, 23.*Term 10 is 39/ })).toBeTruthy()
  })
})

describe('Patterns and Sequences: challenges', () => {
  it('solves an exact challenge only with the right kind, start and step', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('starts at 2 and adds 3')
    slide('Start at', 2)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Add', 3)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.patterns.solved).toEqual(['p-add-2-3'])
    expect(saved().xp).toBe(10)
  })

  it('a "term is" challenge accepts any pattern that fits', async () => {
    seed(['p-add-2-3', 'p-add-5-5'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('3rd term is 10')
    slide('Start at', 4)
    slide('Add', 3) // 4, 7, 10
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a multiplying challenge needs the multiply kind', async () => {
    seed(['p-add-2-3', 'p-add-5-5', 'p-term-3-10'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('doubling pattern that starts at 1')
    slide('Start at', 1)
    slide('Add', 2)
    expect(card().classList.contains('challenge--solved')).toBe(false) // adding 2 from 1
    await kind('Multiply each time')
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a hard "includes both" challenge looks at the six terms shown', async () => {
    seed(['p-term-4-54-mul', 'p-term-10-50', 'p-mul-2-5'], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('includes both 28 and 49')
    slide('Start at', 7)
    slide('Add', 7) // 49 would be the 7th term
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Start at', 14)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(30)
  })

  it('a challenge the default already satisfies still needs a real solve', async () => {
    seed(['p-add-2-3', 'p-add-5-5', 'p-term-3-10', 'p-mul-1-2'], 'medium')
    await open()
    await challengeOn()
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Patterns and Sequences: welcome and Captain', () => {
  it('has its own welcome card', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: /Patterns and Sequences/ })).toBeTruthy()
  })
  it('the Captain gives a pattern tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/steady steps|use the rule/i)
  })
})
