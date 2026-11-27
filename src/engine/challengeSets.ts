import { fractionChallenges, geometryChallenges, isFractionSolved, type GeometryState } from '../data/challenges'
import type { FractionChallenge, GeometryChallenge } from '../data/challenges'
import type { MathModuleId } from '../data/mathModules'
import {
  isNumberSenseSolved,
  numberSenseChallenges,
  type NumberSenseChallenge,
  type PlaceValueCounts,
} from '../data/placeValue'
import type { ChallengeLike, ChallengeSet } from './challenges'

export interface FractionState {
  numerator: number
  denominator: number
}

export const fractionSet: ChallengeSet<FractionChallenge, FractionState> = {
  module: 'fractions',
  challenges: fractionChallenges,
  isSolved: (c, s) => isFractionSolved(c, s.numerator, s.denominator),
}

export const geometrySet: ChallengeSet<GeometryChallenge, GeometryState> = {
  module: 'geometry',
  challenges: geometryChallenges,
  isSolved: (c, s) => c.check(s),
}

export const numberSenseSet: ChallengeSet<NumberSenseChallenge, PlaceValueCounts> = {
  module: 'number-sense',
  challenges: numberSenseChallenges,
  isSolved: isNumberSenseSolved,
}

/** Every module's challenges (used for badge rules, XP and tier lookups). */
export const MODULE_CHALLENGES: Record<MathModuleId, ChallengeLike[]> = {
  fractions: fractionSet.challenges,
  geometry: geometrySet.challenges,
  'number-sense': numberSenseSet.challenges,
}
