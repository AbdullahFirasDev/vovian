import { defineConfig } from 'vitest/config'

// Root unit-test runner: shared business logic + validation schemas.
// App-level tests live inside each app (storefront e2e via Playwright, admin via Vitest).
export default defineConfig({
  test: {
    include: ['packages/**/*.test.ts', 'apps/admin/src/**/*.test.{ts,tsx}'],
    environment: 'node',
  },
})
