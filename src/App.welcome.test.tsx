/** The welcome page: modules grouped by strand, with a grade filter. */
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { mathModules } from './data/mathModules'
import { PROGRESS_STORAGE_KEY, defaultProgress } from './utils/progressStore'

vi.mock('./components/canvas/MathCanvas', () => ({
  default: ({ children }: { children?: unknown }) => <div data-testid="canvas">{children as never}</div>,
}))
vi.mock('./components/scenes/CaptainHexaCubieScene', () => ({ default: () => null }))

const { default: App } = await import('./App')

const open = async () => {
  render(<App />)
  await screen.findByRole('heading', { level: 1 })
}
const cardTitles = (root: ParentNode = document) =>
  [...root.querySelectorAll('.module-card__title')].map((e) => e.textContent)

describe('welcome page grouping', () => {
  it('has a heading per strand, in order, with that strand’s modules under it', async () => {
    await open()
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Number and Operations', 'Geometry and Measurement', 'Mathematical Thinking'])
    const number = screen.getByRole('region', { name: 'Number and Operations' })
    expect(cardTitles(number)).toEqual([
      'Number Sense', 'Add & Subtract', 'Multiplication Arrays', 'Fractions', 'Division and Grouping', 'Decimals and Percentages',
    ])
    const geometry = screen.getByRole('region', { name: 'Geometry and Measurement' })
    expect(cardTitles(geometry)).toEqual(['Area and Perimeter', 'Angles', 'Geometry 3D Explorer'])
    const thinking = screen.getByRole('region', { name: 'Mathematical Thinking' })
    expect(cardTitles(thinking)).toEqual(['Patterns and Sequences', 'Data and Graphs'])
  })

  it('shows every module exactly once under "All grades"', async () => {
    await open()
    expect(cardTitles().length).toBe(mathModules.length)
    expect(new Set(cardTitles()).size).toBe(mathModules.length)
    expect(screen.getByRole('button', { name: 'All grades' }).getAttribute('aria-pressed')).toBe('true')
  })

  it('the grade filter narrows the cards and hides strands with nothing in them', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Grades 1–2' }))
    expect(screen.getByRole('button', { name: 'Grades 1–2' }).getAttribute('aria-pressed')).toBe('true')
    const titles = cardTitles()
    expect(titles).toContain('Number Sense')
    expect(titles).toContain('Patterns and Sequences')
    expect(titles).not.toContain('Decimals and Percentages')
    expect(screen.queryByRole('region', { name: 'Geometry and Measurement' })).toBeNull()
    await userEvent.click(screen.getByRole('button', { name: 'Grades 5–7' }))
    expect(cardTitles()).toContain('Decimals and Percentages')
    expect(cardTitles()).not.toContain('Number Sense')
    await userEvent.click(screen.getByRole('button', { name: 'All grades' }))
    expect(cardTitles().length).toBe(mathModules.length)
  })

  it('cards still open their module, with their stars', async () => {
    const p = defaultProgress()
    p.modules.angles.solved = ['an-right', 'an-45']
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(p))
    await open()
    const geometry = screen.getByRole('region', { name: 'Geometry and Measurement' })
    expect(within(geometry).getByLabelText('2 of 12 challenges solved')).toBeTruthy()
    const angles = [...geometry.querySelectorAll('.module-card')].find((c) => c.textContent?.includes('Angles'))!
    await userEvent.click(angles)
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe('Angles')
  })

  it('the grade filter stays while you are on the welcome page, and resets after visiting a module', async () => {
    await open()
    await userEvent.click(screen.getByRole('button', { name: 'Grades 5–7' }))
    await userEvent.click(screen.getByRole('button', { name: 'MathArmy home' })) // already home: nothing changes
    expect(screen.getByRole('button', { name: 'Grades 5–7' }).getAttribute('aria-pressed')).toBe('true')
    await userEvent.click(screen.getByRole('button', { name: 'Fractions' })) // header tab
    await screen.findByRole('heading', { level: 1, name: 'Fractions' })
    await userEvent.click(screen.getByRole('button', { name: 'MathArmy home' }))
    expect(screen.getByRole('button', { name: 'All grades' }).getAttribute('aria-pressed')).toBe('true')
  })
})
