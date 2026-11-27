import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { captainLine, captainTip } from '../data/captainDialogue'
import { defaultProgress, type ProgressState } from '../utils/progressStore'
import { useCaptainReactions } from './useCaptainReactions'

const withProgress = (mutate: (p: ProgressState) => void) => {
  const p = defaultProgress()
  mutate(p)
  return p
}
const solved = (n: number) =>
  withProgress((p) => {
    p.modules.fractions.solved = Array.from({ length: n }, (_, i) => `f-${i}`)
  })

describe('useCaptainReactions', () => {
  it('says nothing for the progress that is already there', () => {
    const { result } = renderHook(({ p }) => useCaptainReactions(p), { initialProps: { p: solved(3) } })
    expect(result.current.message).toBeNull()
  })

  it('congratulates a new solve', () => {
    const { result, rerender } = renderHook(({ p }) => useCaptainReactions(p), { initialProps: { p: solved(0) } })
    rerender({ p: solved(1) })
    expect(result.current.message).toEqual({ id: 1, text: captainLine('solve', 0), kind: 'solve' })
  })

  it('varies the lines on later solves', () => {
    const { result, rerender } = renderHook(({ p }) => useCaptainReactions(p), { initialProps: { p: solved(0) } })
    rerender({ p: solved(1) })
    const first = result.current.message!.text
    rerender({ p: solved(2) })
    expect(result.current.message!.text).not.toBe(first)
    expect(result.current.message!.id).toBe(2)
  })

  it('a new badge beats a plain solve; a level-up beats a badge', () => {
    const { result, rerender } = renderHook(({ p }) => useCaptainReactions(p), { initialProps: { p: solved(0) } })
    rerender({ p: withProgress((p) => { p.modules.fractions.solved = ['f-1-2']; p.badges = { 'first-steps': 1 } }) })
    expect(result.current.message!.kind).toBe('badge')
    rerender({ p: withProgress((p) => { p.modules.fractions.solved = ['f-1-2', 'f-1-4']; p.badges = { 'first-steps': 1 }; p.xp = 50 }) })
    expect(result.current.message!.kind).toBe('level')
  })

  it('stays quiet when progress goes down (reset) and clears on hide', () => {
    const { result, rerender } = renderHook(({ p }) => useCaptainReactions(p), { initialProps: { p: solved(2) } })
    rerender({ p: solved(3) })
    expect(result.current.message).not.toBeNull()
    act(() => result.current.hide())
    expect(result.current.message).toBeNull()
    rerender({ p: solved(0) })
    expect(result.current.message).toBeNull()
  })

  it('gives a module tip on request', () => {
    const { result } = renderHook(({ p }) => useCaptainReactions(p), { initialProps: { p: solved(0) } })
    act(() => result.current.tip('add-subtract'))
    expect(result.current.message).toEqual({ id: 1, text: captainTip('add-subtract', 0), kind: 'tip' })
  })
})
