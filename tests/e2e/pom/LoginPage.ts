import type { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly loginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.email = page.getByTestId('login-email').or(page.locator('#email'));
    this.password = page.getByTestId('login-password').or(page.locator('#password'));
    this.submit = page.getByTestId('login-submit').or(page.getByRole('button', { name: /zaloguj się/i }));
    this.loginButton = page
      .getByTestId('nav-login')
      .or(page.getByRole('navigation').getByRole('link', { name: /zaloguj się/i }));
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.goto();
    await this.loginButton.click();
    await this.email.fill(email);
    await this.password.fill(password);
    console.log('E2E login: submitting credentials');
    await this.submit.click();
    const errorLocator = this.page.locator('[data-test-id="login-error"]');
    const errorVisible = await errorLocator.isVisible().catch(() => false);

    if (errorVisible) {
      const errorMessage = await errorLocator.textContent();
      console.log('E2E login: error visible', { errorMessage });
      throw new Error(`Login failed with error: ${errorMessage}`);
    }
  }
}
