import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Each test starts with empty storage and an unmounted React tree.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
})
