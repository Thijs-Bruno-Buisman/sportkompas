/**
 * Domeinlogica voor AI Voedingsadviezen & Macro-Balans (Stap 43 / Prompt 37)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Belangrijke principes:
 * 1. AI als Assistent (Regel 7):
 *    - Voedingsdoelen worden NOOIT autonoom gewijzigd.
 *    - Elk advies is een voorstel dat expliciet door de gebruiker bevestigd ('Accepteren & Toepassen')
 *      of afgewezen ('Negeren') moet worden.
 * 2. Transparantie & Eerlijkheid:
 *    - Alle geadviseerde calorie- en macro-waarden zijn voorzien van het label '(schatting)'.
 *    - Duidelijke niet-medische disclaimer conform Regel 7.
 * 3. Fysiologische Veiligheidsgrenzen (Safety Guardrails):
 *    - Calorie-ondergrens van 1200 kcal om crash-diëten te voorkomen.
 *    - Eiwitbereik tussen 1.2 g/kg en 2.6 g/kg lichaamsgewicht.
 *    - Vetminimum van minstens 0.6 g/kg voor hormonale balans.
 * 4. Trainingsdag vs Rustdag differentiatie:
 *    - Op trainingsdagen: verhoogde koolhydraatinname (+150-300 kcal) voor glycogeenherstel.
 *    - Op rustdagen: onderhoud of licht tekort met stabiele eiwitten voor spierherstel.
 */

import type { Profile } from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import { calculateBmr, calculateTdee } from "@/domain/nutrition/goals";
import type { NutritionAdvice } from "@/lib/ai/schemas";

export interface NutritionContextInput {
  profile?: Profile | null;
  currentTargets: DailyNutritionTargets;
  isTrainingDay: boolean;
  consumedToday?: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  userNote?: string;
}

export interface PreparedNutritionContext {
  weightKg: number;
  heightCm: number;
  gender: string;
  activityLevel: string;
  primaryGoal: string;
  isTrainingDay: boolean;
  baseBmr: number;
  baseTdee: number;
  currentTargets: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  consumedToday?: {
    calories: number;
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
  };
  userNote?: string;
}

export interface AiNutritionProposal {
  summary: string;
  isTrainingDay: boolean;
  baselineCalories: number;
  suggestedCalories: number;
  calorieDeltaKcal: number;
  suggestedProteinGrams: number;
  suggestedCarbsGrams: number;
  suggestedFatGrams: number;
  suggestedFiberGrams: number;
  recommendations: string[];
  rationale: string;
  confidence: "hoog" | "gemiddeld" | "laag";
  isEstimate: true;
  source: "gemini" | "lokale_heuristiek";
  requiresConfirmation: true;
  disclaimer: string;
}

export const AI_NUTRITION_DISCLAIMER =
  "Dit voedingsadvies is een indicatieve schatting op basis van je profiel en trainingsactiviteit. SportKompas stelt geen medische diagnoses of therapeutische diëten. Pas je inname aan op basis van persoonlijke tolerantie en raadpleeg bij gezondheidsklachten een diëtist of arts.";

/**
 * Bereidt de volledige voedingscontext voor voor het AI-endpoint.
 */
export function buildNutritionContext(input: NutritionContextInput): PreparedNutritionContext {
  const { profile, currentTargets, isTrainingDay, consumedToday, userNote } = input;

  const weightKg = profile?.startWeightKg || 75;
  const heightCm = profile?.heightMeters ? Math.round(profile.heightMeters * 100) : 175;
  const gender = profile?.gender || "onbekend";
  const activityLevel = profile?.activityLevel || "gemiddeld";
  const primaryGoal = profile?.primaryGoal || "gezondheid_fitheid";

  const birthYear = profile?.birthDate ? new Date(profile.birthDate).getFullYear() : 1995;
  const ageYears = Math.max(16, new Date().getFullYear() - birthYear);

  const baseBmr = calculateBmr(
    profile?.gender || "onbekend",
    weightKg,
    heightCm,
    ageYears,
    profile?.formulaPreference
  );

  const baseTdee = calculateTdee(baseBmr, profile?.activityLevel || "gemiddeld");

  return {
    weightKg,
    heightCm,
    gender,
    activityLevel,
    primaryGoal,
    isTrainingDay,
    baseBmr,
    baseTdee,
    currentTargets: {
      calories: currentTargets.calories,
      proteinGrams: currentTargets.proteinGrams,
      carbsGrams: currentTargets.carbsGrams,
      fatGrams: currentTargets.fatGrams,
    },
    consumedToday,
    userNote,
  };
}

/**
 * Valideert en begrenst AI-voedingsadviezen met fysiologische guardrails.
 */
