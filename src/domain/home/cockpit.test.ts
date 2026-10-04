import { describe, it, expect } from "vitest";
import {
  getGreeting,
  calculateDailyCockpitSummary,
} from "./cockpit";
import type {
  MealLog,
  WaterLog,
  WorkoutSession,
  CardioSession,
  ScheduledSession,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

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

describe("Home Cockpit Domain", () => {
  describe("getGreeting", () => {
    it("geeft 'Goedemorgen' tussen 05:00 en 12:00", () => {
      const morning = new Date(2026, 9, 4, 8, 30);
      expect(getGreeting(morning)).toBe("Goedemorgen");
    });

    it("geeft 'Goedemiddag' tussen 12:00 en 18:00", () => {
      const afternoon = new Date(2026, 9, 4, 14, 15);
      expect(getGreeting(afternoon)).toBe("Goedemiddag");
    });

    it("geeft 'Goedenavond' tussen 18:00 en 23:00", () => {
      const evening = new Date(2026, 9, 4, 20, 0);
      expect(getGreeting(evening)).toBe("Goedenavond");
    });

    it("geeft 'Goedenacht' 's nachts", () => {
      const night = new Date(2026, 9, 4, 2, 0);
      expect(getGreeting(night)).toBe("Goedenacht");
    });
  });

  describe("calculateDailyCockpitSummary", () => {
    it("berekent een schone lege dagsamenvatting zonder fouten", () => {
      const summary = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals: [],
        waterLogs: [],
        cardioSessions: [],
        workoutSessions: [],
        targets: mockTargets,
      });

      expect(summary.isToday).toBe(true);
      expect(summary.caloriesConsumed).toBe(0);
      expect(summary.netCalories).toBe(0);
      expect(summary.calorieBudgetRemaining).toBe(2200);
      expect(summary.energyBalanceStatus).toBe("deficit");
      expect(summary.workoutState).toBe("geen_schema");
      expect(summary.waterConsumedMl).toBe(0);
      expect(summary.isWaterGoalMet).toBe(false);
    });

    it("aggregeert maaltijden, macro's en berekent energiebalans correct", () => {
      const meals: MealLog[] = [
        {
          id: "m1",
          calendarDate: "2026-10-04",
          mealType: "ontbijt",
          items: [],
          totalCalories: 600,
          totalProteinGrams: 45,
          totalCarbsGrams: 75,
          totalFatGrams: 15,
          totalFiberGrams: 8,
          loggedAt: "2026-10-04T08:00:00Z",
        },
        {
          id: "m2",
          calendarDate: "2026-10-04",
          mealType: "diner",
          items: [],
          totalCalories: 1500,
          totalProteinGrams: 95,
          totalCarbsGrams: 160,
          totalFatGrams: 50,
          totalFiberGrams: 20,
          loggedAt: "2026-10-04T18:00:00Z",
        },
      ];

      const water: WaterLog[] = [
        { id: "w1", calendarDate: "2026-10-04", amountMl: 2500, loggedAt: "2026-10-04T12:00:00Z" },
      ];

      const summary = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals,
        waterLogs: water,
        cardioSessions: [],
        workoutSessions: [],
        targets: mockTargets,
      });

      expect(summary.caloriesConsumed).toBe(2100);
      expect(summary.proteinConsumedGrams).toBe(140);
      expect(summary.carbsConsumedGrams).toBe(235);
      expect(summary.fatConsumedGrams).toBe(65);
      expect(summary.fiberConsumedGrams).toBe(28);
      expect(summary.mealCount).toBe(2);

      // 2200 - 2100 = 100 kcal over -> binnen 150 kcal tolerantie voor onderhoud
      expect(summary.calorieBudgetRemaining).toBe(100);
      expect(summary.energyBalanceStatus).toBe("onderhoud");

      expect(summary.waterConsumedMl).toBe(2500);
      expect(summary.isWaterGoalMet).toBe(true);
      expect(summary.waterProgressPercentage).toBe(100);
    });

    it("verwerkt cardio en netto calorieën nauwkeurig", () => {
      const meals: MealLog[] = [
        {
          id: "m1",
          calendarDate: "2026-10-04",
          mealType: "diner",
          items: [],
          totalCalories: 2500,
          totalProteinGrams: 150,
          totalCarbsGrams: 280,
          totalFatGrams: 70,
          totalFiberGrams: 30,
          loggedAt: "2026-10-04T19:00:00Z",
        },
      ];

      const cardio: CardioSession[] = [
        {
          id: "c1",
          calendarDate: "2026-10-04",
          startTime: "2026-10-04T10:00:00.000Z",
          endTime: "2026-10-04T10:45:00.000Z",
          activityType: "hardlopen",
          distanceMeters: 8000,
          durationSeconds: 2700,
          avgHeartRateBpm: 150,
          maxHeartRateBpm: 170,
          elevationGainMeters: 30,
          rpe: 7,
          notes: "",
          estimatedCaloriesBurned: 600,
          provenance: { source: "user" },
        },
      ];

      const summary = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals,
        waterLogs: [],
        cardioSessions: cardio,
        workoutSessions: [],
        targets: mockTargets,
      });

      expect(summary.cardioDistanceKm).toBe(8);
      expect(summary.cardioDurationMinutes).toBe(45);
      expect(summary.cardioCaloriesBurned).toBe(600);
      // Netto: 2500 inname - 600 cardio = 1900 netto
      expect(summary.netCalories).toBe(1900);
      // Budget remaining: 2200 target - 1900 net = 300 kcal over
      expect(summary.calorieBudgetRemaining).toBe(300);
      expect(summary.energyBalanceStatus).toBe("deficit");
    });

    it("herkent de actieve workoutstatus", () => {
      const activeSession: WorkoutSession = {
        id: "s1",
        calendarDate: "2026-10-04",
        startTime: "2026-10-04T10:00:00.000Z",
        endTime: null,
        status: "actief",
        routineId: "r1",
        routineDayId: "rd1",
        routineVersion: 1,
        snapshot: {
          routineName: "Upper Lower",
          routineDayName: "Upper Body Power",
          exercises: [],
        },
        notes: "",
        overallRpe: null,
        provenance: { source: "user" },
      };

      const summary = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals: [],
        waterLogs: [],
        cardioSessions: [],
        workoutSessions: [],
        activeWorkoutSession: activeSession,
        targets: mockTargets,
      });

      expect(summary.workoutState).toBe("actief");
      expect(summary.isWorkoutActiveNow).toBe(true);
      expect(summary.workoutTitle).toBe("Upper Body Power");
    });

    it("herkent een voltooide workout van vandaag", () => {
      const completedSession: WorkoutSession = {
        id: "s2",
        calendarDate: "2026-10-04",
        startTime: "2026-10-04T08:00:00.000Z",
        endTime: "2026-10-04T09:15:00.000Z",
        status: "afgerond",
        routineId: "r1",
        routineDayId: "rd1",
        routineVersion: 1,
        snapshot: {
          routineName: "Push Pull Legs",
          routineDayName: "Leg Day",
          exercises: [
            {
              exerciseId: "e1",
              exerciseName: "Squat",
              primaryMuscleGroup: "benen",
              targetSets: 4,
              restSeconds: 120,
            },
          ],
        },
        notes: "",
        overallRpe: 8,
        provenance: { source: "user" },
      };

      const summary = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals: [],
        waterLogs: [],
        cardioSessions: [],
        workoutSessions: [completedSession],
        targets: mockTargets,
      });

      expect(summary.workoutState).toBe("afgerond");
      expect(summary.workoutTitle).toBe("Leg Day");
      expect(summary.workoutCompletedSets).toBe(4);
    });

    it("herkent een geplande training en rustdag", () => {
      const scheduled: ScheduledSession = {
        id: "sc1",
        calendarDate: "2026-10-04",
        routineId: "r1",
        routineDayId: "rd1",
        status: "gepland",
        notes: "",
        createdAt: "2026-10-04T00:00:00Z",
      };

      const summaryScheduled = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals: [],
        waterLogs: [],
        cardioSessions: [],
        workoutSessions: [],
        scheduledSession: scheduled,
        targets: mockTargets,
      });

      expect(summaryScheduled.workoutState).toBe("gepland");

      const scheduledRest: ScheduledSession = {
        ...scheduled,
        status: "overgeslagen",
      };

      const summaryRest = calculateDailyCockpitSummary({
        calendarDate: "2026-10-04",
        todayDateStr: "2026-10-04",
        meals: [],
        waterLogs: [],
        cardioSessions: [],
        workoutSessions: [],
        scheduledSession: scheduledRest,
        targets: mockTargets,
      });

      expect(summaryRest.workoutState).toBe("rustdag");
    });
  });
});
