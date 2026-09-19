import { defineConfig, devices } from '@playwright/test';

/** Accessibility (axe, WCAG 2.2 AA tags) and lab performance checks against the built site. */
export default defineConfig({
  testDir: 'tests/a11y',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: [['list']],
  use: { baseURL: 'http://127.0.0.1:4321' },
  webServer: {
    command: 'node scripts/serve-dist.ts',
    url: 'http://127.0.0.1:4321/',
    reuseExistingServer: !process.env['CI'],
    timeout: 30_000,
  },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
