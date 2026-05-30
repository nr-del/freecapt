import { resolve } from "node:path";

import { defineConfig } from "vitest/config";

// Unit tests run in a plain Node environment against the pure-logic modules
// (vesting math, the round simulator) — no DB, no React, no jsdom. The `@`
// alias mirrors tsconfig so test files can import like app code.
export default defineConfig({
  resolve: {
    alias: { "@": resolve(__dirname, ".") },
  },
  test: {
    environment: "node",
    include: ["lib/**/*.test.ts"],
  },
});
