import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { MealItemEntry } from "@/types/database";
import { calculateDailyTotals, groupLogsByMealType } from "@/domain/nutrition/diary";

describe("Daily Nutrition Diary Integration (Stap 26 / Prompt 21)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestDiaryDB";

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

  it("logs meal items across different meal moments, merges items, and calculates daily totals", async () => {
    const today = "2026-10-04";

    const oatItem: MealItemEntry = {
      foodItemId: "11111111-1111-4111-8111-111111111111",
      foodName: "Havermout",
      portionGrams: 50,
      calories: 188,
      proteinGrams: 6.8,
      carbsGrams: 31.0,
      fatGrams: 3.5,
      fiberGrams: 5.0,
    };

    const milkItem: MealItemEntry = {
      foodItemId: "22222222-2222-4222-8222-222222222222",
      foodName: "Halfvolle melk",
      portionGrams: 200,
      calories: 94,
      proteinGrams: 7.0,
      carbsGrams: 9.4,
      fatGrams: 3.0,
      fiberGrams: 0.0,
    };

    // 1. Add oatItem to ontbijt
    const log1 = await repos.nutrition.addItemToMeal(today, "ontbijt", oatItem);
    expect(log1.items).toHaveLength(1);
    expect(log1.totalCalories).toBe(188);

    // 2. Add milkItem to the same ontbijt (should merge into log1)
    const log2 = await repos.nutrition.addItemToMeal(today, "ontbijt", milkItem);
    expect(log2.id).toBe(log1.id);
    expect(log2.items).toHaveLength(2);
    expect(log2.totalCalories).toBe(282); // 188 + 94
    expect(log2.totalProteinGrams).toBe(13.8); // 6.8 + 7.0

    // 3. Add lunch item
    const chickenItem: MealItemEntry = {
      foodItemId: "33333333-3333-4333-8333-333333333333",
      foodName: "Kipfilet met rijst",
      portionGrams: 300,
      calories: 450,
      proteinGrams: 40.0,
      carbsGrams: 50.0,
      fatGrams: 6.0,
      fiberGrams: 4.0,
    };
    await repos.nutrition.addItemToMeal(today, "lunch", chickenItem);

    // 4. Retrieve meals by date and calculate totals
    const dayMeals = await repos.nutrition.getMealsByDate(today);
    expect(dayMeals).toHaveLength(2); // 1 ontbijt record, 1 lunch record

    const totals = calculateDailyTotals(dayMeals);
    expect(totals.calories).toBe(732); // 282 + 450
    expect(totals.proteinGrams).toBe(53.8); // 13.8 + 40.0
    expect(totals.carbsGrams).toBe(90.4); // 40.4 + 50.0
    expect(totals.fatGrams).toBe(12.5); // 6.5 + 6.0
    expect(totals.fiberGrams).toBe(9.0); // 5.0 + 4.0

    // 5. Group by meal type
    const grouped = groupLogsByMealType(dayMeals);
    expect(grouped.ontbijt.itemsCount).toBe(2);
    expect(grouped.ontbijt.totalCalories).toBe(282);
    expect(grouped.lunch.itemsCount).toBe(1);
    expect(grouped.lunch.totalCalories).toBe(450);
    expect(grouped.diner.itemsCount).toBe(0);
    expect(grouped.snacks.itemsCount).toBe(0);
  });

  it("updates and deletes meal items with accurate total recalculation", async () => {
    const today = "2026-10-04";

    const snackItem: MealItemEntry = {
      foodItemId: "44444444-4444-4444-8444-444444444444",
      foodName: "Walnoten",
      portionGrams: 25,
      calories: 169,
      proteinGrams: 3.6,
      carbsGrams: 1.4,
      fatGrams: 16.3,
      fiberGrams: 1.5,
    };

    const mealLog = await repos.nutrition.addItemToMeal(today, "snacks", snackItem);
    expect(mealLog.items).toHaveLength(1);

    // Update portion (e.g. 50g instead of 25g)
    const updatedSnack: MealItemEntry = {
      ...snackItem,
      portionGrams: 50,
      calories: 338,
      proteinGrams: 7.2,
      carbsGrams: 2.8,
      fatGrams: 32.6,
      fiberGrams: 3.0,
    };

    const updatedLog = await repos.nutrition.updateItemInMeal(mealLog.id, 0, updatedSnack);
    expect(updatedLog?.totalCalories).toBe(338);
    expect(updatedLog?.totalProteinGrams).toBe(7.2);
    expect(updatedLog?.items[0].portionGrams).toBe(50);

    // Delete item from meal log
    await repos.nutrition.deleteItemFromMeal(mealLog.id, 0);
    const checkDeleted = await repos.nutrition.getMealsByDate(today);
    expect(checkDeleted).toHaveLength(0); // Since it was the only item, the log was deleted
  });

  it("isolates water logging and resetting to specific calendar dates", async () => {
    const day1 = "2026-10-03";
    const day2 = "2026-10-04";

    await repos.nutrition.logWater(day1, 500);
    await repos.nutrition.logWater(day2, 250);
    await repos.nutrition.logWater(day2, 500);

    const waterDay1 = await repos.nutrition.getTotalWaterMlByDate(day1);
    const waterDay2 = await repos.nutrition.getTotalWaterMlByDate(day2);

    expect(waterDay1).toBe(500);
    expect(waterDay2).toBe(750);

    // Reset day 2 water
    await repos.nutrition.resetWaterByDate(day2);
    expect(await repos.nutrition.getTotalWaterMlByDate(day2)).toBe(0);
    expect(await repos.nutrition.getTotalWaterMlByDate(day1)).toBe(500); // Day 1 unaffected
  });
});
