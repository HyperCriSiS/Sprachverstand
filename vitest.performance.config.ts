import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["benchmarks/**/*.bench.ts"],
    restoreMocks: true,
    testTimeout: 30_000
  }
});
