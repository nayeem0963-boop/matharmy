/** Symmetry through the real App (scenes mocked). */
import { render, screen } from '@testing-library/react'
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
for (const scene of ['FractionBlocksScene', 'GeometryExplorerScene', 'PlaceValueScene', 'ArrayScene', 'DivisionScene', 'PatternScene', 'AreaScene', 'DecimalScene', 'DataScene', 'AngleScene', 'PlaneScene', 'NumberLineScene', 'SpinnerScene', 'SymmetryScene', 'CaptainHexaCubieScene']) {
  vi.doMock(`./components/scenes/${scene}`, () => ({ default: () => null }))
}

const { default: App } = await import('./App')

const saved = (): ProgressState => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY)!)
const card = () => document.querySelector('.challenge') as HTMLElement
const click = (name: string | RegExp) => userEvent.click(screen.getByRole('button', { name }))
const challengeOn = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
const overlay = () => screen.getByLabelText(/Symmetry of the/)

const open = async () => {
  window.location.hash = '#/symmetry'
  render(<App />)
  await screen.findByRole('heading', { level: 1, name: 'Symmetry' })
  await screen.findByLabelText('Symmetry of the shape')
}

describe('Symmetry', () => {
  it('shows the lines and turns of the chosen shape', async () => {
    await open()
    expect(overlay().textContent).toContain('Kite')
    expect(overlay().textContent).toContain('1 line of symmetry')
    await click('Regular hexagon')
    expect(overlay().textContent).toContain('6 lines of symmetry')
  })

  it('describes the scene for screen readers', async () => {
    await open()
    expect(screen.getByRole('group', { name: /kite seen from above.*lines of symmetry/i })).toBeTruthy()
  })

  it('mirror view lists the pairs that do not match and clear removes tiles', async () => {
    await open()
    await click('Mirror pattern')
    expect(overlay().textContent).toMatch(/not match/)
    await click('Clear all tiles')
    expect(overlay().textContent).toContain('Symmetric!')
    await click('Start again')
    expect(overlay().textContent).toMatch(/not match/)
  })

  it('solves the first challenge with a square and saves the XP', async () => {
    await open()
    await challengeOn()
    expect(card().textContent).toContain('exactly 4 lines')
    await click('Square')
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.symmetry.solved).toEqual(['sy-lines-4'])
    expect(saved().xp).toBe(10)
  })

  it('a medium mirror challenge starts from its own almost-symmetric picture', async () => {
    const p = defaultProgress()
    p.modules.symmetry = { solved: ['sy-lines-4', 'sy-lines-1', 'sy-lines-0', 'sy-lines-inf'], tier: 'medium', streak: 0, bestStreak: 0 }
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
    await open()
    await challengeOn()
    expect(card().textContent).toContain('left side mirrors the right')
    expect(card().classList.contains('challenge--solved')).toBe(false)
    expect(screen.getByLabelText('Symmetry of the pattern').textContent).toMatch(/not match/)
  })
})
