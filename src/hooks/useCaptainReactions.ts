import { useCallback, useState } from 'react'
import { captainLine, captainTip, type CaptainEvent } from '../data/captainDialogue'
import type { MathModuleId } from '../data/mathModules'
import { levelFromXp } from '../data/xp'
import type { ProgressState } from '../utils/progressStore'

export interface CaptainMessage {
  /** Changes with every message, so the same text can be shown again. */
  id: number
  text: string
  kind: CaptainEvent | 'tip'
}

const snapshot = (p: ProgressState) => ({
  solved: Object.values(p.modules).reduce((n, m) => n + m.solved.length, 0),
  badges: Object.keys(p.badges).length,
  level: levelFromXp(p.xp).level,
})

/**
 * Turns changes in saved progress into things for the Captain to say: a level-up
 * beats a new badge, which beats an ordinary solve. Loading a save, resetting
 * progress, or anything that only goes down says nothing.
 */
export function useCaptainReactions(progress: ProgressState) {
  const now = snapshot(progress)
  const [seen, setSeen] = useState(now)
  const [message, setMessage] = useState<CaptainMessage | null>(null)
  const [count, setCount] = useState(0) // messages said so far: varies the lines

  // Adjust state while rendering (React's pattern for "reacting to a prop change").
  if (now.solved !== seen.solved || now.badges !== seen.badges || now.level !== seen.level) {
    setSeen(now)
    const kind: CaptainEvent | null =
      now.level > seen.level ? 'level' : now.badges > seen.badges ? 'badge' : now.solved > seen.solved ? 'solve' : null
    if (kind) {
      setMessage({ id: count + 1, text: captainLine(kind, count), kind })
      setCount(count + 1)
    }
  }

  const tip = useCallback(
    (module: MathModuleId) => {
      setMessage({ id: count + 1, text: captainTip(module, count), kind: 'tip' })
      setCount(count + 1)
    },
    [count],
  )
  const hide = useCallback(() => setMessage(null), [])

  return { message, tip, hide }
}
