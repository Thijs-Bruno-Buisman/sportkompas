import { describe, it, expect } from "vitest";
import {
  buildChatContext,
  generateLocalChatResponse,
  AI_CHAT_DISCLAIMER,
  QUICK_PROMPT_CHIPS,
} from "./chatAdvisor";
import type {
  Profile,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

describe("AI Chat Advisor Domain Logic", () => {
  const referenceDate = "2026-10-14";

  const mockProfile: Profile = {
    id: "p-1",
    name: "Alex",
    birthDate: "1995-05-10",
    gender: "man",
    heightMeters: 1.82,
    startWeightKg: 80,
    targetWeightKg: 83,
    activityLevel: "gemiddeld",
    primaryGoal: "spieropbouw",
    experienceLevel: "gevorderd",
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
    calories: 2600,
    proteinGrams: 165,
    carbsGrams: 300,
    fatGrams: 75,
    fiberGrams: 35,
    waterMl: 3000,
    strategy: "onderhoud",
    macroSplit: "gebalanceerd",
  };

  const mockWorkouts: WorkoutSession[] = [
    {
      id: "w-1",
      routineId: "r-1",
      routineDayId: "d-1",
      routineVersion: 1,
      calendarDate: "2026-10-10",
      startTime: "2026-10-10T10:00:00Z",
      endTime: "2026-10-10T11:00:00Z",
      status: "afgerond",
      overallRpe: 8,
      notes: "Goede focus",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper Lower",
        routineDayName: "Upper A",
        exercises: [
          {
            exerciseId: "bench-press",
            exerciseName: "Bench Press",
            primaryMuscleGroup: "borst",
            targetSets: 3,
            restSeconds: 90,
          },
        ],
      },
    },
    {
      id: "w-old",
      routineId: "r-1",
      routineDayId: "d-1",
      routineVersion: 1,
      calendarDate: "2026-09-01", // Buiten 14 dagen
      startTime: "2026-09-01T10:00:00Z",
      endTime: "2026-09-01T11:00:00Z",
      status: "afgerond",
      overallRpe: 7,
      notes: "",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper Lower",
        routineDayName: "Upper A",
        exercises: [],
      },
    },
  ];

  const mockSets: WorkoutSet[] = [
    {
      id: "s-1",
      sessionId: "w-1",
      exerciseId: "bench-press",
      setNumber: 1,
      setType: "normal",
      weightKg: 90,
      reps: 8,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 90,
      loggedAt: "2026-10-10T10:15:00Z",
    },
    {
      id: "s-2",
      sessionId: "w-1",
      exerciseId: "bench-press",
      setNumber: 2,
      setType: "normal",
      weightKg: 90,
      reps: 8,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 90,
      loggedAt: "2026-10-10T10:20:00Z",
    },
  ];

  const mockCardio: CardioSession[] = [
    {
      id: "c-1",
      calendarDate: "2026-10-11",
      startTime: "2026-10-11T09:00:00Z",
      endTime: "2026-10-11T09:30:00Z",
      activityType: "hardlopen",
      distanceMeters: 5000,
      durationSeconds: 1800,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 380,
      elevationGainMeters: null,
      rpe: null,
      notes: "",
      status: "afgerond",
      provenance: { source: "user" },
    },
  ];

  const mockMeals: MealLog[] = [
    {
      id: "m-1",
      calendarDate: "2026-10-12",
      mealType: "ontbijt",
      loggedAt: "2026-10-12T08:00:00Z",
      totalCalories: 800,
      totalProteinGrams: 50,
      totalCarbsGrams: 90,
      totalFatGrams: 20,
      items: [],
    },
    {
      id: "m-2",
      calendarDate: "2026-10-12",
      mealType: "diner",
      loggedAt: "2026-10-12T18:00:00Z",
      totalCalories: 1700,
      totalProteinGrams: 110,
      totalCarbsGrams: 180,
      totalFatGrams: 45,
      items: [],
    },
  ];

  const mockRecovery: RecoveryLog[] = [
    {
      id: "rec-1",
      calendarDate: "2026-10-12",
      loggedAt: "2026-10-12T07:30:00Z",
      sleepDurationMinutes: 480,
      sleepQualityRating: 4,
      restingHeartRateBpm: 54,
      sorenessRating: 2,
      stressRating: 2,
      notes: "",
      provenance: { source: "user" },
    },
  ];

  describe("buildChatContext", () => {
    it("aggregeert 14-daagse gegevens voor profiel, kracht, cardio, voeding en rust", () => {
      const context = buildChatContext({
        profile: mockProfile,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        recoveryLogs: mockRecovery,
        nutritionTargets: mockTargets,
        referenceDate,
      });

      expect(context.userName).toBe("Alex");
      expect(context.primaryGoal).toBe("spieropbouw");
      expect(context.daysAnalyzed).toBe(14);
      expect(context.workoutsCount).toBe(1); // alleen w-1 valt binnen het 14-dagen venster
      expect(context.totalTonnageKg).toBe(1440); // 90*8 + 90*8 = 1440
      expect(context.topExercises).toHaveLength(1);
      expect(context.topExercises[0].exerciseName).toBe("Bench Press");
      expect(context.topExercises[0].maxWeightKg).toBe(90);

      expect(context.cardioSessionsCount).toBe(1);
      expect(context.cardioDistanceKm).toBe(5);
      expect(context.estimatedCardioCalories).toBe(380);

      expect(context.loggedNutritionDays).toBe(1);
      expect(context.avgDailyCalories).toBe(2500); // 800 + 1700
      expect(context.avgDailyProteinGrams).toBe(160); // 50 + 110
      expect(context.targetDailyCalories).toBe(2600);
      expect(context.targetDailyProtein).toBe(165);

      // Actieve dagen: 10-10 (workout), 10-11 (cardio) -> 2 actieve dagen. Rest days = 14 - 2 = 12
      expect(context.restDaysCount).toBe(12);
      expect(context.avgRecoveryScore).toBe(80);
    });
  });

  describe("generateLocalChatResponse", () => {
    it("geeft direct een veilige niet-medische waarschuwing bij pijn of blessure", () => {
      const context = buildChatContext({
        profile: mockProfile,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        recoveryLogs: mockRecovery,
        nutritionTargets: mockTargets,
        referenceDate,
      });

      const response = generateLocalChatResponse(
        "Ik heb pijn in mijn schouder na het bankdrukken",
        context
      );

      expect(response).toContain("direct te staken");
      expect(response).toContain("stelt geen medische diagnoses");
      expect(response).toContain("arts of sportfysiotherapeut");
    });

    it("analyseert eiwit- en calorie-inname met (schatting) vermelding", () => {
      const context = buildChatContext({
        profile: mockProfile,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        recoveryLogs: mockRecovery,
        nutritionTargets: mockTargets,
        referenceDate,
      });

      const response = generateLocalChatResponse(
        "Krijg ik voldoende eiwitten en calorieën binnen?",
        context
      );

      expect(response).toContain("2500 kcal");
      expect(response).toContain("160g eiwit");
      expect(response).toContain("(schatting)");
    });

    it("beoordeelt trainingsprogressie en werkgewichten", () => {
      const context = buildChatContext({
        profile: mockProfile,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        recoveryLogs: mockRecovery,
        nutritionTargets: mockTargets,
        referenceDate,
      });

      const response = generateLocalChatResponse(
        "Hoe verloopt mijn progressie op de oefeningen?",
        context
      );

      expect(response).toContain("1.440 kg");
      expect(response).toContain("Bench Press");
      expect(response).toContain("90 kg");
      expect(response).toContain("(schatting)");
    });

    it("evalueert cardio en conditie accuraat", () => {
      const context = buildChatContext({
        profile: mockProfile,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        recoveryLogs: mockRecovery,
        nutritionTargets: mockTargets,
        referenceDate,
      });

      const response = generateLocalChatResponse(
        "Hoeveel cardio heb ik gelopen?",
        context
      );

      expect(response).toContain("5 km");
      expect(response).toContain("380 kcal");
      expect(response).toContain("(schatting)");
    });
  });

  describe("Disclaimers & Chips", () => {
    it("bevat de vereiste niet-medische disclaimer conform Regel 7", () => {
      expect(AI_CHAT_DISCLAIMER).toContain("GEEN medische diagnoses");
    });

    it("biedt minimaal 4 bruikbare suggestievraag-knoppen", () => {
      expect(QUICK_PROMPT_CHIPS.length).toBeGreaterThanOrEqual(4);
      QUICK_PROMPT_CHIPS.forEach((chip) => {
        expect(chip.label).toBeTruthy();
        expect(chip.prompt).toBeTruthy();
      });
    });
  });
});
