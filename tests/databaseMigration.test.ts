import { describe, it, expect } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";

describe("Database Migration Verification (Stap 39 / Prompt 33)", () => {
  it("migreert een v1 database stapsgewijs naar v7 met behoud van alle gebruikersdata en automatische veldtransformaties", async () => {
    const dbName = "SportKompasTest_Migration_" + Math.random().toString(36).substring(2);

    // 1. Simuleer een v1 database zoals geïnstalleerd bij vroege gebruikers
    const v1Db = new Dexie(dbName);
    v1Db.version(1).stores({
      profiles: "id, name, createdAt",
      exercises: "id, name, category, primaryMuscleGroup, isCustom, createdAt",
      workoutRoutines: "id, name, version, isActive, createdAt",
      routineDays: "id, routineId, dayIndex",
      scheduledSessions: "id, calendarDate, routineId, status",
      workoutSessions: "id, calendarDate, startTime, status, routineId",
      workoutSets: "id, sessionId, exerciseId, setNumber",
      cardioSessions: "id, calendarDate, startTime, activityType",
      goals: "id, category, status, targetDate",
      foodItems: "id, name, isCustom, createdAt",
      mealLogs: "id, calendarDate, mealType, loggedAt",
      waterLogs: "id, calendarDate, loggedAt",
      bodyMeasurements: "id, calendarDate, measuredAt",
      recoveryLogs: "id, calendarDate, loggedAt",
      appSettings: "id",
    });

    await v1Db.open();
    expect(v1Db.verno).toBe(1);

    // Voeg oude v1 records toe (zonder latere velden zoals isArchived, provenance, category op foodItems)
    const exerciseTable = v1Db.table("exercises");
    await exerciseTable.put({
      id: "old-ex-1",
      name: "Vintage Bench Press",
      category: "kracht",
      primaryMuscleGroup: "borst",
      isCustom: false,
      createdAt: "2026-01-01T00:00:00.000Z",
      // mist provenance, isArchived, measurementType, alternativeNames
    });

    const sessionTable = v1Db.table("workoutSessions");
    await sessionTable.put({
      id: "old-sess-1",
      calendarDate: "2026-01-02",
      startTime: "2026-01-02T10:00:00.000Z",
      status: "afgerond",
      routineId: null,
      notes: "Oude trainingssessie",
      // mist provenance, snapshot
    });

    const foodTable = v1Db.table("foodItems");
    await foodTable.put({
      id: "old-food-1",
      name: "Klassieke Havermout",
      isCustom: false,
      createdAt: "2026-01-02T00:00:00.000Z",
      // mist category, isFavorite, barcode
    });

    // Sluit v1 instantie
    v1Db.close();

    // 2. Open dezelfde database met de actuele SportKompasDatabase (v1 t/m v7)
    const upgradedDb = new SportKompasDatabase(dbName);
    await upgradedDb.open();

    // Controleer of de database nu op versie 7 draait
    expect(upgradedDb.verno).toBe(7);

    // 3. Verifieer dat alle records behouden zijn (0 dataverlies)
    expect(await upgradedDb.exercises.count()).toBe(1);
    expect(await upgradedDb.workoutSessions.count()).toBe(1);
    expect(await upgradedDb.foodItems.count()).toBe(1);

    // 4. Verifieer dat v2 t/m v7 upgrade-handlers defaults hebben toegekend
    const upgradedExercise = await upgradedDb.exercises.get("old-ex-1");
    expect(upgradedExercise).toBeDefined();
    expect(upgradedExercise?.provenance).toEqual({ source: "system" }); // v2 migratie
    expect(upgradedExercise?.isArchived).toBe(false); // v3 migratie
    expect(upgradedExercise?.measurementType).toBe("gewicht_herhalingen"); // v3 migratie
    expect(upgradedExercise?.alternativeNames).toEqual([]); // v3 migratie

    const upgradedSession = await upgradedDb.workoutSessions.get("old-sess-1");
    expect(upgradedSession).toBeDefined();
    expect(upgradedSession?.provenance).toEqual({ source: "user" }); // v2 migratie
    expect(upgradedSession?.snapshot).toEqual({ exercises: [] }); // v2 migratie

    const upgradedFood = await upgradedDb.foodItems.get("old-food-1");
    expect(upgradedFood).toBeDefined();
    expect(upgradedFood?.category).toBe("overig"); // v5 migratie
    expect(upgradedFood?.isFavorite).toBe(false); // v5 migratie

    // Sluit en ruim op
    upgradedDb.close();
    await Dexie.delete(dbName);
  });
});
