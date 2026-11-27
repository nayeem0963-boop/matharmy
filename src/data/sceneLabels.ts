import { TRIANGLE_NAMES, locationText, pairText, type PlaneMode, type Vec } from './coordinatePlane'
import { KIND_NAMES, classify, turnFraction } from './angles'
import { formatStat, meanOf, medianOf, rangeOf, totalOf, type Topic } from './dataGraphs'
import { decimalText, fractionText, percentText, placeWords } from './decimals'
import { SHAPE_LABELS, areaOf, perimeterOf, type AreaState } from './areaPerimeter'
import { TERMS_SHOWN, ruleSentence, termAt, termsOf, type PatternState } from './patterns'
import { describe as describeDivision, type DivisionState } from './division'
import { OPERATION_SYMBOL, type Operation } from './addSubtract'
import { formatNumber, type ShapeDefinition, type ShapeMetrics } from './geometryShapes'
import { numberToWords, placeValueTotal, type PlaceValueCounts } from './placeValue'

/**
 * Text descriptions of what the 3D view is showing, for screen readers. The
 * canvas itself cannot be read, so each module describes its scene in words.
 */
export const WELCOME_LABEL =
  'Captain Hexa-Cubie, your guide, standing on a glowing platform ringed with floating math symbols. Tap him to say hello.'

export function fractionLabel(numerator: number, denominator: number): string {
  const wholes = Math.max(1, Math.ceil(numerator / denominator))
  const bars = wholes === 1 ? 'one bar' : `${wholes} bars`
  return `A fraction bar split into ${denominator} equal blocks. ${numerator} of the blocks are filled, showing ${numerator}/${denominator}, drawn as ${bars}.`
}

export function geometryLabel(shape: ShapeDefinition, metrics: ShapeMetrics, unfolded: boolean): string {
  const state = unfolded && shape.hasNet ? 'unfolded into a flat net' : 'shown as a solid'
  return `A ${shape.name.toLowerCase()} ${state}. Volume ${formatNumber(metrics.volume)} cubic units, surface area ${formatNumber(metrics.surfaceArea)} square units.`
}

export function blocksLabel(counts: PlaceValueCounts): string {
  const total = placeValueTotal(counts)
  const part = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
  return `Base-ten blocks: ${part(counts.hundreds, 'hundred flat', 'hundred flats')}, ${part(counts.tens, 'ten rod', 'ten rods')} and ${part(counts.ones, 'one cube', 'one cubes')}. That is ${total}, ${numberToWords(total)}.`
}

export function sumLabel(op: Operation, a: number, b: number, counts: PlaceValueCounts): string {
  return `${a} ${OPERATION_SYMBOL[op] === '+' ? 'plus' : 'minus'} ${b}. ${blocksLabel(counts)}`
}

export function arrayLabel(rows: number, cols: number, counted: number): string {
  const counting = counted > 0 ? ` The first ${counted} ${counted === 1 ? 'row is' : 'rows are'} highlighted for counting.` : ''
  return `An array of cubes: ${rows} ${rows === 1 ? 'row' : 'rows'} of ${cols}, ${rows * cols} cubes in all, showing ${rows} times ${cols} equals ${rows * cols}.${counting}`
}

export function divisionLabel(s: DivisionState): string {
  return `Cubes laid out in rows, one row per group, with any left-over cubes in red in a separate row. ${describeDivision(s)}.`
}

export function patternLabel(p: PatternState, findN: number): string {
  return `A bar for each of the first ${TERMS_SHOWN} terms: ${termsOf(p).join(', ')}. ${ruleSentence(p)}. Term ${findN} is ${termAt(p, findN)}.`
}

export function areaLabel(s: AreaState, showArea: boolean, showPerimeter: boolean): string {
  const what = s.shape === 'rect' ? `A rectangle ${s.w} wide and ${s.h} tall` : `An L-shape in a ${s.w} by ${s.h} box with a ${s.nw} by ${s.nh} notch cut from one corner`
  const shown = [showArea ? 'unit tiles for the area' : '', showPerimeter ? 'orange edges for the perimeter' : ''].filter(Boolean).join(' and ')
  return `${what}, seen from above${shown ? ` with ${shown}` : ''}. Area ${areaOf(s)} square units, perimeter ${perimeterOf(s)} units. (${SHAPE_LABELS[s.shape]})`
}

export function decimalLabel(squares: number): string {
  return `A grid of 100 squares in 10 columns, with ${squares} shaded: ${placeWords(squares)}. That is ${decimalText(squares)} as a decimal, ${fractionText(squares)} as a fraction and ${percentText(squares)} as a percent.`
}

export function graphLabel(topic: Topic, values: number[], showMean: boolean): string {
  const bars = topic.categories.map((c, i) => `${c} ${values[i]}`).join(', ')
  return `A bar graph of ${topic.question.toLowerCase()}: ${bars}. Total ${totalOf(values)}, mean ${formatStat(meanOf(values))}, median ${formatStat(medianOf(values))}, range ${rangeOf(values)}.${showMean ? ' An orange line marks the mean.' : ''}`
}

export function angleLabel(angle: number): string {
  return `A protractor seen from above. A fixed ray points right and a second ray is turned counterclockwise by ${angle} degrees: a ${KIND_NAMES[classify(angle)]}, ${turnFraction(angle)} of a full turn. Click the protractor to turn the ray.`
}

export function planeLabel(mode: PlaneMode, point: Vec, triangle: Vec[]): string {
  const grid = 'A coordinate plane seen from above, from -6 to 6 on both axes.'
  if (mode === 'plot') return `${grid} A point at ${pairText(point)}, ${locationText(point)}. Click the plane to move it.`
  return `${grid} A triangle with corners ${triangle.map((c, i) => `${TRIANGLE_NAMES[i]} at ${pairText(c)}`).join(', ')}, and a faint copy where it started.`
}
