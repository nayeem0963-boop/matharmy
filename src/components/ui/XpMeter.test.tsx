import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { XpMeter } from './XpMeter'

describe('XpMeter', () => {
  it('is hidden with no XP', () => {
    const { container } = render(<XpMeter xp={0} />)
    expect(container.firstChild).toBeNull()
  })
  it('shows the level and progress to the next', () => {
    render(<XpMeter xp={70} />)
    const m = screen.getByRole('status')
    expect(m.getAttribute('aria-label')).toBe('Level 2, 20 of 100 XP to the next level')
    expect(m.textContent).toContain('Lv 2')
    expect(m.textContent).toContain('70 XP')
    expect((m.querySelector('.xp-meter__fill') as HTMLElement).style.width).toBe('20%')
  })
  it('starts level 1 at the first XP', () => {
    render(<XpMeter xp={10} />)
    expect(screen.getByRole('status').getAttribute('aria-label')).toBe('Level 1, 10 of 50 XP to the next level')
  })
})
