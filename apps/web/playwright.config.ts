import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration.
 * Requires the full stack running locally:
 *   docker compose up -d    (PostgreSQL + Redis)
 *   uvicorn app.main:app    (API on :8000)
 *   next dev                (Web on :3000)
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,          // tests share state via session cookies
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,                    // sequential — prevents race conditions on shared DB
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Include session cookie in all requests
    extraHTTPHeaders: { Accept: "application/json" },
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // Start Next.js dev server automatically in local mode
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
