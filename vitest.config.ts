import { defineConfig } from "vitest/config";

// Tests that import jsdom themselves cannot load its CommonJS/ESM mix inside
// a VM context; they keep the default pool.
const ownJsdomTests = ["tests/i18n.test.ts", "tests/i18n-ui-guard.test.ts"];

export default defineConfig({
  test: {
    environment: "jsdom",
    restoreMocks: true,
    setupFiles: ["tests/setup-rule-candidate-audit.ts"],
    projects: [
      {
        extends: true,
        test: {
          name: "vm",
          // One jsdom per worker instead of one per file (about five times
          // faster); each file still runs in its own VM context.
          pool: "vmThreads",
          include: ["tests/**/*.test.ts", "tests/**/*.test.mjs"],
          exclude: ownJsdomTests
        }
      },
      {
        extends: true,
        test: { name: "own-jsdom", include: ownJsdomTests }
      }
    ]
  }
});
