import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { FoodItem, Recipe } from "@/types/database";
import { calculateRecipeTotals } from "@/domain/nutrition/calculations";

describe("Voedingsmiddelen & Recepten Database Integration (Stap 25 / Prompt 20)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestNutritionDB";

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

  it("seeds standard Dutch foods library on first start without duplicating on subsequent runs", async () => {
    // Initial count is 0
    const initialFoods = await repos.nutrition.getAllFoods();
    expect(initialFoods).toHaveLength(0);

    // Call ensureDefaultFoods
    await repos.nutrition.ensureDefaultFoods();
    const seededFoods = await repos.nutrition.getAllFoods();
    expect(seededFoods.length).toBeGreaterThanOrEqual(30);

    // Verify properties of seeded items
    const oats = seededFoods.find((f) => f.name.toLowerCase().includes("havermout"));
    expect(oats).toBeDefined();
    expect(oats?.category).toBe("granen_brood");
    expect(oats?.caloriesPer100g).toBeGreaterThan(300);
    expect(oats?.isCustom).toBe(false);
    expect(oats?.provenance.source).toBe("system");

    // Call ensureDefaultFoods again; count should not increase
    await repos.nutrition.ensureDefaultFoods();
    const secondCallFoods = await repos.nutrition.getAllFoods();
    expect(secondCallFoods.length).toBe(seededFoods.length);
  });

  it("allows creating, updating and toggling favorites on custom food items", async () => {
    const customFood: FoodItem = {
      id: "12345678-1234-4234-8234-123456789012",
      name: "Zelfgemaakt Bananenbrood",
      brand: "Mijn Keuken",
      category: "granen_brood",
      caloriesPer100g: 210,
      proteinGramsPer100g: 7.5,
      carbsGramsPer100g: 35.0,
      fatGramsPer100g: 4.5,
      fiberGramsPer100g: 3.0,
      defaultPortionGrams: 60,
      isCustom: true,
      isFavorite: false,
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
    };

    // Save
    await repos.nutrition.foods.save(customFood);
    const retrieved = await repos.nutrition.foods.getById(customFood.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.name).toBe("Zelfgemaakt Bananenbrood");
    expect(retrieved?.isFavorite).toBe(false);

    // Toggle favorite
    const toggled = await repos.nutrition.toggleFavoriteFood(customFood.id);
    expect(toggled?.isFavorite).toBe(true);

    const checkToggled = await repos.nutrition.foods.getById(customFood.id);
    expect(checkToggled?.isFavorite).toBe(true);
  });

  it("protects system foods from deletion while allowing custom foods to be deleted", async () => {
    await repos.nutrition.ensureDefaultFoods();
    const all = await repos.nutrition.getAllFoods();
    const systemFood = all.find((f) => !f.isCustom)!;
    expect(systemFood).toBeDefined();

    // Attempt to delete system food
    const deleteSystemResult = await repos.nutrition.deleteCustomFood(systemFood.id);
    expect(deleteSystemResult).toBe(false);

    const stillThere = await repos.nutrition.foods.getById(systemFood.id);
    expect(stillThere).not.toBeNull();

    // Create and delete custom food
    const customId = "87654321-4321-4321-8321-210987654321";
    await repos.nutrition.foods.save({
      id: customId,
      name: "Tijdelijke Snack",
      brand: null,
      category: "snacks_zoet",
      caloriesPer100g: 300,
      proteinGramsPer100g: 2,
      carbsGramsPer100g: 50,
      fatGramsPer100g: 10,
      fiberGramsPer100g: 1,
      defaultPortionGrams: 30,
      isCustom: true,
      isFavorite: false,
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
    });

    const deleteCustomResult = await repos.nutrition.deleteCustomFood(customId);
    expect(deleteCustomResult).toBe(true);

    const gone = await repos.nutrition.foods.getById(customId);
    expect(gone).toBeNull();
  });

  it("creates, persists, calculates and retrieves recipes in Dexie", async () => {
    const foodId1 = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const foodId2 = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

    const ingredients = [
      {
        foodItemId: foodId1,
        foodName: "Havermout",
        amountGrams: 60,
        calories: 225, // 375 * 0.6
        proteinGrams: 8.1,
        carbsGrams: 37.2,
        fatGrams: 4.2,
        fiberGrams: 6.0,
      },
      {
        foodItemId: foodId2,
        foodName: "Whey Proteïne",
        amountGrams: 30,
        calories: 117, // 390 * 0.3
        proteinGrams: 23.4,
        carbsGrams: 1.8,
        fatGrams: 1.6,
        fiberGrams: 0.3,
      },
    ];

    const totals = calculateRecipeTotals(ingredients, 1);

    const recipe: Recipe = {
      id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      name: "Proteïne Havermoutpap",
      description: "Stevig ontbijt voor de beendag",
      portions: 1,
      ingredients,
      totalGrams: totals.totalGrams,
      totalCalories: totals.totalCalories,
      totalProteinGrams: totals.totalProteinGrams,
      totalCarbsGrams: totals.totalCarbsGrams,
      totalFatGrams: totals.totalFatGrams,
      totalFiberGrams: totals.totalFiberGrams,
      caloriesPer100g: totals.caloriesPer100g,
      proteinPer100g: totals.proteinPer100g,
      carbsPer100g: totals.carbsPer100g,
      fatPer100g: totals.fatPer100g,
      fiberPer100g: totals.fiberPer100g,
      caloriesPerPortion: totals.caloriesPerPortion,
      proteinPerPortion: totals.proteinPerPortion,
      carbsPerPortion: totals.carbsPerPortion,
      fatPerPortion: totals.fatPerPortion,
      fiberPerPortion: totals.fiberPerPortion,
      isCustom: true,
      isFavorite: true,
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
    };

    // Save recipe in Dexie
    await repos.nutrition.recipes.save(recipe);

    const retrievedRecipe = await repos.nutrition.recipes.getById(recipe.id);
    expect(retrievedRecipe).not.toBeNull();
    expect(retrievedRecipe?.name).toBe("Proteïne Havermoutpap");
    expect(retrievedRecipe?.totalGrams).toBe(90);
    expect(retrievedRecipe?.totalCalories).toBe(342); // 225 + 117
    expect(retrievedRecipe?.totalProteinGrams).toBe(31.5); // 8.1 + 23.4
    expect(retrievedRecipe?.ingredients).toHaveLength(2);

    // Toggle favorite recipe
    const toggled = await repos.nutrition.toggleFavoriteRecipe(recipe.id);
    expect(toggled?.isFavorite).toBe(false);

    // Search recipe
    const searchResults = await repos.nutrition.searchRecipes("Havermout");
    expect(searchResults).toHaveLength(1);

    // Delete recipe
    await repos.nutrition.deleteRecipe(recipe.id);
    const deletedCheck = await repos.nutrition.recipes.getById(recipe.id);
    expect(deletedCheck).toBeNull();
  });
});
