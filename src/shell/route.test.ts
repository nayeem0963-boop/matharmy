import { describe, expect, it } from 'vitest'
import { hashForView, viewFromHash } from './route'

describe('hash routes', () => {
  it.each([
    ['', 'welcome'],
    ['#', 'welcome'],
    ['#/', 'welcome'],
    ['#/fractions', 'fractions'],
    ['#/geometry', 'geometry'],
    ['#/number-sense', 'number-sense'],
    ['#fractions', 'fractions'],
    ['#/geometry/', 'geometry'],
  ])('%j -> %s', (hash, view) => {
    expect(viewFromHash(hash)).toBe(view)
  })

  it.each(['#/nope', '#/FRACTIONS', '#/fractions/extra', '#/../x', '#?x=1', 'fractions'])(
    'falls back to welcome for %j',
    (hash) => {
      expect(viewFromHash(hash)).toBe('welcome')
    },
  )

  it('round-trips every view', () => {
    for (const v of ['welcome', 'fractions', 'geometry', 'number-sense'] as const) {
      expect(viewFromHash(hashForView(v))).toBe(v)
    }
  })
})
