import { defineConfig } from "@playwright/test";

const baseURL = process.env.HANGOUT_SMOKE_BASE_URL;

if (!baseURL) {
  throw new Error(
    "HANGOUT_SMOKE_BASE_URL must be set before running deployed smoke tests.",
  );
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
    video: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: {
          width: 1440,
          height: 960,
        },
      },
    },
  ],
});
