import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { calculateActivityStreaks } from "@/domain/home/activityStreaks";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import type { WorkoutSession, CardioSession } from "@/types/database";

describe("Activity Streaks & Heatmap Integration (Stap 35 / Prompt 29)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName =
    "SportKompasTest_Streaks_" + Math.random().toString(36).substring(2);

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

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("laadt multi-pijler data via repositories en berekent streaks en heatmap consistent", async () => {
    const refDate = "2026-10-14";
    const day1 = "2026-10-12"; // Maandag: Workout
    const day2 = "2026-10-13"; // Dinsdag: Cardio + Water
    const day3 = "2026-10-14"; // Woensdag: Voeding + Herstel

    // 1. Krachttraining op day1
    const workoutSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate: day1,
      startTime: `${day1}T09:00:00.000Z`,
      endTime: `${day1}T10:15:00.000Z`,
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: { exercises: [] },
      overallRpe: 8,
      notes: "Full body kracht",
      provenance: { source: "user" },
    };
    await db.workoutSessions.put(workoutSession);

    // 2. Cardio op day2
    const cardioSession: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: day2,
      activityType: "hardlopen",
      distanceMeters: 5200,
      durationSeconds: 1800,
      estimatedCaloriesBurned: 410,
      startTime: `${day2}T07:30:00.000Z`,
      endTime: `${day2}T08:00:00.000Z`,
      avgHeartRateBpm: 150,
      maxHeartRateBpm: 168,
      elevationGainMeters: 20,
      rpe: 7,
      notes: "Ochtendloop",
      provenance: { source: "user" },
    };
    await repos.cardio.save(cardioSession);

    // 3. Water op day2 (2500 ml => haalt het doel)
    await repos.nutrition.logWater(day2, 2500);

    // 4. Maaltijd op day3
    await repos.nutrition.addItemToMeal(day3, "lunch", {
      foodItemId: crypto.randomUUID(),
      foodName: "Gezonde bowl met kip",
      portionGrams: 350,
      calories: 750,
      proteinGrams: 55,
      carbsGrams: 70,
      fatGrams: 18,
      fiberGrams: 10,
    });

    // 5. Herstel op day3
    await repos.recovery.save({
      id: crypto.randomUUID(),
      calendarDate: day3,
      sleepDurationMinutes: 480,
      sleepQualityRating: 4,
      restingHeartRateBpm: 58,
      sorenessRating: 2,
      stressRating: 2,
      notes: "Goed uitgerust",
      provenance: { source: "user" },
      loggedAt: `${day3}T08:00:00.000Z`,
    });

    // Haal data op via repository methodes zoals in HomePage
    const historyStartDate = "2026-08-01";
    const [workouts, cardios, meals, waterLogs, recoveryLogs, weeklyGoal] =
      await Promise.all([
        repos.workout.sessions.getAll(),
        repos.cardio.getAll(),
        repos.nutrition.getMealsForDateRange(historyStartDate, refDate),
        repos.nutrition.getWaterLogsForDateRange(historyStartDate, refDate),
        repos.recovery.getAll(),
        repos.settings.getWeeklyWorkoutGoal(),
      ]);

    // Bereken activiteitstreaks
    const streaks = calculateActivityStreaks({
      referenceDate: refDate,
      weeksCount: 8,
      workoutSessions: workouts,
      cardioSessions: cardios,
      mealLogs: meals,
      waterLogs,
      recoveryLogs,
      targets: mockTargets,
      weeklyWorkoutGoal: weeklyGoal,
    });

    // Validaties
    expect(streaks.referenceDate).toBe(refDate);
    expect(streaks.weeksCount).toBe(8);
    expect(streaks.weeks.length).toBe(8);

    // 3 opeenvolgende actieve dagen (12, 13, 14 okt)
    expect(streaks.currentDailyStreak).toBe(3);
    expect(streaks.longestDailyStreak).toBe(3);
    expect(streaks.isStreakActiveToday).toBe(true);

    // Pijlerstatistieken
    expect(streaks.pillarStats.workoutDays).toBe(1);
    expect(streaks.pillarStats.cardioDays).toBe(1);
    expect(streaks.pillarStats.nutritionDays).toBe(1);
    expect(streaks.pillarStats.waterTargetDays).toBe(1);
    expect(streaks.pillarStats.recoveryLoggedDays).toBe(1);

    // Feedback
    expect(streaks.feedback.tone).toBe("supportive");
    expect(streaks.feedback.title).toBe("Mooie streak in opbouw");
  });

  it("handelt een lege database af met vriendelijke aanmoediging zonder te crashen", async () => {
    const refDate = "2026-10-14";
    const streaks = calculateActivityStreaks({
      referenceDate: refDate,
      weeksCount: 8,
      workoutSessions: [],
      cardioSessions: [],
      mealLogs: [],
      waterLogs: [],
      recoveryLogs: [],
      targets: mockTargets,
    });

    expect(streaks.currentDailyStreak).toBe(0);
    expect(streaks.longestDailyStreak).toBe(0);
    expect(streaks.isStreakActiveToday).toBe(false);
    expect(streaks.totalActiveDays).toBe(0);
    expect(streaks.totalRestDays).toBeGreaterThan(0);
    expect(streaks.activityPercentage).toBe(0);
    expect(streaks.feedback.tone).toBe("encouraging");
  });
});
