import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { calculateProgressHubSummary } from "@/domain/home/progressHub";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import type { WorkoutSession, WorkoutSet, CardioSession } from "@/types/database";

describe("Gecombineerde Voortgang Hub Integration (Prompt 28 / Stap 34)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName =
    "SportKompasTest_ProgressHub_" + Math.random().toString(36).substring(2);

  const mockTargets: DailyNutritionTargets = {
    calories: 2200,
    proteinGrams: 150,
    carbsGrams: 240,
    fatGrams: 70,
    fiberGrams: 30,
    waterMl: 2500,
    strategy: "onderhoud",
    macroSplit: "gebalanceerd",
  };

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("laadt multi-domein data via repositories en berekent holistische correlaties en observaties", async () => {
    const refDate = "2026-10-14";
    const day1 = "2026-10-01"; // Startmeting + training
    const day2 = "2026-10-05"; // Cardio + rustdag voeding
    const day3 = "2026-10-10"; // Training + voeding
    const day4 = "2026-10-14"; // Eindmeting

    // 1. Voeg wegingen toe
    await repos.measurements.logWeightOnly(day1, 82.5);
    await repos.measurements.logWeightOnly(day4, 81.8);

    // 2. Voeg krachttrainingen en sets toe
    const session1Id = crypto.randomUUID();
    const session1: WorkoutSession = {
      id: session1Id,
      calendarDate: day1,
      startTime: `${day1}T10:00:00.000Z`,
      endTime: `${day1}T11:15:00.000Z`,
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: { routineName: "Upper Body Hypertrofie", exercises: [] },
      overallRpe: 8,
      notes: "Upper Body Hypertrofie",
      provenance: { source: "user" },
      updatedAt: `${day1}T11:15:00.000Z`,
    };
    await db.workoutSessions.put(session1);

    const set1: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: session1Id,
      exerciseId: crypto.randomUUID(),
      setNumber: 1,
      setType: "normal",
      weightKg: 80,
      reps: 10,
      completed: true,
      targetRpe: null,
      actualRpe: null,
      restTimeSeconds: 90,
      loggedAt: `${day1}T10:15:00.000Z`,
    };
    const set2: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: session1Id,
      exerciseId: crypto.randomUUID(),
      setNumber: 2,
      setType: "normal",
      weightKg: 80,
      reps: 10,
      completed: true,
      targetRpe: null,
      actualRpe: null,
      restTimeSeconds: 90,
      loggedAt: `${day1}T10:20:00.000Z`,
    };
    await db.workoutSets.bulkPut([set1, set2]);

    const session2Id = crypto.randomUUID();
    const session2: WorkoutSession = {
      id: session2Id,
      calendarDate: day3,
      startTime: `${day3}T14:00:00.000Z`,
      endTime: `${day3}T15:10:00.000Z`,
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: { routineName: "Leg Day Kracht", exercises: [] },
      overallRpe: 8,
      notes: "Leg Day Kracht",
      provenance: { source: "user" },
      updatedAt: `${day3}T15:10:00.000Z`,
    };
    await db.workoutSessions.put(session2);

    const set3: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: session2Id,
      exerciseId: crypto.randomUUID(),
      setNumber: 1,
      setType: "normal",
      weightKg: 100,
      reps: 10,
      completed: true,
      targetRpe: null,
      actualRpe: null,
      restTimeSeconds: 90,
      loggedAt: `${day3}T14:15:00.000Z`,
    };
    await db.workoutSets.put(set3);

    // 3. Voeg cardio toe op day2
    const cardio1: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: day2,
      activityType: "hardlopen",
      distanceMeters: 7500, // 7.5 km
      durationSeconds: 2400, // 40 min
      estimatedCaloriesBurned: 620,
      startTime: `${day2}T08:00:00.000Z`,
      endTime: `${day2}T08:40:00.000Z`,
      avgHeartRateBpm: 152,
      maxHeartRateBpm: 171,
      elevationGainMeters: 45,
      rpe: 7,
      notes: "Vlotte ochtendrun",
      provenance: { source: "user" },
      updatedAt: `${day2}T08:40:00.000Z`,
    };
    await repos.cardio.save(cardio1);

    // 4. Voeg maaltijden toe: trainingsdag (day1) vs rustdag (day2)
    await repos.nutrition.addItemToMeal(day1, "diner", {
      foodItemId: crypto.randomUUID(),
      foodName: "Steak met aardappelen",
      portionGrams: 400,
      calories: 2500,
      proteinGrams: 165,
      carbsGrams: 220,
      fatGrams: 65,
      fiberGrams: 12,
    });

    await repos.nutrition.addItemToMeal(day2, "lunch", {
      foodItemId: crypto.randomUUID(),
      foodName: "Salade met tonijn",
      portionGrams: 300,
      calories: 1800,
      proteinGrams: 120,
      carbsGrams: 150,
      fatGrams: 50,
      fiberGrams: 8,
    });

    // Haal data op via repository methodes zoals in HomePage
    const historyStartDate = "2026-09-14";
    const workoutSessions = await repos.workout.sessions.getAll();
    const workoutSets = await repos.workout.sets.getAll();
    const cardioSessions = await repos.cardio.getAll();
    const mealLogs = await repos.nutrition.getMealsForDateRange(historyStartDate, refDate);
    const measurements = await repos.measurements.getAll();

    // Bereken Progress Hub statistieken voor 14d
    const summary = calculateProgressHubSummary({
      period: "14d",
      referenceDate: refDate,
      workoutSessions,
      workoutSets,
      cardioSessions,
      mealLogs,
      measurements,
      targets: mockTargets,
    });

    // Validaties
    expect(summary.period).toBe("14d");
    expect(summary.dataPoints.length).toBe(14);

    // Kracht volumes
    expect(summary.totalWorkoutsCount).toBe(2);
    // set1: 80*10 = 800, set2: 80*10 = 800, set3: 100*10 = 1000 => totaal 2600 kg
    expect(summary.totalWorkoutVolumeKg).toBe(2600);
    expect(summary.avgVolumePerWorkoutKg).toBe(1300);

    // Cardio
    expect(summary.totalCardioKm).toBe(7.5);
    expect(summary.totalCardioCaloriesBurned).toBe(620);
    expect(summary.totalCardioSessionsCount).toBe(1);

    // Voeding: Trainingsdag (day1) vs Rustdag (day2)
    expect(summary.trainingDaysCount).toBe(1);
    expect(summary.restDaysCount).toBe(1);
    expect(summary.avgCaloriesTrainingDays).toBe(2500);
    expect(summary.avgCaloriesRestDays).toBe(1800);
    expect(summary.avgProteinTrainingDays).toBe(165);
    expect(summary.avgProteinRestDays).toBe(120);

    // Gewichtscorrelatie
    expect(summary.startWeightKg).toBe(82.5);
    expect(summary.endWeightKg).toBe(81.8);
    expect(summary.actualWeightChangeKg).toBe(-0.7);

    // Observaties
    expect(summary.observations.length).toBeGreaterThan(0);
    const hasVolumeObs = summary.observations.some((o) => o.type === "volume_trend");
    const hasCardioObs = summary.observations.some((o) => o.type === "cardio_impact");
    const hasNutritionObs = summary.observations.some((o) => o.type === "nutrition_training");
    expect(hasVolumeObs).toBe(true);
    expect(hasCardioObs).toBe(true);
    expect(hasNutritionObs).toBe(true);
  });

  it("handelt lege datasets robuust af zonder deling door nul of crashes", () => {
    const summary = calculateProgressHubSummary({
      period: "30d",
      referenceDate: "2026-10-14",
      workoutSessions: [],
      workoutSets: [],
      cardioSessions: [],
      mealLogs: [],
      measurements: [],
      targets: mockTargets,
    });

    expect(summary.totalWorkoutVolumeKg).toBe(0);
    expect(summary.totalWorkoutsCount).toBe(0);
    expect(summary.avgVolumePerWorkoutKg).toBe(0);
    expect(summary.totalCardioKm).toBe(0);
    expect(summary.avgCaloriesTrainingDays).toBe(0);
    expect(summary.avgCaloriesRestDays).toBe(0);
    expect(summary.startWeightKg).toBeNull();
    expect(summary.endWeightKg).toBeNull();
    expect(summary.actualWeightChangeKg).toBeNull();
    expect(summary.observations).toEqual([]);
  });
});
