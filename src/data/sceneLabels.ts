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
