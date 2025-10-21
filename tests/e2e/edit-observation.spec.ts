import { test } from '@playwright/test';
import { PanelPage } from './pom/PanelPage';
import { ObservationFormModal } from './pom/ObservationFormModal';
import { ObservationListPage } from './pom/ObservationListPage';

// Test używa storageState z global.setup.ts - użytkownik jest już zalogowany
// Scenariusz: dodaj -> edytuj świeżo dodaną obserwację

test.describe('E2E: Edycja obserwacji', () => {
  test('użytkownik edytuje świeżo dodaną obserwację', async ({ page }) => {
    // Użytkownik jest już zalogowany przez storageState
    const panel = new PanelPage(page);
    await panel.goto();

    // Dodaj nową obserwację przez modal
    await panel.openAddObservationModal();
    const modal = new ObservationFormModal(page);
    await modal.waitForOpen();

    // Wait for categories to load from API
    const categorySelect = page.locator('[data-test-id="field-category"]').or(page.locator('select[name="category_id"]'));
    await page.waitForTimeout(1000);
    
    const options = categorySelect.locator('option');
    const optionCount = await options.count();
    if (optionCount <= 1) {
      test.skip(true, 'Brak kategorii do wyboru');
    }

    const baseName = `E2E Edit ${Date.now()}`;
    const now = new Date();
    const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    await modal.fillForm({
      name: baseName,
      description: 'Opis do edycji',
      categoryIndex: 1,
      observationDateISO: isoLocal,
      lat: '52.1',
      lng: '21.0',
      locationSource: 'manual',
    });
    await modal.save();
    await modal.waitForClose();

    // Edytuj element z listy
    const list = new ObservationListPage(page);
    await list.clickEditByName(baseName);

    await modal.waitForOpen();
    const editedName = `${baseName} - edited`;
    await modal.fillForm({
      name: editedName,
      lat: '52.2',
      lng: '21.1',
    });
    await modal.save();
    await modal.waitForClose();

    // Weryfikacja: sprawdź czy nowa nazwa jest widoczna, a stara zniknęła
    await list.expectRowVisible(editedName);
    await list.expectRowHidden(baseName);
  });
});
