import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    cwd: __dirname,
    env: {
      ...process.env,
      // Point frontend API to mocked routes during tests
      EVENTS_API_URL: 'http://localhost:3000/api-mock',
      NEXT_PUBLIC_EVENTS_API_URL: 'http://localhost:3000/api-mock',
      NEXTAUTH_URL: 'http://localhost:3000',
      NEXTAUTH_SECRET: 'testsecret',
      NEXT_TELEMETRY_DISABLED: '1',
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
