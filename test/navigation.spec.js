const { test, expect } = require("@playwright/test");

test("Site navigation and keyword validation", async ({ page }) => {
  // Set the base URL for your locally running site.
  const baseUrl = "http://localhost:4321";

  // Visit the homepage and check for the keyword "Entry Point"
  await page.goto(baseUrl);
  await expect(page.locator("text=Entry Point")).toBeVisible({
    timeout: 10000,
  });

  // Click the link with text "it" and check that the page contains "water in their face"
  await page.click('text="it"');
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=water in their face")).toBeVisible({
    timeout: 10000,
  });

  // Click the link "finding-humanity-what-we-do-in-the-shadows" and check for "At its heart"
  await page.click("text=finding-humanity-what-we-do-in-the-shadows");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("text=At its heart")).toBeVisible({
    timeout: 10000,
  });
});
