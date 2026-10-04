import { describe, it, expect } from "vitest";
import { calculateActivityStreaks } from "./activityStreaks";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import type {
  WorkoutSession,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";

describe("Activity Streaks Domain (Stap 35 / Prompt 29)", () => {
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

  const createWorkout = (calendarDate: string): WorkoutSession => ({
    id: `ws-${calendarDate}`,
    calendarDate,
    startTime: `${calendarDate}T10:00:00Z`,
    endTime: `${calendarDate}T11:00:00Z`,
    status: "afgerond",
    routineId: null,
    routineDayId: null,
    routineVersion: null,
    snapshot: { exercises: [] },
    overallRpe: 8,
    notes: "",
    provenance: { source: "user" },
  });

  const createCardio = (calendarDate: string): CardioSession => ({
    id: `cs-${calendarDate}`,
    calendarDate,
    activityType: "hardlopen",
    distanceMeters: 5000,
    durationSeconds: 1800, // 30 min
    avgHeartRateBpm: 145,
    maxHeartRateBpm: 160,
    estimatedCaloriesBurned: 350,
    elevationGainMeters: 10,
    rpe: 6,
    notes: "",
    startTime: `${calendarDate}T08:00:00Z`,
    endTime: `${calendarDate}T08:30:00Z`,
    provenance: { source: "user" },
  });

  const createMeal = (calendarDate: string, calories = 600): MealLog => ({
    id: `meal-${calendarDate}`,
    calendarDate,
    mealType: "lunch",
    loggedAt: `${calendarDate}T12:30:00Z`,
    items: [],
    totalCalories: calories,
    totalProteinGrams: 40,
    totalCarbsGrams: 60,
    totalFatGrams: 20,
    totalFiberGrams: 8,
  });

  const createWater = (calendarDate: string, amountMl = 2500): WaterLog => ({
    id: `water-${calendarDate}`,
    calendarDate,
    amountMl,
    loggedAt: `${calendarDate}T14:00:00Z`,
  });

  const createRecovery = (calendarDate: string): RecoveryLog => ({
    id: `rec-${calendarDate}`,
    calendarDate,
    sleepDurationMinutes: 480,
    sleepQualityRating: 4,
    restingHeartRateBpm: 55,
    sorenessRating: 2,
    stressRating: 2,
    notes: "",
    provenance: { source: "user" },
    loggedAt: `${calendarDate}T08:00:00Z`,
  });

  it("berekent opeenvolgende actieve dagen en behoudt streak als vandaag nog niet voorbij is", () => {
    const today = "2026-10-14"; // Woensdag
    // Stel: maandag en dinsdag waren actief, vandaag nog niet
    const workouts = [createWorkout("2026-10-12"), createWorkout("2026-10-13")];

    const result = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: workouts,
      cardioSessions: [],
      mealLogs: [],
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    // Vandaag is nog niet actief
    expect(result.isStreakActiveToday).toBe(false);
    // Maar streak wordt behouden vanaf gisteren (2 dagen: 12 en 13 okt)
    expect(result.currentDailyStreak).toBe(2);
    expect(result.longestDailyStreak).toBe(2);
  });

  it("telt vandaag mee zodra er vandaag activiteit is geregistreerd", () => {
    const today = "2026-10-14";
    // 3 opeenvolgende dagen inclusief vandaag (12, 13, 14)
    const workouts = [createWorkout("2026-10-12"), createWorkout("2026-10-13")];
    const water = [createWater(today, 2600)]; // Vandaag waterdoel gehaald

    const result = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: workouts,
      cardioSessions: [],
      mealLogs: [],
      waterLogs: water,
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(result.isStreakActiveToday).toBe(true);
    expect(result.currentDailyStreak).toBe(3);
    expect(result.longestDailyStreak).toBe(3);
  });

  it("berekent correct de langste streak over de hele geselecteerde periode", () => {
    const today = "2026-10-14";
    // Streak 1: 4 dagen op rij in september (2026-09-01 t/m 2026-09-04)
    const pastMeals = [
      createMeal("2026-09-01"),
      createMeal("2026-09-02"),
      createMeal("2026-09-03"),
      createMeal("2026-09-04"),
    ];

    // Huidige streak: 2 dagen (2026-10-13 en 2026-10-14)
    const currentWorkouts = [createWorkout("2026-10-13"), createWorkout("2026-10-14")];

    const result = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: currentWorkouts,
      cardioSessions: [],
      mealLogs: pastMeals,
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(result.currentDailyStreak).toBe(2);
    expect(result.longestDailyStreak).toBe(4);
  });

  it("structureert een complete 8-weken en 12-weken heatmap van Maandag t/m Zondag", () => {
    const today = "2026-10-14";

    const result8 = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: [],
      cardioSessions: [],
      mealLogs: [],
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(result8.weeksCount).toBe(8);
    expect(result8.weeks.length).toBe(8);
    // Elke week heeft exact 7 dagen (Ma t/m Zo)
    result8.weeks.forEach((week) => {
      expect(week.days.length).toBe(7);
      expect(week.days[0].dayOfWeekIndex).toBe(0); // Maandag
      expect(week.days[6].dayOfWeekIndex).toBe(6); // Zondag
    });

    const result12 = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 12,
      workoutSessions: [],
      cardioSessions: [],
      mealLogs: [],
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(result12.weeksCount).toBe(12);
    expect(result12.weeks.length).toBe(12);
  });

  it("classificeert intensiteitsniveaus (0, 1, 2, 3) correct en telt pijlers", () => {
    const today = "2026-10-14";
    // Dag 1 (11 okt): Alleen herstel => intensiteit 1
    const rec = [createRecovery("2026-10-11")];
    // Dag 2 (12 okt): Alleen workout => intensiteit 2
    const workout = [createWorkout("2026-10-12")];
    // Dag 3 (13 okt): Workout + Voeding => intensiteit 3
    const workout2 = [createWorkout("2026-10-13")];
    const meals = [createMeal("2026-10-13")];
    // Dag 4 (14 okt): Geen activiteit => intensiteit 0

    const result = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: [...workout, ...workout2],
      cardioSessions: [],
      mealLogs: meals,
      waterLogs: [],
      recoveryLogs: rec,
      targets: mockTargets,
    });

    const findDay = (d: string) => {
      for (const w of result.weeks) {
        const found = w.days.find((day) => day.calendarDate === d);
        if (found) return found;
      }
      return null;
    };

    expect(findDay("2026-10-11")?.intensityLevel).toBe(1);
    expect(findDay("2026-10-12")?.intensityLevel).toBe(2);
    expect(findDay("2026-10-13")?.intensityLevel).toBe(3);
    expect(findDay("2026-10-14")?.intensityLevel).toBe(0);

    expect(result.pillarStats.workoutDays).toBe(2);
    expect(result.pillarStats.nutritionDays).toBe(1);
    expect(result.pillarStats.recoveryLoggedDays).toBe(1);
  });

  it("geeft ondersteunende en motiverende feedback zonder schuldgevoel", () => {
    const today = "2026-10-14";
    const resultEmpty = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: [],
      cardioSessions: [],
      mealLogs: [],
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(resultEmpty.feedback.tone).toBe("encouraging");
    expect(resultEmpty.feedback.title).toBe("Elke dag is een nieuwe start");

    // 7 dagen streak
    const sevenWorkouts = [
      createWorkout("2026-10-08"),
      createWorkout("2026-10-09"),
      createWorkout("2026-10-10"),
      createWorkout("2026-10-11"),
      createWorkout("2026-10-12"),
      createWorkout("2026-10-13"),
      createWorkout("2026-10-14"),
    ];

    const resultStreak = calculateActivityStreaks({
      referenceDate: today,
      weeksCount: 8,
      workoutSessions: sevenWorkouts,
      cardioSessions: [],
      mealLogs: [],
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(resultStreak.currentDailyStreak).toBe(7);
    expect(resultStreak.feedback.tone).toBe("positive");
    expect(resultStreak.feedback.title).toContain("Consistentie");
  });
});
