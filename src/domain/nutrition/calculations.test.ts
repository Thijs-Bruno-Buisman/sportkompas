import { describe, it, expect } from "vitest";
import type { FoodItem, Recipe, RecipeIngredient } from "@/types/database";
import {
  calculateNutritionForPortion,
  calculateRecipeTotals,
  calculateMacroDistribution,
  filterFoods,
  filterRecipes,
} from "./calculations";

describe("Domain Nutrition Calculations", () => {
  const dummyOats: FoodItem = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Havermout",
    brand: "Quaker",
    category: "granen_brood",
    caloriesPer100g: 375,
    proteinGramsPer100g: 13.5,
    carbsGramsPer100g: 62.0,
    fatGramsPer100g: 7.0,
    fiberGramsPer100g: 10.0,
    defaultPortionGrams: 50,
    isCustom: false,
    isFavorite: true,
    provenance: { source: "system" },
    createdAt: "2026-10-01T08:00:00.000Z",
  };

  const dummyBanana: FoodItem = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Banaan",
    brand: null,
    category: "groente_fruit",
    caloriesPer100g: 89,
    proteinGramsPer100g: 1.1,
    carbsGramsPer100g: 20.0,
    fatGramsPer100g: 0.3,
    fiberGramsPer100g: 2.0,
    defaultPortionGrams: 120,
    isCustom: false,
    isFavorite: false,
    provenance: { source: "system" },
    createdAt: "2026-10-01T08:00:00.000Z",
  };

  describe("calculateNutritionForPortion", () => {
    it("calculates exact portion nutrition for 50g of oats", () => {
      const portion = calculateNutritionForPortion(dummyOats, 50);
      expect(portion.calories).toBe(188); // 375 * 0.5 = 187.5 -> 188
      expect(portion.proteinGrams).toBe(6.8); // 13.5 * 0.5 = 6.75 -> 6.8
      expect(portion.carbsGrams).toBe(31.0); // 62 * 0.5 = 31.0
      expect(portion.fatGrams).toBe(3.5); // 7 * 0.5 = 3.5
      expect(portion.fiberGrams).toBe(5.0); // 10 * 0.5 = 5.0
    });

    it("returns 0 for negative or zero grams", () => {
      const zero = calculateNutritionForPortion(dummyOats, 0);
      expect(zero.calories).toBe(0);
      expect(zero.proteinGrams).toBe(0);

      const neg = calculateNutritionForPortion(dummyOats, -10);
      expect(neg.calories).toBe(0);
    });
  });

  describe("calculateRecipeTotals", () => {
    const ingredients: RecipeIngredient[] = [
      {
        foodItemId: dummyOats.id,
        foodName: dummyOats.name,
        amountGrams: 100,
        calories: 375,
        proteinGrams: 13.5,
        carbsGrams: 62.0,
        fatGrams: 7.0,
        fiberGrams: 10.0,
      },
      {
        foodItemId: dummyBanana.id,
        foodName: dummyBanana.name,
        amountGrams: 100,
        calories: 89,
        proteinGrams: 1.1,
        carbsGrams: 20.0,
        fatGrams: 0.3,
        fiberGrams: 2.0,
      },
    ];

    it("calculates total and per-portion values correctly for 2 portions", () => {
      const summary = calculateRecipeTotals(ingredients, 2);

      expect(summary.totalGrams).toBe(200);
      expect(summary.totalCalories).toBe(464); // 375 + 89
      expect(summary.totalProteinGrams).toBe(14.6); // 13.5 + 1.1
      expect(summary.totalCarbsGrams).toBe(82.0); // 62 + 20
      expect(summary.totalFatGrams).toBe(7.3); // 7.0 + 0.3
      expect(summary.totalFiberGrams).toBe(12.0); // 10 + 2

      // Per portie (gedeeld door 2)
      expect(summary.caloriesPerPortion).toBe(232); // 464 / 2
      expect(summary.proteinPerPortion).toBe(7.3); // 14.6 / 2
      expect(summary.carbsPerPortion).toBe(41.0); // 82 / 2

      // Per 100 gram (200g totaal dus / 2)
      expect(summary.caloriesPer100g).toBe(232);
      expect(summary.proteinPer100g).toBe(7.3);
    });
  });

  describe("calculateMacroDistribution", () => {
    it("calculates accurate energy percentages with 4-4-9 Atwater factors", () => {
      // 30g protein = 120 kcal, 40g carbs = 160 kcal, 15g fat = 135 kcal. Total = 415 kcal
      const dist = calculateMacroDistribution(30, 40, 15);

      expect(dist.totalCalories).toBe(415);
      expect(dist.proteinCalories).toBe(120);
      expect(dist.carbsCalories).toBe(160);
      expect(dist.fatCalories).toBe(135);

      // Percentages sum to 100
      expect(dist.proteinPercentage + dist.carbsPercentage + dist.fatPercentage).toBe(100);
      expect(dist.proteinPercentage).toBe(29); // 120/415 = 28.9%
      expect(dist.carbsPercentage).toBe(39); // 160/415 = 38.6%
      expect(dist.fatPercentage).toBe(32); // 100 - 29 - 39 = 32%
    });

    it("handles zero macros gracefully", () => {
      const dist = calculateMacroDistribution(0, 0, 0);
      expect(dist.totalCalories).toBe(0);
      expect(dist.proteinPercentage).toBe(0);
    });
  });

  describe("filterFoods", () => {
    const list: FoodItem[] = [
      dummyBanana, // not favorite, groente_fruit
      dummyOats, // favorite, granen_brood
      {
        id: "33333333-3333-4333-8333-333333333333",
        name: "Kipfilet",
        brand: null,
        category: "vlees_vis_ei",
        caloriesPer100g: 165,
        proteinGramsPer100g: 31,
        carbsGramsPer100g: 0,
        fatGramsPer100g: 3.6,
        fiberGramsPer100g: 0,
        defaultPortionGrams: 150,
        isCustom: true,
        isFavorite: true,
        provenance: { source: "user" },
        createdAt: "2026-10-01T08:00:00.000Z",
      },
    ];

    it("filters by query matching name or brand", () => {
      const res = filterFoods(list, { query: "quaker" });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("Havermout");

      const res2 = filterFoods(list, { query: "kip" });
      expect(res2).toHaveLength(1);
      expect(res2[0].name).toBe("Kipfilet");
    });

    it("filters by category", () => {
      const res = filterFoods(list, { category: "groente_fruit" });
      expect(res).toHaveLength(1);
      expect(res[0].name).toBe("Banaan");
    });

    it("sorts favorites to the top", () => {
      const res = filterFoods(list, {});
      expect(res[0].isFavorite).toBe(true);
      expect(res[1].isFavorite).toBe(true);
      expect(res[2].isFavorite).toBe(false);
    });
  });

  describe("filterRecipes", () => {
    const recipes: Recipe[] = [
      {
        id: "r1",
        name: "Proteïne Havermoutpap",
        description: "Lekker ontbijt met banaan en havermout",
        portions: 1,
        ingredients: [
          {
            foodItemId: dummyOats.id,
            foodName: "Havermout",
            amountGrams: 50,
            calories: 188,
            proteinGrams: 6.8,
            carbsGrams: 31,
            fatGrams: 3.5,
            fiberGrams: 5,
          },
        ],
        totalGrams: 50,
        totalCalories: 188,
        totalProteinGrams: 6.8,
        totalCarbsGrams: 31,
        totalFatGrams: 3.5,
        totalFiberGrams: 5,
        caloriesPer100g: 375,
        proteinPer100g: 13.5,
        carbsPer100g: 62,
        fatPer100g: 7,
        fiberPer100g: 10,
        caloriesPerPortion: 188,
        proteinPerPortion: 6.8,
        carbsPerPortion: 31,
        fatPerPortion: 3.5,
        fiberPerPortion: 5,
        isCustom: true,
        isFavorite: false,
        provenance: { source: "user" },
        createdAt: "2026-10-01T08:00:00.000Z",
      },
    ];

    it("filters by recipe name or ingredient", () => {
      const res = filterRecipes(recipes, { query: "Havermout" });
      expect(res).toHaveLength(1);

      const empty = filterRecipes(recipes, { query: "Pannenkoeken" });
      expect(empty).toHaveLength(0);
    });
  });
});
