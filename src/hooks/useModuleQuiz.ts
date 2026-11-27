import { useMemo } from 'react'
import { TIERS, challengesForTier, type Tier } from '../data/challenges'
import type { MathModuleId } from '../data/mathModules'
import type { QuizStatus } from '../components/ui/ChallengeCard'
import { firstUnsolvedIndex, useChallenge } from './useChallenge'
import type { useProgress } from './useProgress'

type ProgressApi = Pick<ReturnType<typeof useProgress>, 'progress' | 'recordSolve' | 'breakStreak' | 'setTier'>

interface UseModuleQuizOptions<C extends { id: string; tier: Tier }> {
  module: MathModuleId
  challenges: C[]
  enabled: boolean
  isSolved: (challenge: C) => boolean
  /** Visual/audio celebration when a challenge is solved. */
  onCelebrate: () => void
  progress: ProgressApi
}

/**
 * One module's quiz, wired to saved progress: plays the selected difficulty
 * tier, resumes at its first unsolved challenge, records solves and streaks,
 * and ends the streak when a challenge is skipped.
 */
export function useModuleQuiz<C extends { id: string; tier: Tier }>({
  module,
  challenges,
  enabled,
  isSolved,
  onCelebrate,
  progress,
}: UseModuleQuizOptions<C>) {
  const { recordSolve, breakStreak, setTier } = progress
  const saved = progress.progress.modules[module]
  const tierList = useMemo(() => challengesForTier(challenges, saved.tier), [challenges, saved.tier])

  const q = useChallenge<C>({
    challenges: tierList,
    enabled,
    isSolved,
    onSolve: (c) => {
      recordSolve(module, c.id)
      onCelebrate()
    },
    initialIndex: firstUnsolvedIndex(tierList, saved.solved),
    resetKey: saved.tier,
  })

  const quiz: QuizStatus = {
    solved: q.solved,
    score: challenges.filter((c) => saved.solved.includes(c.id)).length,
    total: challenges.length,
    tier: saved.tier,
    tierStats: Object.fromEntries(
      TIERS.map((t) => {
        const list = challengesForTier(challenges, t)
        return [t, { solved: list.filter((c) => saved.solved.includes(c.id)).length, total: list.length }]
      }),
    ) as QuizStatus['tierStats'],
    streak: saved.streak,
    onTierChange: (t) => setTier(module, t),
    onNext: () => {
      if (!q.solved) breakStreak(module)
      q.next()
    },
  }

  return { challenge: q.challenge, quiz }
}
