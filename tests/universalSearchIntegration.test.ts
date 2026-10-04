import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { searchUniversalHistory } from "@/domain/home/universalSearch";
import type { WorkoutSession, CardioSession } from "@/types/database";

describe("Universal Search Integration (Stap 36 / Prompt 30)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName =
    "SportKompasTest_UniversalSearch_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("zoekt over alle 4 de pijlers heen in de database en ondersteunt categoriefilters", async () => {
    const today = "2026-10-14";

    // 1. Krachttraining toevoegen
    const workoutSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-12",
      startTime: "2026-10-12T10:00:00.000Z",
      endTime: "2026-10-12T11:15:00.000Z",
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: {
        routineName: "Push Hypertrofie Kracht",
        exercises: [
          {
            exerciseId: crypto.randomUUID(),
            exerciseName: "Incline Dumbbell Press",
            primaryMuscleGroup: "borst",
            targetSets: 4,
            restSeconds: 90,
          },
        ],
      },
      overallRpe: 8,
      notes: "Nieuwe PR op dumbbell press",
      provenance: { source: "user" },
    };
    await db.workoutSessions.put(workoutSession);

    // 2. Cardio toevoegen
    const cardioSession: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-13",
      activityType: "fietsen",
      distanceMeters: 25000, // 25 km
      durationSeconds: 3600, // 60 min
      estimatedCaloriesBurned: 650,
      avgHeartRateBpm: 140,
      maxHeartRateBpm: 165,
      elevationGainMeters: 50,
      rpe: 6,
      notes: "Intervaltraining langs de vaart",
      provenance: { source: "user" },
      startTime: "2026-10-13T14:00:00.000Z",
      endTime: "2026-10-13T15:00:00.000Z",
    };
    await repos.cardio.save(cardioSession);

    // 3. Maaltijd toevoegen
    await repos.nutrition.addItemToMeal("2026-10-14", "ontbijt", {
      foodItemId: crypto.randomUUID(),
      foodName: "Magere Franse Kwark met Bosbessen",
      portionGrams: 300,
      calories: 220,
      proteinGrams: 36,
      carbsGrams: 15,
      fatGrams: 1,
      fiberGrams: 4,
    });

    // 4. Meting toevoegen
    await repos.measurements.logWeightOnly(
      "2026-10-14",
      79.8,
      "Nuchtere ochtendweging na rustweekend"
    );

    // Haal data op via repository methodes
    const [workouts, cardios, meals, measurements] = await Promise.all([
      repos.workout.sessions.getAll(),
      repos.cardio.getAll(),
      repos.nutrition.getMealsForDateRange("2026-10-01", "2026-10-15"),
      repos.measurements.getAll(),
    ]);

    // Test 1: Zoeken naar "Dumbbell" vindt uitsluitend de workout
    const searchDumbbell = searchUniversalHistory({
      query: "Dumbbell",
      workoutSessions: workouts,
      cardioSessions: cardios,
      mealLogs: meals,
      measurements,
    });
    expect(searchDumbbell.length).toBe(1);
    expect(searchDumbbell[0].category).toBe("kracht");
    expect(searchDumbbell[0].title).toBe("Push Hypertrofie Kracht");
    expect(searchDumbbell[0].matchSnippet).toContain("Incline Dumbbell Press");

    // Test 2: Zoeken naar "vaart" vindt de fietssessie
    const searchCardio = searchUniversalHistory({
      query: "vaart",
      workoutSessions: workouts,
      cardioSessions: cardios,
      mealLogs: meals,
      measurements,
    });
    expect(searchCardio.length).toBe(1);
    expect(searchCardio[0].category).toBe("cardio");
    expect(searchCardio[0].title).toBe("Fietsen");
    expect(searchCardio[0].matchSnippet).toContain("Intervaltraining langs de vaart");

    // Test 3: Zoeken naar "Kwark" vindt het ontbijt
    const searchFood = searchUniversalHistory({
      query: "Kwark",
      workoutSessions: workouts,
      cardioSessions: cardios,
      mealLogs: meals,
      measurements,
    });
    expect(searchFood.length).toBe(1);
    expect(searchFood[0].category).toBe("voeding");
    expect(searchFood[0].matchSnippet).toContain("Magere Franse Kwark met Bosbessen");

    // Test 4: Zoeken naar "rustweekend" vindt de gewichtsmeting
    const searchWeight = searchUniversalHistory({
      query: "rustweekend",
      workoutSessions: workouts,
      cardioSessions: cardios,
      mealLogs: meals,
      measurements,
    });
    expect(searchWeight.length).toBe(1);
    expect(searchWeight[0].category).toBe("meting");
    expect(searchWeight[0].title).toContain("79.8 kg");
    expect(searchWeight[0].matchSnippet).toContain("Nuchtere ochtendweging na rustweekend");

    // Test 5: Categorie filter "voeding" geeft alleen voeding
    const onlyFood = searchUniversalHistory({
      query: "",
      category: "voeding",
      workoutSessions: workouts,
      cardioSessions: cardios,
      mealLogs: meals,
      measurements,
    });
    expect(onlyFood.length).toBe(1);
    expect(onlyFood[0].category).toBe("voeding");
  });
});
