/** Integers and Number Lines through the real App (scenes mocked). */
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
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'DataScene', 'AngleScene', 'PlaneScene', 'NumberLineScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const set = (label: string, n: number) => fireEvent.change(screen.getByLabelText(label), { target: { value: String(n) } })
const lineView = () => screen.findByLabelText('Two numbers on the line')
const moveView = () => screen.findByLabelText('Addition or subtraction in numbers')
const card = () => document.querySelector('.challenge') as HTMLElement
const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  window.location.hash = '#/integers'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Integers and Number Lines' })
  await lineView()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.integers = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Integers: number line view', () => {
  it('starts with A at −3 and B at 5: places, absolute value, opposite, comparison and gap', async () => {
    await open()
    const o = await lineView()
    expect(o.textContent).toContain('−3')
    expect(o.textContent).toContain('3 units left of zero')
    expect(o.textContent).toContain('|A| = 3, opposite 3')
    expect(o.textContent).toContain('−3 < 5')
    expect(o.textContent).toContain('−3 is to the left of 5, so it is less')
    expect(o.textContent).toContain('8 apart: 5 − (−3)')
  })

  it('updates when the points move, including ordering two negatives', async () => {
    await open()
    set('Point A', -2)
    set('Point B', -6)
    const o = await lineView()
    expect(o.textContent).toContain('−2 > −6')
    expect(o.textContent).toContain('−2 is to the right of −6, so it is greater')
    expect(o.textContent).toContain('4 apart')
  })

  it('zero is at zero and its own opposite', async () => {
    await open()
    set('Point A', 0)
    const o = await lineView()
    expect(o.textContent).toContain('at zero')
    expect(o.textContent).toContain('|A| = 0, opposite 0')
  })

  it('stays within −10 to 10', async () => {
    await open()
    set('Point A', 10)
    expect(screen.getByRole('button', { name: 'Increase Point A' })).toHaveProperty('disabled', true)
    set('Point A', -10)
    expect(screen.getByRole('button', { name: 'Decrease Point A' })).toHaveProperty('disabled', true)
  })

  it('describes the line in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /number line from -10 to 10.*Point A at −3 and point B at 5: −3 < 5, 8 apart/ })).toBeTruthy()
  })
})

describe('Integers: add and subtract view', () => {
  const toMove = async () => {
    await open()
    await click('Add and subtract')
    await moveView()
  }

  it('shows the working and the move in words', async () => {
    await toMove()
    const o = await moveView()
    expect(o.textContent).toContain('−2 + 3 = 1')
    expect(o.textContent).toContain('Start at −2. Move 3 right. You land on 1.')
  })

  it('subtracting a negative moves right and says why', async () => {
    await toMove()
    await click('Subtract (−)')
    set('Start at', 3)
    set('Number', -4)
    const o = await moveView()
    expect(o.textContent).toContain('3 − (−4) = 7')
    expect(o.textContent).toContain('Move 4 right')
    expect(o.textContent).toContain('adding the opposite')
  })

  it('the start and number stay within −5 to 5, so the answer lands on the line', async () => {
    await toMove()
    set('Start at', 5)
    set('Number', 5)
    expect((await moveView()).textContent).toContain('5 + 5 = 10')
    expect(screen.getByRole('button', { name: 'Increase Start at' })).toHaveProperty('disabled', true)
  })
})

describe('Integers: challenges', () => {
  it('solves "put A on −7" and saves it', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Put point A on −7')
    set('Point A', 7)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    set('Point A', -7)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.integers.solved).toEqual(['i-place-neg-7'])
    expect(saved().xp).toBe(10)
  })

  it('"A on 6 and B its opposite" needs both points', async () => {
    seed(['i-place-neg-7'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('opposite')
    set('Point A', 6)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    set('Point B', -6)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a challenge about adding and subtracting switches the view by itself', async () => {
    seed(['i-gap-7'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('lands on −3')
    expect(screen.getByLabelText('Start at')).toBeTruthy() // the add and subtract controls, not the line points
    expect(screen.queryByLabelText('Point A')).toBeNull()
    set('Start at', 2)
    await click('Subtract (−)')
    set('Number', 5)
    expect(card().classList.contains('challenge--solved')).toBe(true) // 2 − 5 = −3
    expect(saved().xp).toBe(20)
  })

  it('the expression challenge needs that exact expression, not just the same answer', async () => {
    seed(['i-gap-7', 'i-result-neg3', 'i-from-neg3-to-1'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Show 3 − (−4)')
    set('Start at', 3)
    set('Number', 4)
    await click('Add (+)') // 3 + 4 = 7, same answer
    expect(card().classList.contains('challenge--solved')).toBe(false)
    await click('Subtract (−)')
    set('Number', -4)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a hard "subtract a negative" challenge', async () => {
    seed([], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('Subtract a negative number to get 9')
    set('Start at', 5)
    await click('Subtract (−)')
    set('Number', 4)
    expect(card().classList.contains('challenge--solved')).toBe(false) // subtracting a positive
    set('Number', -4)
    expect(card().classList.contains('challenge--solved')).toBe(true) // 5 − (−4) = 9
    expect(saved().xp).toBe(30)
  })

  it('a challenge the default already satisfies still needs a real solve', async () => {
    seed(['i-place-neg-7', 'i-opposite-6', 'i-order-neg', 'i-abs-5'], 'medium')
    await open()
    await challengeOn()
    // −3 and 5 are 8 apart: not the 7 asked for, but the next change must be a real one
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Integers: welcome and Captain', () => {
  it('has its own card under Number and Operations', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    const number = screen.getByRole('region', { name: 'Number and Operations' })
    expect(number.textContent).toContain('Integers and Number Lines')
  })
  it('the Captain gives an integers tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/negative|further right/i)
  })
})
