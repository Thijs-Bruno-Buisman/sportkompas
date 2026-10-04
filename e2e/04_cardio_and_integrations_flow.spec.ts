import { test, expect } from "@playwright/test";
import { enableDemoMode } from "./helpers";

test.describe("E2E Flow 4 — Cardio Logging & Externe Integraties Fallbacks", () => {
  test("opent cardialogger en importmodal, en verifieert Strava & Open Food Facts integraties in profiel", async ({
    page,
  }) => {
    // 1. Start in demomodus
    await enableDemoMode(page);
    await page.goto("/cardio");

    // 2. Controleer Cardio pagina
    await expect(
      page.locator("h1", { hasText: "Cardio & Duursport" })
    ).toBeVisible({ timeout: 10000 });

    // 3. Open de Handmatige Invoer dialoog (Achteraf Loggen)
    const logManualBtn = page.getByRole("button", { name: "Achteraf Loggen" });
    await expect(logManualBtn).toBeVisible({ timeout: 5000 });
    await logManualBtn.click();

    // Controleer dat de sessie registratiemodal opent
    await expect(
      page.locator("h2", { hasText: /Cardiosessie (Registreren|Bewerken)/i })
    ).toBeVisible({ timeout: 5000 });

    // Sluit de dialoog via Annuleren
    const cancelModalBtn = page
      .locator('div[role="dialog"] button:has-text("Annuleren")')
      .first();
    await cancelModalBtn.click();
    await expect(
      page.locator("h2", { hasText: /Cardiosessie (Registreren|Bewerken)/i })
    ).not.toBeVisible({ timeout: 5000 });

    // 4. Open Bestand Importeren modal (GPX / TCX / FIT)
    const importBtn = page.getByRole("button", { name: "Bestand Importeren" });
    await expect(importBtn).toBeVisible({ timeout: 5000 });
    await importBtn.click();

    await expect(
      page.locator("h2", { hasText: /Bestand Importeren/i })
    ).toBeVisible({ timeout: 5000 });

    const closeImportBtn = page
      .locator(
        'div[role="dialog"] button:has-text("Annuleren"), div[role="dialog"] button:has-text("Sluiten")'
      )
      .first();
    await closeImportBtn.click();
    await expect(
      page.locator("h2", { hasText: /Bestand Importeren/i })
    ).not.toBeVisible({ timeout: 5000 });

    // 5. Navigeer naar Profiel & Instellingen
    await page.goto("/profiel");
    await expect(
      page.locator("h1", { hasText: "Profiel & Instellingen" })
    ).toBeVisible({ timeout: 10000 });

    // 6. Schakel over naar het tabblad Eenheden & Thema (met integraties en backup)
    const preferencesTab = page.locator(
      'button[role="tab"]:has-text("Eenheden & Thema")'
    );
    await expect(preferencesTab).toBeVisible({ timeout: 5000 });
    await preferencesTab.click();
    await page.waitForTimeout(300);

    // 7. Controleer Strava integratiecard met "Nog niet verbonden" fallback (Rule 8)
    await expect(page.locator("text=Strava Koppeling")).toBeVisible({
      timeout: 5000,
    });
    await expect(page.locator("text=Nog niet verbonden")).toBeVisible({
      timeout: 5000,
    });

    // 8. Controleer Open Food Facts integratiecard
    await expect(
      page.locator("text=Open Food Facts Voedingsdatabase")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("text=Offline-First Voedingscache")
    ).toBeVisible({ timeout: 5000 });

    // 9. Controleer Back-up & Herstel en CSV Export secties
    await expect(
      page.locator("text=Lokale Opslag & Data-soevereiniteit")
    ).toBeVisible({ timeout: 5000 });
    await expect(
      page.locator("text=Spreadsheet CSV Export")
    ).toBeVisible({ timeout: 5000 });
  });
});
