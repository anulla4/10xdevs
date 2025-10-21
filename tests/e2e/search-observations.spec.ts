import { test, expect } from '@playwright/test';
import { PanelPage } from './pom/PanelPage';
import { ObservationFormModal } from './pom/ObservationFormModal';
import { ObservationListPage } from './pom/ObservationListPage';

// Test używa storageState z global.setup.ts - użytkownik jest już zalogowany
// Scenariusz: tworzy 2 obserwacje i wyszukuje po nazwie

test.describe('E2E: Wyszukiwanie obserwacji', () => {
  test('użytkownik wyszukuje obserwacje po nazwie', async ({ page }) => {
    // Użytkownik jest już zalogowany przez storageState
    const panel = new PanelPage(page);
    await panel.goto();

    const createObservation = async (name: string) => {
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

      const now = new Date();
      const isoLocal = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);

      await modal.fillForm({
        name,
        categoryIndex: 1,
        observationDateISO: isoLocal,
        lat: '52.0',
        lng: '21.0',
      });
      await modal.save();
      await modal.waitForClose();
    };

    const name1 = `E2E Search A ${Date.now()}`;
    const name2 = `E2E Search B ${Date.now()}`;

    await createObservation(name1);
    await createObservation(name2);

    const list = new ObservationListPage(page);
    await list.expectRowVisible(name1);
    await list.expectRowVisible(name2);

    const search = page.getByTestId('search-input');
    await search.fill(name1);

    await expect(list.rowByName(name1)).toBeVisible();
    await expect(list.rowByName(name2)).toHaveCount(0);
  });
});
