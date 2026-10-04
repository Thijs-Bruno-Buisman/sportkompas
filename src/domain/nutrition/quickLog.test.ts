import { describe, it, expect } from "vitest";
import {
  extractRecentMealItems,
  createRecipeFromMealLog,
  getQuickPortionOptions,
  duplicateMealItems,
} from "./quickLog";
import type { MealLog, MealItemEntry } from "@/types/database";

describe("Domain: Nutrition Quick Log & Portions", () => {
  const dummyItem1: MealItemEntry = {
    foodItemId: "food-1",
    foodName: "Havermout",
    portionGrams: 50,
    calories: 185,
    proteinGrams: 6.5,
    carbsGrams: 30,
    fatGrams: 3.5,
    fiberGrams: 5,
  };

  const dummyItem2: MealItemEntry = {
    foodItemId: "food-2",
    foodName: "Magere Kwark",
    portionGrams: 250,
    calories: 130,
    proteinGrams: 22.5,
    carbsGrams: 8.8,
    fatGrams: 0.5,
    fiberGrams: 0,
  };

  const dummyLogs: MealLog[] = [
    {
      id: "log-1",
      calendarDate: "2026-10-01",
      mealType: "ontbijt",
      items: [dummyItem1, dummyItem2],
      totalCalories: 315,
      totalProteinGrams: 29,
      totalCarbsGrams: 38.8,
      totalFatGrams: 4,
      totalFiberGrams: 5,
      loggedAt: "2026-10-01T08:00:00.000Z",
    },
    {
      id: "log-2",
      calendarDate: "2026-10-02",
      mealType: "lunch",
      items: [
        {
          foodItemId: "food-1",
          foodName: "Havermout",
          portionGrams: 60,
          calories: 222,
          proteinGrams: 7.8,
          carbsGrams: 36,
          fatGrams: 4.2,
          fiberGrams: 6,
        },
      ],
      totalCalories: 222,
      totalProteinGrams: 7.8,
      totalCarbsGrams: 36,
      totalFatGrams: 4.2,
      totalFiberGrams: 6,
      loggedAt: "2026-10-02T12:00:00.000Z",
    },
  ];

  it("extraheert recente unieke items gesorteerd op meest recente logging", () => {
    const recents = extractRecentMealItems(dummyLogs);
    expect(recents.length).toBe(2);

    // Havermout was het meest recent (2026-10-02)
    expect(recents[0].foodItemId).toBe("food-1");
    expect(recents[0].timesLogged).toBe(2);
    expect(recents[0].lastPortionGrams).toBe(60);

    // Kwark was op 2026-10-01
    expect(recents[1].foodItemId).toBe("food-2");
    expect(recents[1].timesLogged).toBe(1);
    expect(recents[1].lastPortionGrams).toBe(250);
  });

  it("converteert een MealLog netjes naar een nieuw Recept / Sjabloon", () => {
    const meal = dummyLogs[0];
    const recipe = createRecipeFromMealLog(meal, "Power Ontbijt", 1);

    expect(recipe.name).toBe("Power Ontbijt");
    expect(recipe.portions).toBe(1);
    expect(recipe.ingredients.length).toBe(2);
    expect(recipe.totalGrams).toBe(300);
    expect(recipe.totalCalories).toBe(315);
    expect(recipe.totalProteinGrams).toBe(29);
    expect(recipe.isCustom).toBe(true);
    expect(recipe.isFavorite).toBe(false);
  });

  it("berekent dynamische portieopties op basis van standaard portie", () => {
    const options = getQuickPortionOptions(50);
    expect(options.length).toBeGreaterThan(2);

    const labels = options.map((o) => o.label);
    expect(labels.some((l) => l.includes("1 portie (50g)"))).toBe(true);
    expect(labels.some((l) => l.includes("2 porties (100g)"))).toBe(true);
  });

  it("dupliceert maaltijditems zonder neveneffecten op de originele array", () => {
    const original = [dummyItem1];
    const cloned = duplicateMealItems(original);

    expect(cloned).toEqual(original);
    expect(cloned[0]).not.toBe(original[0]);
  });
});
