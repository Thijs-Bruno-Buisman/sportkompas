import { describe, it, expect } from "vitest";
import {
  buildWeeklyReviewContext,
  sanitizeWeeklyReview,
  AI_WEEKLY_REVIEW_DISCLAIMER,
} from "@/domain/ai/weeklyReview";
import { generateLocalHeuristicResponse } from "@/lib/ai/provider";
import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";
import type { WeeklyReview } from "@/lib/ai/schemas";

describe("Stap 44 / Prompt 38 — AI Wekelijkse & Periodieke Reviews Integratietest", () => {
  const startDate = "2026-10-01";
  const endDate = "2026-10-07";

  const mockWorkouts: WorkoutSession[] = [
    {
      id: "sess-upper",
      routineId: "rd-1",
      routineDayId: "rd-1",
      routineVersion: 1,
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T10:00:00Z",
      endTime: "2026-10-02T11:00:00Z",
      status: "afgerond",
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper / Lower",
        routineDayName: "Upper A",
        exercises: [
          {
            exerciseId: "ex-bench",
            exerciseName: "Bench Press",
            primaryMuscleGroup: "borst",
            targetSets: 3,
            restSeconds: 90,
          },
          {
            exerciseId: "ex-ohp",
            exerciseName: "Overhead Press",
            primaryMuscleGroup: "schouders",
            targetSets: 3,
            restSeconds: 90,
          },
        ],
      },
    },
    {
      id: "sess-lower",
      routineId: "rd-2",
      routineDayId: "rd-2",
      routineVersion: 1,
      calendarDate: "2026-10-05",
      startTime: "2026-10-05T14:00:00Z",
      endTime: "2026-10-05T15:15:00Z",
      status: "afgerond",
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Upper / Lower",
        routineDayName: "Lower A",
        exercises: [
          {
            exerciseId: "ex-squat",
            exerciseName: "Barbell Back Squat",
            primaryMuscleGroup: "benen",
            targetSets: 3,
            restSeconds: 150,
          },
        ],
      },
    },
  ];

  const mockSets: WorkoutSet[] = [
    {
      id: "s1",
      sessionId: "sess-upper",
      exerciseId: "ex-bench",
      setNumber: 1,
      setType: "normal",
      weightKg: 85,
      reps: 8,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 90,
      loggedAt: "2026-10-02T10:15:00Z",
    },
    {
      id: "s2",
      sessionId: "sess-upper",
      exerciseId: "ex-ohp",
      setNumber: 1,
      setType: "normal",
      weightKg: 50,
      reps: 10,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 90,
      loggedAt: "2026-10-02T10:30:00Z",
    },
    {
      id: "s3",
      sessionId: "sess-lower",
      exerciseId: "ex-squat",
      setNumber: 1,
      setType: "normal",
      weightKg: 120,
      reps: 5,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 150,
      loggedAt: "2026-10-05T14:20:00Z",
    },
  ];

  const mockCardio: CardioSession[] = [
    {
      id: "cardio-run",
      activityType: "hardlopen",
      calendarDate: "2026-10-03",
      startTime: "2026-10-03T09:00:00Z",
      endTime: "2026-10-03T09:40:00Z",
      durationSeconds: 2400, // 40 min
      distanceMeters: 7000, // 7 km
      estimatedCaloriesBurned: 520,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      elevationGainMeters: null,
      rpe: null,
      status: "afgerond",
      notes: "",
      provenance: { source: "user" },
    },
  ];

  const mockMeals: MealLog[] = [
    {
      id: "m1",
      calendarDate: "2026-10-02",
      mealType: "ontbijt",
      loggedAt: "2026-10-02T08:30:00Z",
      totalCalories: 550,
      totalProteinGrams: 45,
      totalCarbsGrams: 70,
      totalFatGrams: 10,
      items: [
        {
          foodItemId: "fi-1",
          foodName: "Proteïne Havermout",
          portionGrams: 100,
          calories: 550,
          proteinGrams: 45,
          carbsGrams: 70,
          fatGrams: 10,
          fiberGrams: 8,
        },
      ],
    },
  ];

  const mockWater: WaterLog[] = [
    {
      id: "w1",
      calendarDate: "2026-10-02",
      amountMl: 2800,
      loggedAt: "2026-10-02T21:00:00Z",
    },
  ];

  const mockRecovery: RecoveryLog[] = [
    {
      id: "rec1",
      calendarDate: "2026-10-04",
      loggedAt: "2026-10-04T07:30:00Z",
      sleepDurationMinutes: 510,
      sleepQualityRating: 5,
      restingHeartRateBpm: 52,
      sorenessRating: 1,
      stressRating: 2,
      notes: "",
      provenance: { source: "user" },
    },
  ];

  it("aggregeert alle vier pijlers naadloos tot een multi-domein wekelijks overzicht", () => {
    const context = buildWeeklyReviewContext({
      startDate,
      endDate,
      workouts: mockWorkouts,
      workoutSets: mockSets,
      cardioSessions: mockCardio,
      mealLogs: mockMeals,
      waterLogs: mockWater,
      recoveryLogs: mockRecovery,
      weeklyWorkoutGoal: 2,
      userNote: "Uitstekende focus tijdens de squatsessie.",
    });

    expect(context.completedWorkoutsCount).toBe(2);
    // Tonnage: (85*8) + (50*10) + (120*5) = 680 + 500 + 600 = 1780 kg
    expect(context.totalVolumeKg).toBe(1780);
    expect(context.muscleGroupsTrained).toContain("borst");
    expect(context.muscleGroupsTrained).toContain("schouders");
    expect(context.muscleGroupsTrained).toContain("benen");
    expect(context.cardioSessionsCount).toBe(1);
    expect(context.totalCardioDistanceKm).toBe(7);
    expect(context.totalCardioDurationMinutes).toBe(40);
    expect(context.estimatedCardioCalories).toBe(520);
    expect(context.loggedNutritionDaysCount).toBe(1);
    expect(context.avgDailyCalories).toBe(550);
    expect(context.avgDailyProteinGrams).toBe(45);
    // 7 dagen - 3 actieve dagen (10-02 workout, 10-03 cardio, 10-05 workout) = 4 rest days
    expect(context.restDaysCount).toBe(4);
    expect(context.avgRecoveryScore).toBe(93);
    expect(context.userNote).toBe("Uitstekende focus tijdens de squatsessie.");
  });

  it("genereert via de provider een gestructureerde lokale review conform WeeklyReviewSchema", () => {
    const context = buildWeeklyReviewContext({
      startDate,
      endDate,
      workouts: mockWorkouts,
      workoutSets: mockSets,
      cardioSessions: mockCardio,
      mealLogs: mockMeals,
      waterLogs: mockWater,
      recoveryLogs: mockRecovery,
      weeklyWorkoutGoal: 2,
    });

    const response = generateLocalHeuristicResponse({
      task: "weekly_review",
      context: { preparedContext: context },
    });

    expect(response.success).toBe(true);
    expect(response.task).toBe("weekly_review");
    expect(response.isEstimate).toBe(true);
    expect(response.disclaimer).toBeTruthy();

    const structured = response.structuredData as WeeklyReview;
    expect(structured).toBeDefined();
    expect(structured.headline).toBe("Sterke Trainingsweek: Doelen Behaald!");
    expect(structured.volumeAssessment).toContain("1.780 kg");
    expect(structured.recoveryAssessment).toContain("4 rustdagen");
    expect(structured.keyHighlights.length).toBeGreaterThan(0);
    expect(structured.focusNextWeek).toBeTruthy();
  });

  it("handhaaft Regel 7 richtlijnen: disclaimer, geen medische claims en expliciete (schatting) tagging", () => {
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

    const proposal = sanitizeWeeklyReview(null, context);

    expect(proposal.isEstimate).toBe(true);
    expect(proposal.disclaimer).toBe(AI_WEEKLY_REVIEW_DISCLAIMER);
    expect(proposal.disclaimer).toContain("geen medische diagnoses");
    expect(proposal.volumeAssessment).toContain("(schatting)");
    expect(proposal.nutritionAssessment).toContain("(schatting)");
    expect(proposal.source).toBe("lokale_heuristiek");
    expect(proposal.periodLabel).toBe("2026-10-01 t/m 2026-10-07");
  });

  it("werkt correct voor 30-dagen vensters en rustige periodes", () => {
    const monthStart = "2026-09-08";
    const monthEnd = "2026-10-07";

    const context = buildWeeklyReviewContext({
      startDate: monthStart,
      endDate: monthEnd,
      workouts: mockWorkouts,
      workoutSets: mockSets,
      cardioSessions: mockCardio,
      mealLogs: mockMeals,
      waterLogs: mockWater,
      recoveryLogs: mockRecovery,
      weeklyWorkoutGoal: 3,
    });

    expect(context.daysCount).toBe(30);
    expect(context.restDaysCount).toBe(27); // 30 - 3 active days
    const proposal = sanitizeWeeklyReview(null, context);
    expect(proposal.periodLabel).toBe("2026-09-08 t/m 2026-10-07");
  });
});
