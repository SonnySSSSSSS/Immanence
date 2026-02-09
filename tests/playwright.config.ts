import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './',
  testMatch: ['smoke/**/*.spec.ts'],
  timeout: 60_000,
  expect: {
    timeout: 15_000,
  },
  fullyParallel: false,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort',
    url: 'http://127.0.0.1:4173',
    timeout: 120_000,
    reuseExistingServer: true,
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
});
