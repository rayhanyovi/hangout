import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      "server-only": path.resolve(__dirname, "test", "mocks", "server-only.ts"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./test/setup.ts"],
    css: true,
    include: [
      "components/**/*.test.ts",
      "components/**/*.test.tsx",
      "lib/**/*.test.ts",
      "lib/**/*.test.tsx",
    ],
  },
});
