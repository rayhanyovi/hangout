import path from "node:path";
import { defineConfig } from "@playwright/test";

const port = 3001;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  timeout: 60 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
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
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${port}`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      HANGOUT_ENABLE_STRUCTURED_LOGS: "false",
      HANGOUT_ROOM_STORE_DIR: path.join(
        process.cwd(),
        ".tmp",
        "playwright-room-store",
      ),
      HANGOUT_USE_FIXTURE_VENUES: "true",
      NEXT_TELEMETRY_DISABLED: "1",
    },
  },
});
