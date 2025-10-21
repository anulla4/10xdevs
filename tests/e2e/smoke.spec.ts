import { test, expect } from "@playwright/test";

// Najprostszy test e2e: sprawdza czy strona główna się ładuje
// Używa baseURL z playwright.config.ts (http://localhost:4321)

test.describe("Smoke", () => {
  test("home page loads", async ({ page }) => {
    const response = await page.goto("/");
    expect(response?.ok()).toBeTruthy();

    // Minimalna asercja na render DOM
    await expect(page.locator("body")).toBeVisible();
  });
});
