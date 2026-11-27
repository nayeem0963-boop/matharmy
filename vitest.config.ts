import { defineConfig } from 'vitest/config'

// Kept separate from vite.config.ts so the production build config is untouched.
export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    setupFiles: ['src/test/setup.ts'],
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      include: ['src/data/**', 'src/hooks/**', 'src/utils/**'],
      exclude: ['src/**/*.test.*', 'src/test/**'],
    },
  },
})
