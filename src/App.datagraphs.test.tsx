/** Data and Graphs through the real App (scenes mocked). */
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
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'DataScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const bar = (i: number, name: string, value: number) =>
  fireEvent.change(screen.getByLabelText(`Bar ${i}: ${name}`), { target: { value: String(value) } })
const setBars = (names: string[], values: number[]) => values.forEach((v, i) => bar(i + 1, names[i], v))
const FRUIT = ['Apple', 'Banana', 'Grape', 'Orange', 'Pear']
const overlay = () => screen.findByLabelText('Statistics of the graph')
const card = () => document.querySelector('.challenge') as HTMLElement
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
const stat = async (name: string) => {
  const dts = [...(await overlay()).querySelectorAll('dt')]
  return dts.find((d) => d.textContent === name)!.nextElementSibling!.textContent
}

const open = async () => {
  window.location.hash = '#/data-graphs'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Data and Graphs' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules['data-graphs'] = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Data and Graphs: explore', () => {
  it('starts with 3, 5, 2, 4, 6: total 20, mean 4, median 4, no mode, range 4, tallest Pear', async () => {
    await open()
    const o = await overlay()
    expect(o.querySelector('.number-readout')?.textContent).toBe('20')
    expect(o.textContent).toContain('Favourite fruit')
    expect(await stat('Mean')).toBe('4')
    expect(await stat('Median')).toBe('4')
    expect(await stat('Mode')).toBe('none')
    expect(await stat('Range')).toBe('4')
    expect(await stat('Tallest')).toBe('Pear')
  })

  it('every statistic follows the bars', async () => {
    await open()
    setBars(FRUIT, [3, 3, 1, 5, 2])
    expect(await stat('Mode')).toBe('3')
    expect(await stat('Median')).toBe('3')
    expect(await stat('Mean')).toBe('2.8')
    expect(await stat('Tallest')).toBe('Orange')
    bar(5, 'Pear', 5) // two bars of 5
    expect(await stat('Tallest')).toBe('tie')
  })

  it('switching topic renames the bars and keeps the numbers', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Pets' }))
    expect(screen.getByLabelText('Bar 1: Dog')).toBeTruthy()
    expect((await overlay()).textContent).toContain('Pets at home')
    expect(await stat('Tallest')).toBe('Rabbit')
    expect(await stat('Mean')).toBe('4')
  })

  it('counts stay within 0 to 10', async () => {
    await open()
    bar(1, 'Apple', 10)
    expect(screen.getByRole('button', { name: 'Increase Bar 1: Apple' })).toHaveProperty('disabled', true)
    bar(1, 'Apple', 0)
    expect(screen.getByRole('button', { name: 'Decrease Bar 1: Apple' })).toHaveProperty('disabled', true)
  })

  it('describes the graph in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /bar graph of favourite fruit: Apple 3, Banana 5.*Total 20, mean 4, median 4, range 4/ })).toBeTruthy()
    await userEvent.click(screen.getByRole('switch', { name: 'Show mean line' }))
    expect(await screen.findByRole('group', { name: /An orange line marks the mean/ })).toBeTruthy()
  })
})

describe('Data and Graphs: challenges', () => {
  it('solves "total of 10" and saves it', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('add up to 10')
    setBars(FRUIT, [2, 2, 2, 2, 2])
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['data-graphs'].solved).toEqual(['g-total-10'])
    expect(saved().xp).toBe(10)
  })

  it('"tallest on its own" is not solved by a tie', async () => {
    seed(['g-total-10'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('bar 1 the tallest')
    bar(1, 'Apple', 9)
    bar(2, 'Banana', 9) // tie
    expect(card().classList.contains('challenge--solved')).toBe(false)
    bar(2, 'Banana', 1)
    bar(3, 'Grape', 2)
    bar(4, 'Orange', 3)
    bar(5, 'Pear', 4)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a median challenge looks at the middle value in order', async () => {
    seed(['g-total-10', 'g-tallest-1', 'g-mean-3', 'g-all-equal'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('median of 6')
    setBars(FRUIT, [10, 2, 6, 4, 8]) // in order: 2 4 6 8 10
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(20)
  })

  it('a hard two-fact challenge needs both facts at once', async () => {
    seed(['g-median-above-mean'], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('mean of 6 and a median of 4')
    setBars(FRUIT, [6, 6, 6, 6, 6]) // mean 6 but median 6
    expect(card().classList.contains('challenge--solved')).toBe(false)
    setBars(FRUIT, [4, 4, 4, 9, 9]) // mean 6, median 4
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(30)
  })

  it('a challenge the default graph already satisfies still needs a real solve', async () => {
    seed(['g-total-10', 'g-tallest-1', 'g-mean-3', 'g-all-equal'], 'medium')
    await open()
    await challengeOn()
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Data and Graphs: welcome and Captain', () => {
  it('has its own welcome card', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('button', { name: /Data and Graphs/ })).toBeTruthy()
  })
  it('the Captain gives a data tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/mean|median/i)
  })
})
