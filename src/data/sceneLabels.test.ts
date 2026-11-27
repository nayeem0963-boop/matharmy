import { describe, expect, it } from 'vitest'
import { blocksLabel, fractionLabel, geometryLabel, sumLabel, WELCOME_LABEL } from './sceneLabels'
import { computeMetrics, getShape } from './geometryShapes'

describe('scene labels', () => {
  it('describes a fraction, including extra bars for improper fractions', () => {
    expect(fractionLabel(3, 4)).toBe('A fraction bar split into 4 equal blocks. 3 of the blocks are filled, showing 3/4, drawn as one bar.')
    expect(fractionLabel(7, 4)).toContain('drawn as 2 bars')
    expect(fractionLabel(0, 4)).toContain('0 of the blocks')
  })

  it('describes a solid and whether it is unfolded', () => {
    const cube = getShape('cube')
    const m = computeMetrics('cube', { width: 3, height: 3, depth: 3 })
    expect(geometryLabel(cube, m, false)).toBe('A cube shown as a solid. Volume 27 cubic units, surface area 54 square units.')
    expect(geometryLabel(cube, m, true)).toContain('unfolded into a flat net')
    const sphere = getShape('sphere')
    expect(geometryLabel(sphere, computeMetrics('sphere', { width: 1, height: 1, depth: 1 }), true)).toContain('shown as a solid') // no net
  })

  it('describes base-ten blocks with correct singular/plural', () => {
    expect(blocksLabel({ hundreds: 1, tens: 2, ones: 3 })).toBe(
      'Base-ten blocks: 1 hundred flat, 2 ten rods and 3 one cubes. That is 123, one hundred twenty-three.',
    )
    expect(blocksLabel({ hundreds: 0, tens: 1, ones: 1 })).toContain('1 ten rod and 1 one cube')
  })

  it('describes a sum in words', () => {
    expect(sumLabel('add', 27, 15, { hundreds: 0, tens: 4, ones: 2 })).toMatch(/^27 plus 15\. Base-ten blocks/)
    expect(sumLabel('subtract', 52, 27, { hundreds: 0, tens: 2, ones: 5 })).toMatch(/^52 minus 27\./)
  })

  it('has a welcome description', () => {
    expect(WELCOME_LABEL).toContain('Captain Hexa-Cubie')
  })
})
