import { test } from "@playwright/test";
import { PanelPage } from "./pom/PanelPage";
import { ObservationFormModal } from "./pom/ObservationFormModal";
import { ObservationListPage } from "./pom/ObservationListPage";

// Test używa storageState z global.setup.ts - użytkownik jest już zalogowany
// Wymaga: przynajmniej 1 kategorii w bazie.

test.describe("E2E: Dodawanie obserwacji", () => {
  test("użytkownik dodaje obserwację", async ({ page }) => {
    // Użytkownik jest już zalogowany przez storageState
    const panel = new PanelPage(page);
    await panel.goto();

    await panel.openAddObservationModal();

    const modal = new ObservationFormModal(page);
    await modal.waitForOpen();

    // Wait for categories to load from API
    const categorySelect = page.locator('[data-test-id="field-category"]').or(page.locator('select[name="category_id"]'));
    
    // Wait for at least 2 options (placeholder + 1 category)
    try {
      await page.waitForFunction(
        (selector) => {
          const select = document.querySelector(selector) as HTMLSelectElement;
          return select && select.options && select.options.length > 1;
        },
        '[data-test-id="field-category"]',
        { timeout: 5000 }
      );
    } catch {
      test.skip(true, "Brak kategorii w środowisku testowym. Zseeduj kategorie.");
    }

    const now = new Date();
    const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16); // YYYY-MM-DDTHH:mm dla input type="datetime-local"

    const observationName = `E2E Obserwacja ${Date.now()}`;
    await modal.fillForm({
      name: observationName,
      description: "Dodana w teście e2e",
      categoryIndex: 1, // pierwszy element po placeholderze
      observationDateISO: isoLocal,
      lat: "52.2297",
      lng: "21.0122",
      locationSource: "manual",
      favorite: true,
    });

    await modal.save();
    await modal.waitForClose();

    // Weryfikacja: sprawdź czy obserwacja pojawia się na liście
    const list = new ObservationListPage(page);
    await list.expectRowVisible(observationName);
  });
});
