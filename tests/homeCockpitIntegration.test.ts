import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { calculateDailyCockpitSummary } from "@/domain/home/cockpit";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import type { CardioSession, WorkoutSession } from "@/types/database";

describe("Home Cockpit Integration (Prompt 27 / Stap 33)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "SportKompasTest_HomeCockpit_" + Math.random().toString(36).substring(2);

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

  it("laadt en aggregeert data voor de cockpit en reageert direct op snelle waterinvoer", async () => {
    const today = "2026-10-04";

    // 1. Voeg initiële maaltijd toe
    await repos.nutrition.addItemToMeal(today, "ontbijt", {
      foodItemId: crypto.randomUUID(),
      foodName: "Havermout ontbijt",
      portionGrams: 250,
      calories: 600,
      proteinGrams: 35,
      carbsGrams: 85,
      fatGrams: 12,
      fiberGrams: 9,
    });

    // 2. Haal initiële cockpit data op
    let meals = await repos.nutrition.getMealsByDate(today);
    let waterLogs = await repos.nutrition.getWaterLogsByDate(today);
    let cardioSessions = await repos.cardio.getSessionsByDate(today);
    let workoutSessions = await repos.workout.sessions.getAll();

    let summary = calculateDailyCockpitSummary({
      calendarDate: today,
      todayDateStr: today,
      meals,
      waterLogs,
      cardioSessions,
      workoutSessions,
      targets: mockTargets,
    });

    expect(summary.caloriesConsumed).toBe(600);
    expect(summary.waterConsumedMl).toBe(0);
    expect(summary.isWaterGoalMet).toBe(false);

    // 3. Simuleer Snelle Actie: +250 ml water toevoegen
    await repos.nutrition.logWater(today, 250);
    await repos.nutrition.logWater(today, 500);

    waterLogs = await repos.nutrition.getWaterLogsByDate(today);
    summary = calculateDailyCockpitSummary({
      calendarDate: today,
      todayDateStr: today,
      meals,
      waterLogs,
      cardioSessions,
      workoutSessions,
      targets: mockTargets,
    });

    expect(summary.waterConsumedMl).toBe(750);
    expect(summary.waterProgressPercentage).toBe(30); // 750 / 2500 = 30%
  });

  it("verwerkt snelle gewichtsinvoer via MeasurementRepository en toont dit in de cockpit", async () => {
    const today = "2026-10-04";

    // Log gewicht voor vandaag
    await repos.measurements.logWeightOnly(today, 79.5, "Ochtendmeting");

    const measurements = await repos.measurements.getAll();
    const summary = calculateDailyCockpitSummary({
      calendarDate: today,
      todayDateStr: today,
      meals: [],
      waterLogs: [],
      cardioSessions: [],
      workoutSessions: [],
      measurements,
      targets: mockTargets,
    });

    expect(summary.latestWeightKg).toBe(79.5);
    expect(summary.weightMeasuredToday).toBe(true);
  });

  it("berekent de gecombineerde energiebalans met maaltijden en cardio op dezelfde dag", async () => {
    const today = "2026-10-04";

    // Maaltijd: 2400 kcal
    await repos.nutrition.addItemToMeal(today, "diner", {
      foodItemId: crypto.randomUUID(),
      foodName: "Steak met aardappelen",
      portionGrams: 500,
      calories: 2400,
      proteinGrams: 160,
      carbsGrams: 200,
      fatGrams: 75,
      fiberGrams: 25,
    });

    // Cardio: 650 kcal verbrand
    const cardio: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: today,
      startTime: `${today}T15:00:00.000Z`,
      endTime: `${today}T16:00:00.000Z`,
      activityType: "hardlopen",
      distanceMeters: 8500,
      durationSeconds: 3600,
      avgHeartRateBpm: 152,
      maxHeartRateBpm: 168,
      elevationGainMeters: 45,
      rpe: 8,
      notes: "Stevig tempo",
      estimatedCaloriesBurned: 650,
      provenance: { source: "user" },
    };
    await repos.cardio.save(cardio);

    const meals = await repos.nutrition.getMealsByDate(today);
    const cardioSessions = await repos.cardio.getSessionsByDate(today);

    const summary = calculateDailyCockpitSummary({
      calendarDate: today,
      todayDateStr: today,
      meals,
      waterLogs: [],
      cardioSessions,
      workoutSessions: [],
      targets: mockTargets,
    });

    expect(summary.caloriesConsumed).toBe(2400);
    expect(summary.cardioCaloriesBurned).toBe(650);
    // Netto = 2400 - 650 = 1750 kcal
    expect(summary.netCalories).toBe(1750);
    // Resterend budget t.o.v. doel 2200 = 2200 - 1750 = 450 kcal
    expect(summary.calorieBudgetRemaining).toBe(450);
    expect(summary.energyBalanceStatus).toBe("deficit");
  });

  it("scheidt data van gisteren en vandaag correct bij datumwisseling", async () => {
    const yesterday = "2026-10-03";
    const today = "2026-10-04";

    await repos.nutrition.logWater(yesterday, 2000);
    await repos.nutrition.logWater(today, 1000);

    const waterYesterday = await repos.nutrition.getWaterLogsByDate(yesterday);
    const waterToday = await repos.nutrition.getWaterLogsByDate(today);

    const summaryYesterday = calculateDailyCockpitSummary({
      calendarDate: yesterday,
      todayDateStr: today,
      meals: [],
      waterLogs: waterYesterday,
      cardioSessions: [],
      workoutSessions: [],
      targets: mockTargets,
    });

    const summaryToday = calculateDailyCockpitSummary({
      calendarDate: today,
      todayDateStr: today,
      meals: [],
      waterLogs: waterToday,
      cardioSessions: [],
      workoutSessions: [],
      targets: mockTargets,
    });

    expect(summaryYesterday.isToday).toBe(false);
    expect(summaryYesterday.waterConsumedMl).toBe(2000);

    expect(summaryToday.isToday).toBe(true);
    expect(summaryToday.waterConsumedMl).toBe(1000);
  });
});

