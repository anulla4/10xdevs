import { test, expect } from "@playwright/test";
import { LoginPage } from "./pom/LoginPage";
import { PanelPage } from "./pom/PanelPage";
import { ObservationFormModal } from "./pom/ObservationFormModal";
import { ObservationListPage } from "./pom/ObservationListPage";

test.describe("E2E: Pełny scenariusz zarządzania obserwacją", () => {
  let observationName: string;
  const observationDescription = "granit strzegomski";
  const editedObservationDescription = "granit strzeliński";

  const email = process.env.E2E_EMAIL;
  const password = process.env.E2E_PASSWORD;

  test.beforeEach(async ({ page }) => {
    if (!email || !password) {
      test.skip(true, "Zmienne środowiskowe E2E_EMAIL i E2E_PASSWORD muszą być ustawione.");
      return;
    }
    observationName = `Granit-${Date.now()}`;
    const loginPage = new LoginPage(page);
    await loginPage.login(email, password);
    await expect(page).toHaveURL(/\/panel(\?.*)?$/);
  });

  test("Użytkownik może dodać, edytować, usunąć i wylogować się", async ({ page }) => {
    const panelPage = new PanelPage(page);
    const modal = new ObservationFormModal(page);
    const list = new ObservationListPage(page);

    // --- Krok 1: Dodawanie obserwacji ---
    await panelPage.openAddObservationModal();
    await modal.waitForOpen();
    await modal.fillForm({
      name: observationName,
      description: observationDescription,
      categoryIndex: 3,
      lat: "50.123456",
      lng: "17.645566",
      favorite: true,
    });
    await modal.save();
    await modal.waitForClose();
    await list.expectRowVisible(observationName);

    // --- Krok 2: Edycja obserwacji ---
    await list.clickEditByName(observationName);
    await modal.waitForOpen();
    await modal.fillForm({ description: editedObservationDescription });
    await modal.save();
    await modal.waitForClose();
    await list.expectRowVisible(observationName);

    // --- Krok 3: Usuwanie obserwacji ---
    await list.clickDeleteByName(observationName);
    await list.confirmDeletion();
    await list.expectRowHidden(observationName);

    // --- Krok 4: Wylogowanie ---
    await panelPage.logout();
    await expect(page).not.toHaveURL(/\/panel/);
  });
});
