import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { MealItemEntry } from "@/types/database";

describe("Nutrition Quick Log & Meal Copy Integration (Stap 27 / Prompt 22)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestQuickLogDB";

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

  const dummyOat: MealItemEntry = {
    foodItemId: "11111111-1111-4111-8111-111111111111",
    foodName: "Havermout",
    portionGrams: 50,
    calories: 188,
    proteinGrams: 6.8,
    carbsGrams: 31.0,
    fatGrams: 3.5,
    fiberGrams: 5.0,
  };

  const dummyBanana: MealItemEntry = {
    foodItemId: "22222222-2222-4222-8222-222222222222",
    foodName: "Banaan",
    portionGrams: 120,
    calories: 107,
    proteinGrams: 1.3,
    carbsGrams: 24.0,
    fatGrams: 0.2,
    fiberGrams: 2.3,
  };

  const dummyChicken: MealItemEntry = {
    foodItemId: "33333333-3333-4333-8333-333333333333",
    foodName: "Kipfilet",
    portionGrams: 150,
    calories: 165,
    proteinGrams: 34.5,
    carbsGrams: 0.0,
    fatGrams: 2.4,
    fiberGrams: 0.0,
  };

  it("retrieves deduplicated recent meal items across all past dates", async () => {
    // Log items on 2026-10-01 and 2026-10-02
    await repos.nutrition.addItemToMeal("2026-10-01", "ontbijt", dummyOat);
    await repos.nutrition.addItemToMeal("2026-10-01", "lunch", dummyChicken);
    await repos.nutrition.addItemToMeal("2026-10-02", "ontbijt", dummyBanana);
    // Log Havermout again on 2026-10-02
    await repos.nutrition.addItemToMeal("2026-10-02", "snacks", dummyOat);

    const recents = await repos.nutrition.getRecentMealItems(10);
    expect(recents.length).toBe(3);

    // Havermout should have timesLogged = 2
    const oatRecent = recents.find((r) => r.foodName === "Havermout");
    expect(oatRecent).toBeDefined();
    expect(oatRecent?.timesLogged).toBe(2);
    expect(oatRecent?.lastPortionGrams).toBe(50);
  });

  it("copies a single meal from a source date to a target date", async () => {
    // Setup breakfast on 2026-10-03
    await repos.nutrition.addItemToMeal("2026-10-03", "ontbijt", dummyOat);
    await repos.nutrition.addItemToMeal("2026-10-03", "ontbijt", dummyBanana);

    // Copy to 2026-10-04
    const copiedLog = await repos.nutrition.copyMealFromDate(
      "2026-10-03",
      "2026-10-04",
      "ontbijt"
    );

    expect(copiedLog).not.toBeNull();
    expect(copiedLog?.calendarDate).toBe("2026-10-04");
    expect(copiedLog?.mealType).toBe("ontbijt");
    expect(copiedLog?.items.length).toBe(2);
    expect(copiedLog?.totalCalories).toBe(188 + 107);

    // Verify 2026-10-03 was untouched
    const sourceLogs = await repos.nutrition.getMealsByDate("2026-10-03");
    expect(sourceLogs.length).toBe(1);
    expect(sourceLogs[0].items.length).toBe(2);
  });

  it("copies all meals from a source date to a target date (copy day)", async () => {
    // Setup 2 meals on 2026-10-03
    await repos.nutrition.addItemToMeal("2026-10-03", "ontbijt", dummyOat);
    await repos.nutrition.addItemToMeal("2026-10-03", "diner", dummyChicken);

    const copiedCount = await repos.nutrition.copyAllMealsFromDate("2026-10-03", "2026-10-04");
    expect(copiedCount).toBe(2);

    const targetLogs = await repos.nutrition.getMealsByDate("2026-10-04");
    expect(targetLogs.length).toBe(2);
    expect(targetLogs.map((l) => l.mealType).sort()).toEqual(["diner", "ontbijt"]);
  });

  it("saves a logged meal as a reusable recipe in the recipe library", async () => {
    const meal = await repos.nutrition.addItemToMeal("2026-10-04", "ontbijt", dummyOat);
    await repos.nutrition.addItemToMeal("2026-10-04", "ontbijt", dummyBanana);

    // Fetch updated meal
    const fullMeal = await repos.nutrition.meals.getById(meal.id);
    expect(fullMeal).not.toBeNull();

    const recipe = await repos.nutrition.saveMealAsRecipe(fullMeal!.id, "Havermout met Banaan", 1);
    expect(recipe).toBeDefined();
    expect(recipe.id).toBeDefined();
    expect(recipe.name).toBe("Havermout met Banaan");
    expect(recipe.portions).toBe(1);
    expect(recipe.ingredients.length).toBe(2);
    expect(recipe.totalCalories).toBe(188 + 107);
    expect(recipe.caloriesPerPortion).toBe(188 + 107);

    // Verify it is queryable from recipes repository
    const foundRecipe = await repos.nutrition.recipes.getById(recipe.id);
    expect(foundRecipe).not.toBeNull();
    expect(foundRecipe?.name).toBe("Havermout met Banaan");
  });
});
