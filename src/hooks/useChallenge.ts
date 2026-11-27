import { useEffect, useRef, useState } from 'react'

interface UseChallengeOptions<C> {
  challenges: C[]
  enabled: boolean
  isSolved: (challenge: C) => boolean
  onSolve?: (challenge: C) => void
  /** Challenge to start on (e.g. the first one not yet solved in saved progress). */
  initialIndex?: number
  /**
   * When this changes (e.g. the difficulty tier, and with it `challenges`), the
   * quiz restarts at `initialIndex` for the new list.
   */
  resetKey?: string
}

/**
 * Generic quiz loop: tracks the current challenge and detects when the learner's
 * current state solves it (rising edge only, once per challenge visit). Scoring
 * lives in the persistent progress store, which receives `onSolve`.
 */
export function useChallenge<C>({
  challenges,
  enabled,
  isSolved,
  onSolve,
  initialIndex = 0,
  resetKey = '',
}: UseChallengeOptions<C>) {
  const [position, setPosition] = useState(() => ({ key: resetKey, index: initialIndex }))
  // Restart when the list changes (adjusting state during render is React's
  // recommended pattern for resetting on a prop change).
  if (position.key !== resetKey) setPosition({ key: resetKey, index: initialIndex })
  const index = (position.key === resetKey ? position.index : initialIndex) % challenges.length
  const challenge = challenges[index]
  const solved = enabled && isSolved(challenge)

  const onSolveRef = useRef(onSolve)
  useEffect(() => {
    onSolveRef.current = onSolve
  })

  // Celebrate once per challenge visit (key + index identifies the visit).
  const celebrated = useRef<string | null>(null)
  const visit = `${resetKey}:${index}`
  useEffect(() => {
    if (!solved || celebrated.current === visit) return
    celebrated.current = visit
    onSolveRef.current?.(challenge)
  }, [solved, visit, challenge])

  /** Move to the next challenge that is not already satisfied by the current state. */
  const next = () => {
    const n = challenges.length
    let target = (index + 1) % n
    for (let step = 1; step <= n; step++) {
      const i = (index + step) % n
      if (!isSolved(challenges[i])) {
        target = i
        break
      }
    }
    celebrated.current = null
    setPosition({ key: resetKey, index: target })
  }

  return { challenge, solved, next }
}

/** Index of the first challenge whose id is not in `solvedIds` (0 if all are solved). */
export function firstUnsolvedIndex(challenges: { id: string }[], solvedIds: string[]): number {
  const i = challenges.findIndex((c) => !solvedIds.includes(c.id))
  return i === -1 ? 0 : i
}
