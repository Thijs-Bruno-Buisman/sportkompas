import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { generateDemoData } from "@/lib/db/demo/demoData";
import {
  seedDemoDatabase,
  resetDemoDatabase,
  isDemoDatabaseSeeded,
} from "@/lib/db/demo/seedDemo";
import type { Profile, WorkoutSession, CardioSession, MealLog } from "@/types/database";

describe("Stap 05 — Demomodus & Volledige Data-isolatie", () => {
  let realDb: SportKompasDatabase;
  let demoDb: SportKompasDatabase;
  const realDbName = "Test_Real_SportKompasDB";
  const demoDbName = "Test_Demo_SportKompasDB";

  beforeEach(async () => {
    realDb = new SportKompasDatabase(realDbName);
    demoDb = new SportKompasDatabase(demoDbName);
    await realDb.open();
    await demoDb.open();
  });

  afterEach(async () => {
    await realDb.delete();
    await demoDb.delete();
  });

  it("garandeert dat de echte database en de demodatabase fysiek gescheiden zijn", async () => {
    const realRepos = createRepositories(realDb);
    const demoRepos = createRepositories(demoDb);

    // Initial state: beide databases zijn leeg
    expect(await realRepos.profile.getCurrentProfile()).toBeNull();
    expect(await demoRepos.profile.getCurrentProfile()).toBeNull();

    // Vul uitsluitend de demodatabase
    await seedDemoDatabase(demoDb);

    // Controleer dat demodatabase gevuld is
    const demoProfile = await demoRepos.profile.getCurrentProfile();
    expect(demoProfile).not.toBeNull();
    expect(demoProfile?.name).toBe("Alex (Voorbeeld)");
    expect(demoProfile?.provenance?.source).toBe("demo");
    expect(demoProfile?.provenance?.isDemo).toBe(true);

    // CRUCIAAL: De echte database is nog steeds 100% leeg
    const realProfile = await realRepos.profile.getCurrentProfile();
    expect(realProfile).toBeNull();

    const realWorkouts = await realRepos.workout.sessions.getAll();
    expect(realWorkouts.length).toBe(0);

    const realCardio = await realRepos.cardio.getAll();
    expect(realCardio.length).toBe(0);

    const realMeals = await realRepos.nutrition.getMealsByDate("2026-10-02");
    expect(realMeals.length).toBe(0);
  });

  it("maakt demogegevens reproduceerbaar, gevalideerd en intern consistent", async () => {
    const baseDate = new Date("2026-10-02T10:00:00Z");
    const data = generateDemoData(baseDate);

    // Validatie van kernentiteiten
    expect(data.profile.name).toContain("Alex");
    expect(data.exercises.length).toBe(12);
    expect(data.routine.name).toBe("Upper / Lower Kracht & Massa");
    expect(data.routineDays.length).toBe(4);
    expect(data.workoutSessions.length).toBe(13);
    expect(data.workoutSets.length).toBeGreaterThan(30);
    expect(data.cardioSessions.length).toBe(6);
    expect(data.goals.length).toBe(3);
    expect(data.foodItems.length).toBe(10);
    expect(data.mealLogs.length).toBe(4);
    expect(data.bodyMeasurements.length).toBe(5);
    expect(data.recoveryLogs.length).toBe(5);

    // Alle demo-records hebben de juiste provenance
    expect(data.profile.provenance?.source).toBe("demo");
    expect(data.exercises[0].provenance.source).toBe("demo");
    expect(data.workoutSessions[0].provenance.source).toBe("demo");
    expect(data.cardioSessions[0].provenance.source).toBe("demo");

    // Lichaamsmetingen vertonen een consistente en gezonde trend
    const weights = data.bodyMeasurements.map((b) => b.weightKg);
    expect(weights[0]).toBe(82.5); // Week 1
    expect(weights[4]).toBe(81.0); // Week 5
    expect(weights[0] > weights[4]).toBe(true); // Consistente afname
  });

  it("berekent persoonlijke totalen en PR's dynamisch uit de demologs", async () => {
    await seedDemoDatabase(demoDb);
    const demoRepos = createRepositories(demoDb);

    // 1. Berekening van 1RM op Bench Press vanuit de gelogde sets
    const benchPressEx = await demoDb.exercises.where("name").equals("Barbell Bench Press").first();
    expect(benchPressEx).toBeDefined();

    const benchSets = await demoDb.workoutSets.where("exerciseId").equals(benchPressEx!.id).toArray();
    expect(benchSets.length).toBeGreaterThan(0);

    // Zoek de hoogste Epley 1RM in de sets: weight * (1 + reps/30)
    let maxEstimated1RM = 0;
    for (const set of benchSets) {
      const epley1RM = set.weightKg * (1 + set.reps / 30);
      if (epley1RM > maxEstimated1RM) {
        maxEstimated1RM = epley1RM;
      }
    }
    // De laatste bench press sessie was 87.5 kg x 6 reps -> 87.5 * (1 + 6/30) = 105.0 kg
    expect(Math.round(maxEstimated1RM)).toBe(105);

    // 2. Berekening van totale cardio kilometers
    const allCardio = await demoRepos.cardio.getAll();
    const totalKm = allCardio.reduce((acc, c) => acc + c.distanceMeters, 0) / 1000;
    expect(totalKm).toBe(72.5); // 5 + 20 + 7.5 + 5 + 10 + 25 = 72.5 km

    // 3. Berekening van dagelijkse calorie-inname
    const today = new Date().toISOString().split("T")[0];
    const todayMeals = await demoRepos.nutrition.getMealsByDate(today);
    const totalKcal = todayMeals.reduce((acc, m) => acc + m.totalCalories, 0);
    expect(totalKcal).toBeGreaterThan(1800);
    expect(totalKcal).toBeLessThan(2300);
  });

  it("garandeert dat een nieuwe gebruiker in echte modus geen waarden erft van de demomodus", async () => {
    // Vul de demodatabase
    await seedDemoDatabase(demoDb);

    // Echte database blijft leeg
    const realRepos = createRepositories(realDb);

    // Controleer alle modules in echte modus
    const realProfile = await realRepos.profile.getCurrentProfile();
    expect(realProfile).toBeNull();

    const realWorkouts = await realRepos.workout.sessions.getAll();
    expect(realWorkouts.length).toBe(0);

    const realCardio = await realRepos.cardio.getAll();
    expect(realCardio.length).toBe(0);
    const realKm = realCardio.reduce((acc, c) => acc + c.distanceMeters, 0);
    expect(realKm).toBe(0);

    const realMeasurements = await realRepos.measurements.getAll();
    expect(realMeasurements.length).toBe(0);

    const realRecovery = await realRepos.recovery.getAll();
    expect(realRecovery.length).toBe(0);
  });

  it("behoudt echte gebruikersgegevens bij wisselen naar demo en terug", async () => {
    const realRepos = createRepositories(realDb);
    const demoRepos = createRepositories(demoDb);

    // 1. Maak een echte gebruiker aan
    const realUserData: Omit<Profile, "id" | "createdAt" | "updatedAt"> = {
      name: "Echte Gebruiker",
      birthDate: "1990-01-01",
      gender: "vrouw",
      heightMeters: 1.70,
      startWeightKg: 65.0,
      targetWeightKg: 63.0,
      activityLevel: "licht",
      primaryGoal: "fit_blijven",
      experienceLevel: "beginner",
      strengthDaysPerWeek: 2,
      cardioDaysPerWeek: 3,
      availableEquipment: ["dumbbell", "lichaamsgewicht"],
      unitPreference: "metric",
      formulaPreference: "mifflin_st_jeor",
      onboardingCompleted: true,
    };
    await realRepos.profile.upsertProfile(realUserData);

    // Sla ook een echte cardiosessie op
    const realCardioSession: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T08:00:00Z",
      endTime: "2026-10-02T08:30:00Z",
      activityType: "hardlopen",
      distanceMeters: 4200,
      durationSeconds: 1500,
      avgHeartRateBpm: 150,
      maxHeartRateBpm: 165,
      estimatedCaloriesBurned: 310,
      elevationGainMeters: 10,
      rpe: 6,
      notes: "Mijn eerste echte run",
      provenance: { source: "user" },
    };
    await realRepos.cardio.save(realCardioSession);

    // 2. Open en seed de demo database
    await seedDemoDatabase(demoDb);

    // In demo zien we Alex en 72.5 km cardio
    const demoProfile = await demoRepos.profile.getCurrentProfile();
    expect(demoProfile?.name).toBe("Alex (Voorbeeld)");
    const demoCardio = await demoRepos.cardio.getAll();
    expect(demoCardio.length).toBe(6);

    // 3. Sluit demo (ga terug naar echte DB)
    // Echte gegevens zijn 100% exact hetzelfde gebleven
    const verifiedRealProfile = await realRepos.profile.getCurrentProfile();
    expect(verifiedRealProfile?.name).toBe("Echte Gebruiker");
    expect(verifiedRealProfile?.startWeightKg).toBe(65.0);

    const verifiedRealCardio = await realRepos.cardio.getAll();
    expect(verifiedRealCardio.length).toBe(1);
    expect(verifiedRealCardio[0].distanceMeters).toBe(4200);
    expect(verifiedRealCardio[0].notes).toBe("Mijn eerste echte run");
  });

  it("voert demo-reset uit zonder enige invloed op echte records", async () => {
    const realRepos = createRepositories(realDb);
    const demoRepos = createRepositories(demoDb);

    // Sla echte gebruikersdata op
    await realRepos.profile.upsertProfile({
      name: "Kees",
      birthDate: null,
      gender: "man",
      heightMeters: 1.80,
      startWeightKg: 85.0,
      targetWeightKg: null,
      activityLevel: "gemiddeld",
      primaryGoal: "kracht",
      experienceLevel: "gemiddeld",
      strengthDaysPerWeek: 3,
      cardioDaysPerWeek: 1,
      availableEquipment: ["barbell"],
      unitPreference: "metric",
      formulaPreference: "mifflin_st_jeor",
      onboardingCompleted: true,
    });

    // Seed demodatabase
    await seedDemoDatabase(demoDb);

    // Wijzig demodata (voeg extra nep-workout toe)
    const customDemoWorkoutId = crypto.randomUUID();
    const customDemoWorkout: WorkoutSession = {
      id: customDemoWorkoutId,
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T10:00:00Z",
      endTime: "2026-10-02T11:00:00Z",
      status: "afgerond",
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot: { routineName: "Extra Aangepaste Demotraining", exercises: [] },
      overallRpe: 7,
      notes: "Extra toegevoegd tijdens testen van demomodus",
      provenance: { source: "demo", isDemo: true },
    };
    await demoRepos.workout.sessions.save(customDemoWorkout);
    expect(await demoDb.workoutSessions.count()).toBe(14); // 13 + 1

    // Voer demo reset uit
    await resetDemoDatabase(demoDb);

    // Demodata is hersteld naar de 13 oorspronkelijke sessies
    expect(await demoDb.workoutSessions.count()).toBe(13);
    const reloadedExtra = await demoRepos.workout.sessions.getById(customDemoWorkoutId);
    expect(reloadedExtra).toBeNull();

    // Echte data van Kees is 100% onaangetast gebleven
    const reloadedKees = await realRepos.profile.getCurrentProfile();
    expect(reloadedKees?.name).toBe("Kees");
    expect(reloadedKees?.startWeightKg).toBe(85.0);
    expect(await realDb.workoutSessions.count()).toBe(0);
  });
});
