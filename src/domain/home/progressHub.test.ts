import { describe, it, expect } from "vitest";
import { calculateProgressHubSummary } from "./progressHub";
import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  BodyMeasurement,
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

describe("Progress Hub Holistic Analytics Domain", () => {
  it("genereert exact het juiste aantal chronologische datapunten voor 14d, 30d en 90d", () => {
    const res14 = calculateProgressHubSummary({
      period: "14d",
      referenceDate: "2026-10-14",
      workoutSessions: [],
      workoutSets: [],
      cardioSessions: [],
      mealLogs: [],
      measurements: [],
      targets: mockTargets,
    });
    expect(res14.dataPoints).toHaveLength(14);
    expect(res14.startDate).toBe("2026-10-01");
    expect(res14.endDate).toBe("2026-10-14");

    const res30 = calculateProgressHubSummary({
      period: "30d",
      referenceDate: "2026-10-30",
      workoutSessions: [],
      workoutSets: [],
      cardioSessions: [],
      mealLogs: [],
      measurements: [],
      targets: mockTargets,
    });
    expect(res30.dataPoints).toHaveLength(30);

    const res90 = calculateProgressHubSummary({
      period: "90d",
      referenceDate: "2026-10-30",
      workoutSessions: [],
      workoutSets: [],
      cardioSessions: [],
      mealLogs: [],
      measurements: [],
      targets: mockTargets,
    });
    expect(res90.dataPoints).toHaveLength(90);
  });

  it("berekent correct het krachttrainingsvolume per sessie en dag", () => {
    const sessionId = "ws_1";
    const session: WorkoutSession = {
      id: sessionId,
      calendarDate: "2026-10-10",
      startTime: "2026-10-10T10:00:00.000Z",
      endTime: "2026-10-10T11:00:00.000Z",
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: { exercises: [] },
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
    };

    const sets: WorkoutSet[] = [
      {
        id: "s1",
        sessionId,
        exerciseId: "e1",
        setNumber: 1,
        setType: "normal",
        weightKg: 100,
        reps: 10, // 1000 kg
        completed: true,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        loggedAt: "2026-10-10T10:10:00Z",
      },
      {
        id: "s2",
        sessionId,
        exerciseId: "e1",
        setNumber: 2,
        setType: "normal",
        weightKg: 100,
        reps: 8, // 800 kg
        completed: true,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        loggedAt: "2026-10-10T10:15:00Z",
      },
      {
        id: "s3_incompleted",
        sessionId,
        exerciseId: "e1",
        setNumber: 3,
        setType: "normal",
        weightKg: 100,
        reps: 5,
        completed: false, // Mag niet meetellen!
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        loggedAt: "2026-10-10T10:20:00Z",
      },
    ];

    const result = calculateProgressHubSummary({
      period: "14d",
      referenceDate: "2026-10-14",
      workoutSessions: [session],
      workoutSets: sets,
      cardioSessions: [],
      mealLogs: [],
      measurements: [],
      targets: mockTargets,
    });

    expect(result.totalWorkoutsCount).toBe(1);
    expect(result.totalWorkoutVolumeKg).toBe(1800); // 1000 + 800
    expect(result.avgVolumePerWorkoutKg).toBe(1800);

    const pt10 = result.dataPoints.find((p) => p.calendarDate === "2026-10-10");
    expect(pt10?.hasWorkout).toBe(true);
    expect(pt10?.workoutVolumeKg).toBe(1800);
    expect(pt10?.workoutSetsCount).toBe(2);
  });

  it("vergelijkt voeding op trainingsdagen versus rustdagen nauwkeurig", () => {
    // 1 training op 2026-10-09
    const session: WorkoutSession = {
      id: "ws_1",
      calendarDate: "2026-10-09",
      startTime: "2026-10-09T10:00:00.000Z",
      endTime: "2026-10-09T11:00:00.000Z",
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: { exercises: [] },
      overallRpe: 8,
      notes: "",
      provenance: { source: "user" },
    };

    const sets: WorkoutSet[] = [
      {
        id: "s1",
        sessionId: "ws_1",
        exerciseId: "e1",
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 10,
        completed: true,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        loggedAt: "2026-10-09T10:10:00Z",
      },
    ];

    // Maaltijd op trainingsdag: 2600 kcal, 180g eiwit
    const trainingMeal: MealLog = {
      id: "m_train",
      calendarDate: "2026-10-09",
      mealType: "diner",
      items: [],
      totalCalories: 2600,
      totalProteinGrams: 180,
      totalCarbsGrams: 300,
      totalFatGrams: 70,
      totalFiberGrams: 35,
      loggedAt: "2026-10-09T18:00:00Z",
    };

    // Maaltijd op rustdag: 2000 kcal, 130g eiwit
    const restMeal: MealLog = {
      id: "m_rest",
      calendarDate: "2026-10-10",
      mealType: "diner",
      items: [],
      totalCalories: 2000,
      totalProteinGrams: 130,
      totalCarbsGrams: 210,
      totalFatGrams: 60,
      totalFiberGrams: 25,
      loggedAt: "2026-10-10T18:00:00Z",
    };

    const result = calculateProgressHubSummary({
      period: "14d",
      referenceDate: "2026-10-10",
      workoutSessions: [session],
      workoutSets: sets,
      cardioSessions: [],
      mealLogs: [trainingMeal, restMeal],
      measurements: [],
      targets: mockTargets,
    });

    expect(result.trainingDaysCount).toBe(1);
    expect(result.restDaysCount).toBe(1);
    expect(result.avgCaloriesTrainingDays).toBe(2600);
    expect(result.avgProteinTrainingDays).toBe(180);
    expect(result.avgCaloriesRestDays).toBe(2000);
    expect(result.avgProteinRestDays).toBe(130);

    // Er moet een observatie zijn over hogere inname op trainingsdagen
    const nutritionObs = result.observations.find((o) => o.type === "nutrition_training");
    expect(nutritionObs).toBeDefined();
    expect(nutritionObs?.description).toContain("600 kcal meer");
  });

  it("analyseert gewichtscorrelatie met cumulatief calorietekort en voorspelt gewichtsverlies", () => {
    // 2 gewichtsmetingen: 80.0 kg op dag 1, 79.0 kg op dag 10 (-1.0 kg)
    const measurements: BodyMeasurement[] = [
      {
        id: "bm_1",
        calendarDate: "2026-10-01",
        measuredAt: "2026-10-01T07:00:00Z",
        weightKg: 80.0,
        bodyFatPercentage: null,
        chestMeters: null,
        waistMeters: null,
        hipsMeters: null,
        armsMeters: null,
        thighsMeters: null,
        notes: "",
        provenance: { source: "user" },
      },
      {
        id: "bm_2",
        calendarDate: "2026-10-10",
        measuredAt: "2026-10-10T07:00:00Z",
        weightKg: 79.0,
        bodyFatPercentage: null,
        chestMeters: null,
        waistMeters: null,
        hipsMeters: null,
        armsMeters: null,
        thighsMeters: null,
        notes: "",
        provenance: { source: "user" },
      },
    ];

    // 10 dagen met deficit van 770 kcal/dag (inname 1430 vs doel 2200) -> 10 * -770 = -7700 kcal
    // Verwacht gewichtsverlies = -7700 / 7700 = -1.0 kg!
    const meals: MealLog[] = [];
    for (let i = 1; i <= 10; i++) {
      const date = `2026-10-${String(i).padStart(2, "0")}`;
      meals.push({
        id: `m_${date}`,
        calendarDate: date,
        mealType: "diner",
        items: [],
        totalCalories: 1430,
        totalProteinGrams: 140,
        totalCarbsGrams: 120,
        totalFatGrams: 40,
        totalFiberGrams: 25,
        loggedAt: `${date}T18:00:00Z`,
      });
    }

    const result = calculateProgressHubSummary({
      period: "14d",
      referenceDate: "2026-10-14",
      workoutSessions: [],
      workoutSets: [],
      cardioSessions: [],
      mealLogs: meals,
      measurements,
      targets: mockTargets,
    });

    expect(result.startWeightKg).toBe(80.0);
    expect(result.endWeightKg).toBe(79.0);
    expect(result.actualWeightChangeKg).toBe(-1.0);
    expect(result.expectedWeightChangeKg).toBe(-1.0);
    expect(result.weightCorrelationAccuracyPct).toBe(100);

    const weightObs = result.observations.find((o) => o.type === "weight_balance");
    expect(weightObs).toBeDefined();
    expect(weightObs?.description).toContain("daalde met 1 kg");
  });
});
