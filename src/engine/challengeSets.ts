import { fractionChallenges, geometryChallenges, isFractionSolved, type GeometryState } from '../data/challenges'
import type { FractionChallenge, GeometryChallenge } from '../data/challenges'
import { addSubtractChallenges, isFinished, type AddSubtractChallenge, type Mat, type Operation } from '../data/addSubtract'
import type { MathModuleId } from '../data/mathModules'
import { angleChallenges, isAngleSolved, type AngleChallenge, type AngleState } from '../data/angles'
import { graphChallenges, isGraphSolved, type GraphChallenge, type GraphState } from '../data/dataGraphs'
import { decimalChallenges, isDecimalSolved, type DecimalChallenge, type DecimalState } from '../data/decimals'
import { areaChallenges, isAreaSolved, type AreaChallenge, type AreaState } from '../data/areaPerimeter'
import { isPatternSolved, patternChallenges, type PatternChallenge, type PatternState } from '../data/patterns'
import { divisionChallenges, isDivisionSolved, type DivisionChallenge, type DivisionState } from '../data/division'
import { arrayChallenges, isArraySolved, type ArrayChallenge, type ArrayState } from '../data/multiplication'
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

/** Add & Subtract state is a lookup: the mat the learner has built for a given sum. */
export type MatLookup = (op: Operation, a: number, b: number) => Mat

export const addSubtractSet: ChallengeSet<AddSubtractChallenge, MatLookup> = {
  module: 'add-subtract',
  challenges: addSubtractChallenges,
  isSolved: (c, matFor) => isFinished(matFor(c.op, c.a, c.b), c.op, c.a, c.b),
}

export const multiplicationSet: ChallengeSet<ArrayChallenge, ArrayState> = {
  module: 'multiplication',
  challenges: arrayChallenges,
  isSolved: isArraySolved,
}

export const divisionSet: ChallengeSet<DivisionChallenge, DivisionState> = {
  module: 'division',
  challenges: divisionChallenges,
  isSolved: isDivisionSolved,
}

export const patternSet: ChallengeSet<PatternChallenge, PatternState> = {
  module: 'patterns',
  challenges: patternChallenges,
  isSolved: isPatternSolved,
}

export const areaSet: ChallengeSet<AreaChallenge, AreaState> = {
  module: 'area-perimeter',
  challenges: areaChallenges,
  isSolved: isAreaSolved,
}

export const decimalSet: ChallengeSet<DecimalChallenge, DecimalState> = {
  module: 'decimals',
  challenges: decimalChallenges,
  isSolved: isDecimalSolved,
}

export const graphSet: ChallengeSet<GraphChallenge, GraphState> = {
  module: 'data-graphs',
  challenges: graphChallenges,
  isSolved: isGraphSolved,
}

export const angleSet: ChallengeSet<AngleChallenge, AngleState> = {
  module: 'angles',
  challenges: angleChallenges,
  isSolved: isAngleSolved,
}

/** Every module's challenges (used for badge rules, XP and tier lookups). */
export const MODULE_CHALLENGES: Record<MathModuleId, ChallengeLike[]> = {
  fractions: fractionSet.challenges,
  geometry: geometrySet.challenges,
  'number-sense': numberSenseSet.challenges,
  'add-subtract': addSubtractSet.challenges,
  multiplication: multiplicationSet.challenges,
  division: divisionSet.challenges,
  patterns: patternSet.challenges,
  'area-perimeter': areaSet.challenges,
  decimals: decimalSet.challenges,
  'data-graphs': graphSet.challenges,
  angles: angleSet.challenges,
}