export function sanitizeNutritionAdvice(
  rawAdvice: Partial<NutritionAdvice> | null,
  context: PreparedNutritionContext
): AiNutritionProposal {
  const current = context.currentTargets;
  const weightKg = context.weightKg;

  // Bepaal calorie-aanpassing (standaard +200 kcal op trainingsdagen, 0 op rustdagen)
  const defaultCalorieAdjustment = context.isTrainingDay ? 200 : 0;
  let calorieAdjustment =
    typeof rawAdvice?.calorieAdjustmentKcal === "number" && !isNaN(rawAdvice.calorieAdjustmentKcal)
      ? rawAdvice.calorieAdjustmentKcal
      : defaultCalorieAdjustment;

  // Guardrail 1: Begrens aanpassing tussen -750 kcal en +600 kcal
  calorieAdjustment = Math.max(-750, Math.min(600, calorieAdjustment));

  let suggestedCalories = Math.round(current.calories + calorieAdjustment);

  // Guardrail 2: Harde ondergrens van 1200 kcal om crashdiëten te weren
  if (suggestedCalories < 1200) {
    suggestedCalories = 1200;
    calorieAdjustment = suggestedCalories - current.calories;
  }

  // Guardrail 3: Eiwitdoel (tussen 1.4 en 2.4 g/kg)
  const minProtein = Math.round(weightKg * 1.4);
  const maxProtein = Math.round(weightKg * 2.5);
  let suggestedProtein =
    typeof rawAdvice?.proteinTargetGrams === "number" && rawAdvice.proteinTargetGrams > 0
      ? rawAdvice.proteinTargetGrams
      : Math.round(weightKg * (context.isTrainingDay ? 2.0 : 1.8));
  suggestedProtein = Math.max(minProtein, Math.min(maxProtein, suggestedProtein));

  // Guardrail 4: Vetdoel (minimaal 0.6 g/kg, circa 20-30% van calorieën)
  const minFat = Math.round(weightKg * 0.6);
  const targetFatKcal = suggestedCalories * 0.25;
  const defaultFat = Math.max(minFat, Math.round(targetFatKcal / 9));
  const suggestedFat = Math.max(minFat, defaultFat);

  // Guardrail 5: Koolhydraten vullen het restant van de calorieën aan
  const kcalFromProteinAndFat = suggestedProtein * 4 + suggestedFat * 9;
  const remainingKcal = Math.max(0, suggestedCalories - kcalFromProteinAndFat);
  const suggestedCarbs = Math.max(50, Math.round(remainingKcal / 4));

  // Vezeladvies: ~14g per 1000 kcal
  const suggestedFiber = Math.max(25, Math.round((suggestedCalories / 1000) * 14));

  // Label rationale expliciet met (schatting)
  let rationale =
    rawAdvice?.rationale ||
    (context.isTrainingDay
      ? `Op trainingsdagen verbruiken je spieren extra glycogeen. Een verhoging van ~${calorieAdjustment} kcal (schatting) met focus op koolhydraten en eiwitten bevordert herstel.`
      : `Op rustdagen herstelt je lichaam. Een stabiel onderhoudsniveau van ${suggestedCalories} kcal (schatting) met voldoende eiwit optimaliseert spierbehoud.`);

  if (!rationale.includes("(schatting)")) {
    rationale = `${rationale} (schatting)`;
  }

  const defaultRecommendations = context.isTrainingDay
    ? [
        "Neem een eiwit- en koolhydraatrijke maaltijd binnen 2 uur na je training.",
        "Drink minimaal 2,5 tot 3 liter water voor optimale spierhydratatie.",
        "Kies voor complexe koolhydraten (havermout, zilvervliesrijst, zoete aardappel).",
      ]
    : [
        "Behoud een gelijkmatige eiwitverdeling over 3 tot 4 maaltijden.",
        "Focus op vezelrijke groenten en gezonde vetten (olijfolie, noten, avocado).",
        "Blijf goed hydrateren (minimaal 2 liter water).",
      ];

  const recommendations =
    Array.isArray(rawAdvice?.recommendations) && rawAdvice.recommendations.length > 0
      ? rawAdvice.recommendations
      : defaultRecommendations;

  const summary =
    rawAdvice?.summary ||
    (context.isTrainingDay
      ? `Trainingsdag advies: ${suggestedCalories} kcal (+${calorieAdjustment} kcal) & ${suggestedProtein}g eiwit (schatting)`
      : `Rustdag advies: ${suggestedCalories} kcal & ${suggestedProtein}g eiwit voor herstel (schatting)`);

  return {
    summary,
    isTrainingDay: context.isTrainingDay,
    baselineCalories: current.calories,
    suggestedCalories,
    calorieDeltaKcal: calorieAdjustment,
    suggestedProteinGrams: suggestedProtein,
    suggestedCarbsGrams: suggestedCarbs,
    suggestedFatGrams: suggestedFat,
    suggestedFiberGrams: suggestedFiber,
    recommendations,
    rationale,
    confidence: "hoog",
    isEstimate: true,
    source: rawAdvice ? "gemini" : "lokale_heuristiek",
    requiresConfirmation: true,
    disclaimer: AI_NUTRITION_DISCLAIMER,
  };
}

/**
 * Past een goedgekeurd voedingsvoorstel toe op de dagelijkse doelen.
 */
export function applyNutritionAdviceToTargets(
  currentTargets: DailyNutritionTargets,
  proposal: AiNutritionProposal
): DailyNutritionTargets {
  return {
    ...currentTargets,
    calories: proposal.suggestedCalories,
    proteinGrams: proposal.suggestedProteinGrams,
    carbsGrams: proposal.suggestedCarbsGrams,
    fatGrams: proposal.suggestedFatGrams,
    fiberGrams: proposal.suggestedFiberGrams,
    strategy: "aangepast",
    macroSplit: "aangepast",
  };
}
