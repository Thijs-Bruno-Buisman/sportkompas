import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import {
  aggregateWeeklyMealPrepIngredients,
  calculateWeeklyPlanningSummary,
} from "@/domain/nutrition/planning";
import type { MealItemEntry } from "@/types/database";

describe("Nutrition Planning Integration (Prompt 24 / Stap 29)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "SportKompasTest_Planning_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("plant maaltijden in en kan deze opvragen per datum en datumbereik", async () => {
    const items: MealItemEntry[] = [
      {
        foodItemId: crypto.randomUUID(),
        foodName: "Havermout",
        portionGrams: 80,
        calories: 300,
        proteinGrams: 10,
        carbsGrams: 50,
        fatGrams: 5,
        fiberGrams: 8,
      },
      {
        foodItemId: crypto.randomUUID(),
        foodName: "Halfvolle Melk",
        portionGrams: 200,
        calories: 92,
        proteinGrams: 7,
        carbsGrams: 9.4,
        fatGrams: 3,
        fiberGrams: 0,
      },
    ];

    const planned = await repos.nutrition.planMeal({
      calendarDate: "2026-10-05",
      mealType: "ontbijt",
      name: "Havermoutpap met melk",
      items,
      totalCalories: 392,
      totalProteinGrams: 17,
      totalCarbsGrams: 59.4,
      totalFatGrams: 8,
      totalFiberGrams: 8,
      status: "gepland",
      notes: "Met wat kaneel",
    });

    expect(planned.id).toBeDefined();
    expect(planned.status).toBe("gepland");

    // Haal op per datum
    const dayMeals = await repos.nutrition.getPlannedMealsByDate("2026-10-05");
    expect(dayMeals.length).toBe(1);
    expect(dayMeals[0].name).toBe("Havermoutpap met melk");

    // Haal op voor weekbereik
    const rangeMeals = await repos.nutrition.getPlannedMealsForRange(
      "2026-10-05",
      "2026-10-11"
    );
    expect(rangeMeals.length).toBe(1);
  });

  it("markeert geplande maaltijd als genuttigd en logt deze direct in het voedingsdagboek (MealLog)", async () => {
    const item: MealItemEntry = {
      foodItemId: crypto.randomUUID(),
      foodName: "Banaan",
      portionGrams: 120,
      calories: 105,
      proteinGrams: 1.3,
      carbsGrams: 27,
      fatGrams: 0.3,
      fiberGrams: 3.1,
    };

    const planned = await repos.nutrition.planMeal({
      calendarDate: "2026-10-06",
      mealType: "snacks",
      name: "Tussendoortje banaan",
      items: [item],
      totalCalories: 105,
      totalProteinGrams: 1.3,
      totalCarbsGrams: 27,
      totalFatGrams: 0.3,
      totalFiberGrams: 3.1,
      status: "gepland",
    });

    // Markeer als genuttigd
    const result = await repos.nutrition.markPlannedMealAsConsumed(planned.id);
    expect(result.plannedMeal.status).toBe("genuttigd");
    expect(result.plannedMeal.consumedMealLogId).toBe(result.mealLog.id);

    // Controleer dat MealLog nu in de database staat
    const mealLogs = await repos.nutrition.meals.getAll();
    expect(mealLogs.length).toBe(1);
    expect(mealLogs[0].calendarDate).toBe("2026-10-06");
    expect(mealLogs[0].mealType).toBe("snacks");
    expect(mealLogs[0].items.length).toBe(1);
    expect(mealLogs[0].items[0].foodName).toBe("Banaan");
  });

  it("kopieert geplande maaltijden naar een andere kalenderdag", async () => {
    const item: MealItemEntry = {
      foodItemId: crypto.randomUUID(),
      foodName: "Kipfilet",
      portionGrams: 150,
      calories: 165,
      proteinGrams: 34.5,
      carbsGrams: 0,
      fatGrams: 2.3,
      fiberGrams: 0,
    };

    await repos.nutrition.planMeal({
      calendarDate: "2026-10-05",
      mealType: "lunch",
      name: "Kipsalade",
      items: [item],
      totalCalories: 165,
      totalProteinGrams: 34.5,
      totalCarbsGrams: 0,
      totalFatGrams: 2.3,
      totalFiberGrams: 0,
      status: "gepland",
    });

    const copiedCount = await repos.nutrition.copyPlannedMealsToDate(
      "2026-10-05",
      "2026-10-07"
    );
    expect(copiedCount).toBe(1);

    const wednesdayMeals = await repos.nutrition.getPlannedMealsByDate("2026-10-07");
    expect(wednesdayMeals.length).toBe(1);
    expect(wednesdayMeals[0].name).toBe("Kipsalade");
    expect(wednesdayMeals[0].calendarDate).toBe("2026-10-07");
    expect(wednesdayMeals[0].status).toBe("gepland");
  });

  it("aggregeert ingrediënten voor boodschappenlijst en meal prep", async () => {
    const sharedFoodId = crypto.randomUUID();
    const item1: MealItemEntry = {
      foodItemId: sharedFoodId,
      foodName: "Kipfilet",
      portionGrams: 200,
      calories: 220,
      proteinGrams: 46,
      carbsGrams: 0,
      fatGrams: 3,
      fiberGrams: 0,
    };
    const item2: MealItemEntry = {
      foodItemId: sharedFoodId,
      foodName: "Kipfilet",
      portionGrams: 200,
      calories: 220,
      proteinGrams: 46,
      carbsGrams: 0,
      fatGrams: 3,
      fiberGrams: 0,
    };

    const meal1 = await repos.nutrition.planMeal({
      calendarDate: "2026-10-05",
      mealType: "diner",
      name: "Maaltijd 1",
      items: [item1],
      totalCalories: 220,
      totalProteinGrams: 46,
      totalCarbsGrams: 0,
      totalFatGrams: 3,
      totalFiberGrams: 0,
      status: "gepland",
    });

    const meal2 = await repos.nutrition.planMeal({
      calendarDate: "2026-10-06",
      mealType: "diner",
      name: "Maaltijd 2",
      items: [item2],
      totalCalories: 220,
      totalProteinGrams: 46,
      totalCarbsGrams: 0,
      totalFatGrams: 3,
      totalFiberGrams: 0,
      status: "gepland",
    });

    const prepList = aggregateWeeklyMealPrepIngredients([meal1, meal2]);
    expect(prepList.length).toBe(1);
    expect(prepList[0].foodName).toBe("Kipfilet");
    expect(prepList[0].totalGrams).toBe(400);
    expect(prepList[0].mealCount).toBe(2);

    const summary = calculateWeeklyPlanningSummary([meal1, meal2]);
    expect(summary.totalPlannedMeals).toBe(2);
    expect(summary.totalPlannedCalories).toBe(440);
    expect(summary.completedMeals).toBe(0);
  });
});
