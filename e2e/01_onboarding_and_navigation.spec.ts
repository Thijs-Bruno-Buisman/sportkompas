import { test, expect } from "@playwright/test";
import { completeOnboardingWizard, enableCleanMode } from "./helpers";

test.describe("E2E Flow 1 — Onboarding, Hoofdnavigatie & Paginalayout", () => {
  test("voltooit onboarding wizard en navigeert soepel langs alle 5 hoofdroutes", async ({
    page,
  }) => {
    // 1. Start met een schone context zonder demo-vlag
    await enableCleanMode(page);
    await page.goto("/");

    // 2. Doorloop de 3 stappen van de onboarding wizard
    await completeOnboardingWizard(page, "SportKompas Tester");

    // 3. Controleer Home Dashboard Cockpit
    await expect(
      page.locator("text=Zoeken in trainingen, gerechten, cardio...")
    ).toBeVisible({ timeout: 10000 });

    // 4. Navigeer naar Training
    const trainingNav = page.locator('nav a[href="/training"]').first();
    await trainingNav.click();
    await expect(page).toHaveURL(/.*\/training/);
    await expect(
      page.locator("h1", { hasText: "Krachttraining" })
    ).toBeVisible();

    // 5. Navigeer naar Cardio
    const cardioNav = page.locator('nav a[href="/cardio"]').first();
    await cardioNav.click();
    await expect(page).toHaveURL(/.*\/cardio/);
    await expect(
      page.locator("h1", { hasText: "Cardio & Duursport" })
    ).toBeVisible();

    // 6. Navigeer naar Voeding
    const voedingNav = page.locator('nav a[href="/voeding"]').first();
    await voedingNav.click();
    await expect(page).toHaveURL(/.*\/voeding/);
    await expect(
      page.locator("h1", { hasText: "Voeding & Macro's" })
    ).toBeVisible();

    // 7. Navigeer naar Profiel
    const profielNav = page.locator('nav a[href="/profiel"]').first();
    await profielNav.click();
    await expect(page).toHaveURL(/.*\/profiel/);
    await expect(
      page.locator("h1", { hasText: "Profiel & Instellingen" })
    ).toBeVisible();

    // 8. Keer terug naar Home
    const homeNav = page.locator('nav a[href="/"]').first();
    await homeNav.click();
    await expect(page).toHaveURL(/\/$/);
    await expect(
      page.locator("text=Zoeken in trainingen, gerechten, cardio...")
    ).toBeVisible();
  });
});
