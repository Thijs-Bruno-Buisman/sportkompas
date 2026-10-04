import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import {
  runDatabaseIntegrityCheck,
  repairOrphanedWorkoutSets,
} from "@/domain/integrity/integrityCheck";
import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  WorkoutRoutine,
  RoutineDay,
  CardioSession,
  BodyMeasurement,
} from "@/types/database";

describe("Database Integrity Integration (Stap 39 / Prompt 33)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "SportKompasTest_IntegrityInteg_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("bevestigt 100% integriteit bij consistente data en herstelt wees-records bij inconsistenties", async () => {
    // 1. Bouw een consistente relationele datastructuur
    const profileId = crypto.randomUUID();
    await repos.profile.save({
      id: profileId,
      name: "Integriteit Tester",
      birthDate: "1994-06-15",
      gender: "man",
      heightMeters: 1.84,
      startWeightKg: 82.0,
      targetWeightKg: 80.0,
      activityLevel: "gemiddeld",
      primaryGoal: "kracht",
      experienceLevel: "gevorderd",
      strengthDaysPerWeek: 4,
      cardioDaysPerWeek: 2,
      availableEquipment: ["barbell", "dumbbell"],
      unitPreference: "metric",
      formulaPreference: "mifflin_st_jeor",
      onboardingCompleted: true,
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    });

    const routineId = crypto.randomUUID();
    const routine: WorkoutRoutine = {
      id: routineId,
      name: "Upper Lower Split",
      description: "4-daagse split",
      version: 1,
      isActive: true,
      isArchived: false,
      provenance: { source: "user" },
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    };
    await db.workoutRoutines.put(routine);

    const routineDayId = crypto.randomUUID();
    const routineDay: RoutineDay = {
      id: routineDayId,
      routineId,
      dayIndex: 1,
      name: "Upper Body Power",
      plannedExercises: [],
      createdAt: "2026-10-01T08:00:00.000Z",
    };
    await db.routineDays.put(routineDay);

    const exerciseId = crypto.randomUUID();
    const exercise: Exercise = {
      id: exerciseId,
      name: "Incline Dumbbell Press",
      category: "kracht",
      primaryMuscleGroup: "borst",
      secondaryMuscleGroups: ["schouders", "armen"],
      equipment: "dumbbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Bankje op 30 graden",
      provenance: { source: "user" },
      createdAt: "2026-10-01T08:00:00.000Z",
    };
    await db.exercises.put(exercise);

    const sessionId = crypto.randomUUID();
    const session: WorkoutSession = {
      id: sessionId,
      calendarDate: "2026-10-15",
      startTime: "2026-10-15T18:00:00.000Z",
      endTime: "2026-10-15T19:00:00.000Z",
      status: "afgerond",
      routineId,
      routineDayId,
      routineVersion: 1,
      snapshot: {
        routineName: "Upper Lower Split",
        exercises: [
          {
            exerciseId,
            exerciseName: "Incline Dumbbell Press",
            primaryMuscleGroup: "borst",
            targetSets: 3,
            restSeconds: 90,
          },
        ],
      },
      overallRpe: 8,
      notes: "Sterke training",
      provenance: { source: "user" },
    };
    await db.workoutSessions.put(session);

    const set: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId,
      exerciseId,
      setNumber: 1,
      setType: "normal",
      weightKg: 32,
      reps: 10,
      completed: true,
      restTimeSeconds: 90,
      targetRpe: 8,
      actualRpe: 8,
      loggedAt: "2026-10-15T18:15:00.000Z",
    };
    await db.workoutSets.put(set);

    // Initial check: moet 100% gezond zijn
    const cleanReport = await runDatabaseIntegrityCheck(db);
    expect(cleanReport.status).toBe("gezond");
    expect(cleanReport.healthScore).toBe(100);
    expect(cleanReport.summary.errorsCount).toBe(0);
    expect(cleanReport.schemaVersion).toBe(7);
    expect(cleanReport.totalTables).toBe(17); // 17 geregistreerde domeintabellen

    // 2. Injecteer doelbewust referentiële fouten
    // a. Wees-set
    const orphanSetId = crypto.randomUUID();
    const orphanSet: WorkoutSet = {
      id: orphanSetId,
      sessionId: "onbekende-verwijderde-sessie",
      exerciseId,
      setNumber: 1,
      setType: "normal",
      weightKg: 20,
      reps: 10,
      completed: true,
      restTimeSeconds: 60,
      targetRpe: null,
      actualRpe: null,
      loggedAt: "2026-10-15T18:30:00.000Z",
    };
    await db.workoutSets.put(orphanSet);

    // b. Wees-schemadag
    const orphanDay: RoutineDay = {
      id: crypto.randomUUID(),
      routineId: "onbekend-schema",
      dayIndex: 2,
      name: "Verweesde Dag",
      plannedExercises: [],
      createdAt: "2026-10-01T08:00:00.000Z",
    };
    await db.routineDays.put(orphanDay);

    // c. Meting met onrealistisch gewicht (warning)
    const badMeasurement: BodyMeasurement = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-16",
      measuredAt: "2026-10-16T08:00:00.000Z",
      weightKg: 550, // onrealistisch > 400
      bodyFatPercentage: 15,
      chestMeters: null,
      waistMeters: null,
      hipsMeters: null,
      armsMeters: null,
      thighsMeters: null,
      notes: "Typfout test",
      provenance: { source: "user" },
    };
    await db.bodyMeasurements.put(badMeasurement);

    // Controleer integriteit na injectie
    const dirtyReport = await runDatabaseIntegrityCheck(db);
    expect(dirtyReport.status).toBe("beschadigd");
    expect(dirtyReport.healthScore).toBeLessThan(100);
    expect(dirtyReport.summary.errorsCount).toBeGreaterThanOrEqual(2);
    expect(dirtyReport.summary.warningsCount).toBeGreaterThanOrEqual(1);

    // 3. Test reparatie van wees-sets
    const repairResult = await repairOrphanedWorkoutSets(db);
    expect(repairResult.repairedCount).toBe(1);

    // Controleer dat de wees-set daadwerkelijk uit Dexie is verwijderd
    const checkedSet = await db.workoutSets.get(orphanSetId);
    expect(checkedSet).toBeUndefined();

    // Verwijder de test-wees-dag om database weer netjes te maken
    await db.routineDays.delete(orphanDay.id);
    await db.bodyMeasurements.delete(badMeasurement.id);

    const healedReport = await runDatabaseIntegrityCheck(db);
    expect(healedReport.status).toBe("gezond");
    expect(healedReport.summary.errorsCount).toBe(0);
    expect(healedReport.healthScore).toBe(100);
  });
});

