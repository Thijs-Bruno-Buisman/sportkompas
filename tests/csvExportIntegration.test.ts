import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import {
  exportWorkoutsToCsv,
  exportCardioToCsv,
  exportNutritionToCsv,
  exportMeasurementsToCsv,
  UTF8_BOM,
} from "@/domain/export/csvExport";
import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  BodyMeasurement,
} from "@/types/database";

describe("CSV Export Integration (Stap 38 / Prompt 32)", () => {
  let db: SportKompasDatabase;
  const testDbName = "SportKompasTest_CsvExport_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("haalt data uit Dexie op en exporteert alle 4 de modules naar valide CSV met Excel- en RFC4180-compatibiliteit", async () => {
    // 1. Krachttraining data invoegen
    const exerciseId = crypto.randomUUID();
    const exercise: Exercise = {
      id: exerciseId,
      name: "Barbell Squat",
      category: "kracht",
      primaryMuscleGroup: "benen",
      secondaryMuscleGroups: ["rug"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Diepe squat",
      createdAt: "2026-10-01T08:00:00.000Z",
      provenance: { source: "user" },
    };
    await db.exercises.put(exercise);

    const sessionId = crypto.randomUUID();
    const session: WorkoutSession = {
      id: sessionId,
      calendarDate: "2026-10-15",
      startTime: "2026-10-15T18:00:00.000Z",
      endTime: "2026-10-15T19:15:00.000Z",
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: {
        routineName: "Leg Day Focus",
        exercises: [
          {
            exerciseId,
            exerciseName: "Barbell Squat",
            primaryMuscleGroup: "benen",
            targetSets: 3,
            restSeconds: 120,
          },
        ],
      },
      overallRpe: 9,
      notes: "Zwaar maar voldaan!",
      provenance: { source: "user" },
    };
    await db.workoutSessions.put(session);

    const setId = crypto.randomUUID();
    const set: WorkoutSet = {
      id: setId,
      sessionId,
      exerciseId,
      setNumber: 1,
      setType: "normal",
      weightKg: 100,
      reps: 8,
      completed: true,
      restTimeSeconds: 120,
      targetRpe: 8,
      actualRpe: 8.5,
      actualRir: 1,
      loggedAt: "2026-10-15T18:15:00.000Z",
    };
    await db.workoutSets.put(set);

    // 2. Cardio data invoegen
    const cardioId = crypto.randomUUID();
    const cardio: CardioSession = {
      id: cardioId,
      calendarDate: "2026-10-16",
      startTime: "2026-10-16T08:00:00.000Z",
      endTime: "2026-10-16T08:50:00.000Z",
      activityType: "hardlopen",
      distanceMeters: 8000,
      durationSeconds: 2400, // 40 minuten
      avgHeartRateBpm: 152,
      maxHeartRateBpm: 168,
      estimatedCaloriesBurned: 640,
      elevationGainMeters: 30,
      rpe: 7,
      notes: "Interval training bos",
      provenance: { source: "user" },
    };
    await db.cardioSessions.put(cardio);

    // 3. Voeding data invoegen
    const mealId = crypto.randomUUID();
    const mealLog: MealLog = {
      id: mealId,
      calendarDate: "2026-10-16",
      mealType: "lunch",
      loggedAt: "2026-10-16T12:30:00.000Z",
      items: [
        {
          foodItemId: "food-123",
          foodName: "Kipfilet met Zilvervliesrijst",
          portionGrams: 350,
          calories: 480,
          proteinGrams: 42.5,
          carbsGrams: 55.0,
          fatGrams: 6.2,
          fiberGrams: 4.8,
        },
      ],
      totalCalories: 480,
      totalProteinGrams: 42.5,
      totalCarbsGrams: 55.0,
      totalFatGrams: 6.2,
      totalFiberGrams: 4.8,
    };
    await db.mealLogs.put(mealLog);

    // 4. Metingen data invoegen
    const measId = crypto.randomUUID();
    const measurement: BodyMeasurement = {
      id: measId,
      calendarDate: "2026-10-17",
      measuredAt: "2026-10-17T07:15:00.000Z",
      weightKg: 79.5,
      bodyFatPercentage: 15.2,
      waistMeters: 0.83,
      chestMeters: 1.04,
      hipsMeters: 0.98,
      armsMeters: 0.385,
      thighsMeters: 0.61,
      notes: "Wekelijkse weging na rustdag",
      provenance: { source: "user" },
    };
    await db.bodyMeasurements.put(measurement);

    // TEST WORKOUTS EXPORT (NL Excel formaat: ';' en ',')
    const [fetchedSessions, fetchedSets, fetchedExercises] = await Promise.all([
      db.workoutSessions.toArray(),
      db.workoutSets.toArray(),
      db.exercises.toArray(),
    ]);

    const workoutCsvNl = exportWorkoutsToCsv(
      fetchedSessions,
      fetchedSets,
      fetchedExercises,
      { delimiter: ";", decimalSeparator: ",", includeBom: true }
    );

    expect(workoutCsvNl.startsWith(UTF8_BOM)).toBe(true);
    expect(workoutCsvNl).toContain("Barbell Squat;benen;1;normal;100;8;800");
    expect(workoutCsvNl).toContain("Zwaar maar voldaan!");

    // TEST CARDIO EXPORT (RFC 4180 formaat: ',' en '.')
    const fetchedCardio = await db.cardioSessions.toArray();
    const cardioCsvRfc = exportCardioToCsv(fetchedCardio, {
      delimiter: ",",
      decimalSeparator: ".",
      includeBom: false,
    });

    expect(cardioCsvRfc.startsWith(UTF8_BOM)).toBe(false);
    expect(cardioCsvRfc).toContain("2026-10-16,08:00,08:50,hardlopen,8,40,5:00,12,640,152,168,30,7");
    expect(cardioCsvRfc).toContain("Interval training bos");

    // TEST NUTRITION EXPORT
    const fetchedMeals = await db.mealLogs.toArray();
    const nutritionCsv = exportNutritionToCsv(fetchedMeals, {
      delimiter: ";",
      decimalSeparator: ",",
    });
    expect(nutritionCsv).toContain("Kipfilet met Zilvervliesrijst;350;480;42,5;55;6,2;4,8");

    // TEST MEASUREMENTS EXPORT
    const fetchedMeasurements = await db.bodyMeasurements.toArray();
    const measurementsCsv = exportMeasurementsToCsv(fetchedMeasurements, {
      delimiter: ";",
      decimalSeparator: ",",
    });
    expect(measurementsCsv).toContain("2026-10-17;07:15;79,5;15,2;104;83;98;38,5;61;Wekelijkse weging na rustdag");

    // TEST DATUMFILTERING
    const filteredWorkouts = exportWorkoutsToCsv(
      fetchedSessions,
      fetchedSets,
      fetchedExercises,
      { startDate: "2026-10-16" } // later dan sessie van 2026-10-15
    );
    const lines = filteredWorkouts.replace(UTF8_BOM, "").trim().split("\r\n");
    expect(lines.length).toBe(1); // Alleen de headerregel, geen records
  });
});
