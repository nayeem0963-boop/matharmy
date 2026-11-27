import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Each test starts with empty storage, no hash route and an unmounted React tree.
afterEach(() => {
  cleanup()
  window.localStorage.clear()
  window.history.replaceState(null, '', window.location.pathname) // hash routes must not leak between tests
})
