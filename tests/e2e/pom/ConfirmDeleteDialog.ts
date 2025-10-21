import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class ConfirmDeleteDialog {
  readonly page: Page;
  readonly dialog: Locator;
  readonly content: Locator;
  readonly confirm: Locator;
  readonly cancel: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use fallback selectors for dev server caching
    this.dialog = page.getByTestId("delete-dialog").or(page.getByRole("alertdialog"));
    this.content = page.getByTestId("delete-dialog-content").or(page.locator("[role='alertdialog'] > div"));
    this.confirm = page
      .getByTestId("btn-confirm-delete")
      .or(page.getByRole("button", { name: /potwierdź|usuń/i }));
    this.cancel = page
      .getByTestId("btn-cancel-delete")
      .or(page.getByRole("button", { name: /anuluj/i }));
  }

  async waitForOpen() {
    await expect(this.dialog).toBeVisible();
    await expect(this.content).toBeVisible();
  }

  async confirmDelete() {
    await this.confirm.click();
    await expect(this.dialog).toBeHidden();
  }

  async cancelDelete() {
    await this.cancel.click();
    await expect(this.dialog).toBeHidden();
  }
}
