import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
    // Lead tests start a real local D1 (Miniflare/workerd) per test. Startup is slow and varies
    // with machine load, so the default 5s timeout is not a meaningful signal here.
    testTimeout: 60_000,
    hookTimeout: 60_000,
  },
});
