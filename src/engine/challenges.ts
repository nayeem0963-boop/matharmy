import type { Tier } from '../data/challenges'
import type { MathModuleId } from '../data/mathModules'

/**
 * Shared challenge/question contracts for every module, today and later.
 *
 * Saved progress only ever stores `id`s, so an id is permanent: never rename or
 * reuse one (see the id-list tests next to each challenge file).
 */
export interface ChallengeLike {
  /** Stable, unique, stored in saved progress. */
  id: string
  tier: Tier
}

/**
 * A module's challenges plus the rule that decides whether the learner's
 * current state solves one. `S` is whatever that module's state looks like.
 * This is what `useModuleQuiz` plays; new modules provide one of these.
 */
export interface ChallengeSet<C extends ChallengeLike = ChallengeLike, S = unknown> {
  module: MathModuleId
  challenges: C[]
  isSolved: (challenge: C, state: S) => boolean
}

/* ----------------------------------------------------------------------------
 * Question kinds. Only 'build' (arrange the 3D model until it matches) exists
 * today. The other shapes are declared so the assessment engine can grow without
 * changing the saved-progress format: every kind is answered or not, by id.
 * -------------------------------------------------------------------------- */
export interface BuildQuestion extends ChallengeLike {
  kind: 'build'
  prompt: string
  hint?: string
}

export interface MultipleChoiceQuestion extends ChallengeLike {
  kind: 'multiple-choice'
  prompt: string
  hint?: string
  choices: string[]
  /** Index into `choices`. */
  answer: number
}

export interface NumericQuestion extends ChallengeLike {
  kind: 'numeric'
  prompt: string
  hint?: string
  answer: number
  /** Accepted distance from `answer` (default exact). */
  tolerance?: number
  unit?: string
}

export type Question = BuildQuestion | MultipleChoiceQuestion | NumericQuestion

/** Pure answer check for the non-build kinds. */
export function isAnswerCorrect(q: MultipleChoiceQuestion | NumericQuestion, answer: number): boolean {
  if (q.kind === 'multiple-choice') return answer === q.answer
  return Math.abs(answer - q.answer) <= (q.tolerance ?? 0)
}
