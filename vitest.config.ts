import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'node',
    include: ['**/*.test.ts', '**/*.test.tsx'],
    env: {
      SKIP_ENV_VALIDATION: '1',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/fulling_test',
    },
  },
})
