/**
 * Phase 2B: the three existing modules, driven through the real App (scenes
 * mocked out): controls, live readouts, challenge completion, stars, badges,
 * and loading of previously saved progress.
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
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
const openTab = (name: string) => userEvent.click(screen.getByRole('button', { name: new RegExp(`^${name}$`) }))
const challengeMode = () => userEvent.click(screen.getByRole('switch', { name: 'Challenge mode' }))
const slide = (label: string, value: number) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value: String(value) } })
const readout = () => document.querySelector('.fraction-readout')!.textContent
const card = () => document.querySelector('.challenge') as HTMLElement
const score = () => card().querySelector('.challenge__score')!.textContent
// Overlays render inside the lazy 3D boundary, so they appear after the chunk resolves.
const overlay = (name: string) => screen.findByLabelText(name)

describe('Fractions', () => {
  it('starts at 3/4 and updates the readout from both controls', async () => {
    render(<App />)
    await openTab('Fractions')
    expect(readout()).toBe('34')
    slide('Numerator', 5)
    slide('Denominator', 6)
    expect(readout()).toBe('56')
  })

  it('keeps the numerator within two wholes when the denominator shrinks', async () => {
    render(<App />)
    await openTab('Fractions')
    slide('Numerator', 8) // 8/4 is the maximum
    slide('Denominator', 2)
    expect(readout()).toBe('42')
    expect((screen.getByLabelText('Numerator') as HTMLInputElement).max).toBe('4')
  })

  it('stops at denominator 12 and 1', async () => {
    render(<App />)
    await openTab('Fractions')
    slide('Denominator', 12)
    expect(screen.getByRole('button', { name: 'Increase Denominator' })).toHaveProperty('disabled', true)
    slide('Denominator', 1)
    expect(screen.getByRole('button', { name: 'Decrease Denominator' })).toHaveProperty('disabled', true)
  })

  it('solving a challenge saves a star and unlocks First Steps', async () => {
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    expect(card().textContent).toContain('1/2')
    expect(score()).toBe('★ 0/12')
    slide('Denominator', 2)
    slide('Numerator', 1)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(score()).toBe('★ 1/12')
    expect(saved().modules.fractions.solved).toEqual(['f-1-2'])
    expect(saved().badges).toHaveProperty('first-steps')
    expect(await screen.findByText('Badge unlocked!')).toBeTruthy()
  })

  it('accepts an equivalent fraction and says so', async () => {
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    slide('Denominator', 4)
    slide('Numerator', 2) // 2/4 = 1/2
    expect(card().textContent).toContain('Correct! 2/4 = 1/2')
    expect(saved().modules.fractions.solved).toEqual(['f-1-2'])
  })

  it('does not count a wrong fraction', async () => {
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    slide('Denominator', 3)
    slide('Numerator', 1)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    expect(saved().modules.fractions.solved).toEqual([])
  })

  it('unlocks Fraction Finder when the last Easy fraction is solved', async () => {
    save((p) => {
      p.modules.fractions.solved = ['f-1-2', 'f-1-4', 'f-3-4']
    })
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    expect(card().textContent).toContain('2/3') // resumes at the first unsolved
    slide('Denominator', 3)
    slide('Numerator', 2)
    expect(saved().badges).toHaveProperty('fraction-finder')
    expect(await screen.findByText('Fraction Finder')).toBeTruthy()
  })

  it('skipping ends the streak, solving grows it', async () => {
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    slide('Denominator', 2)
    slide('Numerator', 1) // solves f-1-2
    expect(saved().modules.fractions.streak).toBe(1)
    await userEvent.click(screen.getByRole('button', { name: 'Next challenge →' }))
    await userEvent.click(screen.getByRole('button', { name: 'Skip' }))
    expect(saved().modules.fractions.streak).toBe(0)
    expect(saved().modules.fractions.bestStreak).toBe(1)
  })

  it('switching difficulty is saved and starts that tier', async () => {
    render(<App />)
    await openTab('Fractions')
    await challengeMode()
    await userEvent.click(within(card()).getByRole('radio', { name: /Hard/ }))
    expect(saved().modules.fractions.tier).toBe('hard')
    expect(card().textContent).toContain('5/4')
  })
})

describe('Geometry 3D Explorer', () => {
  it('shows live volume and surface area and switches solids', async () => {
    render(<App />)
    await openTab('Geometry')
    const cube = await overlay('Cube measurements')
    expect(cube.textContent).toContain('V = a³')
    expect(cube.textContent).toContain('27')
    expect(cube.textContent).toContain('54')
    slide('Edge', 4)
    expect((await overlay('Cube measurements')).textContent).toContain('64')
    expect((await overlay('Cube measurements')).textContent).toContain('96')

    await userEvent.click(screen.getByRole('button', { name: 'Cylinder' }))
    const cyl = await overlay('Cylinder measurements')
    expect(cyl.textContent).toContain('V = πr²h')
    expect(screen.getByLabelText('Radius')).toBeTruthy()
    expect(screen.getByLabelText('Height')).toBeTruthy()
  })

  it('offers the right controls for each solid', async () => {
    render(<App />)
    await openTab('Geometry')
    const controls: Record<string, string[]> = {
      'Rectangular Prism': ['Length', 'Width', 'Height'],
      Sphere: ['Radius'],
      'Triangular Prism': ['Base', 'Triangle height', 'Length'],
    }
    for (const [shape, labels] of Object.entries(controls)) {
      await userEvent.click(screen.getByRole('button', { name: shape }))
      for (const l of labels) expect(screen.getByLabelText(l)).toBeTruthy()
    }
  })

  it('net toggle is available and labels the sphere as not applicable', async () => {
    render(<App />)
    await openTab('Geometry')
    expect(screen.getByRole('switch', { name: 'Unfold into net' })).toBeTruthy()
    await userEvent.click(screen.getByRole('button', { name: 'Sphere' }))
    expect(screen.getByRole('switch', { name: /n\/a for sphere/ })).toBeTruthy()
  })

  it('the first challenge needs a real solve (free-star fix), then saves it', async () => {
    render(<App />)
    await openTab('Geometry')
    await challengeMode()
    expect(card().textContent).toContain('volume of 27')
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Edge', 2)
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Edge', 3)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules.geometry.solved).toEqual(['g-cube-27'])
    expect(score()).toBe('★ 1/12')
  })

  it('recognises a solid by its properties (sphere challenge)', async () => {
    save((p) => {
      p.modules.geometry.solved = ['g-cube-27', 'g-5-faces', 'g-curved']
    })
    render(<App />)
    await openTab('Geometry')
    await challengeMode()
    expect(card().textContent).toContain('no edges and no vertices')
    await userEvent.click(screen.getByRole('button', { name: 'Sphere' }))
    expect(saved().modules.geometry.solved).toContain('g-sphere')
    expect(saved().badges).toHaveProperty('shape-shifter')
  })
})

describe('Number Sense', () => {
  const number = () => document.querySelector('.number-readout')!.textContent
  const regroupBtn = (label: RegExp) => screen.getByRole('button', { name: label }) as HTMLButtonElement

  it('starts at 123 and shows the number in words and expanded form', async () => {
    render(<App />)
    await openTab('Number Sense')
    const o = await overlay('Number built from blocks')
    expect(number()).toBe('123')
    expect(o.textContent).toContain('one hundred twenty-three')
    expect(o.textContent).toContain('100 + 20 + 3')
  })

  it('builds numbers from the steppers', async () => {
    render(<App />)
    await openTab('Number Sense')
    await overlay('Number built from blocks')
    slide('Hundreds', 4)
    slide('Tens', 0)
    slide('Ones', 6)
    expect(number()).toBe('406')
    expect((await overlay('Number built from blocks')).textContent).toContain('400 + 6')
  })

  it('clear removes every block', async () => {
    render(<App />)
    await openTab('Number Sense')
    await overlay('Number built from blocks')
    await userEvent.click(screen.getByRole('button', { name: 'Clear all blocks' }))
    expect(number()).toBe('0')
  })

  it('regrouping changes the build but never the number', async () => {
    render(<App />)
    await openTab('Number Sense')
    await overlay('Number built from blocks')
    expect(regroupBtn(/10 ones → 1 ten/).disabled).toBe(true) // only 3 ones
    slide('Ones', 12)
    expect(number()).toBe('132')
    expect((await overlay('Number built from blocks')).textContent).toContain('Not standard form')
    await userEvent.click(regroupBtn(/10 ones → 1 ten/))
    expect(number()).toBe('132')
    expect((screen.getByLabelText('Tens') as HTMLInputElement).value).toBe('3')
    expect((screen.getByLabelText('Ones') as HTMLInputElement).value).toBe('2')
    await userEvent.click(regroupBtn(/1 hundred → 10 tens/))
    expect(number()).toBe('132')
    expect((screen.getByLabelText('Hundreds') as HTMLInputElement).value).toBe('0')
    expect((screen.getByLabelText('Tens') as HTMLInputElement).value).toBe('13')
  })

  it('solves a build-the-number challenge and saves it', async () => {
    render(<App />)
    await openTab('Number Sense')
    await challengeMode()
    expect(card().textContent).toContain('243')
    slide('Hundreds', 2)
    slide('Tens', 4)
    slide('Ones', 3)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['number-sense'].solved).toEqual(['n-243'])
  })

  it('a challenge that needs exact blocks rejects the right number built the wrong way', async () => {
    save((p) => {
      p.modules['number-sense'].tier = 'medium'
      p.modules['number-sense'].solved = ['n-406', 'n-505']
    })
    render(<App />)
    await openTab('Number Sense')
    await challengeMode()
    expect(card().textContent).toContain('exactly 14 ones')
    slide('Hundreds', 0)
    slide('Tens', 3)
    slide('Ones', 4) // 34, but not built from 14 ones
    expect(card().classList.contains('challenge--solved')).toBe(false)
    slide('Tens', 2)
    slide('Ones', 14)
    expect(card().classList.contains('challenge--solved')).toBe(true)
    expect(saved().modules['number-sense'].solved).toContain('n-34-14')
  })
})

describe('saved progress', () => {
  it('loads an original v1 save: stars, badges, no spurious toast, then upgrades the record', async () => {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({
        version: 1,
        modules: {
          fractions: { solved: ['f-1-2', 'f-1-4', 'f-3-4', 'f-2-3'] },
          geometry: { solved: ['g-cube-27'] },
          'number-sense': { solved: [] },
        },
        soundOn: true,
        lastView: 'welcome',
      }),
    )
    render(<App />)
    expect(await screen.findByLabelText('4 of 12 challenges solved')).toBeTruthy()
    expect(screen.getByLabelText('1 of 12 challenges solved')).toBeTruthy()
    expect(screen.queryByText('Badge unlocked!')).toBeNull()
    expect(screen.getByText('Fraction Finder').closest('li')!.className).toContain('badge-tile--earned')
    expect(saved().version).toBe(3)
    expect(saved().xp).toBe(50)
    expect(saved().badges).toHaveProperty('fraction-finder')
  })

  it('loads a v2 save with a chosen difficulty and resumes there', async () => {
    save((p) => {
      p.modules.geometry.tier = 'hard'
      p.modules.geometry.solved = ['g-prism-area-52']
    })
    render(<App />)
    await openTab('Geometry')
    await challengeMode()
    expect(within(card()).getByRole('radio', { name: /Hard/ }).getAttribute('aria-checked')).toBe('true')
    expect(card().textContent).toContain('triangular prism with a volume of 12') // first unsolved Hard
  })

  it('shows locked and earned badges on the welcome page', async () => {
    save((p) => {
      p.badges = { 'first-steps': 1 }
      p.modules.fractions.solved = ['f-1-2']
    })
    render(<App />)
    expect(screen.getByText('First Steps').closest('li')!.className).toContain('badge-tile--earned')
    expect(screen.getByText('Hot Streak').closest('li')!.className).not.toContain('badge-tile--earned')
  })

  it('reset progress clears stars and badges after confirmation', async () => {
    save((p) => {
      p.modules.fractions.solved = ['f-1-2']
      p.badges = { 'first-steps': 1 }
    })
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Reset progress/ }))
    expect(saved().modules.fractions.solved).toEqual([])
    expect(saved().badges).toEqual({})
  })

  it('does not reset when the confirmation is declined', async () => {
    save((p) => {
      p.modules.fractions.solved = ['f-1-2']
    })
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Reset progress/ }))
    expect(saved().modules.fractions.solved).toEqual(['f-1-2'])
  })

  it('persists the sound preference', async () => {
    render(<App />)
    await userEvent.click(screen.getByRole('button', { name: /Sound on/ }))
    expect(saved().soundOn).toBe(false)
  })
})
