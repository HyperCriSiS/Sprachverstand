import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["benchmarks/dom-scale-audit.audit.ts"],
    testTimeout: 120000,
    restoreMocks: true
  }
});
