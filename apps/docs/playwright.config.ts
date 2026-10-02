import { defineConfig } from '@playwright/test';

const externalServer = process.env.PLAYWRIGHT_BASE_URL;
const production = process.env.PLAYWRIGHT_SERVER === 'preview';
const port = production ? 4173 : 5173;
const baseURL = externalServer ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  timeout: 45000,
  expect: { timeout: 8000 },
  retries: 0,
  workers: 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    channel: process.env.CI ? undefined : 'chrome',
    headless: true,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: externalServer
    ? undefined
    : {
        command: production
          ? `npm run preview -- --port ${port} --strictPort`
          : `npm run dev --prefix ../.. -- --port ${port} --strictPort`,
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 300000,
      },
});
