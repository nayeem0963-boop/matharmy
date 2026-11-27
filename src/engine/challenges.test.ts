import { describe, expect, it } from 'vitest'
import { fractionSet, geometrySet, numberSenseSet, MODULE_CHALLENGES } from './challengeSets'
import { isAnswerCorrect, type MultipleChoiceQuestion, type NumericQuestion } from './challenges'
import { computeMetrics, effectiveDimensions } from '../data/geometryShapes'
import { mathModules } from '../data/mathModules'

describe('challenge sets', () => {
  it('there is one set per module, keyed consistently', () => {
    expect(fractionSet.module).toBe('fractions')
    expect(geometrySet.module).toBe('geometry')
    expect(numberSenseSet.module).toBe('number-sense')
    expect(Object.keys(MODULE_CHALLENGES).sort()).toEqual(mathModules.map((m) => m.id).sort())
  })

  it('challenge ids are unique across all modules', () => {
    const ids = Object.values(MODULE_CHALLENGES).flat().map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('fractions: isSolved applies the equivalent-fraction rule', () => {
    const half = fractionSet.challenges[0]
    expect(fractionSet.isSolved(half, { numerator: 2, denominator: 4 })).toBe(true)
    expect(fractionSet.isSolved(half, { numerator: 1, denominator: 3 })).toBe(false)
  })

  it('geometry: isSolved delegates to the challenge check', () => {
    const dimensions = effectiveDimensions('cube', { width: 3, height: 3, depth: 3 })
    const state = { shapeId: 'cube' as const, dimensions, metrics: computeMetrics('cube', dimensions) }
    expect(geometrySet.isSolved(geometrySet.challenges[0], state)).toBe(true)
    expect(geometrySet.isSolved(geometrySet.challenges[3], state)).toBe(false)
  })

  it('number sense: isSolved applies target and required blocks', () => {
    expect(numberSenseSet.isSolved(numberSenseSet.challenges[0], { hundreds: 2, tens: 4, ones: 3 })).toBe(true)
    expect(numberSenseSet.isSolved(numberSenseSet.challenges[0], { hundreds: 2, tens: 4, ones: 4 })).toBe(false)
  })
})

describe('question kinds (shared answer checks)', () => {
  const mc: MultipleChoiceQuestion = {
    id: 'q1', tier: 'easy', kind: 'multiple-choice', prompt: '2 + 2?', choices: ['3', '4', '5'], answer: 1,
  }
  const num: NumericQuestion = { id: 'q2', tier: 'medium', kind: 'numeric', prompt: 'π to 2dp', answer: 3.14, tolerance: 0.01 }

  it('multiple choice needs the right index', () => {
    expect(isAnswerCorrect(mc, 1)).toBe(true)
    expect(isAnswerCorrect(mc, 0)).toBe(false)
  })
  it('numeric answers respect tolerance (exact by default)', () => {
    expect(isAnswerCorrect(num, 3.141)).toBe(true)
    expect(isAnswerCorrect(num, 3.2)).toBe(false)
    expect(isAnswerCorrect({ ...num, tolerance: undefined }, 3.14)).toBe(true)
    expect(isAnswerCorrect({ ...num, tolerance: undefined }, 3.141)).toBe(false)
  })
})
