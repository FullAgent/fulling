import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.BETTER_AUTH_URL || 'http://127.0.0.1:3000'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node node_modules/next/dist/bin/next dev -H 0.0.0.0 -p 3000',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    env: {
      ...process.env,
      BETTER_AUTH_URL: baseURL,
    },
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'e2e/.auth/state.json',
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        storageState: 'e2e/.auth/state.json',
      },
    },
    {
      name: 'narrow',
      use: {
        viewport: { width: 320, height: 568 },
        storageState: 'e2e/.auth/state.json',
      },
    },
  ],
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
})
