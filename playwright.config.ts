import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  testMatch: '**/*.spec.ts',
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: 'list',
  use: {
    browserName: 'chromium',
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
    ignoreHTTPSErrors: true,
    // OAuth traffic contains secrets. Do not capture it in test artifacts.
    trace: 'off',
    screenshot: 'off',
    video: 'off'
  }
})
