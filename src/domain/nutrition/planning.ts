import type { PlannedMeal, MealLog, MealItemEntry } from "@/types/database";
import type { DailyNutritionTotals } from "./diary";

export interface MealPrepIngredientSummary {
  foodItemId: string;
  foodName: string;
  totalGrams: number;
  mealCount: number;
  estimatedCalories: number;
  estimatedProtein: number;
}

export interface WeeklyPlanningSummary {
  totalPlannedMeals: number;
  completedMeals: number;
  skippedMeals: number;
  totalPlannedCalories: number;
  totalPlannedProteinGrams: number;
}

/**
 * Groepeert geplande maaltijden per kalenderdatum (YYYY-MM-DD).
 */
export function groupPlannedMealsByDate(
  plannedMeals: PlannedMeal[]
): Record<string, PlannedMeal[]> {
  const result: Record<string, PlannedMeal[]> = {};

  for (const meal of plannedMeals) {
    if (!result[meal.calendarDate]) {
      result[meal.calendarDate] = [];
    }
    result[meal.calendarDate].push(meal);
  }

  // Sorteer op maaltijdmoment
  const order: Record<MealLog["mealType"], number> = {
    ontbijt: 1,
    lunch: 2,
    diner: 3,
    snacks: 4,
  };

  for (const date of Object.keys(result)) {
    result[date].sort((a, b) => order[a.mealType] - order[b.mealType]);
  }

  return result;
}

/**
 * Groepeert geplande maaltijden voor een specifieke dag per maaltijdmoment.
 */
export function groupPlannedMealsByMealType(
  plannedMeals: PlannedMeal[]
): Record<MealLog["mealType"], PlannedMeal[]> {
  const result: Record<MealLog["mealType"], PlannedMeal[]> = {
    ontbijt: [],
    lunch: [],
    diner: [],
    snacks: [],
  };

  for (const meal of plannedMeals) {
    if (meal.mealType in result) {
      result[meal.mealType].push(meal);
    }
  }

  return result;
}

/**
 * Berekent de geplande dagtotalen van alle maaltijden op die dag (ongeacht status).
 */
export function calculatePlannedDailyTotals(
  plannedMeals: PlannedMeal[]
): DailyNutritionTotals {
  let calories = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;
  let fiberGrams = 0;

  for (const meal of plannedMeals) {
    calories += meal.totalCalories;
    proteinGrams += meal.totalProteinGrams;
    carbsGrams += meal.totalCarbsGrams;
    fatGrams += meal.totalFatGrams;
    fiberGrams += meal.totalFiberGrams || 0;
  }

  return {
    calories: Math.round(calories),
    proteinGrams: Math.round(proteinGrams * 10) / 10,
    carbsGrams: Math.round(carbsGrams * 10) / 10,
    fatGrams: Math.round(fatGrams * 10) / 10,
    fiberGrams: Math.round(fiberGrams * 10) / 10,
  };
}

/**
 * Aggregeert ingrediënten van alle geplande maaltijden voor de week tot een
 * overzichtelijke boodschappen- en meal prep lijst.
 */
export function aggregateWeeklyMealPrepIngredients(
  plannedMeals: PlannedMeal[]
): MealPrepIngredientSummary[] {
  const map = new Map<string, MealPrepIngredientSummary>();

  for (const meal of plannedMeals) {
    // Alleen geplande en eventueel genuttigde maaltijden meetellen (niet overgeslagen)
    if (meal.status === "overgeslagen") continue;

    for (const item of meal.items) {
      const key = item.foodItemId || item.foodName.toLowerCase().trim();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          foodItemId: item.foodItemId,
          foodName: item.foodName,
          totalGrams: item.portionGrams,
          mealCount: 1,
          estimatedCalories: item.calories,
          estimatedProtein: item.proteinGrams,
        });
      } else {
        existing.totalGrams += item.portionGrams;
        existing.mealCount += 1;
        existing.estimatedCalories += item.calories;
        existing.estimatedProtein += item.proteinGrams;
      }
    }
  }

  return Array.from(map.values())
    .map((item) => ({
      ...item,
      totalGrams: Math.round(item.totalGrams * 10) / 10,
      estimatedCalories: Math.round(item.estimatedCalories),
      estimatedProtein: Math.round(item.estimatedProtein * 10) / 10,
    }))
    .sort((a, b) => b.totalGrams - a.totalGrams);
}

/**
 * Berekent algemene weekstatistieken voor de maaltijdplanning.
 */
export function calculateWeeklyPlanningSummary(
  plannedMeals: PlannedMeal[]
): WeeklyPlanningSummary {
  let completed = 0;
  let skipped = 0;
  let totalCal = 0;
  let totalProtein = 0;

  for (const m of plannedMeals) {
    if (m.status === "genuttigd") completed++;
    else if (m.status === "overgeslagen") skipped++;

    totalCal += m.totalCalories;
    totalProtein += m.totalProteinGrams;
  }

  return {
    totalPlannedMeals: plannedMeals.length,
    completedMeals: completed,
    skippedMeals: skipped,
    totalPlannedCalories: Math.round(totalCal),
    totalPlannedProteinGrams: Math.round(totalProtein * 10) / 10,
  };
}
