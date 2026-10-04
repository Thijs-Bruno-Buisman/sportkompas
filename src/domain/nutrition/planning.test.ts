import { describe, it, expect } from "vitest";
import {
  groupPlannedMealsByDate,
  groupPlannedMealsByMealType,
  calculatePlannedDailyTotals,
  aggregateWeeklyMealPrepIngredients,
  calculateWeeklyPlanningSummary,
} from "./planning";
import type { PlannedMeal } from "@/types/database";

describe("Domain: Nutrition Planning & Meal Prep", () => {
  const dummyMeal1: PlannedMeal = {
    id: "pmeal-1",
    calendarDate: "2026-10-05",
    mealType: "ontbijt",
    name: "Havermout Power",
    items: [
      {
        foodItemId: "food-1",
        foodName: "Havermout",
        portionGrams: 60,
        calories: 220,
        proteinGrams: 8,
        carbsGrams: 36,
        fatGrams: 4,
        fiberGrams: 6,
      },
      {
        foodItemId: "food-2",
        foodName: "Magere Kwark",
        portionGrams: 200,
        calories: 104,
        proteinGrams: 18,
        carbsGrams: 7,
        fatGrams: 0.4,
        fiberGrams: 0,
      },
    ],
    totalCalories: 324,
    totalProteinGrams: 26,
    totalCarbsGrams: 43,
    totalFatGrams: 4.4,
    totalFiberGrams: 6,
    status: "gepland",
    provenance: { source: "user" },
    createdAt: "2026-10-04T10:00:00Z",
  };

  const dummyMeal2: PlannedMeal = {
    id: "pmeal-2",
    calendarDate: "2026-10-05",
    mealType: "lunch",
    name: "Kip met Rijst",
    items: [
      {
        foodItemId: "food-3",
        foodName: "Kipfilet",
        portionGrams: 150,
        calories: 165,
        proteinGrams: 34.5,
        carbsGrams: 0,
        fatGrams: 2.4,
        fiberGrams: 0,
      },
    ],
    totalCalories: 165,
    totalProteinGrams: 34.5,
    totalCarbsGrams: 0,
    totalFatGrams: 2.4,
    totalFiberGrams: 0,
    status: "genuttigd",
    provenance: { source: "user" },
    createdAt: "2026-10-04T10:00:00Z",
  };

  const dummyMeal3: PlannedMeal = {
    id: "pmeal-3",
    calendarDate: "2026-10-06",
    mealType: "ontbijt",
    name: "Havermout Power",
    items: [
      {
        foodItemId: "food-1",
        foodName: "Havermout",
        portionGrams: 60,
        calories: 220,
        proteinGrams: 8,
        carbsGrams: 36,
        fatGrams: 4,
        fiberGrams: 6,
      },
    ],
    totalCalories: 220,
    totalProteinGrams: 8,
    totalCarbsGrams: 36,
    totalFatGrams: 4,
    totalFiberGrams: 6,
    status: "gepland",
    provenance: { source: "user" },
    createdAt: "2026-10-04T10:00:00Z",
  };

  it("groepeert geplande maaltijden per kalenderdag", () => {
    const grouped = groupPlannedMealsByDate([dummyMeal1, dummyMeal2, dummyMeal3]);
    expect(Object.keys(grouped)).toHaveLength(2);
    expect(grouped["2026-10-05"]).toHaveLength(2);
    expect(grouped["2026-10-06"]).toHaveLength(1);
    expect(grouped["2026-10-05"][0].mealType).toBe("ontbijt");
    expect(grouped["2026-10-05"][1].mealType).toBe("lunch");
  });

  it("groepeert maaltijden per maaltijdmoment", () => {
    const grouped = groupPlannedMealsByMealType([dummyMeal1, dummyMeal2, dummyMeal3]);
    expect(grouped.ontbijt).toHaveLength(2);
    expect(grouped.lunch).toHaveLength(1);
    expect(grouped.diner).toHaveLength(0);
  });

  it("berekent geplande dagtotalen nauwkeurig", () => {
    const totals = calculatePlannedDailyTotals([dummyMeal1, dummyMeal2]);
    expect(totals.calories).toBe(324 + 165);
    expect(totals.proteinGrams).toBe(60.5);
    expect(totals.carbsGrams).toBe(43);
    expect(totals.fatGrams).toBe(6.8);
    expect(totals.fiberGrams).toBe(6);
  });

  it("aggregeert weekingrediënten voor meal prep en boodschappenlijst", () => {
    const prep = aggregateWeeklyMealPrepIngredients([dummyMeal1, dummyMeal2, dummyMeal3]);
    expect(prep.length).toBe(3);

    // Havermout zit in meal 1 (60g) en meal 3 (60g) = 120g totaal
    const oat = prep.find((p) => p.foodName === "Havermout");
    expect(oat).toBeDefined();
    expect(oat?.totalGrams).toBe(120);
    expect(oat?.mealCount).toBe(2);

    // Kipfilet: 150g in meal 2
    const chicken = prep.find((p) => p.foodName === "Kipfilet");
    expect(chicken).toBeDefined();
    expect(chicken?.totalGrams).toBe(150);
  });

  it("berekent correcte algemene weekstatistieken", () => {
    const summary = calculateWeeklyPlanningSummary([dummyMeal1, dummyMeal2, dummyMeal3]);
    expect(summary.totalPlannedMeals).toBe(3);
    expect(summary.completedMeals).toBe(1); // dummyMeal2 status === "genuttigd"
    expect(summary.skippedMeals).toBe(0);
    expect(summary.totalPlannedCalories).toBe(324 + 165 + 220);
  });
});
