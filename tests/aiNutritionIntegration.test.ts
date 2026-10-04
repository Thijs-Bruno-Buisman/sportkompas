import { describe, it, expect } from "vitest";
import {
  buildNutritionContext,
  sanitizeNutritionAdvice,
  applyNutritionAdviceToTargets,
  AI_NUTRITION_DISCLAIMER,
} from "@/domain/ai/nutritionAdvisor";
import { generateLocalHeuristicResponse } from "@/lib/ai/provider";
import type { Profile } from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

describe("Stap 43 / Prompt 37 — AI Voedingsadviezen Integratietest", () => {
  const profile: Profile = {
    id: "prof-thijs",
    name: "Thijs",
    birthDate: "1998-05-15",
    gender: "man",
    heightMeters: 1.84,
    startWeightKg: 80,
    targetWeightKg: 82,
    activityLevel: "gemiddeld",
    primaryGoal: "spieropbouw",
    experienceLevel: "gemiddeld",
    strengthDaysPerWeek: 4,
    cardioDaysPerWeek: 2,
    availableEquipment: ["barbell", "dumbbell"],
    unitPreference: "metric",
    formulaPreference: "mifflin_st_jeor",
    onboardingCompleted: true,
    provenance: { source: "user" },
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
  };

  const currentTargets: DailyNutritionTargets = {
    calories: 2500,
    proteinGrams: 160,
    carbsGrams: 280,
    fatGrams: 75,
    fiberGrams: 35,
    waterMl: 3000,
    strategy: "onderhoud",
    macroSplit: "gebalanceerd",
  };

  it("bouwt correcte context met BMR, TDEE en trainingsdag differentiatie", () => {
    const context = buildNutritionContext({
      profile,
      currentTargets,
      isTrainingDay: true,
      userNote: "Zware squatsessie",
    });

    expect(context.weightKg).toBe(80);
    expect(context.heightCm).toBe(184);
    expect(context.isTrainingDay).toBe(true);
    expect(context.baseBmr).toBeGreaterThan(1600);
    expect(context.baseTdee).toBeGreaterThan(context.baseBmr);
    expect(context.userNote).toBe("Zware squatsessie");
  });

  it("differentieert dynamisch tussen trainingsdag (+kcal/koolhydraten) en rustdag (herstel/stabiel)", () => {
    const trainingContext = buildNutritionContext({
      profile,
      currentTargets,
      isTrainingDay: true,
    });
    const restContext = buildNutritionContext({
      profile,
      currentTargets,
      isTrainingDay: false,
    });

    const trainingAdvice = sanitizeNutritionAdvice(null, trainingContext);
    const restAdvice = sanitizeNutritionAdvice(null, restContext);

    // Trainingsdag moet extra calorieën hebben (+200 kcal)
    expect(trainingAdvice.isTrainingDay).toBe(true);
    expect(trainingAdvice.suggestedCalories).toBe(2700);
    expect(trainingAdvice.calorieDeltaKcal).toBe(200);
    expect(trainingAdvice.suggestedProteinGrams).toBe(160); // 80kg * 2.0
    expect(trainingAdvice.rationale).toContain("(schatting)");

    // Rustdag moet onderhoud hebben
    expect(restAdvice.isTrainingDay).toBe(false);
    expect(restAdvice.suggestedCalories).toBe(2500);
    expect(restAdvice.calorieDeltaKcal).toBe(0);
    expect(restAdvice.suggestedProteinGrams).toBe(144); // 80kg * 1.8
    expect(restAdvice.rationale).toContain("(schatting)");
  });

  it("genereert betrouwbare gestructureerde AI-output via de lokale provider (Regel 8)", () => {
    const context = buildNutritionContext({
      profile,
      currentTargets,
      isTrainingDay: true,
    });

    const response = generateLocalHeuristicResponse({
      task: "nutrition_advice",
      context: context as unknown as Record<string, unknown>,
    });

    expect(response.success).toBe(true);
    expect(response.isEstimate).toBe(true);
    expect(response.disclaimer).toBeDefined();

    const sanitized = sanitizeNutritionAdvice(response.structuredData as any, context);
    expect(sanitized.suggestedCalories).toBe(2700);
    expect(sanitized.isEstimate).toBe(true);
    expect(sanitized.requiresConfirmation).toBe(true);
  });

  it("handhaaft fysiologische guardrails tegen onveilige calorie-inname of extreme macro's", () => {
    const lowContext = buildNutritionContext({
      profile,
      currentTargets: {
        ...currentTargets,
        calories: 1400,
      },
      isTrainingDay: false,
    });

    // Gesimuleerde extreme AI hallucinatie: -600 kcal op 1400 kcal (zou 800 kcal worden)
    const dangerousAiOutput = {
      summary: "Drastisch crashdieet",
      isTrainingDay: false,
      calorieAdjustmentKcal: -600,
      proteinTargetGrams: 400, // Onveilig extreem eiwit!
      carbsTargetGrams: 20,
      recommendations: ["Eet nauwelijks"],
      rationale: "Snel afvallen",
    };

    const sanitized = sanitizeNutritionAdvice(dangerousAiOutput, lowContext);

    // Moet begrensd zijn tot minimaal 1200 kcal
    expect(sanitized.suggestedCalories).toBe(1200);
    // Eiwit moet begrensd zijn tot max 2.5 g/kg (80 * 2.5 = 200g)
    expect(sanitized.suggestedProteinGrams).toBeLessThanOrEqual(200);
    expect(sanitized.isEstimate).toBe(true);
  });

  it("handhaaft 'AI als assistent, nooit autonoom' (Regel 7): past doelen uitsluitend aan na expliciete bevestiging", () => {
    const context = buildNutritionContext({
      profile,
      currentTargets,
      isTrainingDay: true,
    });

    const proposal = sanitizeNutritionAdvice(null, context);

    // Scenario A: Gebruiker negeert / weigert het advies
    // Doelen in de database blijven 100% onveranderd
    expect(currentTargets.calories).toBe(2500);
    expect(currentTargets.proteinGrams).toBe(160);

    // Scenario B: Gebruiker bevestigt met 'Accepteren & Toepassen'
    const newTargets = applyNutritionAdviceToTargets(currentTargets, proposal);

    expect(newTargets.calories).toBe(2700);
    expect(newTargets.proteinGrams).toBe(160);
    expect(newTargets.strategy).toBe("aangepast");
    expect(newTargets.macroSplit).toBe("aangepast");
  });
});
