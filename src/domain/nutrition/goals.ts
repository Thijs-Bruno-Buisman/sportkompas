import type { DailyNutritionTotals } from "./diary";
import type { Profile } from "@/types/database";

export type NutritionStrategy =
  | "afvallen_rustig"
  | "afvallen_standaard"
  | "afvallen_agressief"
  | "onderhoud"
  | "aankomen_lean"
  | "aankomen_bulken"
  | "aangepast";

export type MacroSplit =
  | "gebalanceerd"
  | "eiwitrijk"
  | "koolhydraatarm"
  | "krachtsport_per_kg"
  | "aangepast";

export interface DailyNutritionTargets {
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterMl: number;
  strategy?: NutritionStrategy;
  macroSplit?: MacroSplit;
}

export interface MetricProgress {
  target: number;
  consumed: number;
  remaining: number;
  percentage: number;
  status: "onder" | "doel_bereikt" | "overschreden";
}

export interface NutritionProgress {
  calories: MetricProgress;
  protein: MetricProgress;
  carbs: MetricProgress;
  fat: MetricProgress;
  fiber: MetricProgress;
  water: MetricProgress;
  isCalorieDeficit: boolean;
  isCalorieSurplus: boolean;
}

/**
 * Standaard dagelijkse richtlijnen als er nog geen profiel is ingevuld.
 */
export const DEFAULT_NUTRITION_TARGETS: DailyNutritionTargets = {
  calories: 2200,
  proteinGrams: 140,
  carbsGrams: 250,
  fatGrams: 70,
  fiberGrams: 30,
  waterMl: 2500,
  strategy: "onderhoud",
  macroSplit: "gebalanceerd",
};

/**
 * Berekent de Basal Metabolic Rate (BMR) volgens Mifflin-St Jeor of Katch-McArdle.
 */
export function calculateBmr(
  gender: Profile["gender"],
  weightKg: number,
  heightCm: number,
  ageYears: number,
  formulaPreference: Profile["formulaPreference"] = "mifflin_st_jeor",
  bodyFatPercentage: number | null = null
): number {
  if (weightKg <= 0) return 1600;

  // Katch-McArdle formule (vereist vetpercentage en baseert zich op Vetvrije Massa / LBM)
  if (
    formulaPreference === "katch_mcardle" &&
    bodyFatPercentage !== null &&
    bodyFatPercentage > 0 &&
    bodyFatPercentage < 70
  ) {
    const leanBodyMassKg = weightKg * (1 - bodyFatPercentage / 100);
    const bmr = 370 + 21.6 * leanBodyMassKg;
    return Math.round(bmr);
  }

  // Mifflin-St Jeor formule (gouden standaard voor algemene populatie)
  const safeAge = Math.max(12, Math.min(100, ageYears || 30));
  const safeHeight = Math.max(100, Math.min(250, heightCm || 175));

  let bmr = 10 * weightKg + 6.25 * safeHeight - 5 * safeAge;

  if (gender === "man") {
    bmr += 5;
  } else if (gender === "vrouw") {
    bmr -= 161;
  } else {
    // Gemiddelde tussen man en vrouw voor genderneutraal / anders / onbekend
    bmr -= 78;
  }

  return Math.round(bmr);
}

/**
 * Berekent het Total Daily Energy Expenditure (TDEE) op basis van activiteitsniveau.
 */
export function calculateTdee(
  bmr: number,
  activityLevel: Profile["activityLevel"]
): number {
  let factor = 1.375; // licht actief als veilige default

  switch (activityLevel) {
    case "sedentair":
      factor = 1.2;
      break;
    case "licht":
      factor = 1.375;
      break;
    case "gemiddeld":
      factor = 1.55;
      break;
    case "zeer":
      factor = 1.725;
      break;
    default:
      factor = 1.375;
      break;
  }

  return Math.round(bmr * factor);
}

/**
 * Berekent calorie-doel op basis van strategie (tekort/overschot/onderhoud).
 */
export function calculateStrategyCalories(
  tdee: number,
  strategy: NutritionStrategy,
  customCalories?: number
): number {
  if (strategy === "aangepast" && customCalories && customCalories > 0) {
    return Math.max(800, Math.min(10000, Math.round(customCalories)));
  }

  let adjustment = 0;
  switch (strategy) {
    case "afvallen_rustig":
      adjustment = -300;
      break;
    case "afvallen_standaard":
      adjustment = -500;
      break;
    case "afvallen_agressief":
      adjustment = -750;
      break;
    case "aankomen_lean":
      adjustment = 250;
      break;
    case "aankomen_bulken":
      adjustment = 500;
      break;
    case "onderhoud":
    default:
      adjustment = 0;
      break;
  }

  const result = Math.round(tdee + adjustment);
  // Veiligheidsgrens: minimaal 1200 kcal om crash-diëten te voorkomen
  return Math.max(1200, result);
}

