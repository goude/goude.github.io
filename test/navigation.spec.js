import { test, expect } from "@playwright/test";

const TIMEOUT = 10_000;
const baseUrl = "http://localhost:4321";

test("Site navigation: home and about page", async ({ page }) => {
  await page.goto(baseUrl, { timeout: TIMEOUT });
  await expect(page.locator("text=Hello There")).toBeVisible({
    timeout: TIMEOUT,
  });

  await page.click("text=about");
  await page.waitForLoadState("networkidle", { timeout: TIMEOUT });
  await expect(page.locator("text=current")).toBeVisible({ timeout: TIMEOUT });
});

test("Sitemap page: all links work", async ({ page }) => {
  await page.goto(`${baseUrl}/sitemap`, { timeout: TIMEOUT });

  // Extract hrefs and labels from links before navigating
  const hrefs = await page.locator("ul > li > a").evaluateAll((anchors) =>
    anchors.map((a) => ({
      href: a.getAttribute("href"),
      label: a.textContent?.trim() || "<no label>",
    })),
  );

  for (const { href, label } of hrefs) {
    if (!href) {
      console.warn(`Skipping link with missing href: ${label}`);
      continue;
    }

    const fullUrl = href.startsWith("http") ? href : `${baseUrl}${href}`;
    console.log(`Visiting: ${fullUrl} (${label})`);

    await page.goto(fullUrl, { timeout: TIMEOUT });

    const body = page.locator("body");
    await expect(body).toBeVisible({ timeout: TIMEOUT });
    await expect(body).not.toBeEmpty({ timeout: TIMEOUT });
    console.log(`✓ Page ${href} rendered successfully.`);
  }
});
