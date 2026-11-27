/**
 * Regression tests for the two bugs found in the Phase 1 audit, plus
 * characterisation of the navigation behaviour.
 *
 * The bug tests assert the correct behaviour. They were `it.fails` at the end
 * of Phase 2A (bugs reproduced) and became plain `it` once Phase 2B fixed them.
 *
 * The three.js scenes are replaced with empty components: these tests cover the
 * React shell, state and persistence, not WebGL.
 */
import { render, screen, within } from '@testing-library/react'
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

const save = (mutate: (p: ProgressState) => void) => {
  const p = defaultProgress()
  mutate(p)
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
}
const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const heading = () => screen.findByRole('heading', { level: 1 })
const openTab = (name: string) => userEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}$`) }))
const challengeMode = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))

describe('navigation (current behaviour)', () => {
  it('opens on the welcome page', async () => {
    render(<App />)
    expect((await heading()).textContent).toMatch(/Math\s*Army/)
  })

  it('switches between the three modules with the header tabs', async () => {
    render(<App />)
    await openTab('Fractions')
    expect((await heading()).textContent).toBe('Fractions')
    await openTab('Geometry')
    expect((await heading()).textContent).toBe('Geometry 3D Explorer')
    await openTab('Number Sense')
    expect((await heading()).textContent).toBe('Number Sense')
    await userEvent.click(screen.getByRole('button', { name: 'MathArmy home' }))
    expect((await heading()).textContent).toMatch(/Math\s*Army/)
  })

  it('records the module being viewed in saved progress', async () => {
    render(<App />)
    await openTab('Geometry')
    expect(saved().lastView).toBe('geometry')
  })

  it('shows saved stars on the welcome cards', async () => {
    save((p) => {
      p.modules.fractions.solved = ['f-1-2', 'f-1-4']
    })
    render(<App />)
    expect(await screen.findByLabelText('2 of 12 challenges solved')).toBeTruthy()
  })
})

describe('regression: Geometry gives a free star when Challenge mode is switched on', () => {
  // Default cube (edge 3, volume 27) already satisfies the first challenge
  // "Build a cube with a volume of 27".
  it('does not pre-solve the first Geometry challenge', async () => {
    render(<App />)
    await openTab('Geometry')
    await challengeMode()
    const card = document.querySelector('.challenge')!
    expect(card.classList.contains('challenge--solved')).toBe(false)
    expect(saved().modules.geometry.solved).toEqual([])
    expect(within(card as HTMLElement).getByText(/Quick Quiz/)).toBeTruthy()
  })

  it('does not unlock First Steps just by opening Challenge mode', async () => {
    render(<App />)
    await openTab('Geometry')
    await challengeMode()
    expect(saved().badges).toEqual({})
  })

  it('same problem for Fractions once earlier challenges are saved (default 3/4 solves f-3-4)', async () => {
    save((p) => {
      p.modules.fractions.solved = ['f-1-2', 'f-1-4']
    })
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    expect(document.querySelector('.challenge--solved')).toBeNull()
    expect(saved().modules.fractions.solved).toEqual(['f-1-2', 'f-1-4'])
  })
})

describe('regression: the saved last module is used (as a Continue shortcut, welcome stays the landing page)', () => {
  const continueButton = () => screen.queryByRole('button', { name: /^Continue:/ })

  it('always opens on the welcome page, even when a module was saved', async () => {
    save((p) => {
      p.lastView = 'geometry'
    })
    render(<App />)
    expect((await heading()).textContent).toMatch(/Math\s*Army/)
  })

  it('offers a Continue shortcut to the saved module, and it works', async () => {
    save((p) => {
      p.lastView = 'number-sense'
    })
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /^Continue: Number Sense/ }))
    expect((await heading()).textContent).toBe('Number Sense')
  })

  it('shows no Continue shortcut for a first visit, nor after the learner went home', async () => {
    render(<App />)
    expect(continueButton()).toBeNull()
    await openTab('Geometry')
    await userEvent.click(screen.getByRole('button', { name: 'MathArmy home' }))
    expect(continueButton()).toBeNull()
    expect(saved().lastView).toBe('welcome')
  })
})
