import { test, expect } from "@playwright/test";
import { enableDemoMode } from "./helpers";

test.describe("E2E Flow 3 — Voedingsdagboek, Hydratatie & Product Invoer", () => {
  test("bekijkt macroverdeling, logt water, navigeert tabs en voegt een product toe via database", async ({
    page,
  }) => {
    // 1. Start in persistente demomodus met rijke voedingsdata
    await enableDemoMode(page);
    await page.goto("/voeding");

    // 2. Controleer pagina header
    await expect(
      page.locator("h1", { hasText: "Voeding & Macro's" })
    ).toBeVisible({ timeout: 10000 });

    // 3. Controleer hydratatiewidget en log 250 ml water
    await expect(page.locator("text=Hydratatie & Water")).toBeVisible({
      timeout: 5000,
    });
    const addWaterBtn = page.getByRole("button", { name: "250 ml" });
    await expect(addWaterBtn).toBeVisible({ timeout: 5000 });
    await addWaterBtn.click();
    await page.waitForTimeout(300);

    // 4. Verken de hoofdtabbladen van de voedingsmodule
    const weekplanningTab = page.locator(
      'button[role="tab"]:has-text("Weekplanning")'
    );
    await weekplanningTab.click();
    await expect(
      page.locator('button:has-text("Boodschappen & Prep")')
    ).toBeVisible({ timeout: 5000 });

    const trendsTab = page.locator('button[role="tab"]:has-text("Trends")');
    await trendsTab.click();
    await expect(
      page.locator("text=Toon Cardio-verbranding")
    ).toBeVisible({ timeout: 5000 });

    const databaseTab = page.locator('button[role="tab"]:has-text("Database")');
    await databaseTab.click();
    await expect(
      page.locator('button:has-text("Voedingsmiddelen")')
    ).toBeVisible({ timeout: 5000 });

    // Keer terug naar Dagboek
    const dagboekTab = page.locator('button[role="tab"]:has-text("Dagboek")');
    await dagboekTab.click();
    await expect(page.locator("text=Hydratatie & Water")).toBeVisible();

    // 5. Open Product Toevoegen dialoog in het eerste maaltijdblok (bijv. Ontbijt)
    const addProductBtn = page
      .locator('button:has-text("Toevoegen")')
      .first();
    await expect(addProductBtn).toBeVisible({ timeout: 5000 });
    await addProductBtn.click();

    // Controleer dat dialoog zichtbaar is
    await expect(
      page.locator("h2", { hasText: /Product Toevoegen aan/i })
    ).toBeVisible({ timeout: 5000 });

    // Schakel over naar het tabblad Database binnen de dialoog
    const dialogDatabaseTab = page
      .locator('div[role="dialog"] button:has-text("Database")')
      .first();
    await dialogDatabaseTab.click();
    await page.waitForTimeout(300);

    // Selecteer een voedingsmiddel uit de lijst
    const firstFoodItem = page
      .locator('div[role="dialog"] div[class*="cursor-pointer"]')
      .first();
    await expect(firstFoodItem).toBeVisible({ timeout: 5000 });
    await firstFoodItem.click();
    await page.waitForTimeout(300);

    // Bevestig toevoegen via de submit knop in de dialog footer
    const confirmAddBtn = page
      .locator('div[role="dialog"] button[type="submit"]')
      .first();
    await expect(confirmAddBtn).toBeEnabled({ timeout: 5000 });
    await confirmAddBtn.click();

    // Controleer dat dialoog sluit
    await expect(
      page.locator("h2", { hasText: /Product Toevoegen aan/i })
    ).not.toBeVisible({ timeout: 5000 });
  });
});
