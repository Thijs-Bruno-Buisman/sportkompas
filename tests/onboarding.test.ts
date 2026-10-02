import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import {
  parseLocalizedNumber,
  isValidBirthDate,
  kgToLbs,
  lbsToKg,
  metersToKm,
  metersToMiles,
} from "@/domain/units";

describe("Prompt 04: Profiel & Eerste Gebruik (Onboarding & Eenheden)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestOnboardingDB";

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  describe("1. Nieuw profiel aanmaken (inclusief optionele velden & 'onbekend')", () => {
    it("maakt een profiel aan met minimale gegevens zonder calorieadvies of lichaamsmetingen", async () => {
      // Gebruiker vult geen gewicht, geen lengte en geen geboortedatum in
      const minimalProfile = await repos.profile.upsertProfile({
        name: "", // optioneel leeg
        birthDate: null,
        gender: "onbekend",
        heightMeters: null,
        startWeightKg: null,
        targetWeightKg: null,
        activityLevel: "onbekend",
        primaryGoal: "onbekend",
        experienceLevel: "onbekend",
        strengthDaysPerWeek: 3,
        cardioDaysPerWeek: 2,
        availableEquipment: ["lichaamsgewicht"],
        unitPreference: "metric",
        formulaPreference: "onbekend",
        onboardingCompleted: true,
      });

      expect(minimalProfile.id).toBeDefined();
      expect(minimalProfile.onboardingCompleted).toBe(true);
      expect(minimalProfile.startWeightKg).toBeNull();
      expect(minimalProfile.heightMeters).toBeNull();

      const saved = await repos.profile.getCurrentProfile();
      expect(saved).not.toBeNull();
      expect(saved?.onboardingCompleted).toBe(true);
    });

    it("maakt een volledig profiel aan met alle trainingsparameters", async () => {
      const fullProfile = await repos.profile.upsertProfile({
        name: "Robin",
        birthDate: "1994-08-20",
        gender: "vrouw",
        heightMeters: 1.72,
        startWeightKg: 68.5,
        targetWeightKg: 65.0,
        activityLevel: "gemiddeld",
        primaryGoal: "spieropbouw",
        experienceLevel: "gemiddeld",
        strengthDaysPerWeek: 4,
        cardioDaysPerWeek: 1,
        availableEquipment: ["barbell", "dumbbell", "kabel"],
        unitPreference: "metric",
        formulaPreference: "mifflin_st_jeor",
        onboardingCompleted: true,
      });

      expect(fullProfile.name).toBe("Robin");
      expect(fullProfile.primaryGoal).toBe("spieropbouw");
      expect(fullProfile.strengthDaysPerWeek).toBe(4);
      expect(fullProfile.availableEquipment).toContain("barbell");
    });
  });

  describe("2. Terugkomen na reload & Persistentie", () => {
    it("zorgt dat na het sluiten en heropenen van de database het profiel behouden blijft en onboardingCompleted true is", async () => {
      await repos.profile.upsertProfile({
        name: "Sam",
        birthDate: "1990-03-12",
        gender: "man",
        heightMeters: 1.80,
        startWeightKg: 78.0,
        targetWeightKg: null,
        activityLevel: "licht",
        primaryGoal: "kracht",
        experienceLevel: "gevorderd",
        strengthDaysPerWeek: 5,
        cardioDaysPerWeek: 2,
        availableEquipment: ["barbell", "dumbbell", "machine"],
        unitPreference: "metric",
        formulaPreference: "mifflin_st_jeor",
        onboardingCompleted: true,
      });

      // Simuleer herladen van pagina (sluit db en heropen met nieuwe repo instantie)
      db.close();

      const reloadedDb = new SportKompasDatabase(testDbName);
      const reloadedRepos = createRepositories(reloadedDb);
      await reloadedDb.open();

      const profileAfterReload = await reloadedRepos.profile.getCurrentProfile();
      expect(profileAfterReload).not.toBeNull();
      expect(profileAfterReload?.name).toBe("Sam");
      expect(profileAfterReload?.onboardingCompleted).toBe(true);
      expect(profileAfterReload?.startWeightKg).toBe(78.0);

      reloadedDb.close();
    });
  });

  describe("3. Profiel aanpassen in Profiel-scherm", () => {
    it("overschrijft bestaande gegevens zonder dataverlies", async () => {
      const initial = await repos.profile.upsertProfile({
        name: "Alex",
        birthDate: "1992-11-05",
        gender: "man",
        heightMeters: 1.85,
        startWeightKg: 85.0,
        targetWeightKg: 80.0,
        activityLevel: "gemiddeld",
        primaryGoal: "kracht",
        experienceLevel: "beginner",
        strengthDaysPerWeek: 3,
        cardioDaysPerWeek: 2,
        availableEquipment: ["dumbbell"],
        unitPreference: "metric",
        formulaPreference: "mifflin_st_jeor",
        onboardingCompleted: true,
      });

      // Pas later aan in Profiel (ervaring wordt gemiddeld, 4 dagen kracht, extra apparatuur)
      const updated = await repos.profile.upsertProfile({
        ...initial,
        experienceLevel: "gemiddeld",
        strengthDaysPerWeek: 4,
        availableEquipment: ["dumbbell", "barbell", "kabel"],
      });

      expect(updated.id).toBe(initial.id);
      expect(updated.experienceLevel).toBe("gemiddeld");
      expect(updated.strengthDaysPerWeek).toBe(4);
      expect(updated.availableEquipment).toHaveLength(3);
    });
  });

  describe("4. Weergave-eenheden (kg/km vs lb/miles) & Canonieke opslag", () => {
    it("wijziging van weergavevoorkeur verandert de canonieke opgeslagen waarden NIET", async () => {
      const canonicalWeightKg = 80.0; // 80 kg
      const canonicalDistanceMeters = 5000; // 5000 m = 5 km

      // 1. Opgeslagen profiel in metric
      const prof = await repos.profile.upsertProfile({
        name: "Chris",
        birthDate: "1990-01-01",
        gender: "man",
        heightMeters: 1.80,
        startWeightKg: canonicalWeightKg,
        targetWeightKg: null,
        activityLevel: "gemiddeld",
        primaryGoal: "kracht",
        experienceLevel: "gemiddeld",
        strengthDaysPerWeek: 3,
        cardioDaysPerWeek: 2,
        availableEquipment: ["barbell"],
        unitPreference: "metric",
        formulaPreference: "mifflin_st_jeor",
        onboardingCompleted: true,
      });

      expect(prof.startWeightKg).toBe(80.0);

      // 2. Wijzig de weergavevoorkeur naar imperial in het profiel
      const switchedToImperial = await repos.profile.save({
        ...prof,
        unitPreference: "imperial",
      });

      // Opgeslagen canonieke waarde in IndexedDB blijft EXACT 80 kg!
      expect(switchedToImperial.startWeightKg).toBe(80.0);

      // De UI toont de geconverteerde waarde in lbs
      const displayedLbs = kgToLbs(switchedToImperial.startWeightKg!);
      expect(displayedLbs).toBe(176.4);

      // Als de gebruiker 176.4 lbs invoert, converteert de parser dit terug naar ~80.0 kg
      const convertedBackKg = lbsToKg(displayedLbs);
      expect(Math.round(convertedBackKg)).toBe(80);

      // Hetzelfde geldt voor afstanden: 5000m blijft 5000m
      expect(metersToKm(canonicalDistanceMeters)).toBe(5);
      expect(metersToMiles(canonicalDistanceMeters)).toBe(3.11);
    });
  });

  describe("5. Invoervalidatie (komma's, negatieve waarden, datums)", () => {
    it("accepteert decimalen met een komma (bv. 82,5) en normaliseert naar getal", () => {
      expect(parseLocalizedNumber("82,5")).toBe(82.5);
      expect(parseLocalizedNumber("1,84")).toBe(1.84);
      expect(parseLocalizedNumber(" 70,25 ")).toBe(70.25);
    });

    it("weigert negatieve getallen met een duidelijke foutmelding", () => {
      expect(() => parseLocalizedNumber("-82,5", "Gewicht")).toThrow(
        "Gewicht mag niet negatief zijn."
      );
      expect(() => parseLocalizedNumber("-1", "Lengte")).toThrow(
        "Lengte mag niet negatief zijn."
      );
    });

    it("valideert datums en weigert ongeldige of toekomstige datums", () => {
      expect(isValidBirthDate("1996-05-24").valid).toBe(true);
      expect(isValidBirthDate("").valid).toBe(true); // Optioneel
      expect(isValidBirthDate("2026-15-40").valid).toBe(false); // Ongeldige maand/dag
      expect(isValidBirthDate("2035-01-01").valid).toBe(false); // Toekomst
      expect(isValidBirthDate("1880-01-01").valid).toBe(false); // Te ver in het verleden
    });
  });
});
