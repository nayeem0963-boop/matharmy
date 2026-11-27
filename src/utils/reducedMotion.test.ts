import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { prefersReducedMotion, useReducedMotion } from './reducedMotion'

function mockMatchMedia(matches: boolean) {
  let listener: (() => void) | null = null
  const mq = {
    matches,
    addEventListener: (_: string, fn: () => void) => (listener = fn),
    removeEventListener: () => (listener = null),
  }
  vi.stubGlobal('matchMedia', vi.fn(() => mq))
  return {
    set(next: boolean) {
      mq.matches = next
      listener?.()
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('reduced motion preference', () => {
  it('reads the media query', () => {
    mockMatchMedia(true)
    expect(prefersReducedMotion()).toBe(true)
    mockMatchMedia(false)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('is false when matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
    expect(renderHook(() => useReducedMotion()).result.current).toBe(false)
  })

  it('the hook follows changes to the setting', () => {
    const mq = mockMatchMedia(false)
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
    act(() => mq.set(true))
    expect(result.current).toBe(true)
  })
})
