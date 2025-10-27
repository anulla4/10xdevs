import { expect } from '@playwright/test';
import type { Page, Locator } from '@playwright/test';

export class ObservationListPage {
  readonly page: Page;
  readonly rows: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use fallback selector for dev server caching
    this.rows = page
      .locator('[data-test-id="observation-row"]')
      .or(page.locator('tr[data-observation-id]'))
      .or(page.locator('tbody tr'));
  }

  rowByName(name: string): Locator {
    return this.rows.filter({ hasText: name });
  }

  async clickEditByName(name: string) {
    const row = this.rowByName(name).first();
    await expect(row).toBeVisible();
    const editBtn = row
      .locator('[data-test-id="row-edit"]')
      .or(row.getByRole('button', { name: /edytuj/i }))
      .or(row.locator('button').filter({ hasText: /edytuj/i }));
    await editBtn.click();
  }

  async clickDeleteByName(name: string) {
    const row = this.rowByName(name).first();
    await expect(row).toBeVisible();
    const deleteBtn = row
      .locator('[data-test-id="row-delete"]')
      .or(row.getByRole('button', { name: /usuń/i }))
      .or(row.locator('button').filter({ hasText: /usuń/i }));
    await deleteBtn.click();
  }

  async expectRowVisible(name: string) {
    await expect(this.rowByName(name)).toBeVisible();
  }

  async expectRowHidden(name: string) {
    await expect(this.rowByName(name)).toHaveCount(0);
  }

  async confirmDeletion() {
    const confirmButton = this.page.locator('[data-test-id="btn-confirm-delete"]');
    await confirmButton.click();
  }
}
