import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import {
  runDatabaseIntegrityCheck,
  repairOrphanedWorkoutSets,
} from "./integrityCheck";
import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
} from "@/types/database";

describe("Domain: integrityCheck", () => {
  let db: SportKompasDatabase;
  const testDbName = "SportKompasTest_IntegrityUnit_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("geeft status 'gezond' en healthScore 100 voor een consistente database", async () => {
    // Voeg geldige oefening, sessie en set toe
    const exerciseId = crypto.randomUUID();
    const exercise: Exercise = {
      id: exerciseId,
      name: "Dumbbell Curl",
      category: "kracht",
      primaryMuscleGroup: "armen",
      secondaryMuscleGroups: [],
      equipment: "dumbbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Gecontroleerd curlen",
      provenance: { source: "user" },
      createdAt: "2026-10-01T08:00:00.000Z",
    };
    await db.exercises.put(exercise);

    const sessionId = crypto.randomUUID();
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
      notes: "Lekker getraind",
      provenance: { source: "user" },
    };
    await db.workoutSessions.put(session);

    const set: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId,
      exerciseId,
      setNumber: 1,
      setType: "normal",
      weightKg: 14,
      reps: 12,
      completed: true,
      restTimeSeconds: 60,
      targetRpe: 8,
      actualRpe: 8,
      loggedAt: "2026-10-10T10:15:00.000Z",
    };
    await db.workoutSets.put(set);

    const report = await runDatabaseIntegrityCheck(db);

    expect(report.status).toBe("gezond");
    expect(report.healthScore).toBe(100);
    expect(report.summary.errorsCount).toBe(0);
    expect(report.summary.warningsCount).toBe(0);
    expect(report.schemaVersion).toBe(7);
    expect(report.totalRecords).toBe(3);
  });

  it("detecteert wees-sets en ongeldige datums als kritieke fouten", async () => {
    // 1. Voeg een wees-set toe (sessionId bestaat niet)
    const orphanSet: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: "niet-bestaande-sessie",
      exerciseId: "onbekende-oefening",
      setNumber: 1,
      setType: "normal",
      weightKg: 50,
      reps: 10,
      completed: true,
      restTimeSeconds: 60,
      targetRpe: null,
      actualRpe: null,
      loggedAt: "2026-10-10T10:15:00.000Z",
    };
    await db.workoutSets.put(orphanSet);

    // 2. Voeg een cardio-sessie toe met een ongeldige datum
    const badCardio: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "ongeldige-datum",
      startTime: "2026-10-10T10:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 5000,
      durationSeconds: 1800,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 300,
      elevationGainMeters: null,
      rpe: null,
      notes: "",
      provenance: { source: "user" },
    };
    await db.cardioSessions.put(badCardio);

    const report = await runDatabaseIntegrityCheck(db);

    expect(report.status).toBe("beschadigd");
    expect(report.healthScore).toBeLessThan(100);
    expect(report.summary.errorsCount).toBeGreaterThanOrEqual(2);

    const errorTables = report.issues.filter((i) => i.severity === "error").map((i) => i.table);
    expect(errorTables).toContain("workoutSets");
    expect(errorTables).toContain("cardioSessions");
  });

  it("kan wees-sets veilig repareren via repairOrphanedWorkoutSets", async () => {
    const orphanSet: WorkoutSet = {
      id: "wees-set-1",
      sessionId: "onbekende-sessie-id",
      exerciseId: "ex-1",
      setNumber: 1,
      setType: "normal",
      weightKg: 50,
      reps: 10,
      completed: true,
      restTimeSeconds: 60,
      targetRpe: null,
      actualRpe: null,
      loggedAt: "2026-10-10T10:15:00.000Z",
    };
    await db.workoutSets.put(orphanSet);

    const preReport = await runDatabaseIntegrityCheck(db);
    expect(preReport.summary.errorsCount).toBe(1);

    const repairRes = await repairOrphanedWorkoutSets(db);
    expect(repairRes.repairedCount).toBe(1);

    const postReport = await runDatabaseIntegrityCheck(db);
    expect(postReport.summary.errorsCount).toBe(0);
    expect(postReport.status).toBe("gezond");
  });
});

