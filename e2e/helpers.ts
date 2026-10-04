import { Page, expect } from "@playwright/test";

/**
 * Configureert de pagina om direct te starten in de persistente demomodus.
 * Dit vult IndexedDB met rijke voorbeelddata en omzeilt de onboarding wizard.
 */
export async function enableDemoMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.setItem("sportkompas_demo_mode", "true");
    } catch {
      // Negeer fouten in addInitScript context
    }
  });
}

/**
 * Configureert de pagina om te starten met een schone, lege toestand (geen demo).
 */
export async function enableCleanMode(page: Page): Promise<void> {
  await page.addInitScript(() => {
    try {
      localStorage.removeItem("sportkompas_demo_mode");
    } catch {
      // Negeer fouten
    }
  });
}

/**
 * Doorloopt de 3 stappen van de OnboardingModal wizard op een verse installatie.
 */
export async function completeOnboardingWizard(
  page: Page,
  name: string = "Test Atleet"
): Promise<void> {
  // Wacht tot de onboarding modal zichtbaar is
  const step1Header = page.locator("text=Welkom bij SportKompas");
  await expect(step1Header).toBeVisible({ timeout: 10000 });

  // Stap 1: Vul optionele naam in
  const nameInput = page.locator("#onboarding-name");
  await nameInput.fill(name);

  // Klik Volgende Stap naar Stap 2
  const nextBtn = page.getByRole("button", { name: "Volgende Stap" });
  await nextBtn.click();

  // Stap 2: Trainingsritme & Apparatuur (bevestig standaarden)
  await expect(page.locator("text=Stap 2 van 3")).toBeVisible({
    timeout: 5000,
  });
  await nextBtn.click();

  // Stap 3: Fysiek Profiel & Formules
  await expect(page.locator("text=Stap 3 van 3")).toBeVisible({
    timeout: 5000,
  });

  // Afronden en opslaan
  const saveBtn = page.getByRole("button", {
    name: "Profiel Opslaan & Starten",
  });
  await saveBtn.click();

  // Controleer dat modal verdwijnt
  await expect(step1Header).not.toBeVisible({ timeout: 10000 });
}
