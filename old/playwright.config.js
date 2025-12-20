import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "test",
  use: {
    baseURL: "http://localhost:4321",
  },
  webServer: {
    command: "npm run start",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
