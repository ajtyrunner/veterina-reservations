import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 10000, // 10 sekund místo 30
  
  use: {
    baseURL: 'http://svahy.lvh.me:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 5000, // 5 sekund pro akce
    navigationTimeout: 10000, // 10 sekund pro navigaci
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],

  webServer: [
    {
      command: 'npm run dev:web',
      port: 3000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'npm run dev:api',
      port: 4000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});