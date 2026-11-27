import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { firstUnsolvedIndex, useChallenge } from './useChallenge'

interface C {
  id: string
  target: number
}
const list: C[] = [
  { id: 'a', target: 1 },
  { id: 'b', target: 2 },
  { id: 'c', target: 3 },
]

const setup = (value: { current: number }, opts: Partial<Parameters<typeof useChallenge<C>>[0]> = {}) => {
  const onSolve = vi.fn()
  const hook = renderHook(
    (props: { enabled: boolean }) =>
      useChallenge<C>({
        challenges: list,
        enabled: props.enabled,
        isSolved: (c) => c.target === value.current,
        onSolve,
        ...opts,
      }),
    { initialProps: { enabled: true } },
  )
  return { ...hook, onSolve }
}

describe('firstUnsolvedIndex', () => {
  it('finds the first challenge not yet solved', () => {
    expect(firstUnsolvedIndex(list, [])).toBe(0)
    expect(firstUnsolvedIndex(list, ['a'])).toBe(1)
    expect(firstUnsolvedIndex(list, ['a', 'c'])).toBe(1)
  })
  it('returns 0 when everything is solved', () => {
    expect(firstUnsolvedIndex(list, ['a', 'b', 'c'])).toBe(0)
  })
})

describe('useChallenge', () => {
  it('starts on the initial challenge', () => {
    const v = { current: 0 }
    expect(setup(v).result.current.challenge.id).toBe('a')
    expect(setup(v, { initialIndex: 2 }).result.current.challenge.id).toBe('c')
  })

  it('reports solved only while enabled', () => {
    const v = { current: 0 }
    const { result, rerender, onSolve } = setup(v)
    v.current = 1
    rerender({ enabled: true })
    expect(result.current.solved).toBe(true)
    expect(onSolve).toHaveBeenCalledTimes(1)
    rerender({ enabled: false })
    expect(result.current.solved).toBe(false)
  })

  describe('a challenge that is already satisfied when the quiz starts (free-star bug)', () => {
    it('is not solved and does not call onSolve', () => {
      const v = { current: 1 } // already matches challenge "a"
      const { result, onSolve } = setup(v)
      expect(result.current.solved).toBe(false)
      expect(onSolve).not.toHaveBeenCalled()
    })

    it('counts once the learner moves away and builds it again', () => {
      const v = { current: 1 }
      const { result, rerender, onSolve } = setup(v)
      v.current = 5
      rerender({ enabled: true })
      v.current = 1
      rerender({ enabled: true })
      expect(result.current.solved).toBe(true)
      expect(onSolve).toHaveBeenCalledTimes(1)
    })

    it('is not counted when the quiz is switched off and on again without changing anything', () => {
      const v = { current: 0 }
      const { result, rerender, onSolve } = setup(v)
      v.current = 1
      rerender({ enabled: true })
      expect(onSolve).toHaveBeenCalledTimes(1) // genuine solve
      act(() => result.current.next())
      v.current = 2 // matches "b"
      rerender({ enabled: false })
      rerender({ enabled: true })
      expect(result.current.challenge.id).toBe('b')
      expect(result.current.solved).toBe(false)
      expect(onSolve).toHaveBeenCalledTimes(1)
    })

    it('applies again after the difficulty list is reset', () => {
      const v = { current: 0 }
      const onSolve = vi.fn()
      const { result, rerender } = renderHook(
        (p: { key: string }) =>
          useChallenge<C>({
            challenges: list,
            enabled: true,
            isSolved: (c) => c.target === v.current,
            onSolve,
            resetKey: p.key,
          }),
        { initialProps: { key: 'easy' } },
      )
      v.current = 1
      rerender({ key: 'easy' })
      expect(onSolve).toHaveBeenCalledTimes(1)
      rerender({ key: 'medium' }) // new list, still showing 1, which matches "a"
      expect(result.current.solved).toBe(false)
      expect(onSolve).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onSolve once per challenge visit, not on every render', () => {
    const v = { current: 0 }
    const { result, rerender, onSolve } = setup(v)
    expect(onSolve).not.toHaveBeenCalled()
    v.current = 1
    rerender({ enabled: true })
    rerender({ enabled: true })
    expect(onSolve).toHaveBeenCalledTimes(1)
    expect(onSolve).toHaveBeenCalledWith(list[0])
    expect(result.current.solved).toBe(true)
  })

  it('next() moves on and the next challenge can be solved too', () => {
    const v = { current: 0 }
    const { result, rerender, onSolve } = setup(v)
    v.current = 1
    rerender({ enabled: true })
    act(() => result.current.next())
    expect(result.current.challenge.id).toBe('b')
    v.current = 2
    rerender({ enabled: true })
    expect(onSolve).toHaveBeenLastCalledWith(list[1])
    expect(onSolve).toHaveBeenCalledTimes(2)
  })

  it('next() skips challenges the current state already satisfies', () => {
    const v = { current: 2 } // satisfies "b" only
    const { result } = setup(v, { enabled: false } as never)
    act(() => result.current.next())
    expect(result.current.challenge.id).toBe('c') // from a: b is already satisfied, so skip it
  })

  it('wraps around the list', () => {
    const v = { current: 0 }
    const { result } = setup(v, { initialIndex: 2 })
    act(() => result.current.next())
    expect(result.current.challenge.id).toBe('a')
  })

  it('restarts at initialIndex when resetKey changes', () => {
    const v = { current: 0 }
    const onSolve = vi.fn()
    const { result, rerender } = renderHook(
      (p: { key: string; start: number }) =>
        useChallenge<C>({
          challenges: list,
          enabled: true,
          isSolved: (c) => c.target === v.current,
          onSolve,
          initialIndex: p.start,
          resetKey: p.key,
        }),
      { initialProps: { key: 'easy', start: 0 } },
    )
    act(() => result.current.next())
    expect(result.current.challenge.id).toBe('b')
    rerender({ key: 'hard', start: 2 })
    expect(result.current.challenge.id).toBe('c')
  })
})
