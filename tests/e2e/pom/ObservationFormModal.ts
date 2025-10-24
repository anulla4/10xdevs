import { expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

export class ObservationFormModal {
  readonly page: Page;
  readonly dialog: Locator;
  readonly overlay: Locator;
  readonly content: Locator;
  readonly form: Locator;

  readonly name: Locator;
  readonly description: Locator;
  readonly category: Locator;
  readonly observationDate: Locator;
  readonly locationLat: Locator;
  readonly locationLng: Locator;
  readonly locationSource: Locator;
  readonly isFavorite: Locator;

  readonly cancelButton: Locator;
  readonly saveButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Use fallback selectors for dev server caching issues
    this.dialog = page.getByTestId('observation-form-dialog')
      .or(page.getByRole('dialog'));
    this.overlay = page.getByTestId('observation-form-overlay')
      .or(page.locator('[data-slot="dialog-overlay"]'));
    this.content = page.getByTestId('observation-form-content')
      .or(page.locator('form').first());
    this.form = page.getByTestId('observation-form')
      .or(page.locator('form').first());

    this.name = page.getByTestId('field-name')
      .or(page.locator('input[name="name"]'))
      .or(page.getByLabel(/nazwa/i));
    this.description = page.getByTestId('field-description')
      .or(page.locator('textarea[name="description"]'))
      .or(page.getByLabel(/opis/i));
    this.category = page.getByTestId('field-category')
      .or(page.locator('select[name="category_id"]'))
      .or(page.getByLabel(/kategoria/i));
    this.observationDate = page.getByTestId('field-observation-date')
      .or(page.locator('input[name="observation_date"]'))
      .or(page.getByLabel(/data obserwacji/i));
    this.locationLat = page.getByTestId('field-location-lat')
      .or(page.locator('input[name="location_lat"]'))
      .or(page.getByLabel(/szerokość/i));
    this.locationLng = page.getByTestId('field-location-lng')
      .or(page.locator('input[name="location_lng"]'))
      .or(page.getByLabel(/długość/i));
    this.locationSource = page.getByTestId('field-location-source')
      .or(page.locator('select[name="location_source"]'));
    this.isFavorite = this.form.getByTestId('field-is-favorite')
      .or(this.form.locator('input[name="is_favorite"]'))
      .or(this.form.getByRole('checkbox', { name: /dodaj do ulubionych/i }));

    this.cancelButton = page.getByTestId('btn-cancel-observation')
      .or(page.getByRole('button', { name: /anuluj/i }));
    this.saveButton = page.getByTestId('btn-save-observation')
      .or(page.getByRole('button', { name: /dodaj/i }))
      .or(page.getByRole('button', { name: /zapisz/i }));
  }

  async waitForOpen() {
    await this.overlay.waitFor({ state: 'visible' });
    await this.content.waitFor({ state: 'visible' });
  }

  async waitForClose() {
    await this.overlay.waitFor({ state: 'hidden', timeout: 15000 });
    await this.content.waitFor({ state: 'hidden', timeout: 15000 });
  }

  async fillForm(data: {
    name?: string;
    description?: string;
    categoryValue?: string; // value attribute or label via selectOption
    categoryIndex?: number; // fallback if value unknown
    observationDateISO?: string; // 'YYYY-MM-DDTHH:mm'
    lat?: string;
    lng?: string;
    locationSource?: 'manual' | 'gps';
    favorite?: boolean;
  }) {
    if (data.name) {
      await this.name.fill(data.name);
    }
    if (data.description !== undefined) {
      await this.description.fill(data.description);
    }

    if (data.categoryValue) {
      await this.category.selectOption(data.categoryValue);
    } else if (typeof data.categoryIndex === 'number') {
      await this.category.selectOption({ index: data.categoryIndex });
    }

    if (data.observationDateISO) {
      await this.observationDate.fill(data.observationDateISO);
    }

    if (data.lat) {
      await this.locationLat.fill(data.lat);
    }
    if (data.lng) {
      await this.locationLng.fill(data.lng);
    }

    if (data.locationSource) {
      await this.locationSource.selectOption(data.locationSource);
    }

    if (typeof data.favorite === 'boolean') {
      const checked = await this.isFavorite.isChecked().catch(() => false);
      if (data.favorite !== checked) {
        await this.isFavorite.click();
      }
    }
  }

  async save(options?: { label?: RegExp | string }) {
    if (options?.label) {
      const button = this.form
        .getByRole('button', { name: options.label })
        .or(this.page.getByRole('button', { name: options.label }));
      await button.click();
      return;
    }

    await this.saveButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }
}
