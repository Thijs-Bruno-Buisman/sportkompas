import type { MealLog, MealItemEntry } from "@/types/database";

export interface DailyNutritionTotals {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface MealTypeSummary {
  mealType: MealLog["mealType"];
  title: string;
  logs: MealLog[];
  itemsCount: number;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
}

export const MEAL_TYPES: Array<{ id: MealLog["mealType"]; title: string }> = [
  { id: "ontbijt", title: "Ontbijt" },
  { id: "lunch", title: "Lunch" },
  { id: "diner", title: "Diner" },
  { id: "snacks", title: "Snacks & Tussendoor" },
];

/**
 * Berekent de geaggregeerde totalen van alle maaltijdlogs op een specifieke dag.
 */
export function calculateDailyTotals(logs: MealLog[]): DailyNutritionTotals {
  let calories = 0;
  let proteinGrams = 0;
  let carbsGrams = 0;
  let fatGrams = 0;
  let fiberGrams = 0;

  for (const log of logs) {
    calories += log.totalCalories;
    proteinGrams += log.totalProteinGrams;
    carbsGrams += log.totalCarbsGrams;
    fatGrams += log.totalFatGrams;

    // Neem log.totalFiberGrams of tel de individuele items
    if (log.totalFiberGrams !== undefined) {
      fiberGrams += log.totalFiberGrams;
    } else {
      for (const item of log.items) {
        fiberGrams += item.fiberGrams || 0;
      }
    }
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
 * Groepeert maaltijdlogs per maaltijdtype (ontbijt, lunch, diner, snacks) en berekent de subtotale waarden.
 */
export function groupLogsByMealType(logs: MealLog[]): Record<MealLog["mealType"], MealTypeSummary> {
  const result: Record<MealLog["mealType"], MealTypeSummary> = {
    ontbijt: {
      mealType: "ontbijt",
      title: "Ontbijt",
      logs: [],
      itemsCount: 0,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFiberGrams: 0,
    },
    lunch: {
      mealType: "lunch",
      title: "Lunch",
      logs: [],
      itemsCount: 0,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFiberGrams: 0,
    },
    diner: {
      mealType: "diner",
      title: "Diner",
      logs: [],
      itemsCount: 0,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFiberGrams: 0,
    },
    snacks: {
      mealType: "snacks",
      title: "Snacks & Tussendoor",
      logs: [],
      itemsCount: 0,
      totalCalories: 0,
      totalProteinGrams: 0,
      totalCarbsGrams: 0,
      totalFatGrams: 0,
      totalFiberGrams: 0,
    },
  };

  for (const log of logs) {
    if (log.mealType in result) {
      const group = result[log.mealType];
      group.logs.push(log);
      group.itemsCount += log.items.length;
      group.totalCalories += log.totalCalories;
      group.totalProteinGrams += log.totalProteinGrams;
      group.totalCarbsGrams += log.totalCarbsGrams;
      group.totalFatGrams += log.totalFatGrams;

      if (log.totalFiberGrams !== undefined) {
        group.totalFiberGrams += log.totalFiberGrams;
      } else {
        for (const item of log.items) {
          group.totalFiberGrams += item.fiberGrams || 0;
        }
      }
    }
  }

  // Afronden op 1 decimaal
  for (const key of Object.keys(result) as MealLog["mealType"][]) {
    const group = result[key];
    group.totalCalories = Math.round(group.totalCalories);
    group.totalProteinGrams = Math.round(group.totalProteinGrams * 10) / 10;
    group.totalCarbsGrams = Math.round(group.totalCarbsGrams * 10) / 10;
    group.totalFatGrams = Math.round(group.totalFatGrams * 10) / 10;
    group.totalFiberGrams = Math.round(group.totalFiberGrams * 10) / 10;
  }

  return result;
}

/**
 * Maakt een nieuwe MealLog aan voor een specifiek item op een kalenderdag.
 */
export function createMealLogFromItem(
  calendarDate: string,
  mealType: MealLog["mealType"],
  item: MealItemEntry
): MealLog {
  return {
    id: crypto.randomUUID(),
    calendarDate,
    mealType,
    items: [item],
    totalCalories: item.calories,
    totalProteinGrams: item.proteinGrams,
    totalCarbsGrams: item.carbsGrams,
    totalFatGrams: item.fatGrams,
    totalFiberGrams: item.fiberGrams,
    loggedAt: new Date().toISOString(),
  };
}

/**
 * Herrekent de totalen van een MealLog nadat items zijn gewijzigd of verwijderd.
 */
export function recalculateMealLogTotals(log: MealLog): MealLog {
  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;

  for (const item of log.items) {
    calories += item.calories;
    protein += item.proteinGrams;
    carbs += item.carbsGrams;
    fat += item.fatGrams;
    fiber += item.fiberGrams;
  }

  return {
    ...log,
    totalCalories: Math.round(calories),
    totalProteinGrams: Math.round(protein * 10) / 10,
    totalCarbsGrams: Math.round(carbs * 10) / 10,
    totalFatGrams: Math.round(fat * 10) / 10,
    totalFiberGrams: Math.round(fiber * 10) / 10,
  };
}
