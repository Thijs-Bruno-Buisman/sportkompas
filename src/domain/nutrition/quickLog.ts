import type { MealLog, MealItemEntry, Recipe, RecipeIngredient } from "@/types/database";
import { calculateRecipeTotals } from "./calculations";

export interface RecentMealItemSummary {
  foodItemId: string;
  foodName: string;
  lastPortionGrams: number;
  lastCalories: number;
  lastProteinGrams: number;
  lastCarbsGrams: number;
  lastFatGrams: number;
  lastFiberGrams: number;
  lastLoggedAt: string;
  timesLogged: number;
}

export interface QuickPortionOption {
  label: string;
  grams: number;
}

/**
 * Extraheert unieke recent gelogde voedingsitems uit maaltijdlogs,
 * gesorteerd op meest recent gelogd en aantal keren gebruikt.
 */
export function extractRecentMealItems(
  logs: MealLog[],
  limit: number = 20
): RecentMealItemSummary[] {
  const map = new Map<string, RecentMealItemSummary>();

  // Sorteer logs chronologisch aflopend (nieuwste eerst)
  const sortedLogs = [...logs].sort((a, b) => {
    const timeA = new Date(a.loggedAt || a.calendarDate).getTime();
    const timeB = new Date(b.loggedAt || b.calendarDate).getTime();
    return timeB - timeA;
  });

  for (const log of sortedLogs) {
    const logTimestamp = log.loggedAt || `${log.calendarDate}T12:00:00.000Z`;

    for (const item of log.items) {
      const key = item.foodItemId || item.foodName.toLowerCase().trim();
      const existing = map.get(key);

      if (!existing) {
        map.set(key, {
          foodItemId: item.foodItemId,
          foodName: item.foodName,
          lastPortionGrams: item.portionGrams,
          lastCalories: item.calories,
          lastProteinGrams: item.proteinGrams,
          lastCarbsGrams: item.carbsGrams,
          lastFatGrams: item.fatGrams,
          lastFiberGrams: item.fiberGrams || 0,
          lastLoggedAt: logTimestamp,
          timesLogged: 1,
        });
      } else {
        existing.timesLogged += 1;
        // Als dit log-item nieuwer is, update de laatste portie en datum
        if (new Date(logTimestamp).getTime() > new Date(existing.lastLoggedAt).getTime()) {
          existing.lastPortionGrams = item.portionGrams;
          existing.lastCalories = item.calories;
          existing.lastProteinGrams = item.proteinGrams;
          existing.lastCarbsGrams = item.carbsGrams;
          existing.lastFatGrams = item.fatGrams;
          existing.lastFiberGrams = item.fiberGrams || 0;
          existing.lastLoggedAt = logTimestamp;
        }
      }
    }
  }

  return Array.from(map.values())
    .sort((a, b) => new Date(b.lastLoggedAt).getTime() - new Date(a.lastLoggedAt).getTime())
    .slice(0, limit);
}

/**
 * Converteert een gelogde maaltijd naar een herbruikbaar Recept / Maaltijdsjabloon.
 */
export function createRecipeFromMealLog(
  mealLog: MealLog,
  recipeName: string,
  portions: number = 1
): Omit<Recipe, "id"> {
  const safePortions = Math.max(1, Math.round(portions));
  const safeName = recipeName.trim() || `${mealLog.mealType.charAt(0).toUpperCase() + mealLog.mealType.slice(1)} Sjabloon`;

  const ingredients: RecipeIngredient[] = mealLog.items.map((item) => ({
    foodItemId: item.foodItemId,
    foodName: item.foodName,
    amountGrams: item.portionGrams,
    calories: item.calories,
    proteinGrams: item.proteinGrams,
    carbsGrams: item.carbsGrams,
    fatGrams: item.fatGrams,
    fiberGrams: item.fiberGrams || 0,
  }));

  const totals = calculateRecipeTotals(ingredients, safePortions);
  const now = new Date().toISOString();

  return {
    name: safeName,
    description: `Aangemaakt vanuit ${mealLog.mealType} op ${mealLog.calendarDate}`,
    portions: safePortions,
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
    isFavorite: false,
    provenance: {
      source: "user",
    },
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Berekent praktische snelkeuzeknoppen voor porties op basis van een standaard portiegrootte.
 */
export function getQuickPortionOptions(defaultPortionGrams: number = 100): QuickPortionOption[] {
  const optionsMap = new Map<number, string>();

  const base = Math.max(1, Math.round(defaultPortionGrams));

  if (base !== 100) {
    const half = Math.round(base * 0.5);
    if (half > 0) optionsMap.set(half, `½ portie (${half}g)`);
    optionsMap.set(base, `1 portie (${base}g)`);
    const oneAndHalf = Math.round(base * 1.5);
    optionsMap.set(oneAndHalf, `1½ portie (${oneAndHalf}g)`);
    const double = Math.round(base * 2);
    optionsMap.set(double, `2 porties (${double}g)`);
  }

  // Voeg nuttige vaste gram-opties toe
  const standardGrams = [50, 100, 150, 200, 250];
  for (const g of standardGrams) {
    if (!optionsMap.has(g)) {
      optionsMap.set(g, `${g}g`);
    }
  }

  const result: QuickPortionOption[] = [];
  const sortedGrams = Array.from(optionsMap.keys()).sort((a, b) => a - b);
  for (const g of sortedGrams) {
    result.push({
      grams: g,
      label: optionsMap.get(g)!,
    });
  }

  return result.slice(0, 6);
}

/**
 * Kopieert en kloont items van een maaltijd die veilig elders ingevoegd kunnen worden.
 */
export function duplicateMealItems(items: MealItemEntry[]): MealItemEntry[] {
  return items.map((item) => ({
    ...item,
  }));
}
