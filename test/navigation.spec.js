import { test, expect } from "@playwright/test";

test("Site navigation and keyword validation", async ({ page }) => {
  const baseUrl = "http://localhost:4321";

  await page.goto(baseUrl);
  await expect(page.locator("text=Hello There")).toBeVisible();

  await page.click("text=about");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=dig")).toBeVisible();
});
