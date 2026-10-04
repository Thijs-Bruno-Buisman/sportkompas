import { test, expect } from "@playwright/test";
import { enableDemoMode } from "./helpers";

test.describe("E2E Flow 2 — Krachttraining, Oefeningenbieb & Actieve Workout Flow", () => {
  test("verkent schema's en oefeningen, start een vrije workout, voltooit een set en rondt de sessie af", async ({
    page,
  }) => {
    // 1. Start direct in demomodus (rijke data, geen onboarding blocker)
    await enableDemoMode(page);
    await page.goto("/training");

    // 2. Controleer pagina header en tabbladen
    await expect(
      page.locator("h1", { hasText: "Krachttraining" })
    ).toBeVisible({ timeout: 10000 });

    const tabsList = page.locator('[role="tablist"]');
    await expect(tabsList).toBeVisible();

    // 3. Verken Oefeningenbibliotheek tab
    const oefeningenTab = page.locator('button[role="tab"]:has-text("Oefeningen")');
    await oefeningenTab.click();
    const searchInput = page.locator('input[placeholder*="Zoek"]');
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    await searchInput.fill("Squat");
    await page.waitForTimeout(300);

    // 4. Verken Schema's tab
    const schemasTab = page.locator('button[role="tab"]:has-text("Schema\'s")');
    await schemasTab.click();
    await expect(
      page.locator("text=Trainingsschema's")
    ).toBeVisible({ timeout: 5000 });

    // 5. Start een Vrije Krachttraining
    const startFreeBtn = page.getByRole("button", {
      name: "Vrije Training Starten",
    });
    await startFreeBtn.click();

    // In dialoog: klik op Start Training
    const confirmStartBtn = page.getByRole("button", { name: "Start Training" });
    await expect(confirmStartBtn).toBeVisible({ timeout: 5000 });
    await confirmStartBtn.click();

    // 6. Controleer Actieve Workout Tracker interface
    await expect(page.locator("text=Training Actief")).toBeVisible({
      timeout: 10000,
    });

    // 7. Voeg een oefening toe als de training nog leeg is
    const addExerciseFirstBtn = page.locator(
      'button:has-text("Voeg je eerste oefening toe"), button:has-text("+ Oefening Toevoegen")'
    ).first();
    await expect(addExerciseFirstBtn).toBeVisible({ timeout: 5000 });
    await addExerciseFirstBtn.click();

    // Selecteer de eerste beschikbare oefening in de selector dialoog
    const firstExerciseItem = page
      .locator('div[role="dialog"] button:has-text("Kies")')
      .first();
    await expect(firstExerciseItem).toBeVisible({ timeout: 5000 });
    await firstExerciseItem.click();

    // 8. Wacht tot oefening & setrij getoond worden en voltooi een set
    await expect(page.locator("text=Werkelijk Uitgevoerde Sets")).toBeVisible({
      timeout: 5000,
    });

    const setVoltooienBtn = page
      .getByRole("button", { name: "Set voltooien" })
      .first();
    if (await setVoltooienBtn.isVisible()) {
      await setVoltooienBtn.click();
      await page.waitForTimeout(300);
    }

    // 9. Rond de training af via de cockpit header
    const voltooienBtn = page.getByRole("button", {
      name: "Voltooien",
      exact: true,
    });
    await expect(voltooienBtn).toBeVisible({ timeout: 5000 });
    await voltooienBtn.click();

    // Bevestig in FinishWorkoutDialog
    const confirmSaveWorkoutBtn = page.getByRole("button", {
      name: "Training Opslaan & Afronden",
    });
    await expect(confirmSaveWorkoutBtn).toBeVisible({ timeout: 5000 });
    await confirmSaveWorkoutBtn.click();

    // 10. Controleer terugkeer naar krachttraining overzicht
    await expect(
      page.locator("h1", { hasText: "Krachttraining" })
    ).toBeVisible({ timeout: 10000 });
  });
});
