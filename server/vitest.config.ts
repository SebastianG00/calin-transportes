import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "supabase/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    fileParallelism: false,
    // DB-backed tests hit a live (free-tier) Supabase that can cold-start;
    // 5s default is too tight and caused a spurious timeout. 15s is safe.
    testTimeout: 15000,
    hookTimeout: 15000,
  },
});
