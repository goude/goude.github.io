import { test, expect } from "@playwright/test";

const TIMEOUT = 10_000; // 10 seconds

test("Site navigation and keyword validation", async ({ page }) => {
  const baseUrl = "http://localhost:4321";

  await page.goto(baseUrl, { timeout: TIMEOUT });
  await expect(page.locator("text=Hello There")).toBeVisible({ timeout: TIMEOUT });

  await page.click("text=about");
  await page.waitForLoadState("networkidle", { timeout: TIMEOUT });
  await expect(page.locator("text=dig")).toBeVisible({ timeout: TIMEOUT });
}, TIMEOUT);
