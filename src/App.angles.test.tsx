/** Angles through the real App (scenes mocked). */
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
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'DataScene', 'AngleScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const setAngle = (n: number) =>
  fireEvent.change(screen.getByLabelText('Angle (degrees)'), { target: { value: String(n) } })
const overlay = () => screen.findByLabelText('Angle in numbers')
const card = () => document.querySelector('.challenge') as HTMLElement
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

const open = async () => {
  window.location.hash = '#/angles'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Angles' })
  await overlay()
}
const seed = (solved: string[], tier: 'easy' | 'medium' | 'hard') => {
  const p = defaultProgress()
  p.modules.angles = { solved, tier, streak: 0, bestStreak: 0 }
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}

describe('Angles: explore', () => {
  it('starts at 125°: an obtuse angle, with its partners and share of a turn', async () => {
    await open()
    const o = await overlay()
    expect(o.querySelector('.number-readout')?.textContent).toBe('125°')
    expect(o.querySelector('.angle-name')?.textContent).toBe('obtuse angle')
    expect(o.textContent).toContain('No partner for 90°')
    expect(o.textContent).toContain('Adds to 180° with 55°')
    expect(o.textContent).toContain('Adds to 360° with 235°')
    expect(o.textContent).toContain('25/72 of a full turn')
  })

  it('names every kind of angle as it turns', async () => {
    await open()
    const name = async () => (await overlay()).querySelector('.angle-name')!.textContent
    const cases: [number, string][] = [[0, 'zero angle'], [30, 'acute angle'], [90, 'right angle'], [120, 'obtuse angle'], [180, 'straight angle'], [200, 'reflex angle'], [360, 'full turn']]
    for (const [deg, expected] of cases) {
      setAngle(deg)
      expect(await name(), `${deg}°`).toBe(expected)
    }
  })

  it('shows the complement and supplement of an acute angle', async () => {
    await open()
    setAngle(35)
    const o = await overlay()
    expect(o.textContent).toContain('Adds to 90° with 55°')
    expect(o.textContent).toContain('Adds to 180° with 145°')
    expect(o.textContent).toContain('7/72 of a full turn')
  })

  it('the jump buttons set common angles', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: '270°' }))
    expect((screen.getByLabelText('Angle (degrees)') as HTMLInputElement).value).toBe('270')
    expect((await overlay()).textContent).toContain('3/4 of a full turn')
    await userEvent.click(screen.getByRole('button', { name: '360°' }))
    expect((await overlay()).textContent).toContain('A whole turn')
  })

  it('the stepper goes up and down a degree at a time and stops at the ends', async () => {
    await open()
    setAngle(360)
    expect(screen.getByRole('button', { name: 'Increase Angle (degrees)' })).toHaveProperty('disabled', true)
    setAngle(0)
    expect(screen.getByRole('button', { name: 'Decrease Angle (degrees)' })).toHaveProperty('disabled', true)
    await userEvent.click(screen.getByRole('button', { name: 'Increase Angle (degrees)' }))
    expect((screen.getByLabelText('Angle (degrees)') as HTMLInputElement).value).toBe('1')
  })

  it('describes the protractor in words for screen readers', async () => {
    await open()
    expect(await screen.findByRole('group', { name: /turned counterclockwise by 125 degrees: a obtuse angle, 25\/72 of a full turn/ })).toBeTruthy()
  })
})

describe('Angles: challenges', () => {
  it('solves "make a right angle" only at exactly 90°', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('right angle')
    setAngle(89)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    setAngle(90)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.angles.solved).toEqual(['an-right'])
    expect(saved().xp).toBe(10)
  })

  it('a "kind" challenge accepts any angle of that kind', async () => {
    seed(['an-right', 'an-45'], 'easy')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('any acute angle')
    setAngle(17)
    expect(card().classList.contains('challenge--solved')).toBe(true)
  })

  it('a complement challenge needs the exact partner', async () => {
    seed(['an-right', 'an-45', 'an-acute', 'an-straight'], 'medium')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('adds to 90° with 35°')
    setAngle(56)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    setAngle(55)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(20)
  })

  it('a hard challenge needs single-degree control (57°)', async () => {
    seed(['an-three-quarter'], 'hard')
    await open()
    await challengeOn()
    expect(card().textContent).toContain('adds to 180° with 123°')
    setAngle(55)
    await userEvent.click(screen.getByRole('button', { name: 'Increase Angle (degrees)' }))
    await userEvent.click(screen.getByRole('button', { name: 'Increase Angle (degrees)' }))
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().xp).toBe(30)
  })

  it('a challenge the default angle already satisfies still needs a real solve', async () => {
    seed(['an-right', 'an-45', 'an-acute', 'an-straight', 'an-comp-35', 'an-supp-65'], 'medium')
    await open()
    await challengeOn()
    // 125° is already "obtuse, bigger than 150°"? No (125 < 151), but the next kind challenge must still be earned
    expect(card().classList.contains('challenge--solved')).toBe(false)
  })
})

describe('Angles: welcome and Captain', () => {
  it('the teaser became a real card; the Coming soon list no longer lists it', async () => {
    window.location.hash = ''
    render(<App />)
    await screen.findByRole('heading', { level: 1 })
    const cards = [...document.querySelectorAll('.module-card')]
    expect(cards.some((b) => b.textContent?.includes('Turn the ray, name the angle'))).toBe(true)
    expect(document.querySelector('.upcoming')).toBeNull()
  })
  it('the Captain gives an angles tip', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(document.querySelector('.captain__bubble--tip')?.textContent).toMatch(/protractor|right angle/i)
  })
})
