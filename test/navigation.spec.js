import { test, expect } from "@playwright/test";

test("Site navigation and keyword validation", async ({ page }) => {
  const baseUrl = "http://localhost:4321";

  await page.goto(baseUrl);
  await expect(page.locator("text=Entry Point")).toBeVisible();

  // Click the link with text "it" and check that the page contains "water in their face"
  await page.click('text="it"');
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=water in their face")).toBeVisible({ timeout: 20000 });

  // Click the link "finding-humanity-what-we-do-in-the-shadows" and check for "At its heart"
  await page.click("text=finding-humanity-what-we-do-in-the-shadows");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=At its heart")).toBeVisible({ timeout: 20000 });
});
