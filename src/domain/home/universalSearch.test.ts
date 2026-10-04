import { describe, it, expect } from "vitest";
import { searchUniversalHistory } from "./universalSearch";
import type {
  WorkoutSession,
  CardioSession,
  MealLog,
  BodyMeasurement,
} from "@/types/database";

describe("Universal Search Domain (Stap 36 / Prompt 30)", () => {
  const workout1: WorkoutSession = {
    id: "ws-1",
    calendarDate: "2026-10-10",
    startTime: "2026-10-10T10:00:00Z",
    endTime: "2026-10-10T11:00:00Z",
    status: "afgerond",
    routineId: null,
    routineDayId: null,
    routineVersion: null,
    snapshot: {
      routineName: "Borst & Triceps Power",
      exercises: [
        {
          exerciseId: "ex-1",
          exerciseName: "Barbell Bench Press",
          primaryMuscleGroup: "borst",
          targetSets: 4,
          restSeconds: 90,
        },
      ],
    },
    overallRpe: 8,
    notes: "Nieuw PR op bench press",
    provenance: { source: "user" },
  };

  const cardio1: CardioSession = {
    id: "cs-1",
    calendarDate: "2026-10-11",
    activityType: "hardlopen",
    distanceMeters: 6000,
    durationSeconds: 1900,
    avgHeartRateBpm: 152,
    maxHeartRateBpm: 170,
    estimatedCaloriesBurned: 480,
    elevationGainMeters: 15,
    rpe: 7,
    notes: "Lekker tempo in het bos",
    startTime: "2026-10-11T08:00:00Z",
    endTime: "2026-10-11T08:32:00Z",
    provenance: { source: "user" },
  };

  const meal1: MealLog = {
    id: "ml-1",
    calendarDate: "2026-10-12",
    mealType: "ontbijt",
    loggedAt: "2026-10-12T08:00:00Z",
    items: [
      {
        foodItemId: "item-1",
        foodName: "Havermout met bosbessen",
        portionGrams: 200,
        calories: 380,
        proteinGrams: 15,
        carbsGrams: 60,
        fatGrams: 8,
        fiberGrams: 6,
      },
    ],
    totalCalories: 380,
    totalProteinGrams: 15,
    totalCarbsGrams: 60,
    totalFatGrams: 8,
    totalFiberGrams: 6,
  };

  const measurement1: BodyMeasurement = {
    id: "bm-1",
    calendarDate: "2026-10-13",
    measuredAt: "2026-10-13T07:00:00Z",
    weightKg: 80.5,
    bodyFatPercentage: 14.5,
    chestMeters: null,
    waistMeters: null,
    hipsMeters: null,
    armsMeters: null,
    thighsMeters: null,
    notes: "Nuchtere ochtendweging",
    provenance: { source: "user" },
  };

  it("vindt krachttrainingen op basis van oefeningsnaam en notities", () => {
    const results = searchUniversalHistory({
      query: "Bench Press",
      workoutSessions: [workout1],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });

    expect(results.length).toBe(1);
    expect(results[0].category).toBe("kracht");
    expect(results[0].title).toBe("Borst & Triceps Power");
    expect(results[0].matchSnippet).toContain("Bench Press");
    expect(results[0].targetUrl).toBe("/training");
  });

  it("vindt cardio op activiteittype en notities", () => {
    const results = searchUniversalHistory({
      query: "tempo in het bos",
      workoutSessions: [workout1],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });

    expect(results.length).toBe(1);
    expect(results[0].category).toBe("cardio");
    expect(results[0].title).toBe("Hardlopen");
    expect(results[0].subtitle).toContain("6.0 km");
    expect(results[0].targetUrl).toBe("/cardio");
  });

  it("vindt maaltijden op productnaam", () => {
    const results = searchUniversalHistory({
      query: "bosbessen",
      workoutSessions: [workout1],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });

    expect(results.length).toBe(1);
    expect(results[0].category).toBe("voeding");
    expect(results[0].title).toContain("Ontbijt");
    expect(results[0].matchSnippet).toContain("Havermout met bosbessen");
    expect(results[0].targetUrl).toBe("/voeding");
  });

  it("vindt wegingen op gewichtsterm en notitie", () => {
    const results = searchUniversalHistory({
      query: "nuchtere",
      workoutSessions: [workout1],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });

    expect(results.length).toBe(1);
    expect(results[0].category).toBe("meting");
    expect(results[0].title).toContain("80.5 kg");
    expect(results[0].targetUrl).toBe("/profiel");
  });

  it("filtert specifiek op categorie", () => {
    // Zoek naar '10' (komt voor in datums of waarden)
    const resultsOnlyCardio = searchUniversalHistory({
      query: "",
      category: "cardio",
      workoutSessions: [workout1],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });

    expect(resultsOnlyCardio.every((r) => r.category === "cardio")).toBe(true);
    expect(resultsOnlyCardio.length).toBe(1);
  });

  it("filtert correct op datumperiode", () => {
    const refDate = "2026-10-14";
    // 7 dagen terug vanaf 14 okt is 7 okt: alles valt erin
    const results7d = searchUniversalHistory({
      query: "",
      datePeriod: "7d",
      referenceDate: refDate,
      workoutSessions: [workout1],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });
    expect(results7d.length).toBe(4);

    // Oude sessie toevoegen buiten het bereik
    const oldWorkout: WorkoutSession = {
      ...workout1,
      id: "ws-old",
      calendarDate: "2026-08-01",
    };

    const resultsFiltered = searchUniversalHistory({
      query: "",
      datePeriod: "7d",
      referenceDate: refDate,
      workoutSessions: [workout1, oldWorkout],
      cardioSessions: [cardio1],
      mealLogs: [meal1],
      measurements: [measurement1],
    });

    expect(resultsFiltered.find((r) => r.id === "ws-old")).toBeUndefined();
  });
});
