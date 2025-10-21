import type { Page, Locator } from '@playwright/test';

export class PanelPage {
  readonly page: Page;
  readonly addObservationButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use fallback selector for dev server caching issues
    this.addObservationButton = page.getByTestId('add-observation-button')
      .or(page.getByRole('button', { name: /dodaj obserwację/i }));
  }

  async goto() {
    await this.page.goto('/panel');
  }

  async openAddObservationModal() {
    await this.addObservationButton.click();
  }
}
