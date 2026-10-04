import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import {
  exportDatabaseToJson,
  validateBackupFile,
  importDatabaseFromJson,
  BACKUP_FORMAT_VERSION,
  CURRENT_DATABASE_SCHEMA_VERSION,
} from "./backup";
import type { FoodItem, Profile } from "@/types/database";

describe("Domain: backup and restore logic", () => {
  let db: SportKompasDatabase;
  const testDbName = "SportKompasTest_BackupUnit_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  describe("validateBackupFile", () => {
    it("keurt een ongeldige JSON string af met een duidelijke foutmelding", () => {
      const result = validateBackupFile("{ ongeldige json string");
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe("Het bestand is geen geldige JSON. Controleer of het bestand niet beschadigd is.");
      expect(result.preview).toBeUndefined();
    });

    it("keurt niet-objecten of onvolledige structuren af", () => {
      const resultPrimitive = validateBackupFile("12345");
      expect(resultPrimitive.isValid).toBe(false);
      expect(resultPrimitive.errorMessage).toContain("Geen geldig SportKompas back-upbestand");

      const resultMissingData = validateBackupFile(JSON.stringify({ metadata: { appName: "SportKompas" } }));
      expect(resultMissingData.isValid).toBe(false);
      expect(resultMissingData.errorMessage).toContain("Geen geldig SportKompas back-upbestand");
    });

    it("keurt bestanden met ongeldige metadata af", () => {
      const invalidMeta = JSON.stringify({
        metadata: {
          appName: "AnderApp",
          appVersion: "1.0.0",
          formatVersion: "1.0.0",
          schemaVersion: 7,
          exportedAt: new Date().toISOString(),
          databaseName: "AnderDB",
          recordCounts: {},
        },
        data: {},
      });
      const result = validateBackupFile(invalidMeta);
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toContain("Geen geldig SportKompas back-upbestand");
      expect(result.errorMessage).toContain("metadata.appName");
    });

    it("valideert een correct SportKompas backup bestand en berekent preview", () => {
      const validPayload = {
        metadata: {
          appName: "SportKompas",
          appVersion: "0.1.0",
          formatVersion: BACKUP_FORMAT_VERSION,
          schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
          exportedAt: "2026-10-15T12:00:00.000Z",
          databaseName: "SportKompasDB",
          recordCounts: {
            foodItems: 1,
            profiles: 1,
          },
        },
        data: {
          profiles: [
            {
              id: "profile-1",
              name: "Test Gebruiker",
              birthDate: "1990-01-01",
              gender: "man",
              heightMeters: 1.8,
              startWeightKg: 80,
              targetWeightKg: 75,
              activityLevel: "gemiddeld",
              primaryGoal: "kracht",
              formulaPreference: "mifflin_st_jeor",
              onboardingCompleted: true,
              createdAt: "2026-10-01T00:00:00.000Z",
              updatedAt: "2026-10-01T00:00:00.000Z",
            } as Profile,
          ],
          exercises: [],
          workoutRoutines: [],
          routineDays: [],
          scheduledSessions: [],
          workoutSessions: [],
          workoutSets: [],
          cardioSessions: [],
          goals: [],
          foodItems: [
            {
              id: "food-1",
              name: "Havermout",
              caloriesPer100g: 370,
              proteinGramsPer100g: 13,
              carbsGramsPer100g: 60,
              fatGramsPer100g: 7,
              fiberGramsPer100g: 10,
              defaultPortionGrams: 50,
              provenance: { source: "user" },
            } as FoodItem,
          ],
          recipes: [],
          mealLogs: [],
          plannedMeals: [],
          waterLogs: [],
          bodyMeasurements: [],
          recoveryLogs: [],
          appSettings: [],
        },
      };

      const result = validateBackupFile(JSON.stringify(validPayload));
      expect(result.isValid).toBe(true);
      expect(result.errorMessage).toBeUndefined();
      expect(result.preview).toBeDefined();
      expect(result.preview?.totalRecords).toBe(2);
      expect(result.preview?.metadata.exportedAt).toBe("2026-10-15T12:00:00.000Z");
      expect(result.preview?.metadata.schemaVersion).toBe(CURRENT_DATABASE_SCHEMA_VERSION);
      expect(result.preview?.isCompatible).toBe(true);
    });

    it("geeft een waarschuwing bij een toekomstige schemaVersion", () => {
      const futurePayload = {
        metadata: {
          appName: "SportKompas",
          appVersion: "0.2.0",
          formatVersion: BACKUP_FORMAT_VERSION,
          schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION + 1,
          exportedAt: "2026-10-15T12:00:00.000Z",
          databaseName: "SportKompasDB",
          recordCounts: {},
        },
        data: {
          profiles: [],
          exercises: [],
          workoutRoutines: [],
          routineDays: [],
          scheduledSessions: [],
          workoutSessions: [],
          workoutSets: [],
          cardioSessions: [],
          goals: [],
          foodItems: [],
          recipes: [],
          mealLogs: [],
          plannedMeals: [],
          waterLogs: [],
          bodyMeasurements: [],
          recoveryLogs: [],
          appSettings: [],
        },
      };

      const result = validateBackupFile(JSON.stringify(futurePayload));
      expect(result.isValid).toBe(true);
      expect(result.preview?.isCompatible).toBe(false);
      expect(result.preview?.compatibilityWarning).toContain("nieuwere databaseversie");
    });
  });

  describe("exportDatabaseToJson & importDatabaseFromJson", () => {
    it("kan data exporteren en weer importeren", async () => {
      const food: FoodItem = {
        id: "apple-1",
        name: "Appel Elstar",
        brand: null,
        caloriesPer100g: 52,
        proteinGramsPer100g: 0.3,
        carbsGramsPer100g: 12,
        fatGramsPer100g: 0.2,
        fiberGramsPer100g: 2,
        defaultPortionGrams: 150,
        isCustom: false,
        provenance: { source: "user" },
        createdAt: "2026-10-01T00:00:00.000Z",
      };
      await db.foodItems.put(food);

      const exportRes = await exportDatabaseToJson(db);
      expect(typeof exportRes.jsonString).toBe("string");
      expect(exportRes.payload.metadata.appName).toBe("SportKompas");
      expect(exportRes.payload.data.foodItems.length).toBe(1);
      expect(exportRes.payload.data.foodItems[0].name).toBe("Appel Elstar");
      expect(exportRes.sizeBytes).toBeGreaterThan(0);

      // Verwijder item uit db
      await db.foodItems.clear();
      expect(await db.foodItems.count()).toBe(0);

      // Herstel via importDatabaseFromJson
      const importResult = await importDatabaseFromJson(db, exportRes.payload, "replace");
      expect(importResult.success).toBe(true);
      expect(importResult.recordsImported).toBe(1);

      const restoredItem = await db.foodItems.get("apple-1");
      expect(restoredItem).toBeDefined();
      expect(restoredItem?.name).toBe("Appel Elstar");
    });
  });
});
