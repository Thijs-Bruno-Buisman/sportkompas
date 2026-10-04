import { describe, it, expect } from "vitest";
import {
  getDateRangeForNutritionPeriod,
  calculateMacroDistribution,
  determineCalorieAdherence,
  calculateNutritionPeriodSummary,
} from "./statistics";
import type { MealLog, WaterLog, CardioSession } from "@/types/database";
import type { DailyNutritionTargets } from "./goals";

const mockTargets: DailyNutritionTargets = {
  calories: 2200,
  proteinGrams: 150,
  carbsGrams: 240,
  fatGrams: 70,
  fiberGrams: 30,
  waterMl: 2500,
  strategy: "onderhoud",
  macroSplit: "gebalanceerd",
};

describe("Nutrition Statistics Domain", () => {
  describe("getDateRangeForNutritionPeriod", () => {
    it("genereert exact 7 dagen voor '7d'", () => {
      const range = getDateRangeForNutritionPeriod("7d", "2026-10-10");
      expect(range.dates).toHaveLength(7);
      expect(range.startDate).toBe("2026-10-04");
      expect(range.endDate).toBe("2026-10-10");
      expect(range.dates[0]).toBe("2026-10-04");
      expect(range.dates[6]).toBe("2026-10-10");
    });

    it("genereert exact 14 dagen voor '14d'", () => {
      const range = getDateRangeForNutritionPeriod("14d", "2026-10-14");
      expect(range.dates).toHaveLength(14);
      expect(range.startDate).toBe("2026-10-01");
      expect(range.endDate).toBe("2026-10-14");
    });

    it("genereert exact 30 dagen voor '30d'", () => {
      const range = getDateRangeForNutritionPeriod("30d", "2026-10-30");
      expect(range.dates).toHaveLength(30);
      expect(range.startDate).toBe("2026-10-01");
      expect(range.endDate).toBe("2026-10-30");
    });

    it("genereert Maandag t/m Zondag voor 'deze_week'", () => {
      // 2026-10-07 is een woensdag
      const range = getDateRangeForNutritionPeriod("deze_week", "2026-10-07");
      expect(range.dates).toHaveLength(7);
      expect(range.startDate).toBe("2026-10-05"); // Maandag
      expect(range.endDate).toBe("2026-10-11"); // Zondag
    });

    it("genereert de volledige kalendermaand voor 'deze_maand'", () => {
      const range = getDateRangeForNutritionPeriod("deze_maand", "2026-10-15");
      expect(range.startDate).toBe("2026-10-01");
      expect(range.endDate).toBe("2026-10-31");
      expect(range.dates).toHaveLength(31);
    });
  });

  describe("calculateMacroDistribution", () => {
    it("berekent correct 4 kcal per gram eiwit/koolhydraat en 9 kcal per gram vet", () => {
      // 150g eiwit = 600 kcal
      // 200g carbs = 800 kcal
      // 60g vet = 540 kcal
      // Totaal = 1940 kcal
      const result = calculateMacroDistribution(150, 200, 60);

      expect(result.protein.calories).toBe(600);
      expect(result.carbs.calories).toBe(800);
      expect(result.fat.calories).toBe(540);
      expect(result.totalMacroCalories).toBe(1940);

      // Percentage checks:
      // 600 / 1940 = ~30.9%
      // 800 / 1940 = ~41.2%
      // 540 / 1940 = ~27.8%
      expect(result.protein.percentage).toBeCloseTo(30.9, 0.5);
      expect(result.carbs.percentage).toBeCloseTo(41.2, 0.5);
      expect(result.fat.percentage).toBeCloseTo(27.8, 0.5);
    });

    it("handelt 0 grammen veilig af zonder NaN of error", () => {
      const result = calculateMacroDistribution(0, 0, 0);
      expect(result.totalMacroCalories).toBe(0);
      expect(result.protein.percentage).toBe(0);
      expect(result.carbs.percentage).toBe(0);
      expect(result.fat.percentage).toBe(0);
    });
  });

  describe("determineCalorieAdherence", () => {
    it("geeft 'geen_data' als er geen maaltijden zijn ingevoerd", () => {
      expect(determineCalorieAdherence(0, 2200, false)).toBe("geen_data");
      expect(determineCalorieAdherence(0, 2200, true)).toBe("geen_data");
    });

    it("geeft 'op_doel' binnen de tolerantie van ±10%", () => {
      // Doel 2200 -> tolerantie is 220 -> bereik [1980, 2420]
      expect(determineCalorieAdherence(2200, 2200, true)).toBe("op_doel");
      expect(determineCalorieAdherence(2000, 2200, true)).toBe("op_doel");
      expect(determineCalorieAdherence(2400, 2200, true)).toBe("op_doel");
    });

    it("geeft 'onder_doel' onder de tolerantiegrens", () => {
      expect(determineCalorieAdherence(1800, 2200, true)).toBe("onder_doel");
    });

    it("geeft 'boven_doel' boven de tolerantiegrens", () => {
      expect(determineCalorieAdherence(2500, 2200, true)).toBe("boven_doel");
    });
  });

  describe("calculateNutritionPeriodSummary", () => {
    it("handelt een lege periode correct af met 0-waarden", () => {
      const summary = calculateNutritionPeriodSummary({
        period: "7d",
        mealLogs: [],
        waterLogs: [],
        targets: mockTargets,
        referenceDate: "2026-10-10",
      });

      expect(summary.totalDays).toBe(7);
      expect(summary.loggedDaysCount).toBe(0);
      expect(summary.totalCaloriesIntake).toBe(0);
      expect(summary.avgDailyCalories).toBe(0);
      expect(summary.consistencyPercentage).toBe(0);
      expect(summary.highestCalorieDay).toBeNull();
      expect(summary.lowestCalorieDay).toBeNull();
      expect(summary.dailyStats).toHaveLength(7);
      expect(summary.dailyStats[0].adherenceStatus).toBe("geen_data");
    });

    it("berekent daggemiddelden uitsluitend over gelogde dagen zodat lege dagen het gemiddelde niet vertekeken", () => {
      const meals: MealLog[] = [
        {
          id: "m1",
          calendarDate: "2026-10-09",
          mealType: "ontbijt",
          items: [],
          totalCalories: 2000,
          totalProteinGrams: 140,
          totalCarbsGrams: 220,
          totalFatGrams: 60,
          totalFiberGrams: 28,
          loggedAt: "2026-10-09T08:00:00Z",
        },
        {
          id: "m2",
          calendarDate: "2026-10-10",
          mealType: "lunch",
          items: [],
          totalCalories: 2400,
          totalProteinGrams: 160,
          totalCarbsGrams: 260,
          totalFatGrams: 80,
          totalFiberGrams: 32,
          loggedAt: "2026-10-10T12:00:00Z",
        },
      ];

      const summary = calculateNutritionPeriodSummary({
        period: "7d",
        mealLogs: meals,
        waterLogs: [],
        targets: mockTargets,
        referenceDate: "2026-10-10",
      });

      expect(summary.totalDays).toBe(7);
      expect(summary.loggedDaysCount).toBe(2);
      expect(summary.totalCaloriesIntake).toBe(4400);
      // Gemiddelde over 2 gelogde dagen: (2000 + 2400) / 2 = 2200 kcal
      expect(summary.avgDailyCalories).toBe(2200);
      expect(summary.avgDailyProteinGrams).toBe(150);
      expect(summary.avgDailyCarbsGrams).toBe(240);
      expect(summary.avgDailyFatGrams).toBe(70);
      expect(summary.avgDailyFiberGrams).toBe(30);

      // Doelvergelijking: avg 2200 - target 2200 = 0 verschil
      expect(summary.dailyCalorieDifference).toBe(0);
      expect(summary.weeklyCalorieBalance).toBe(0);
      expect(summary.estimatedFatChangeKgPerWeek).toBe(0);

      // Beide dagen waren binnen ±10% van 2200
      expect(summary.onTargetDaysCount).toBe(2);
      expect(summary.consistencyPercentage).toBe(100);

      expect(summary.highestCalorieDay).toEqual({
        date: "2026-10-10",
        calories: 2400,
      });
      expect(summary.lowestCalorieDay).toEqual({
        date: "2026-10-09",
        calories: 2000,
      });
    });

    it("berekent correct cardio-verbranding en netto calorieën", () => {
      const meals: MealLog[] = [
        {
          id: "m1",
          calendarDate: "2026-10-10",
          mealType: "diner",
          items: [],
          totalCalories: 2500,
          totalProteinGrams: 160,
          totalCarbsGrams: 280,
          totalFatGrams: 80,
          totalFiberGrams: 35,
          loggedAt: "2026-10-10T18:00:00Z",
        },
      ];

      const cardio: CardioSession[] = [
        {
          id: "c1",
          calendarDate: "2026-10-10",
          startTime: "2026-10-10T10:00:00.000Z",
          endTime: "2026-10-10T11:00:00.000Z",
          activityType: "hardlopen",
          distanceMeters: 10000,
          durationSeconds: 3600,
          avgHeartRateBpm: null,
          maxHeartRateBpm: null,
          elevationGainMeters: null,
          rpe: null,
          notes: "",
          estimatedCaloriesBurned: 700,
          provenance: { source: "user" },
        },
      ];

      const summary = calculateNutritionPeriodSummary({
        period: "7d",
        mealLogs: meals,
        waterLogs: [],
        cardioSessions: cardio,
        targets: mockTargets,
        referenceDate: "2026-10-10",
      });

      expect(summary.totalCaloriesIntake).toBe(2500);
      expect(summary.totalCardioBurnCalories).toBe(700);
      expect(summary.totalNetCalories).toBe(1800);

      const day10 = summary.dailyStats.find((d) => d.calendarDate === "2026-10-10");
      expect(day10).toBeDefined();
      expect(day10?.calories).toBe(2500);
      expect(day10?.cardioBurnCalories).toBe(700);
      expect(day10?.netCalories).toBe(1800);
    });

    it("berekent waterdoelen en hydratatiepercentages nauwkeurig", () => {
      const water: WaterLog[] = [
        { id: "w1", calendarDate: "2026-10-09", amountMl: 1500, loggedAt: "2026-10-09T09:00:00Z" },
        { id: "w2", calendarDate: "2026-10-09", amountMl: 1200, loggedAt: "2026-10-09T14:00:00Z" }, // Totaal 2700ml (> 2500ml doel)
        { id: "w3", calendarDate: "2026-10-10", amountMl: 1000, loggedAt: "2026-10-10T11:00:00Z" }, // Totaal 1000ml (< 2500ml doel)
      ];

      const summary = calculateNutritionPeriodSummary({
        period: "7d",
        mealLogs: [],
        waterLogs: water,
        targets: mockTargets,
        referenceDate: "2026-10-10",
      });

      expect(summary.totalWaterMl).toBe(3700);
      expect(summary.waterGoalMetDaysCount).toBe(1); // Alleen 2026-10-09 haalde >= 2500ml
    });

    it("berekent wekelijks calorieëntekort (deficit) en geschat gewichtsverlies", () => {
      // 7 dagen gelogd op 1700 kcal vs doel 2200 kcal -> -500 kcal/dag
      // Wekelijkse balans = -500 * 7 = -3500 kcal
      // Geschat vetverlies = -3500 / 7700 = -0.45 kg
      const meals: MealLog[] = [];
      const range = getDateRangeForNutritionPeriod("7d", "2026-10-10");
      for (const date of range.dates) {
        meals.push({
          id: `m_${date}`,
          calendarDate: date,
          mealType: "diner",
          items: [],
          totalCalories: 1700,
          totalProteinGrams: 140,
          totalCarbsGrams: 160,
          totalFatGrams: 55,
          totalFiberGrams: 30,
          loggedAt: `${date}T19:00:00Z`,
        });
      }

      const summary = calculateNutritionPeriodSummary({
        period: "7d",
        mealLogs: meals,
        waterLogs: [],
        targets: mockTargets,
        referenceDate: "2026-10-10",
      });

      expect(summary.loggedDaysCount).toBe(7);
      expect(summary.avgDailyCalories).toBe(1700);
      expect(summary.dailyCalorieDifference).toBe(-500);
      expect(summary.weeklyCalorieBalance).toBe(-3500);
      expect(summary.estimatedFatChangeKgPerWeek).toBe(-0.45);
    });
  });
});
