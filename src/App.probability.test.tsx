/** Probability through the real App (scenes mocked). */
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { tallyOf } from './data/probability'
import { PROGRESS_STORAGE_KEY, defaultProgress, type ProgressState } from './utils/progressStore'

vi.mock('./components/canvas/MathCanvas', () => ({
  default: ({ children, label }: { children?: unknown; label?: string }) => (
    <div data-testid="canvas" role="group" aria-label={label}>
      {children as never}
    </div>
  ),
}))
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'DataScene', 'AngleScene', 'PlaneScene', 'NumberLineScene', 'SpinnerScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

// The module picks a random seed when it opens; fixing Math.random makes the spins repeatable.
// The seed is Math.floor(random * 2^32), so random = 0.25 gives seed 1073741824.
const SEED = Math.floor(0.25 * 2 ** 32)
afterEach(() => vi.restoreAllMocks())

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const sectors = (label: string, n: number) => fireEvent.change(screen.getByLabelText(label), { target: { value: String(n) } })
const view = () => screen.findByLabelText('Chances and results')
const card = () => document.querySelector('.challenge') as HTMLElement
const btn = (name: string | RegExp) => screen.getByRole('button', { name }) as HTMLButtonElement
const click = (name: string | RegExp) => userEvent.click(btn(name))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  vi.spyOn(Math, 'random').mockReturnValue(0.25)
  window.location.hash = '#/probability'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Probability' })
  await view()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.probability = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Probability: explore', () => {
  it('starts with 2 red, 2 blue and 2 green: each colour has a 1/3 chance', async () => {
    await open()
    const o = await view()
    expect(o.textContent).toContain('Chance (6 sectors)')
    expect(o.textContent).toContain('Red: 1/3 = 33.3%')
    expect(o.textContent).toContain('Blue: 1/3 = 33.3%')
    expect(o.textContent).toContain('No spins yet')
  })

  it('changing the sectors updates the chances and their words', async () => {
    await open()
    sectors('Red sectors', 6)
    sectors('Blue sectors', 0)
    sectors('Green sectors', 0)
    const o = await view()
    expect(o.textContent).toContain('Red: 1 = 100%')
    expect(o.textContent).toContain('certain')
    expect(o.textContent).toContain('Blue: 0 = 0%')
    expect(o.textContent).toContain('impossible')
  })

  it('spinning shows exactly the tally that the seed gives (replayable)', async () => {
    await open()
    await click('Spin 100 times')
    const t = tallyOf(SEED, 100, { red: 2, blue: 2, green: 2 })
    const o = await view()
    expect(o.textContent).toContain('After 100 spins')
    expect(o.textContent).toContain(`Red: ${t.red} (${t.red}%)`)
    expect(o.textContent).toContain(`Blue: ${t.blue} (${t.blue}%)`)
    expect(o.textContent).toContain(`Green: ${t.green} (${t.green}%)`)
    expect(t.red + t.blue + t.green).toBe(100)
  })

  it('spins add up, and a single spin adds one', async () => {
    await open()
    await click('Spin 10 times')
    await click('Spin once')
    expect((await view()).textContent).toContain('After 11 spins')
  })

  it('changing the wheel starts the count again; "Clear results" also does', async () => {
    await open()
    await click('Spin 10 times')
    sectors('Red sectors', 3)
    expect((await view()).textContent).toContain('No spins yet')
    await click('Spin 10 times')
    await click('Clear results')
    expect((await view()).textContent).toContain('No spins yet')
    expect(btn('Clear results').disabled).toBe(true)
  })

  it('cannot spin an empty wheel', async () => {
    await open()
    sectors('Red sectors', 0)
    sectors('Blue sectors', 0)
    sectors('Green sectors', 0)
    expect(btn('Spin once').disabled).toBe(true)
    expect((await view()).textContent).toContain('Add some sectors')
  })

  it('describes the wheel and the results in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /spinner and a bar for each colour.*red 2 of 6 sectors, 1\/3.*No spins yet/ })).toBeTruthy()
  })
})

describe('Probability: challenges', () => {
  it('solves "chance of red is 1/2" with any wheel that gives it', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('chance of red is 1/2')
    sectors('Red sectors', 3)
    sectors('Blue sectors', 3)
    sectors('Green sectors', 0)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.probability.solved).toEqual(['pr-red-half'])
    expect(saved().xp).toBe(10)
  })

  it('"impossible" needs no sectors of that colour but some sectors', async () => {
    seed(['pr-red-half'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('green impossible')
    sectors('Green sectors', 1)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    sectors('Green sectors', 0)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a spinning challenge counts the spins', async () => {
    seed(['pr-red-quarter', 'pr-order'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('at least 50 times')
    await click('Spin 10 times')
    expect(card().classList.contains('challenge--solved')).toBe(false)
    for (let i = 0; i < 4; i++) await click('Spin 10 times')
    expect(card().classList.contains('challenge--solved')).toBe(true) // 50 spins
    expect(saved().xp).toBe(20)
  })

  it('the fair-wheel challenge needs a fair wheel AND 100 spins, and changing the wheel clears the spins', async () => {
    seed(['pr-green-3-8', 'pr-red-unlikely'], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('fair two-colour wheel')
    await click('Spin 100 times') // wheel is not fair yet (2 / 2 / 2)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    sectors('Green sectors', 0) // red = blue = 2, green = 0: fair, but the spins were cleared
    expect(card().classList.contains('challenge--solved')).toBe(false)
    await click('Spin 100 times')
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(30)
  })

  it('a challenge the default wheel already satisfies still needs a real solve', async () => {
    seed(['pr-red-half', 'pr-green-impossible', 'pr-blue-certain'], 'easy')
    await open()
    await challengeOn()
    // all three colours are equally likely on the starting wheel (2/2/2), but it must be earned
    expect(card().textContent).toContain('equally likely')
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Probability: welcome and Captain', () => {
  it('has its own card under Mathematical Thinking', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    expect(screen.getByRole('region', { name: 'Mathematical Thinking' }).textContent).toContain('Spin, count and compare')
  })
  it('the Captain gives a probability tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/spin|chance/i)
  })
})
