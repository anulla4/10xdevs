import { test, expect } from "@playwright/test";

// This test should run without authentication to verify the public homepage
test.use({ storageState: { cookies: [], origins: [] } });

test("homepage renders and shows login link", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Nature Log/i);
  await expect(page.getByRole("link", { name: /Zaloguj się/i }).first()).toBeVisible();
});
