import { defineConfig, devices } from '@playwright/test';

const PORT = 4200;
const BASE_URL = `http://localhost:${PORT}`;
const isCi = Boolean(process.env['CI']);

/**
 * End-to-end tests against the dev server with the MSW fake backend.
 * Run with `npm run e2e` (first time: `npm run e2e:install`); debug with
 * `npm run e2e:ui`. Guide: docs/architecture/testing.md.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 2 : 0,
  reporter: [[isCi ? 'github' : 'list'], ['html', { open: 'never' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: `npx ng serve --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: !isCi,
    timeout: 180_000,
  },
});
