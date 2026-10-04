import { describe, it, expect } from "vitest";
import {
  buildChatContext,
  generateLocalChatResponse,
  AI_CHAT_DISCLAIMER,
  QUICK_PROMPT_CHIPS,
} from "@/domain/ai/chatAdvisor";
import { generateLocalHeuristicResponse } from "@/lib/ai/provider";
import type {
  Profile,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

describe("Stap 45 / Prompt 39 — AI Assistent Contextuele Q&A Chat Integratietest", () => {
  const referenceDate = "2026-10-14";

  const mockProfile: Profile = {
    id: "prof-elena",
    name: "Elena",
    birthDate: "1994-03-22",
    gender: "vrouw",
    heightMeters: 1.72,
    startWeightKg: 68,
    targetWeightKg: 65,
    activityLevel: "gemiddeld",
    primaryGoal: "kracht",
    experienceLevel: "gemiddeld",
    strengthDaysPerWeek: 3,
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
    calories: 2100,
    proteinGrams: 140,
    carbsGrams: 220,
    fatGrams: 65,
    fiberGrams: 30,
    waterMl: 2500,
    strategy: "onderhoud",
    macroSplit: "gebalanceerd",
  };

  const mockWorkouts: WorkoutSession[] = [
    {
      id: "w-deadlift",
      routineId: "r-1",
      routineDayId: "d-1",
      routineVersion: 1,
      calendarDate: "2026-10-10",
      startTime: "2026-10-10T14:00:00Z",
      endTime: "2026-10-10T15:00:00Z",
      status: "afgerond",
      overallRpe: 8.5,
      notes: "Deadlifts voelden sterk",
      provenance: { source: "user" },
      snapshot: {
        routineName: "Full Body A",
        routineDayName: "Dag 1",
        exercises: [
          {
            exerciseId: "ex-deadlift",
            exerciseName: "Conventional Deadlift",
            primaryMuscleGroup: "rug",
            targetSets: 3,
            restSeconds: 180,
          },
        ],
      },
    },
  ];

  const mockSets: WorkoutSet[] = [
    {
      id: "s-1",
      sessionId: "w-deadlift",
      exerciseId: "ex-deadlift",
      setNumber: 1,
      setType: "normal",
      weightKg: 110,
      reps: 5,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 180,
      loggedAt: "2026-10-10T14:20:00Z",
    },
    {
      id: "s-2",
      sessionId: "w-deadlift",
      exerciseId: "ex-deadlift",
      setNumber: 2,
      setType: "normal",
      weightKg: 110,
      reps: 5,
      targetRpe: null,
      actualRpe: null,
      completed: true,
      restTimeSeconds: 180,
      loggedAt: "2026-10-10T14:25:00Z",
    },
  ];

  const mockCardio: CardioSession[] = [
    {
      id: "c-run",
      calendarDate: "2026-10-11",
      startTime: "2026-10-11T09:00:00Z",
      endTime: "2026-10-11T09:35:00Z",
      activityType: "hardlopen",
      distanceMeters: 6000,
      durationSeconds: 2100,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 420,
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
      loggedAt: "2026-10-12T08:30:00Z",
      totalCalories: 600,
      totalProteinGrams: 45,
      totalCarbsGrams: 65,
      totalFatGrams: 15,
      items: [],
    },
    {
      id: "m-2",
      calendarDate: "2026-10-12",
      mealType: "diner",
      loggedAt: "2026-10-12T19:00:00Z",
      totalCalories: 1400,
      totalProteinGrams: 90,
      totalCarbsGrams: 150,
      totalFatGrams: 35,
      items: [],
    },
  ];

  const mockRecovery: RecoveryLog[] = [
    {
      id: "rec-1",
      calendarDate: "2026-10-12",
      loggedAt: "2026-10-12T07:00:00Z",
      sleepDurationMinutes: 490,
      sleepQualityRating: 5,
      restingHeartRateBpm: 56,
      sorenessRating: 2,
      stressRating: 2,
      notes: "",
      provenance: { source: "user" },
    },
  ];

  it("bouwt 14-daagse context die exact overeenkomt met de gelogde feiten", () => {
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

    expect(context.userName).toBe("Elena");
    expect(context.primaryGoal).toBe("kracht");
    expect(context.workoutsCount).toBe(1);
    expect(context.totalTonnageKg).toBe(1100); // 110*5 + 110*5 = 1100
    expect(context.topExercises[0].exerciseName).toBe("Conventional Deadlift");
    expect(context.topExercises[0].maxWeightKg).toBe(110);
    expect(context.cardioDistanceKm).toBe(6);
    expect(context.avgDailyCalories).toBe(2000); // 600 + 1400
    expect(context.avgDailyProteinGrams).toBe(135); // 45 + 90
    expect(context.targetDailyProtein).toBe(140);
    expect(context.restDaysCount).toBe(12);
  });

  it("geeft via de provider qa_chat taak een context-gevoelig antwoord met (schatting) tagging", () => {
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

    const response = generateLocalHeuristicResponse({
      task: "qa_chat",
      userPrompt: "Hoe presteer ik op mijn deadlift en krachttraining?",
      context: { preparedContext: context },
    });

    expect(response.success).toBe(true);
    expect(response.task).toBe("qa_chat");
    expect(response.isEstimate).toBe(true);
    expect(response.message).toContain("Conventional Deadlift");
    expect(response.message).toContain("110 kg");
    expect(response.message).toContain("1.100 kg");
    expect(response.message).toContain("(schatting)");
    expect(response.disclaimer).toBeTruthy();
  });

  it("handhaaft strikte niet-medische guardrails bij blessure-gerelateerde vragen", () => {
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

    const response = generateLocalHeuristicResponse({
      task: "qa_chat",
      userPrompt: "Ik heb hevige pijn in mijn onderrug, moet ik doortrainen?",
      context: { preparedContext: context },
    });

    expect(response.message).toContain("direct te staken");
    expect(response.message).toContain("stelt geen medische diagnoses");
    expect(response.message).toContain("arts of sportfysiotherapeut");
  });

  it("bevat vooraf ingestelde suggestie-chips voor soepele gebruikerservaring", () => {
    expect(QUICK_PROMPT_CHIPS.length).toBeGreaterThanOrEqual(4);
    expect(AI_CHAT_DISCLAIMER).toContain("GEEN medische diagnoses");
  });
});
