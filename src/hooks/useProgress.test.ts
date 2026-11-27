import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PROGRESS_STORAGE_KEY, defaultProgress, loadProgress, saveProgress } from '../utils/progressStore'
import { useProgress } from './useProgress'

const stored = () => JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? 'null')

describe('useProgress', () => {
  it('starts from saved progress', () => {
    const s = defaultProgress()
    s.modules.fractions.solved = ['f-1-2']
    s.soundOn = false
    saveProgress(s)
    const { result } = renderHook(() => useProgress())
    expect(result.current.progress.modules.fractions.solved).toEqual(['f-1-2'])
    expect(result.current.progress.soundOn).toBe(false)
  })

  it('recordSolve adds the challenge once, grows the streak and persists', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.recordSolve('fractions', 'f-1-2'))
    act(() => result.current.recordSolve('fractions', 'f-1-2'))
    const m = result.current.progress.modules.fractions
    expect(m.solved).toEqual(['f-1-2'])
    expect(m.streak).toBe(2) // streak counts solves in a row, even a repeat
    expect(m.bestStreak).toBe(2)
    expect(stored().modules.fractions.solved).toEqual(['f-1-2'])
  })

  it('breakStreak resets the streak but keeps the best streak and solves', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.recordSolve('geometry', 'g-sphere'))
    act(() => result.current.recordSolve('geometry', 'g-curved'))
    act(() => result.current.breakStreak('geometry'))
    const m = result.current.progress.modules.geometry
    expect(m.streak).toBe(0)
    expect(m.bestStreak).toBe(2)
    expect(m.solved).toEqual(['g-sphere', 'g-curved'])
  })

  it('keeps streaks and solves separate per module', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.recordSolve('fractions', 'f-1-2'))
    expect(result.current.progress.modules.geometry.streak).toBe(0)
    expect(result.current.progress.modules['number-sense'].solved).toEqual([])
  })

  it('setTier, setSoundOn and setLastView update and persist', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.setTier('number-sense', 'hard'))
    act(() => result.current.setSoundOn(false))
    act(() => result.current.setLastView('geometry'))
    expect(result.current.progress.modules['number-sense'].tier).toBe('hard')
    expect(result.current.progress.soundOn).toBe(false)
    expect(result.current.progress.lastView).toBe('geometry')
    expect(stored()).toMatchObject({ soundOn: false, lastView: 'geometry' })
  })

  it('unlocks First Steps on the first solve and queues a toast once', () => {
    const { result } = renderHook(() => useProgress())
    expect(result.current.badgeQueue).toEqual([])
    act(() => result.current.recordSolve('fractions', 'f-1-2'))
    expect(result.current.progress.badges).toHaveProperty('first-steps')
    expect(result.current.badgeQueue).toEqual(['first-steps'])
    act(() => result.current.recordSolve('fractions', 'f-1-4'))
    expect(result.current.badgeQueue).toEqual(['first-steps'])
    act(() => result.current.dismissBadge())
    expect(result.current.badgeQueue).toEqual([])
  })

  it('unlocks the streak badge after 3 solves in a row, but not after a skip in between', () => {
    const a = renderHook(() => useProgress())
    act(() => a.result.current.recordSolve('fractions', 'f-1-2'))
    act(() => a.result.current.recordSolve('fractions', 'f-1-4'))
    act(() => a.result.current.breakStreak('fractions'))
    act(() => a.result.current.recordSolve('fractions', 'f-3-4'))
    expect(a.result.current.progress.badges).not.toHaveProperty('hot-streak')
    act(() => a.result.current.recordSolve('fractions', 'f-2-3'))
    act(() => a.result.current.recordSolve('fractions', 'f-2-5'))
    expect(a.result.current.progress.badges).toHaveProperty('hot-streak')
  })

  it('does not announce badges granted while loading an old save', () => {
    window.localStorage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify({ version: 1, modules: { fractions: { solved: ['f-1-2'] } } }),
    )
    const { result } = renderHook(() => useProgress())
    expect(result.current.progress.badges).toHaveProperty('first-steps')
    expect(result.current.badgeQueue).toEqual([])
  })

  it('resetProgress clears solves, streaks, tiers and badges but keeps the sound preference', () => {
    const { result } = renderHook(() => useProgress())
    act(() => result.current.recordSolve('fractions', 'f-1-2'))
    act(() => result.current.setTier('fractions', 'hard'))
    act(() => result.current.setSoundOn(false))
    act(() => result.current.resetProgress())
    const p = result.current.progress
    expect(p.modules.fractions).toEqual({ solved: [], tier: 'easy', streak: 0, bestStreak: 0 })
    expect(p.badges).toEqual({})
    expect(p.soundOn).toBe(false)
    expect(result.current.badgeQueue).toEqual([])
    expect(loadProgress().modules.fractions.solved).toEqual([])
  })

  it('syncs from another tab through the storage event and ignores other keys', () => {
    const { result } = renderHook(() => useProgress())
    const other = defaultProgress()
    other.modules.geometry.solved = ['g-sphere']
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(other))
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: 'something-else' }))
    })
    expect(result.current.progress.modules.geometry.solved).toEqual([])
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_STORAGE_KEY }))
    })
    expect(result.current.progress.modules.geometry.solved).toEqual(['g-sphere'])
  })

  it('removes its storage listener on unmount', () => {
    const { unmount, result } = renderHook(() => useProgress())
    unmount()
    const other = defaultProgress()
    other.soundOn = false
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(other))
    window.dispatchEvent(new StorageEvent('storage', { key: PROGRESS_STORAGE_KEY }))
    expect(result.current.progress.soundOn).toBe(true)
  })
})
