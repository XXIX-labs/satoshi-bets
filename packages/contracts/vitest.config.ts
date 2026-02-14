import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'clarinet',
    singleThread: true,
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'json', 'html'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
})
