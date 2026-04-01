import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts'],
    env: {
      SKIP_ENV_VALIDATION: '1',
      DATABASE_URL: 'https://example.com/fulling-test',
    },
  },
})
