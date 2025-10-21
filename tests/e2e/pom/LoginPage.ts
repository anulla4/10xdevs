import type { Page, Locator } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByTestId("login-email");
    this.password = page.getByTestId("login-password");
    this.submit = page.getByTestId("login-submit");
  }

  async goto(redirectTo = "/panel") {
    await this.page.goto(`/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`);
  }

  async login(email: string, password: string, redirectTo = "/panel") {
    await this.goto(redirectTo);
    await this.email.fill(email);
    await this.password.fill(password);
    console.log("E2E login: submitting credentials", { redirectTo });
    await this.submit.click();
    const errorLocator = this.page.locator('[data-test-id="login-error"]');
    const errorVisible = await errorLocator.isVisible().catch(() => false);

    if (errorVisible) {
      const errorMessage = await errorLocator.textContent();
      console.log("E2E login: error visible", { errorMessage });
      throw new Error(`Login failed with error: ${errorMessage}`);
    }

    try {
      await this.page.waitForURL((url) => url.pathname === new URL(redirectTo, url).pathname, { timeout: 5000 });
    } catch (e) {
      const currentUrl = await this.page.url();
      const stillErrorVisible = await errorLocator.isVisible().catch(() => false);
      let message = `Login redirect timeout. Current URL: ${currentUrl}`;
      if (stillErrorVisible) {
        const errText = await errorLocator.textContent();
        message += ` | login-error: ${errText}`;
      }
      console.log("E2E login: redirect wait failed", { currentUrl, stillErrorVisible });
      throw new Error(message);
    }
  }
}

