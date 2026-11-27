import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  devtools: {
    // Remove this `apply` property to enable devtools for build as well
    apply: 'serve',
  },
  plugins: [react()],
  build: {
    // three.js core (~740 kB min / ~190 kB gzip) is one indivisible library that
    // R3F imports as a whole namespace. It is lazy-loaded with the first 3D scene
    // and cached separately, so warn only above that size.
    chunkSizeWarningLimit: 800,
    rolldownOptions: {
      output: {
        // Vite 8 bundles with Rolldown. Its legacy `manualChunks` is migrated to a
        // group that also captures every dependency (so drei swallowed three, R3F
        // and React). Explicit groups without recursive capture give clean splits.
        codeSplitting: {
          includeDependenciesRecursively: false,
          groups: [
            { name: 'vendor-three', test: /[\\/]node_modules[\\/]three[\\/]/, priority: 30 },
            { name: 'vendor-r3f', test: /[\\/]node_modules[\\/]@react-three[\\/]fiber[\\/]/, priority: 20 },
            { name: 'vendor-drei', test: /[\\/]node_modules[\\/]@react-three[\\/]drei[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
