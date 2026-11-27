import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CaptainCompanion } from './CaptainCompanion'

describe('CaptainCompanion', () => {
  it('shows only the Captain when there is nothing to say', () => {
    render(<CaptainCompanion message={null} onTap={() => {}} onHide={() => {}} />)
    expect(screen.getByRole('button', { name: /Captain Hexa-Cubie/ })).toBeTruthy()
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('speaks the message and announces it politely', () => {
    render(<CaptainCompanion message={{ id: 1, text: 'You nailed it!', kind: 'solve' }} onTap={() => {}} onHide={() => {}} />)
    expect(screen.getByRole('status').textContent).toBe('You nailed it!')
  })

  it('asks for a tip when tapped', async () => {
    const onTap = vi.fn()
    render(<CaptainCompanion message={null} onTap={onTap} onHide={() => {}} />)
    await userEvent.click(screen.getByRole('button', { name: /tap for a tip/ }))
    expect(onTap).toHaveBeenCalledTimes(1)
  })

  it('hides itself after a few seconds', () => {
    vi.useFakeTimers()
    const onHide = vi.fn()
    render(<CaptainCompanion message={{ id: 1, text: 'Hi', kind: 'tip' }} onTap={() => {}} onHide={onHide} />)
    expect(onHide).not.toHaveBeenCalled()
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(onHide).toHaveBeenCalledTimes(1)
    vi.useRealTimers()
  })
})
