import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { MealItemEntry, Profile } from "@/types/database";
import {
  calculateNutritionProgress,
  DEFAULT_NUTRITION_TARGETS,
  type DailyNutritionTargets,
} from "@/domain/nutrition/goals";
import { calculateDailyTotals } from "@/domain/nutrition/diary";

describe("Nutrition Goals & Progress Integration (Stap 28 / Prompt 23)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestNutritionGoalsDB";

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    await db.close();
    await Dexie.delete(testDbName);
  });

  it("calculates default targets when no profile or custom targets exist", async () => {
    const targets = await repos.settings.getNutritionTargets(null);
    expect(targets).toEqual(DEFAULT_NUTRITION_TARGETS);
  });

  it("dynamically computes targets based on user profile BMR, TDEE, and fitness goal", async () => {
    const dummyProfile: Profile = {
      id: "profile-1",
      name: "Alex",
      birthDate: "1994-05-15", // ~32 jaar
      gender: "man",
      heightMeters: 1.82,
      startWeightKg: 82,
      targetWeightKg: 78,
      activityLevel: "gemiddeld", // TDEE factor 1.55
      primaryGoal: "afvallen", // afvallen_standaard -> -500 kcal
      experienceLevel: "gemiddeld",
      strengthDaysPerWeek: 4,
      cardioDaysPerWeek: 2,
      availableEquipment: ["barbell", "dumbbell"],
      unitPreference: "metric",
      formulaPreference: "mifflin_st_jeor",
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const targets = await repos.settings.getNutritionTargets(dummyProfile);
    expect(targets.calories).toBeGreaterThan(1500);
    expect(targets.calories).toBeLessThan(3500);
    expect(targets.proteinGrams).toBeGreaterThan(100);
    expect(targets.carbsGrams).toBeGreaterThan(100);
    expect(targets.fatGrams).toBeGreaterThan(40);
  });

  it("persists custom nutrition targets in AppSettings and retrieves them accurately", async () => {
    const customTargets: DailyNutritionTargets = {
      calories: 2450,
      proteinGrams: 180,
      carbsGrams: 260,
      fatGrams: 75,
      fiberGrams: 35,
      waterMl: 3000,
      strategy: "aangepast",
      macroSplit: "aangepast",
    };

    await repos.settings.updateNutritionTargets(customTargets);

    const loaded = await repos.settings.getNutritionTargets(null);
    expect(loaded.calories).toBe(2450);
    expect(loaded.proteinGrams).toBe(180);
    expect(loaded.carbsGrams).toBe(260);
    expect(loaded.fatGrams).toBe(75);
    expect(loaded.fiberGrams).toBe(35);
    expect(loaded.waterMl).toBe(3000);
  });

  it("tracks budget and remaining macros accurately as meals are logged", async () => {
    const customTargets: DailyNutritionTargets = {
      calories: 2000,
      proteinGrams: 150,
      carbsGrams: 200,
      fatGrams: 60,
      fiberGrams: 30,
      waterMl: 2500,
    };

    const mealItem: MealItemEntry = {
      foodItemId: "11111111-1111-4111-8111-111111111111",
      foodName: "Kipfilet met Rijst",
      portionGrams: 350,
      calories: 550,
      proteinGrams: 48,
      carbsGrams: 65,
      fatGrams: 8,
      fiberGrams: 4,
    };

    const today = "2026-10-04";
    await repos.nutrition.addItemToMeal(today, "lunch", mealItem);
    await repos.nutrition.logWater(today, 750);

    const mealLogs = await repos.nutrition.getMealsByDate(today);
    const dailyTotals = calculateDailyTotals(mealLogs);
    const waterTotal = await repos.nutrition.getTotalWaterMlByDate(today);

    const progress = calculateNutritionProgress(customTargets, dailyTotals, waterTotal);

    // Calorieën: 2000 - 550 = 1450 over
    expect(progress.calories.consumed).toBe(550);
    expect(progress.calories.remaining).toBe(1450);
    expect(progress.calories.status).toBe("onder");

    // Eiwit: 150 - 48 = 102 over
    expect(progress.protein.consumed).toBe(48);
    expect(progress.protein.remaining).toBe(102);

    // Water: 2500 - 750 = 1750 over
    expect(progress.water.consumed).toBe(750);
    expect(progress.water.remaining).toBe(1750);
  });
});
