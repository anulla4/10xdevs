import { test, expect } from "@playwright/test";
import { PanelPage } from "./pom/PanelPage";
import { ObservationFormModal } from "./pom/ObservationFormModal";
import { ObservationListPage } from "./pom/ObservationListPage";
import { ConfirmDeleteDialog } from "./pom/ConfirmDeleteDialog";

// Test używa storageState z global.setup.ts - użytkownik jest już zalogowany
// Scenariusz: dodaj -> usuń świeżo dodaną obserwację

test.describe("E2E: Usuwanie obserwacji", () => {
  test("użytkownik usuwa dodaną obserwację", async ({ page }) => {
    // Użytkownik jest już zalogowany przez storageState
    const panel = new PanelPage(page);
    await panel.goto();

    // Dodaj nową obserwację
    await panel.openAddObservationModal();
    const modal = new ObservationFormModal(page);
    await modal.waitForOpen();

    // Wait for categories to load from API
    const categorySelect = page.locator('[data-test-id="field-category"]').or(page.locator('select[name="category_id"]'));
    await page.waitForTimeout(1000);
    
    const options = categorySelect.locator('option');
    const optionCount = await options.count();
    if (optionCount <= 1) {
      test.skip(true, "Brak kategorii do wyboru");
    }

    const name = `E2E Delete ${Date.now()}`;
    const now = new Date();
    const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    await modal.fillForm({
      name,
      description: "Do usunięcia w teście",
      categoryIndex: 1,
      observationDateISO: isoLocal,
      lat: "52.3",
      lng: "21.3",
      locationSource: "manual",
    });
    await modal.save();
    await modal.waitForClose();

    const list = new ObservationListPage(page);
    await list.expectRowVisible(name);
    await list.clickDeleteByName(name);

    const confirm = new ConfirmDeleteDialog(page);
    await confirm.waitForOpen();
    await confirm.confirmDelete();

    await list.expectRowHidden(name);
  });
});
