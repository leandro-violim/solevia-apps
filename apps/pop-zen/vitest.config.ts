import { defineConfig } from "vitest/config";

// Unit tests target pure logic (game-config scoring, records migration),
// so the default node environment is enough — no jsdom needed.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
