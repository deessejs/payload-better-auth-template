import { defineConfig } from '@playwright/test';

const baseURL = process.env.AGENT_TEST_BASE_URL;
if (!baseURL) throw new Error('AGENT_TEST_BASE_URL is required for browser tests.');

export default defineConfig({
  testDir: '.',
  testMatch: '**/*.spec.ts',
  outputDir: '../../../.local/agent-test/playwright-results',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL,
    browserName: 'chromium',
    headless: true,
    trace: 'retain-on-failure',
  },
});
