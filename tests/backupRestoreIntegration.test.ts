import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import {
  exportDatabaseToJson,
  validateBackupFile,
  importDatabaseFromJson,
} from "@/domain/backup/backup";
import type { WorkoutSession, CardioSession, FoodItem } from "@/types/database";

describe("Backup & Restore Integration (Stap 37 / Prompt 31)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName =
    "SportKompasTest_FullBackupRestore_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("exporteert alle 16 tabellen naar JSON en herstelt ze via replace en merge modus", async () => {
    // 1. Vul diverse tabellen
    const profileId = crypto.randomUUID();
    await repos.profile.save({
      id: profileId,
      name: "Sanne Tester",
      birthDate: "1995-05-12",
      gender: "vrouw",
      heightMeters: 1.75,
      startWeightKg: 68.5,
      targetWeightKg: 65.0,
      activityLevel: "gemiddeld",
      primaryGoal: "spieropbouw",
      experienceLevel: "gevorderd",
      strengthDaysPerWeek: 4,
      cardioDaysPerWeek: 2,
      availableEquipment: ["barbell", "dumbbell", "kabel"],
      unitPreference: "metric",
      formulaPreference: "mifflin_st_jeor",
      onboardingCompleted: true,
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    });

    const workoutSessionId = crypto.randomUUID();
    const workout: WorkoutSession = {
      id: workoutSessionId,
      calendarDate: "2026-10-10",
      startTime: "2026-10-10T10:00:00.000Z",
      endTime: "2026-10-10T11:15:00.000Z",
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: {
        routineName: "Leg Day Focus",
        exercises: [],
      },
      overallRpe: 9,
      notes: "Zware squat sessie",
      provenance: { source: "user" },
    };
    await db.workoutSessions.put(workout);

    const cardioSessionId = crypto.randomUUID();
    const cardio: CardioSession = {
      id: cardioSessionId,
      calendarDate: "2026-10-11",
      activityType: "fietsen",
      distanceMeters: 30000,
      durationSeconds: 3600,
      estimatedCaloriesBurned: 720,
      avgHeartRateBpm: 145,
      maxHeartRateBpm: 168,
      elevationGainMeters: 60,
      rpe: 7,
      notes: "Heerlijke tocht",
      provenance: { source: "user" },
      startTime: "2026-10-11T13:00:00.000Z",
      endTime: "2026-10-11T14:00:00.000Z",
    };
    await repos.cardio.save(cardio);

    const foodItemId = crypto.randomUUID();
    const food: FoodItem = {
      id: foodItemId,
      name: "Griekse Yoghurt 0%",
      brand: "Total",
      caloriesPer100g: 57,
      proteinGramsPer100g: 10.3,
      carbsGramsPer100g: 4.0,
      fatGramsPer100g: 0.0,
      fiberGramsPer100g: 0.0,
      defaultPortionGrams: 200,
      category: "zuivel",
      isCustom: true,
      isFavorite: true,
      provenance: { source: "user" },
      createdAt: "2026-10-01T08:00:00.000Z",
    };
    await repos.nutrition.foods.save(food);

    await repos.nutrition.addItemToMeal("2026-10-12", "ontbijt", {
      foodItemId,
      foodName: "Griekse Yoghurt 0%",
      portionGrams: 250,
      calories: 142,
      proteinGrams: 26,
      carbsGrams: 10,
      fatGrams: 0,
      fiberGrams: 0,
    });

    await repos.nutrition.logWater("2026-10-12", 2000);
    await repos.measurements.logWeightOnly("2026-10-12", 68.2, "Ochtendgewicht");

    // 2. Exporteer de database
    const exported = await exportDatabaseToJson(db);
    expect(exported.filename).toMatch(/^sportkompas-backup-\d{4}-\d{2}-\d{2}-\d{4}\.json$/);
    expect(exported.sizeBytes).toBeGreaterThan(100);

    // 3. Valideer de export string
    const validated = validateBackupFile(exported.jsonString);
    expect(validated.isValid).toBe(true);
    expect(validated.preview?.isCompatible).toBe(true);
    expect(validated.preview?.metadata.recordCounts.profiles).toBe(1);
    expect(validated.preview?.metadata.recordCounts.workoutSessions).toBe(1);
    expect(validated.preview?.metadata.recordCounts.cardioSessions).toBe(1);
    expect(validated.preview?.metadata.recordCounts.foodItems).toBe(1);
    expect(validated.preview?.metadata.recordCounts.mealLogs).toBe(1);
    expect(validated.preview?.metadata.recordCounts.waterLogs).toBe(1);
    expect(validated.preview?.metadata.recordCounts.bodyMeasurements).toBe(1);

    // 4. Wis de database volledig om dataverlies / herstel te simuleren
    await db.profiles.clear();
    await db.workoutSessions.clear();
    await db.cardioSessions.clear();
    await db.foodItems.clear();
    await db.mealLogs.clear();
    await db.waterLogs.clear();
    await db.bodyMeasurements.clear();

    expect((await db.profiles.toArray()).length).toBe(0);
    expect((await db.workoutSessions.toArray()).length).toBe(0);

    // 5. Herstel via Replace Mode
    const replaceResult = await importDatabaseFromJson(db, exported.payload, "replace");
    expect(replaceResult.success).toBe(true);
    expect(replaceResult.mode).toBe("replace");

    // Controleer herstelde data
    const restoredProfile = await repos.profile.getCurrentProfile();
    expect(restoredProfile?.name).toBe("Sanne Tester");
    expect(restoredProfile?.primaryGoal).toBe("spieropbouw");

    const restoredWorkout = await db.workoutSessions.get(workoutSessionId);
    expect(restoredWorkout?.snapshot.routineName).toBe("Leg Day Focus");

    const restoredCardio = await repos.cardio.getById(cardioSessionId);
    expect(restoredCardio?.activityType).toBe("fietsen");
    expect(restoredCardio?.distanceMeters).toBe(30000);

    const restoredFood = await repos.nutrition.foods.getById(foodItemId);
    expect(restoredFood?.name).toBe("Griekse Yoghurt 0%");

    // 6. Test Merge Mode: Voeg een extra sessie toe, importeer opnieuw met merge
    const newCardioId = crypto.randomUUID();
    await repos.cardio.save({
      id: newCardioId,
      calendarDate: "2026-10-14",
      activityType: "hardlopen",
      distanceMeters: 4000,
      durationSeconds: 1500,
      estimatedCaloriesBurned: 280,
      avgHeartRateBpm: 150,
      maxHeartRateBpm: 165,
      elevationGainMeters: 10,
      rpe: 6,
      notes: "Nieuwe loop",
      provenance: { source: "user" },
      startTime: "2026-10-14T09:00:00.000Z",
      endTime: "2026-10-14T09:25:00.000Z",
    });

    const mergeResult = await importDatabaseFromJson(db, exported.payload, "merge");
    expect(mergeResult.success).toBe(true);
    expect(mergeResult.mode).toBe("merge");

    // Controleer dat zowel de nieuw toegevoegde cardio als de oorspronkelijke cardio bestaat
    const allCardio = await repos.cardio.getAll();
    expect(allCardio.some((c) => c.id === newCardioId)).toBe(true);
    expect(allCardio.some((c) => c.id === cardioSessionId)).toBe(true);
  });
});