/**
 * Berekent macronutriëntendoelen in grammen (Eiwit: 4 kcal/g, Koolhydraten: 4 kcal/g, Vet: 9 kcal/g).
 */
export function calculateMacroTargets(
  targetCalories: number,
  split: MacroSplit,
  weightKg: number = 75,
  custom?: {
    proteinGrams?: number;
    carbsGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
    waterMl?: number;
  }
): DailyNutritionTargets {
  if (split === "aangepast" && custom) {
    return {
      calories: targetCalories,
      proteinGrams: Math.round(custom.proteinGrams || 140),
      carbsGrams: Math.round(custom.carbsGrams || 250),
      fatGrams: Math.round(custom.fatGrams || 70),
      fiberGrams: Math.round(custom.fiberGrams || 30),
      waterMl: Math.round(custom.waterMl || 2500),
      strategy: "aangepast",
      macroSplit: "aangepast",
    };
  }

  let pGrams = 0;
  let cGrams = 0;
  let fGrams = 0;

  if (split === "krachtsport_per_kg") {
    // 2.0g eiwit / kg, 1.0g vet / kg, restant aan koolhydraten
    const safeWeight = Math.max(40, Math.min(200, weightKg));
    pGrams = Math.round(safeWeight * 2.0);
    fGrams = Math.round(safeWeight * 1.0);
    const kcalFromPF = pGrams * 4 + fGrams * 9;
    const remainingKcal = Math.max(0, targetCalories - kcalFromPF);
    cGrams = Math.round(remainingKcal / 4);
  } else if (split === "eiwitrijk") {
    // 35% E, 40% K, 25% V
    pGrams = Math.round((targetCalories * 0.35) / 4);
    cGrams = Math.round((targetCalories * 0.4) / 4);
    fGrams = Math.round((targetCalories * 0.25) / 9);
  } else if (split === "koolhydraatarm") {
    // 35% E, 20% K, 45% V
    pGrams = Math.round((targetCalories * 0.35) / 4);
    cGrams = Math.round((targetCalories * 0.2) / 4);
    fGrams = Math.round((targetCalories * 0.45) / 9);
  } else {
    // "gebalanceerd": 30% E, 40% K, 30% V
    pGrams = Math.round((targetCalories * 0.3) / 4);
    cGrams = Math.round((targetCalories * 0.4) / 4);
    fGrams = Math.round((targetCalories * 0.3) / 9);
  }

  // Gezonde vezelinname: ~14g per 1000 kcal met een minimum van 28g
  const fiberGrams = Math.max(28, Math.round((targetCalories / 1000) * 14));

  // Gezonde waterinname: ~35ml per kg lichaamsgewicht met een minimum van 2200ml
  const waterMl = Math.max(2200, Math.round(weightKg * 35));

  return {
    calories: targetCalories,
    proteinGrams: pGrams,
    carbsGrams: cGrams,
    fatGrams: fGrams,
    fiberGrams,
    waterMl,
    macroSplit: split,
  };
}

/**
 * Berekent de voortgang en het resterend budget per macronutriënt en calorieën.
 */
export function calculateNutritionProgress(
  targets: DailyNutritionTargets,
  consumed: DailyNutritionTotals,
  consumedWaterMl: number
): NutritionProgress {
  const calcMetric = (target: number, actual: number): MetricProgress => {
    const safeTarget = Math.max(1, target);
    const safeActual = Math.max(0, actual);
    const remaining = Math.round((safeTarget - safeActual) * 10) / 10;
    const percentage = Math.round((safeActual / safeTarget) * 100);

    let status: MetricProgress["status"] = "onder";
    if (percentage >= 95 && percentage <= 105) {
      status = "doel_bereikt";
    } else if (percentage > 105) {
      status = "overschreden";
    }

    return {
      target: safeTarget,
      consumed: Math.round(safeActual * 10) / 10,
      remaining,
      percentage,
      status,
    };
  };

  return {
    calories: calcMetric(targets.calories, consumed.calories),
    protein: calcMetric(targets.proteinGrams, consumed.proteinGrams),
    carbs: calcMetric(targets.carbsGrams, consumed.carbsGrams),
    fat: calcMetric(targets.fatGrams, consumed.fatGrams),
    fiber: calcMetric(targets.fiberGrams, consumed.fiberGrams),
    water: calcMetric(targets.waterMl, consumedWaterMl),
    isCalorieDeficit: consumed.calories < targets.calories,
    isCalorieSurplus: consumed.calories > targets.calories,
  };
}
