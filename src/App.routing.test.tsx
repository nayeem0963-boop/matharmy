/** Phase 2C: hash navigation and the Academy shell, through the real App (scenes mocked). */
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mathModules } from './data/mathModules'
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
vi.mock('./components/scenes/CaptainHexaCubieScene', () => ({ default: () => null }))

const { default: App } = await import('./App')

const heading = async () => (await screen.findByRole('heading', { level: 1 })).textContent
const openTab = (name: string) => userEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}$`) }))
const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const goTo = (hash: string) =>
  act(async () => {
    window.location.hash = hash
    await new Promise((r) => setTimeout(r, 0)) // jsdom fires hashchange asynchronously
  })

describe('hash navigation', () => {
  it.each([
    ['#/fractions', 'Fractions'],
    ['#/geometry', 'Geometry 3D Explorer'],
    ['#/number-sense', 'Number Sense'],
    ['#/add-subtract', 'Add & Subtract'],
    ['#/multiplication', 'Multiplication Arrays'],
    ['#/division', 'Division and Grouping'],
    ['#/patterns', 'Patterns and Sequences'],
  ])('a link to %s opens that module directly', async (hash, title) => {
    window.location.hash = hash
    render(<App />)
    expect(await heading()).toBe(title)
  })

  it('an unknown route shows the welcome page', async () => {
    window.location.hash = '#/algebra'
    render(<App />)
    expect(await heading()).toMatch(/Math\s*Army/)
  })

  it('clicking a tab or the logo updates the URL', async () => {
    render(<App />)
    await openTab('Geometry')
    expect(window.location.hash).toBe('#/geometry')
    await openTab('Number Sense')
    expect(window.location.hash).toBe('#/number-sense')
    await userEvent.click(screen.getByRole('button', { name: 'MathArmy home' }))
    expect(window.location.hash).toBe('#/')
  })

  it('changing the URL (back/forward, typed link) changes the view and is remembered', async () => {
    render(<App />)
    await goTo('#/fractions')
    expect(await heading()).toBe('Fractions')
    await goTo('#/geometry')
    expect(await heading()).toBe('Geometry 3D Explorer')
    expect(saved().lastView).toBe('geometry')
    await goTo('#/')
    expect(await heading()).toMatch(/Math\s*Army/)
  })

  it('the active tab follows the route', async () => {
    window.location.hash = '#/fractions'
    render(<App />)
    await heading()
    expect(screen.getByRole('button', { name: 'Fractions' }).getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByRole('button', { name: 'Geometry' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('module state survives switching tabs (as before the refactor)', async () => {
    render(<App />)
    await openTab('Fractions')
    const slider = screen.getByLabelText('Numerator') as HTMLInputElement
    await userEvent.type(slider, '{ArrowRight}') // 3 -> 4
    const value = slider.value
    await openTab('Geometry')
    await openTab('Fractions')
    expect((screen.getByLabelText('Numerator') as HTMLInputElement).value).toBe(value)
  })
})

describe('Academy shell', () => {
  it('shows level and XP in the header only once XP has been earned', async () => {
    render(<App />)
    await heading()
    expect(screen.queryByText(/^Lv /)).toBeNull()
    cleanup()
    const p = JSON.parse(JSON.stringify(defaultProgress()))
    p.xp = 130
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
    render(<App />)
    expect((await screen.findByText(/^Lv /)).textContent).toBe('Lv 2')
    expect(screen.getByText('130 XP')).toBeTruthy()
  })

  it('lists every registered module as a tab and a welcome card', async () => {
    render(<App />)
    await heading()
    for (const name of ['Fractions', 'Geometry', 'Number Sense', 'Add & Subtract', 'Multiply', 'Divide', 'Patterns']) {
      expect(screen.getByRole('button', { name })).toBeTruthy()
    }
    expect(document.querySelectorAll('.module-card')).toHaveLength(mathModules.length)
  })

  it('themes the controls with the active module colour (and not on the welcome page)', async () => {
    render(<App />)
    await heading()
    const root = () => document.querySelector('.app') as HTMLElement
    expect(root().style.getPropertyValue('--module-color')).toBe('')
    await openTab('Geometry')
    expect(root().style.getPropertyValue('--module-color')).toBe('#22c55e')
    await openTab('Fractions')
    expect(root().style.getPropertyValue('--module-color')).toBe('#f59e0b')
  })

  it('describes the 3D scene in words, and the description follows the state', async () => {
    render(<App />)
    expect((await screen.findByRole('group', { name: /Captain Hexa-Cubie, your guide/ })).textContent).toBeDefined()
    await openTab('Fractions')
    expect(await screen.findByRole('group', { name: /showing 3\/4/ })).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Numerator'), { target: { value: '5' } })
    expect(await screen.findByRole('group', { name: /showing 5\/4, drawn as 2 bars/ })).toBeTruthy()
    await openTab('Number Sense')
    expect(await screen.findByRole('group', { name: /1 hundred flat, 2 ten rods and 3 one cubes/ })).toBeTruthy()
  })

  it('labels the stage for the current view', async () => {
    render(<App />)
    expect(await screen.findByLabelText('Captain Hexa-Cubie welcome scene')).toBeTruthy()
    await openTab('Geometry')
    expect(await screen.findByLabelText('Geometry 3D Explorer 3D view')).toBeTruthy()
  })
})
