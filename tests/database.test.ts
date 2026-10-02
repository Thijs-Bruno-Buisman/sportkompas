import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { ValidationError } from "@/lib/db/errors";
import { checkStorageCapacity } from "@/lib/db/capacity";

describe("IndexedDB & Repository Layer (SportKompas)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestSportKompasDB";

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  describe("1. Typed CRUD & Canonieke eenheden", () => {
    it("slaagt in opslaan en ophalen van een gebruikersprofiel in canonieke eenheden", async () => {
      const profile = await repos.profile.upsertProfile({
        name: "Thijs",
        birthDate: "1998-05-14",
        gender: "man",
        heightMeters: 1.84, // 184 cm in meters
        startWeightKg: 82.5, // kg
        targetWeightKg: 78.0,
        activityLevel: "gemiddeld",
        primaryGoal: "kracht",
        experienceLevel: "gevorderd",
        strengthDaysPerWeek: 4,
        cardioDaysPerWeek: 2,
        availableEquipment: ["barbell", "dumbbell"],
        unitPreference: "metric",
        formulaPreference: "mifflin_st_jeor",
        onboardingCompleted: true,
      });

      expect(profile.id).toBeDefined();
      expect(profile.name).toBe("Thijs");
      expect(profile.heightMeters).toBe(1.84);
      expect(profile.startWeightKg).toBe(82.5);

      const fetched = await repos.profile.getCurrentProfile();
      expect(fetched).not.toBeNull();
      expect(fetched?.name).toBe("Thijs");
      expect(fetched?.startWeightKg).toBe(82.5);
    });

    it("slaagt in opslaan van cardio met afstand in meters en duur in seconden", async () => {
      const cardio = await repos.cardio.save({
        id: crypto.randomUUID(),
        calendarDate: "2026-10-02",
        startTime: "2026-10-02T08:00:00.000Z",
        endTime: "2026-10-02T08:35:00.000Z",
        activityType: "hardlopen",
        distanceMeters: 6200, // 6.2 km
        durationSeconds: 2100, // 35 min
        avgHeartRateBpm: 154,
        maxHeartRateBpm: 172,
        estimatedCaloriesBurned: 450,
        elevationGainMeters: 35,
        rpe: 7,
        notes: "Mooie ochtendloop",
        provenance: { source: "user" },
      });

      expect(cardio.distanceMeters).toBe(6200);
      expect(cardio.durationSeconds).toBe(2100);

      const list = await repos.cardio.getSessionsByDate("2026-10-02");
      expect(list.length).toBe(1);
      expect(list[0].distanceMeters).toBe(6200);
    });

    it("slaagt in het loggen van water en berekent het dagtotaal accuraat", async () => {
      await repos.nutrition.logWater("2026-10-02", 250);
      await repos.nutrition.logWater("2026-10-02", 500);
      await repos.nutrition.logWater("2026-10-02", 250);

      const totalMl = await repos.nutrition.getTotalWaterMlByDate("2026-10-02");
      expect(totalMl).toBe(1000);
    });
  });

  describe("2. Persistentie na herladen (Simulatie heropenen database)", () => {
    it("behoudt data na het sluiten en heropenen van de databaseverbinding", async () => {
      const exerciseId = crypto.randomUUID();
      await repos.exercises.save({
        id: exerciseId,
        name: "Incline Barbell Bench Press",
        alternativeNames: [],
        category: "kracht",
        primaryMuscleGroup: "borst",
        secondaryMuscleGroups: ["schouders", "armen"],
        equipment: "barbell",
        measurementType: "gewicht_herhalingen",
        isCustom: false,
        isArchived: false,
        instructions: "Stel de bank in op circa 30 graden.",
        provenance: { source: "system" },
        createdAt: new Date().toISOString(),
      });

      // Sluit huidige verbinding (simuleert page reload of browser restart)
      db.close();

      // Heropen nieuwe instantie op exact dezelfde databasenaam
      const reloadedDb = new SportKompasDatabase(testDbName);
      const reloadedRepos = createRepositories(reloadedDb);
      await reloadedDb.open();

      const exercise = await reloadedRepos.exercises.getById(exerciseId);
      expect(exercise).not.toBeNull();
      expect(exercise?.name).toBe("Incline Barbell Bench Press");
      expect(exercise?.primaryMuscleGroup).toBe("borst");

      reloadedDb.close();
    });
  });

  describe("3. Workout Snapshotting (Onveranderlijke geschiedenis)", () => {
    it("bevriest de routine in een snapshot zodat latere schemawijzigingen voltooide sessies niet veranderen", async () => {
      const routineId = crypto.randomUUID();
      const routineDayId = crypto.randomUUID();
      const exerciseId = crypto.randomUUID();

      const originalRoutine = await repos.workout.routines.save({
        id: routineId,
        name: "Origineel Push Schema",
        description: "Versie 1",
        version: 1,
        isActive: true,
        provenance: { source: "user" },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const originalDay = await repos.workout.routineDays.save({
        id: routineDayId,
        routineId,
        dayIndex: 1,
        name: "Push Dag",
        plannedExercises: [
          {
            exerciseId,
            exerciseName: "Bench Press",
            targetSets: 4,
            targetRepsMin: 8,
            targetRepsMax: 10,
            restSeconds: 120,
          },
        ],
        createdAt: new Date().toISOString(),
      });

      // Start sessie met snapshot
      const session = await repos.workout.startSessionWithSnapshot({
        calendarDate: "2026-10-02",
        routine: originalRoutine,
        routineDay: originalDay,
      });

      expect(session.snapshot.routineName).toBe("Origineel Push Schema");
      expect(session.snapshot.exercises.length).toBe(1);
      expect(session.snapshot.exercises[0].exerciseName).toBe("Bench Press");

      // Pas naderhand de routine en de schemadag aan (bv. andere oefening en naam)
      await repos.workout.routines.save({
        ...originalRoutine,
        name: "Gewijzigd Push Schema v2",
        version: 2,
      });

      await repos.workout.routineDays.save({
        ...originalDay,
        name: "Gewijzigde Push Dag",
        plannedExercises: [
          {
            exerciseId: crypto.randomUUID(),
            exerciseName: "Dumbbell Shoulder Press",
            targetSets: 3,
            targetRepsMin: 12,
            targetRepsMax: 15,
            restSeconds: 90,
          },
        ],
      });

      // Verifieer dat de opgeslagen workout-sessie ONGEWIJZIGD is gebleven
      const fetchedSession = await repos.workout.sessions.getById(session.id);
      expect(fetchedSession?.snapshot.routineName).toBe("Origineel Push Schema");
      expect(fetchedSession?.snapshot.exercises[0].exerciseName).toBe("Bench Press");
      expect(fetchedSession?.snapshot.exercises[0].targetSets).toBe(4);
    });
  });

  describe("4. Database Versiemigratie (Upgrade v1 naar v2 zonder dataverlies)", () => {
    it("upgradeert een v1 database naar v2 en verrijkt records zonder dataverlies", async () => {
      const migrationDbName = "MigrationTestDB";
      await Dexie.delete(migrationDbName);

      // Simuleer een v1 database met een oudere Dexie instantie
      const legacyDb = new Dexie(migrationDbName);
      legacyDb.version(1).stores({
        exercises: "id, name, category",
        workoutSessions: "id, calendarDate",
      });
      await legacyDb.open();

      const exerciseId = crypto.randomUUID();
      const sessionId = crypto.randomUUID();

      // Sla records op in v1 (zonder provenance of snapshot)
      await legacyDb.table("exercises").put({
        id: exerciseId,
        name: "Oude Squat Oefening",
        category: "kracht",
      });

      await legacyDb.table("workoutSessions").put({
        id: sessionId,
        calendarDate: "2026-09-01",
      });

      legacyDb.close();

      // Open nu met de officiële SportKompasDatabase (die versie 2 definieert met upgrade-stap)
      const modernDb = new SportKompasDatabase(migrationDbName);
      await modernDb.open();

      expect(modernDb.verno).toBe(3);

      // Controleer dat de oude data behouden is en correct gemigreerd via v2 en v3
      const migratedExercise = await modernDb.exercises.get(exerciseId);
      expect(migratedExercise).toBeDefined();
      expect(migratedExercise?.name).toBe("Oude Squat Oefening");
      expect(migratedExercise?.provenance).toEqual({ source: "system" });
      expect(migratedExercise?.isArchived).toBe(false);
      expect(migratedExercise?.measurementType).toBe("gewicht_herhalingen");

      const migratedSession = await modernDb.workoutSessions.get(sessionId);
      expect(migratedSession).toBeDefined();
      expect(migratedSession?.calendarDate).toBe("2026-09-01");
      expect(migratedSession?.provenance).toEqual({ source: "user" });
      expect(migratedSession?.snapshot).toEqual({ exercises: [] });

      modernDb.close();
      await Dexie.delete(migrationDbName);
    });
  });

  describe("5. Zod Validatie & Foutafhandeling", () => {
    it("weigert ongeldige records met een duidelijke ValidationError", async () => {
      const invalidProfile: any = {
        id: "geen-geldige-uuid",
        name: "",
        birthDate: "ongeldig",
        gender: "onbekend-geslacht",
        heightMeters: -1,
        startWeightKg: -10,
        activityLevel: "extreem",
      };

      await expect(repos.profile.save(invalidProfile)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe("6. Opslagcapaciteit Bewaking", () => {
    it("geeft een veilige fallback terug in omgevingen zonder navigator.storage", async () => {
      const estimate = await checkStorageCapacity();
      expect(estimate).toBeDefined();
      expect(typeof estimate.percentUsed).toBe("number");
      expect(typeof estimate.isLowCapacity).toBe("boolean");
    });
  });
});
