import { describe, it, expect } from "vitest";
import {
  buildWeeklyReviewContext,
  generateDeterministicWeeklyReview,
  sanitizeWeeklyReview,
  AI_WEEKLY_REVIEW_DISCLAIMER,
} from "./weeklyReview";
import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";

describe("WeeklyReview Domain Logic", () => {
  const startDate = "2026-10-01";
  const endDate = "2026-10-07";

const mockWorkouts: WorkoutSession[] = [
    {
      id: "sess-1",
      routineId: "r-1",
      routineDayId: "day-1",
      routineVersion: 1,
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T09:00:00Z",
      endTime: "2026-10-02T10:00:00Z",
      status: "afgerond",
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper Lower",
        routineDayName: "Upper 1",
        exercises: [
          {
            exerciseId: "ex-bench",
            exerciseName: "Bench Press",
            primaryMuscleGroup: "borst",
            targetSets: 3,
            restSeconds: 90,
          },
          {
            exerciseId: "ex-row",
            exerciseName: "Barbell Row",
            primaryMuscleGroup: "rug",
            targetSets: 3,
            restSeconds: 90,
          },
        ],
      },
    },
    {
      id: "sess-2",
      routineId: "r-1",
      routineDayId: "day-2",
      routineVersion: 1,
      calendarDate: "2026-10-04",
      startTime: "2026-10-04T09:00:00Z",
      endTime: "2026-10-04T10:15:00Z",
      status: "afgerond",
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper Lower",
        routineDayName: "Lower 1",
        exercises: [
          {
            exerciseId: "ex-squat",
            exerciseName: "Squat",
            primaryMuscleGroup: "benen",
            targetSets: 3,
            restSeconds: 120,
          },
        ],
      },
    },
    {
      id: "sess-out-of-range",
      routineId: "r-1",
      routineDayId: "day-1",
      routineVersion: 1,
      calendarDate: "2026-09-20",
      startTime: "2026-09-20T09:00:00Z",
      endTime: "2026-09-20T10:00:00Z",
      status: "afgerond",
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper Lower",
        routineDayName: "Upper 1",
        exercises: [],
      },
    },
  ];

  const mockSets: WorkoutSet[] = [
    // sess-1 sets
    {
      id: "s1",
      sessionId: "sess-1",
      exerciseId: "ex-bench",
      setNumber: 1,
      setType: "normal",
      weightKg: 80,
      reps: 8,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 90,
      loggedAt: "2026-10-02T09:10:00Z",
    },
    {
      id: "s2",
      sessionId: "sess-1",
      exerciseId: "ex-bench",
      setNumber: 2,
      setType: "normal",
      weightKg: 80,
      reps: 8,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 90,
      loggedAt: "2026-10-02T09:15:00Z",
    },
    {
      id: "s-warmup",
      sessionId: "sess-1",
      exerciseId: "ex-bench",
      setNumber: 0,
      setType: "warmup",
      weightKg: 40,
      reps: 10,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 60,
      loggedAt: "2026-10-02T09:05:00Z",
    },
    // sess-2 sets
    {
      id: "s3",
      sessionId: "sess-2",
      exerciseId: "ex-squat",
      setNumber: 1,
      setType: "normal",
      weightKg: 100,
      reps: 6,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 120,
      loggedAt: "2026-10-04T09:20:00Z",
    },
  ];

  const mockCardio: CardioSession[] = [
    {
      id: "cardio-1",
      activityType: "hardlopen",
      calendarDate: "2026-10-03",
      startTime: "2026-10-03T18:00:00Z",
      endTime: "2026-10-03T18:30:00Z",
      durationSeconds: 1800, // 30 min
      distanceMeters: 5000, // 5 km
      estimatedCaloriesBurned: 350,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      elevationGainMeters: null,
      rpe: null,
      status: "afgerond",
      notes: "Lekker rustig tempo",
      provenance: { source: "user" },
    },
  ];

  const mockMeals: MealLog[] = [
    {
      id: "meal-1",
      calendarDate: "2026-10-02",
      mealType: "ontbijt",
      loggedAt: "2026-10-02T08:00:00Z",
      totalCalories: 500,
      totalProteinGrams: 40,
      totalCarbsGrams: 60,
      totalFatGrams: 10,
      items: [
        {
          foodItemId: "f-1",
          foodName: "Havermout & Whey",
          portionGrams: 100,
          calories: 500,
          proteinGrams: 40,
          carbsGrams: 60,
          fatGrams: 10,
          fiberGrams: 5,
        },
      ],
    },
    {
      id: "meal-2",
      calendarDate: "2026-10-02",
      mealType: "diner",
      loggedAt: "2026-10-02T19:00:00Z",
      totalCalories: 700,
      totalProteinGrams: 60,
      totalCarbsGrams: 80,
      totalFatGrams: 12,
      items: [
        {
          foodItemId: "f-2",
          foodName: "Kip rijst broccoli",
          portionGrams: 300,
          calories: 700,
          proteinGrams: 60,
          carbsGrams: 80,
          fatGrams: 12,
          fiberGrams: 6,
        },
      ],
    },
  ];

  const mockWater: WaterLog[] = [
    {
      id: "w-1",
      calendarDate: "2026-10-02",
      amountMl: 2500,
      loggedAt: "2026-10-02T20:00:00Z",
    },
  ];

  const mockRecovery: RecoveryLog[] = [
    {
      id: "rec-1",
      calendarDate: "2026-10-03",
      loggedAt: "2026-10-03T08:00:00Z",
      sleepDurationMinutes: 480,
      sleepQualityRating: 4,
      restingHeartRateBpm: 55,
      sorenessRating: 2,
      stressRating: 2,
      notes: "",
      provenance: { source: "user" },
    },
  ];

  describe("buildWeeklyReviewContext", () => {
    it("aggregates multi-pillar activity accurately for the specified period", () => {
      const context = buildWeeklyReviewContext({
        startDate,
        endDate,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        waterLogs: mockWater,
        recoveryLogs: mockRecovery,
        weeklyWorkoutGoal: 3,
        userNote: "Voelde me fit deze week",
      });

      expect(context.startDate).toBe(startDate);
      expect(context.endDate).toBe(endDate);
      expect(context.daysCount).toBe(7);

      // Strength checks
      expect(context.completedWorkoutsCount).toBe(2);
      expect(context.totalSetsCount).toBe(3); // 2 bench + 1 squat (warmup excluded)
      // Volume: 80*8 + 80*8 + 100*6 = 640 + 640 + 600 = 1880
      expect(context.totalVolumeKg).toBe(1880);
      expect(context.muscleGroupsTrained).toContain("borst");
      expect(context.muscleGroupsTrained).toContain("rug");
      expect(context.muscleGroupsTrained).toContain("benen");

      // Cardio checks
      expect(context.cardioSessionsCount).toBe(1);
      expect(context.totalCardioDistanceKm).toBe(5);
      expect(context.totalCardioDurationMinutes).toBe(30);
      expect(context.estimatedCardioCalories).toBe(350);

      // Nutrition checks
      expect(context.loggedNutritionDaysCount).toBe(1); // both meals are on 2026-10-02
      expect(context.avgDailyCalories).toBe(1200); // 500 + 700
      expect(context.avgDailyProteinGrams).toBe(100); // 40 + 60
      expect(context.avgDailyWaterMl).toBe(2500);

      // Rest days: 7 days total - 3 active days (10-02 workout, 10-03 cardio, 10-04 workout) = 4 rest days
      expect(context.restDaysCount).toBe(4);
      expect(context.avgRecoveryScore).toBe(80);
      expect(context.weeklyWorkoutGoal).toBe(3);
      expect(context.userNote).toBe("Voelde me fit deze week");
    });

    it("handles empty activity datasets gracefully", () => {
      const context = buildWeeklyReviewContext({
        startDate: "2026-10-01",
        endDate: "2026-10-07",
        workouts: [],
        workoutSets: [],
        cardioSessions: [],
        mealLogs: [],
        waterLogs: [],
        recoveryLogs: [],
      });

      expect(context.completedWorkoutsCount).toBe(0);
      expect(context.totalSetsCount).toBe(0);
      expect(context.totalVolumeKg).toBe(0);
      expect(context.muscleGroupsTrained).toHaveLength(0);
      expect(context.cardioSessionsCount).toBe(0);
      expect(context.totalCardioDistanceKm).toBe(0);
      expect(context.loggedNutritionDaysCount).toBe(0);
      expect(context.avgDailyCalories).toBe(0);
      expect(context.restDaysCount).toBe(7);
      expect(context.avgRecoveryScore).toBeNull();
    });
  });

  describe("generateDeterministicWeeklyReview", () => {
    it("generates a motivating headline and assessments when workout goal is met", () => {
      const context = buildWeeklyReviewContext({
        startDate,
        endDate,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        waterLogs: mockWater,
        recoveryLogs: mockRecovery,
        weeklyWorkoutGoal: 2, // 2 completed out of 2 goal
      });

      const review = generateDeterministicWeeklyReview(context);

      expect(review.headline).toBe("Sterke Trainingsweek: Doelen Behaald!");
      expect(review.volumeAssessment).toContain("2 krachttraining(en)");
      expect(review.volumeAssessment).toContain("1.880 kg");
      expect(review.volumeAssessment).toContain("(schatting)");
      expect(review.recoveryAssessment).toContain("4 rustdagen");
      expect(review.nutritionAssessment).toContain("1200 kcal");
      expect(review.keyHighlights.length).toBeGreaterThan(0);
      expect(review.keyHighlights.length).toBeLessThanOrEqual(3);
      expect(review.focusNextWeek).toBeTruthy();
    });

    it("provides constructive guidance when no workouts were registered", () => {
      const context = buildWeeklyReviewContext({
        startDate,
        endDate,
        workouts: [],
        workoutSets: [],
        cardioSessions: [],
        mealLogs: [],
        waterLogs: [],
        recoveryLogs: [],
        weeklyWorkoutGoal: 3,
      });

      const review = generateDeterministicWeeklyReview(context);

      expect(review.headline).toBe("Rustige Week: Ideaal Moment voor een Frisse Start");
      expect(review.volumeAssessment).toContain("Er zijn deze week geen krachttrainingen geregistreerd");
      expect(review.focusNextWeek).toContain("Plan minimaal 2 vaste trainingsmomenten");
    });
  });

  describe("sanitizeWeeklyReview", () => {
    it("preserves valid Gemini review while ensuring estimate disclaimers and tags", () => {
      const context = buildWeeklyReviewContext({
        startDate,
        endDate,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        waterLogs: mockWater,
        recoveryLogs: mockRecovery,
      });

      const rawGeminiReview = {
        headline: "Geweldige consistentie in je trainingsweek!",
        volumeAssessment: "Tonnage was goed verdeeld over boven- en onderlichaam.",
        recoveryAssessment: "Herstelindicatoren zagen er prima uit.",
        nutritionAssessment: "Inname was passend bij je doel.",
        keyHighlights: ["2 krachttrainingen voltooid", "5 km cardio gelopen"],
        focusNextWeek: "Verhoog het gewicht op de squat met 2.5 kg.",
      };

      const sanitized = sanitizeWeeklyReview(rawGeminiReview, context);

      expect(sanitized.headline).toBe(rawGeminiReview.headline);
      expect(sanitized.periodLabel).toBe("2026-10-01 t/m 2026-10-07");
      expect(sanitized.source).toBe("gemini");
      expect(sanitized.isEstimate).toBe(true);
      expect(sanitized.disclaimer).toBe(AI_WEEKLY_REVIEW_DISCLAIMER);
      expect(sanitized.volumeAssessment).toContain("(schatting)");
      expect(sanitized.nutritionAssessment).toContain("(schatting)");
      expect(sanitized.keyHighlights).toHaveLength(2);
    });

    it("falls back safely to deterministic heuristics when rawReview is null", () => {
      const context = buildWeeklyReviewContext({
        startDate,
        endDate,
        workouts: mockWorkouts,
        workoutSets: mockSets,
        cardioSessions: mockCardio,
        mealLogs: mockMeals,
        waterLogs: mockWater,
        recoveryLogs: mockRecovery,
      });

      const sanitized = sanitizeWeeklyReview(null, context);

      expect(sanitized.source).toBe("lokale_heuristiek");
      expect(sanitized.headline).toBeTruthy();
      expect(sanitized.volumeAssessment).toContain("1.880 kg");
      expect(sanitized.disclaimer).toBe(AI_WEEKLY_REVIEW_DISCLAIMER);
    });
  });
});
