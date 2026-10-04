import { describe, it, expect } from "vitest";
import {
  calculateBmr,
  calculateTdee,
  calculateStrategyCalories,
  calculateMacroTargets,
  calculateNutritionProgress,
  DEFAULT_NUTRITION_TARGETS,
} from "./goals";

describe("Domain: Nutrition Goals & Calculations", () => {
  it("berekent BMR volgens Mifflin-St Jeor voor man en vrouw", () => {
    // Man, 80kg, 180cm, 30 jaar: 10*80 + 6.25*180 - 5*30 + 5 = 800 + 1125 - 150 + 5 = 1780
    const bmrMan = calculateBmr("man", 80, 180, 30);
    expect(bmrMan).toBe(1780);

    // Vrouw, 65kg, 168cm, 28 jaar: 10*65 + 6.25*168 - 5*28 - 161 = 650 + 1050 - 140 - 161 = 1399
    const bmrVrouw = calculateBmr("vrouw", 65, 168, 28);
    expect(bmrVrouw).toBe(1399);
  });

  it("berekent BMR volgens Katch-McArdle bij bekend vetpercentage", () => {
    // 80kg, 15% vet -> LBM = 68kg -> 370 + 21.6*68 = 370 + 1468.8 = 1838.8 -> 1839
    const bmrKatch = calculateBmr("man", 80, 180, 30, "katch_mcardle", 15);
    expect(bmrKatch).toBe(1839);
  });

  it("berekent TDEE op basis van activiteitsniveau", () => {
    const bmr = 1800;
    expect(calculateTdee(bmr, "sedentair")).toBe(Math.round(1800 * 1.2)); // 2160
    expect(calculateTdee(bmr, "licht")).toBe(Math.round(1800 * 1.375)); // 2475
    expect(calculateTdee(bmr, "gemiddeld")).toBe(Math.round(1800 * 1.55)); // 2790
    expect(calculateTdee(bmr, "zeer")).toBe(Math.round(1800 * 1.725)); // 3105
  });

  it("berekent strategische calorieën met een veilige ondergrens van 1200 kcal", () => {
    const tdee = 2500;
    expect(calculateStrategyCalories(tdee, "afvallen_standaard")).toBe(2000);
    expect(calculateStrategyCalories(tdee, "afvallen_rustig")).toBe(2200);
    expect(calculateStrategyCalories(tdee, "aankomen_lean")).toBe(2750);
    expect(calculateStrategyCalories(tdee, "onderhoud")).toBe(2500);

    // Veilige ondergrens
    expect(calculateStrategyCalories(1300, "afvallen_agressief")).toBe(1200);
  });

  it("berekent macroverdeling volgens krachtsport_per_kg", () => {
    // 80kg atleet, 2400 kcal
    // Eiwit: 80 * 2.0 = 160g (640 kcal)
    // Vet: 80 * 1.0 = 80g (720 kcal)
    // Totaal E+V = 1360 kcal
    // Rest koolhydraten: 2400 - 1360 = 1040 kcal / 4 = 260g
    const targets = calculateMacroTargets(2400, "krachtsport_per_kg", 80);
    expect(targets.proteinGrams).toBe(160);
    expect(targets.fatGrams).toBe(80);
    expect(targets.carbsGrams).toBe(260);
    expect(targets.calories).toBe(2400);
  });

  it("berekent macroverdeling volgens gebalanceerd en eiwitrijk", () => {
    const gebalanceerd = calculateMacroTargets(2000, "gebalanceerd");
    // 30% van 2000 = 600 kcal / 4 = 150g eiwit
    expect(gebalanceerd.proteinGrams).toBe(150);

    const eiwitrijk = calculateMacroTargets(2000, "eiwitrijk");
    // 35% van 2000 = 700 kcal / 4 = 175g eiwit
    expect(eiwitrijk.proteinGrams).toBe(175);
  });

  it("berekent nauwkeurige voortgang, resterende waarden en status per macro", () => {
    const targets = DEFAULT_NUTRITION_TARGETS; // 2200 kcal, 140g E, 250g K, 70g V
    const consumed = {
      calories: 1800,
      proteinGrams: 142,
      carbsGrams: 200,
      fatGrams: 80,
      fiberGrams: 25,
    };
    const waterMl = 2000;

    const progress = calculateNutritionProgress(targets, consumed, waterMl);

    // Calorieën: 2200 - 1800 = 400 remaining
    expect(progress.calories.remaining).toBe(400);
    expect(progress.calories.status).toBe("onder");
    expect(progress.isCalorieDeficit).toBe(true);

    // Eiwit: 140 target vs 142 consumed -> doel bereikt
    expect(progress.protein.status).toBe("doel_bereikt");

    // Vet: 70 target vs 80 consumed -> overschreden
    expect(progress.fat.remaining).toBe(-10);
    expect(progress.fat.status).toBe("overschreden");

    // Water: 2500 target vs 2000 consumed -> 500 remaining
    expect(progress.water.remaining).toBe(500);
  });
});
