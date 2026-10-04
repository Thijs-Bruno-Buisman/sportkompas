import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { MealLog, WaterLog, CardioSession } from "@/types/database";
import { calculateNutritionPeriodSummary } from "@/domain/nutrition/statistics";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

describe("Nutrition Statistics & History Integration (Prompt 26 / Stap 31)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "SportKompasTest_NutrStats_" + Math.random().toString(36).substring(2);

  const testTargets: DailyNutritionTargets = {
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

  it("haalt correct maaltijden en waterlogs op binnen een specifiek datumbereik via Dexie", async () => {
    const m1Id = crypto.randomUUID();
    const m2Id = crypto.randomUUID();
    const mOutsideId = crypto.randomUUID();

    // 1. Voeg maaltijden toe op verschillende datums (binnen en buiten bereik)
    const meal1: MealLog = {
      id: m1Id,
      calendarDate: "2026-10-01",
      mealType: "ontbijt",
      items: [],
      totalCalories: 500,
      totalProteinGrams: 35,
      totalCarbsGrams: 55,
      totalFatGrams: 15,
      totalFiberGrams: 8,
      loggedAt: "2026-10-01T08:00:00Z",
    };

    const meal2: MealLog = {
      id: m2Id,
      calendarDate: "2026-10-03",
      mealType: "lunch",
      items: [],
      totalCalories: 750,
      totalProteinGrams: 45,
      totalCarbsGrams: 80,
      totalFatGrams: 25,
      totalFiberGrams: 10,
      loggedAt: "2026-10-03T12:30:00Z",
    };

    const mealOutside: MealLog = {
      id: mOutsideId,
      calendarDate: "2026-09-25",
      mealType: "diner",
      items: [],
      totalCalories: 900,
      totalProteinGrams: 50,
      totalCarbsGrams: 90,
      totalFatGrams: 35,
      totalFiberGrams: 12,
      loggedAt: "2026-09-25T18:00:00Z",
    };

    await repos.nutrition.meals.save(meal1);
    await repos.nutrition.meals.save(meal2);
    await repos.nutrition.meals.save(mealOutside);

    const w1Id = crypto.randomUUID();
    const w2Id = crypto.randomUUID();
    const wOutsideId = crypto.randomUUID();

    // 2. Voeg waterlogs toe
    const water1: WaterLog = {
      id: w1Id,
      calendarDate: "2026-10-01",
      amountMl: 1500,
      loggedAt: "2026-10-01T10:00:00Z",
    };
    const water2: WaterLog = {
      id: w2Id,
      calendarDate: "2026-10-02",
      amountMl: 2500,
      loggedAt: "2026-10-02T16:00:00Z",
    };
    const waterOutside: WaterLog = {
      id: wOutsideId,
      calendarDate: "2026-09-20",
      amountMl: 2000,
      loggedAt: "2026-09-20T12:00:00Z",
    };

    await repos.nutrition.water.save(water1);
    await repos.nutrition.water.save(water2);
    await repos.nutrition.water.save(waterOutside);

    // 3. Query het bereik 2026-10-01 t/m 2026-10-05
    const rangeMeals = await repos.nutrition.getMealsForDateRange("2026-10-01", "2026-10-05");
    const rangeWater = await repos.nutrition.getWaterLogsForDateRange("2026-10-01", "2026-10-05");

    expect(rangeMeals).toHaveLength(2);
    expect(rangeMeals.map((m) => m.id)).toEqual(expect.arrayContaining([m1Id, m2Id]));
    expect(rangeMeals.some((m) => m.id === mOutsideId)).toBe(false);

    expect(rangeWater).toHaveLength(2);
    expect(rangeWater.map((w) => w.id)).toEqual(expect.arrayContaining([w1Id, w2Id]));
    expect(rangeWater.some((w) => w.id === wOutsideId)).toBe(false);
  });

  it("berekent end-to-end statistieken, macroverdeling en caloriebalans over een 7-daagse periode", async () => {
    // Vul 4 dagen met maaltijden in
    const testDays = ["2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07"];
    const foodId1 = crypto.randomUUID();
    const foodId2 = crypto.randomUUID();

    for (const d of testDays) {
      await repos.nutrition.addItemToMeal(d, "ontbijt", {
        foodItemId: foodId1,
        foodName: "Havermout & Whey",
        portionGrams: 200,
        calories: 550,
        proteinGrams: 40,
        carbsGrams: 70,
        fatGrams: 10,
        fiberGrams: 8,
      });

      await repos.nutrition.addItemToMeal(d, "diner", {
        foodItemId: foodId2,
        foodName: "Kip met Rijst en Broccoli",
        portionGrams: 400,
        calories: 1650,
        proteinGrams: 110,
        carbsGrams: 170,
        fatGrams: 55,
        fiberGrams: 22,
      });
      // Totaal per dag = 2200 kcal, 150g eiwit, 240g carbs, 65g vet, 30g vezels (precies op doel!)

      await repos.nutrition.logWater(d, 2600);
    }

    // Voeg ook één cardio-sessie toe op 2026-10-06
    const cardio: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-06",
      startTime: "2026-10-06T09:00:00.000Z",
      endTime: "2026-10-06T09:45:00.000Z",
      activityType: "hardlopen",
      distanceMeters: 7500,
      durationSeconds: 2700,
      estimatedCaloriesBurned: 520,
      avgHeartRateBpm: 155,
      maxHeartRateBpm: 172,
      elevationGainMeters: 40,
      rpe: 7,
      notes: "Ochtendloopje",
      provenance: { source: "user" },
    };
    await repos.cardio.save(cardio);

    // Haal gegevens op voor 7d periode met referentiedatum 2026-10-07
    const meals = await repos.nutrition.getMealsForDateRange("2026-10-01", "2026-10-07");
    const water = await repos.nutrition.getWaterLogsForDateRange("2026-10-01", "2026-10-07");
    const sessions = await repos.cardio.getSessionsByDateRange("2026-10-01", "2026-10-07");

    const summary = calculateNutritionPeriodSummary({
      period: "7d",
      mealLogs: meals,
      waterLogs: water,
      cardioSessions: sessions,
      targets: testTargets,
      referenceDate: "2026-10-07",
    });

    expect(summary.totalDays).toBe(7);
    expect(summary.loggedDaysCount).toBe(4);
    expect(summary.avgDailyCalories).toBe(2200);
    expect(summary.avgDailyProteinGrams).toBe(150);
    expect(summary.avgDailyCarbsGrams).toBe(240);
    expect(summary.avgDailyFatGrams).toBe(65);
    expect(summary.avgDailyFiberGrams).toBe(30);

    // Doeltreffendheid
    expect(summary.onTargetDaysCount).toBe(4);
    expect(summary.consistencyPercentage).toBe(100);

    // Cardio en netto
    expect(summary.totalCardioBurnCalories).toBe(520);
    expect(summary.totalNetCalories).toBe(4 * 2200 - 520);

    // Macro-energieverdeling:
    // Eiwit: 4 * 150 = 600 kcal
    // Carbs: 4 * 240 = 960 kcal
    // Vet: 9 * 65 = 585 kcal
    // Totaal per dag = 2145 kcal macro-energie
    expect(summary.macroDistribution.protein.percentage).toBeGreaterThan(25);
    expect(summary.macroDistribution.carbs.percentage).toBeGreaterThan(40);
    expect(summary.macroDistribution.fat.percentage).toBeGreaterThan(20);

    // Water consistentie: 4 dagen >= 2500ml
    expect(summary.waterGoalMetDaysCount).toBe(4);
  });

  it("geeft een lege samenvatting zonder fouten wanneer er geen data in de database aanwezig is", async () => {
    const meals = await repos.nutrition.getMealsForDateRange("2026-10-01", "2026-10-07");
    const water = await repos.nutrition.getWaterLogsForDateRange("2026-10-01", "2026-10-07");
    const cardio = await repos.cardio.getSessionsByDateRange("2026-10-01", "2026-10-07");

    const summary = calculateNutritionPeriodSummary({
      period: "7d",
      mealLogs: meals,
      waterLogs: water,
      cardioSessions: cardio,
      targets: testTargets,
      referenceDate: "2026-10-07",
    });

    expect(summary.totalDays).toBe(7);
    expect(summary.loggedDaysCount).toBe(0);
    expect(summary.totalCaloriesIntake).toBe(0);
    expect(summary.avgDailyCalories).toBe(0);
    expect(summary.weeklyCalorieBalance).toBe(0);
    expect(summary.macroDistribution.totalMacroCalories).toBe(0);
  });
});
