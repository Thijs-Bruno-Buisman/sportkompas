import { describe, it, expect } from "vitest";
import {
  buildNutritionContext,
  sanitizeNutritionAdvice,
  applyNutritionAdviceToTargets,
} from "./nutritionAdvisor";
import type { Profile } from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

const mockProfile: Profile = {
  id: "profile-1",
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

const mockTargets: DailyNutritionTargets = {
  calories: 2500,
  proteinGrams: 160,
  carbsGrams: 300,
  fatGrams: 70,
  fiberGrams: 35,
  waterMl: 3000,
  strategy: "onderhoud",
  macroSplit: "gebalanceerd",
};

describe("nutritionAdvisor domain logic", () => {
  describe("buildNutritionContext", () => {
    it("stelt context samen met berekende BMR, TDEE en trainingsdag-indicator", () => {
      const context = buildNutritionContext({
        profile: mockProfile,
        currentTargets: mockTargets,
        isTrainingDay: true,
        userNote: "Zware beentraining",
      });

      expect(context.weightKg).toBe(80);
      expect(context.heightCm).toBe(184);
      expect(context.isTrainingDay).toBe(true);
      expect(context.baseBmr).toBeGreaterThan(1600);
      expect(context.baseTdee).toBeGreaterThan(context.baseBmr);
      expect(context.currentTargets.calories).toBe(2500);
      expect(context.userNote).toBe("Zware beentraining");
    });
  });

  describe("sanitizeNutritionAdvice", () => {
    it("adviseert extra koolhydraten en calorieën op trainingsdagen", () => {
      const context = buildNutritionContext({
        profile: mockProfile,
        currentTargets: mockTargets,
        isTrainingDay: true,
      });

      const advice = sanitizeNutritionAdvice(null, context);

      expect(advice.isTrainingDay).toBe(true);
      expect(advice.suggestedCalories).toBe(2700); // 2500 + 200
      expect(advice.calorieDeltaKcal).toBe(200);
      expect(advice.suggestedProteinGrams).toBe(160); // 80kg * 2.0
      expect(advice.isEstimate).toBe(true);
      expect(advice.rationale).toContain("(schatting)");
      expect(advice.requiresConfirmation).toBe(true);
      expect(advice.recommendations.length).toBeGreaterThan(0);
    });

    it("adviseert stabiel onderhoud op rustdagen", () => {
      const context = buildNutritionContext({
        profile: mockProfile,
        currentTargets: mockTargets,
        isTrainingDay: false,
      });

      const advice = sanitizeNutritionAdvice(null, context);

      expect(advice.isTrainingDay).toBe(false);
      expect(advice.suggestedCalories).toBe(2500);
      expect(advice.calorieDeltaKcal).toBe(0);
      expect(advice.suggestedProteinGrams).toBe(144); // 80kg * 1.8
      expect(advice.isEstimate).toBe(true);
      expect(advice.rationale).toContain("(schatting)");
    });

    it("handhaaft de absolute ondergrens van 1200 kcal tegen crash-diëten", () => {
      const lowCalTargets: DailyNutritionTargets = {
        ...mockTargets,
        calories: 1300,
      };

      const context = buildNutritionContext({
        profile: mockProfile,
        currentTargets: lowCalTargets,
        isTrainingDay: false,
      });

      // Extreme AI hallucination van -500 kcal op 1300 kcal (zou 800 kcal worden)
      const rawAi = {
        summary: "Drastisch verlagen",
        isTrainingDay: false,
        calorieAdjustmentKcal: -500,
        recommendations: ["Eet heel weinig"],
        rationale: "Snel afvallen",
      };

      const advice = sanitizeNutritionAdvice(rawAi, context);

      expect(advice.suggestedCalories).toBe(1200); // Geklemd op 1200 kcal
      expect(advice.isEstimate).toBe(true);
    });
  });

  describe("applyNutritionAdviceToTargets", () => {
    it("werkt doelen bij met de voorgestelde waarden en zet strategie op aangepast", () => {
      const context = buildNutritionContext({
        profile: mockProfile,
        currentTargets: mockTargets,
        isTrainingDay: true,
      });

      const proposal = sanitizeNutritionAdvice(null, context);
      const updatedTargets = applyNutritionAdviceToTargets(mockTargets, proposal);

      expect(updatedTargets.calories).toBe(2700);
      expect(updatedTargets.proteinGrams).toBe(160);
      expect(updatedTargets.strategy).toBe("aangepast");
      expect(updatedTargets.macroSplit).toBe("aangepast");
    });
  });
});
