import type { FoodItem, FoodCategory, Recipe, RecipeIngredient } from "@/types/database";

export interface PortionNutrition {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface MacroDistribution {
  totalCalories: number;
  proteinCalories: number;
  carbsCalories: number;
  fatCalories: number;
  proteinPercentage: number;
  carbsPercentage: number;
  fatPercentage: number;
}

export interface CalculatedRecipeSummary {
  totalGrams: number;
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  // Per 100 gram
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  // Per portie
  caloriesPerPortion: number;
  proteinPerPortion: number;
  carbsPerPortion: number;
  fatPerPortion: number;
  fiberPerPortion: number;
}

/**
 * Berekent calorieën en macronutriënten voor een gewenste portiegrootte in grammen.
 * Calorieën worden afgerond op hele getallen; macronutriënten op 1 decimaal.
 */
export function calculateNutritionForPortion(
  foodItem: Pick<
    FoodItem,
    "caloriesPer100g" | "proteinGramsPer100g" | "carbsGramsPer100g" | "fatGramsPer100g" | "fiberGramsPer100g"
  >,
  grams: number
): PortionNutrition {
  if (grams <= 0) {
    return {
      calories: 0,
      proteinGrams: 0,
      carbsGrams: 0,
      fatGrams: 0,
      fiberGrams: 0,
    };
  }

  const factor = grams / 100;
  return {
    calories: Math.round(foodItem.caloriesPer100g * factor),
    proteinGrams: Math.round(foodItem.proteinGramsPer100g * factor * 10) / 10,
    carbsGrams: Math.round(foodItem.carbsGramsPer100g * factor * 10) / 10,
    fatGrams: Math.round(foodItem.fatGramsPer100g * factor * 10) / 10,
    fiberGrams: Math.round(foodItem.fiberGramsPer100g * factor * 10) / 10,
  };
}

/**
 * Berekent de totale voedingswaarden, waarden per portie en waarden per 100g voor een recept.
 */
export function calculateRecipeTotals(
  ingredients: RecipeIngredient[],
  portions: number
): CalculatedRecipeSummary {
  const safePortions = Math.max(1, Math.round(portions));

  let totalGrams = 0;
  let totalCalories = 0;
  let totalProteinGrams = 0;
  let totalCarbsGrams = 0;
  let totalFatGrams = 0;
  let totalFiberGrams = 0;

  for (const ing of ingredients) {
    totalGrams += ing.amountGrams;
    totalCalories += ing.calories;
    totalProteinGrams += ing.proteinGrams;
    totalCarbsGrams += ing.carbsGrams;
    totalFatGrams += ing.fatGrams;
    totalFiberGrams += ing.fiberGrams;
  }

  totalGrams = Math.round(totalGrams * 10) / 10;
  totalCalories = Math.round(totalCalories);
  totalProteinGrams = Math.round(totalProteinGrams * 10) / 10;
  totalCarbsGrams = Math.round(totalCarbsGrams * 10) / 10;
  totalFatGrams = Math.round(totalFatGrams * 10) / 10;
  totalFiberGrams = Math.round(totalFiberGrams * 10) / 10;

  // Per portie
  const caloriesPerPortion = Math.round(totalCalories / safePortions);
  const proteinPerPortion = Math.round((totalProteinGrams / safePortions) * 10) / 10;
  const carbsPerPortion = Math.round((totalCarbsGrams / safePortions) * 10) / 10;
  const fatPerPortion = Math.round((totalFatGrams / safePortions) * 10) / 10;
  const fiberPerPortion = Math.round((totalFiberGrams / safePortions) * 10) / 10;

  // Per 100 gram bereid recept
  const factor100g = totalGrams > 0 ? 100 / totalGrams : 0;
  const caloriesPer100g = Math.round(totalCalories * factor100g);
  const proteinPer100g = Math.round(totalProteinGrams * factor100g * 10) / 10;
  const carbsPer100g = Math.round(totalCarbsGrams * factor100g * 10) / 10;
  const fatPer100g = Math.round(totalFatGrams * factor100g * 10) / 10;
  const fiberPer100g = Math.round(totalFiberGrams * factor100g * 10) / 10;

  return {
    totalGrams,
    totalCalories,
    totalProteinGrams,
    totalCarbsGrams,
    totalFatGrams,
    totalFiberGrams,
    caloriesPer100g,
    proteinPer100g,
    carbsPer100g,
    fatPer100g,
    fiberPer100g,
    caloriesPerPortion,
    proteinPerPortion,
    carbsPerPortion,
    fatPerPortion,
    fiberPerPortion,
  };
}

/**
 * Berekent de energieverdeling (macro percentages) volgens de Atwater-factoren:
 * Eiwit = 4 kcal/g, Koolhydraten = 4 kcal/g, Vetten = 9 kcal/g.
 */
export function calculateMacroDistribution(
  proteinGrams: number,
  carbsGrams: number,
  fatGrams: number
): MacroDistribution {
  const pKcal = Math.max(0, proteinGrams) * 4;
  const cKcal = Math.max(0, carbsGrams) * 4;
  const fKcal = Math.max(0, fatGrams) * 9;
  const total = pKcal + cKcal + fKcal;

  if (total <= 0) {
    return {
      totalCalories: 0,
      proteinCalories: 0,
      carbsCalories: 0,
      fatCalories: 0,
      proteinPercentage: 0,
      carbsPercentage: 0,
      fatPercentage: 0,
    };
  }

  const pPct = Math.round((pKcal / total) * 100);
  const cPct = Math.round((cKcal / total) * 100);
  const fPct = Math.max(0, 100 - pPct - cPct); // Garandeert 100% sommatie

  return {
    totalCalories: Math.round(total),
    proteinCalories: Math.round(pKcal),
    carbsCalories: Math.round(cKcal),
    fatCalories: Math.round(fKcal),
    proteinPercentage: pPct,
    carbsPercentage: cPct,
    fatPercentage: fPct,
  };
}

/**
 * Geeft Nederlandstalige label en styling metadata voor voedingscategorieën.
 */
export function getCategoryMetadata(category: FoodCategory): {
  label: string;
  badgeBg: string;
  badgeText: string;
} {
  switch (category) {
    case "vlees_vis_ei":
      return { label: "Vlees, Vis & Ei", badgeBg: "bg-rose-50 dark:bg-rose-950/40", badgeText: "text-rose-600 dark:text-rose-400" };
    case "zuivel":
      return { label: "Zuivel", badgeBg: "bg-sky-50 dark:bg-sky-950/40", badgeText: "text-sky-600 dark:text-sky-400" };
    case "granen_brood":
      return { label: "Granen & Brood", badgeBg: "bg-amber-50 dark:bg-amber-950/40", badgeText: "text-amber-600 dark:text-amber-400" };
    case "groente_fruit":
      return { label: "Groente & Fruit", badgeBg: "bg-emerald-50 dark:bg-emerald-950/40", badgeText: "text-emerald-600 dark:text-emerald-400" };
    case "peulvruchten":
      return { label: "Peulvruchten", badgeBg: "bg-teal-50 dark:bg-teal-950/40", badgeText: "text-teal-600 dark:text-teal-400" };
    case "noten_zaden":
      return { label: "Noten & Zaden", badgeBg: "bg-orange-50 dark:bg-orange-950/40", badgeText: "text-orange-600 dark:text-orange-400" };
    case "oliën_sauzen":
      return { label: "Oliën & Vetten", badgeBg: "bg-yellow-50 dark:bg-yellow-950/40", badgeText: "text-yellow-600 dark:text-yellow-400" };
    case "dranken":
      return { label: "Dranken", badgeBg: "bg-blue-50 dark:bg-blue-950/40", badgeText: "text-blue-600 dark:text-blue-400" };
    case "supplementen":
      return { label: "Supplementen", badgeBg: "bg-purple-50 dark:bg-purple-950/40", badgeText: "text-purple-600 dark:text-purple-400" };
    case "snacks_zoet":
      return { label: "Snacks & Zoet", badgeBg: "bg-pink-50 dark:bg-pink-950/40", badgeText: "text-pink-600 dark:text-pink-400" };
    case "overig":
    default:
      return { label: "Overig", badgeBg: "bg-slate-100 dark:bg-slate-800", badgeText: "text-slate-600 dark:text-slate-400" };
  }
}

export interface FoodFilterOptions {
  query?: string;
  category?: FoodCategory | "alle";
  onlyFavorites?: boolean;
  onlyCustom?: boolean;
}

/**
 * Filtert en sorteert voedingsmiddelen op basis van zoekterm, categorie en favorieten.
 */
export function filterFoods(foods: FoodItem[], options: FoodFilterOptions): FoodItem[] {
  const { query, category = "alle", onlyFavorites = false, onlyCustom = false } = options;
  const q = query ? query.toLowerCase().trim() : "";

  return foods
    .filter((f) => {
      if (onlyFavorites && !f.isFavorite) return false;
      if (onlyCustom && !f.isCustom) return false;
      if (category !== "alle" && f.category !== category) return false;
      if (q) {
        const nameMatch = f.name.toLowerCase().includes(q);
        const brandMatch = f.brand ? f.brand.toLowerCase().includes(q) : false;
        if (!nameMatch && !brandMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      // Favorieten eerst, dan alfabetisch op naam
      if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) {
        return a.isFavorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "nl");
    });
}

export interface RecipeFilterOptions {
  query?: string;
  onlyFavorites?: boolean;
}

/**
 * Filtert en sorteert recepten op basis van zoekterm en favorieten.
 */
export function filterRecipes(recipes: Recipe[], options: RecipeFilterOptions): Recipe[] {
  const { query, onlyFavorites = false } = options;
  const q = query ? query.toLowerCase().trim() : "";

  return recipes
    .filter((r) => {
      if (onlyFavorites && !r.isFavorite) return false;
      if (q) {
        const nameMatch = r.name.toLowerCase().includes(q);
        const descMatch = r.description ? r.description.toLowerCase().includes(q) : false;
        const ingMatch = r.ingredients.some((i) => i.foodName.toLowerCase().includes(q));
        if (!nameMatch && !descMatch && !ingMatch) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (Boolean(a.isFavorite) !== Boolean(b.isFavorite)) {
        return a.isFavorite ? -1 : 1;
      }
      return a.name.localeCompare(b.name, "nl");
    });
}
