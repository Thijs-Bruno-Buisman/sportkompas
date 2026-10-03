import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import type {
  Exercise,
  WorkoutSession,
  WorkoutSet,
} from "@/types/database";
import Dexie from "dexie";

describe("Stap 16 — Spiergroepen Volume & Wekelijkse Consistentie (Integratietests)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-step16-muscle-volume";

  let benchPress: Exercise;
  let squat: Exercise;

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);

    await repos.exercises.ensureDefaultExercises();
    const allEx = await repos.exercises.getAll();

    benchPress = allEx.find(
      (e) =>
        e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001" ||
        e.name.toLowerCase().includes("bankdrukken")
    )!;

    squat = allEx.find(
      (e) =>
        e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e002" ||
        e.name.toLowerCase().includes("squat")
    )!;
  });

  afterEach(async () => {
    if (db.isOpen()) {
      await db.close();
    }
    await Dexie.delete(testDbName);
  });

  const createMockSession = (
    overrides: Partial<WorkoutSession> & { id: string; calendarDate: string }
  ): WorkoutSession => ({
    startTime: `${overrides.calendarDate}T10:00:00Z`,
    endTime: `${overrides.calendarDate}T11:00:00Z`,
    status: "afgerond",
    currentExerciseIndex: 0,
    activeExerciseId: null,
    routineId: null,
    routineDayId: null,
    routineVersion: null,
    snapshot: {
      routineName: "Workout Test",
      exercises: [],
    },
    overallRpe: null,
    notes: "",
    provenance: { source: "user" },
    ...overrides,
  });

  const createMockSet = (
    overrides: Partial<WorkoutSet> & {
      sessionId: string;
      exerciseId: string;
      setNumber: number;
    }
  ): WorkoutSet => ({
    id: crypto.randomUUID(),
    setType: "normal",
    weightKg: 0,
    reps: 0,
    targetRpe: null,
    actualRpe: null,
    restTimeSeconds: 90,
    completed: true,
    loggedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    ...overrides,
  });

  it("berekent weekvolume met gescheiden primaire en secundaire spiergroepen", async () => {
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-05", // Maandag
    });
    await repos.workout.sessions.save(session);

    // 3 sets bankdrukken (primair = borst; secundair = schouders, armen)
    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 80,
      reps: 10,
    });
    const set2 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 2,
      weightKg: 80,
      reps: 10,
    });
    const set3 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 3,
      weightKg: 80,
      reps: 10,
    });

    await repos.workout.saveWorkoutSet(set1);
    await repos.workout.saveWorkoutSet(set2);
    await repos.workout.saveWorkoutSet(set3);

    const report = await repos.workout.getWeeklyMuscleVolume("2026-10-05", "maandag");

    expect(report.totalCompletedWorksets).toBe(3);
    expect(report.totalTonnageKg).toBe(2400);

    // Borst = 3 directe sets
    expect(report.muscleGroups.borst.primarySets).toBe(3);
    expect(report.muscleGroups.borst.secondarySets).toBe(0);
    expect(report.muscleGroups.borst.fractionalTotalSets).toBe(3);

    // Schouders & Armen = indirecte hulpspieren (0.5x per set = 1.5 fractioneel)
    expect(report.muscleGroups.schouders.primarySets).toBe(0);
    expect(report.muscleGroups.schouders.secondarySets).toBe(3);
    expect(report.muscleGroups.schouders.fractionalTotalSets).toBe(1.5);

    expect(report.muscleGroups.armen.primarySets).toBe(0);
    expect(report.muscleGroups.armen.secondarySets).toBe(3);
    expect(report.muscleGroups.armen.fractionalTotalSets).toBe(1.5);

    // Telmethode toelichting aanwezig
    expect(report.countingMethodDescription).toContain("Primaire spiergroepen tellen als 1,0 set");
    expect(report.disclaimer).toContain("voorkomt op zichzelf geen overtraining");
  });

  it("sluit warming-up sets en incomplete sets uit van het spiergroepsvolume", async () => {
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-06",
    });
    await repos.workout.sessions.save(session);

    const warmup = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 40,
      reps: 15,
      setType: "warmup",
    });
    const incomplete = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 2,
      weightKg: 80,
      reps: 0,
      completed: false,
    });
    const workset = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 3,
      weightKg: 80,
      reps: 10,
      completed: true,
    });

    await repos.workout.saveWorkoutSet(warmup);
    await repos.workout.saveWorkoutSet(incomplete);
    await repos.workout.saveWorkoutSet(workset);

    const report = await repos.workout.getWeeklyMuscleVolume("2026-10-05", "maandag");

    expect(report.totalCompletedWorksets).toBe(1);
    expect(report.muscleGroups.borst.primarySets).toBe(1);
  });

  it("werkt totalen direct bij wanneer een sessie wordt verwijderd (data-integriteit)", async () => {
    const sessionId = crypto.randomUUID();
    const session = createMockSession({
      id: sessionId,
      calendarDate: "2026-10-05",
    });
    await repos.workout.sessions.save(session);

    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: squat.id,
      setNumber: 1,
      weightKg: 100,
      reps: 5,
    });
    await repos.workout.saveWorkoutSet(set1);

    const beforeDelete = await repos.workout.getWeeklyMuscleVolume("2026-10-05", "maandag");
    expect(beforeDelete.totalCompletedWorksets).toBe(1);
    expect(beforeDelete.muscleGroups.benen.primarySets).toBe(1);

    // Verwijder de sessie veilig
    await repos.workout.deleteCompletedSession(sessionId);

    const afterDelete = await repos.workout.getWeeklyMuscleVolume("2026-10-05", "maandag");
    expect(afterDelete.totalCompletedWorksets).toBe(0);
    expect(afterDelete.muscleGroups.benen.primarySets).toBe(0);
    expect(afterDelete.totalTonnageKg).toBe(0);
  });

  it("berekent consistentie t.o.v. ingesteld weekdoel met rustdagen als herstel", async () => {
    // Stel weekdoel in op 3
    await repos.settings.setWeeklyWorkoutGoal(3);
    const goal = await repos.settings.getWeeklyWorkoutGoal();
    expect(goal).toBe(3);

    // Maandag, Woensdag, Vrijdag trainingen
    const s1 = createMockSession({ id: crypto.randomUUID(), calendarDate: "2026-10-05" });
    const s2 = createMockSession({ id: crypto.randomUUID(), calendarDate: "2026-10-07" });
    const s3 = createMockSession({ id: crypto.randomUUID(), calendarDate: "2026-10-09" });

    await repos.workout.sessions.save(s1);
    await repos.workout.sessions.save(s2);
    await repos.workout.sessions.save(s3);

    const consistency = await repos.workout.getWeeklyConsistency(
      1,
      "2026-10-10", // Zaterdag
      "maandag"
    );

    expect(consistency.weeklyGoal).toBe(3);
    expect(consistency.currentWeek.completedWorkoutsCount).toBe(3);
    expect(consistency.currentWeek.isGoalMet).toBe(true);

    // Controleer dat rustdagen als herstellend gemarkeerd zijn en niet als falen
    const days = consistency.currentWeek.days;
    const tuesday = days[1];
    expect(tuesday.isWorkoutDay).toBe(false);
    expect(tuesday.isRestDay).toBe(true);
    expect(consistency.disclaimer).toContain("Rustdagen zijn essentieel voor herstel en tellen nooit als falen");
  });

  it("verwerkt de jaar- en maandgrens correct (bv. 31 december naar 1 januari)", async () => {
    const sOldYear = createMockSession({ id: crypto.randomUUID(), calendarDate: "2026-12-31" });
    const sNewYear = createMockSession({ id: crypto.randomUUID(), calendarDate: "2027-01-01" });

    await repos.workout.sessions.save(sOldYear);
    await repos.workout.sessions.save(sNewYear);

    const set1 = createMockSet({
      sessionId: sOldYear.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 80,
      reps: 10,
    });
    const set2 = createMockSet({
      sessionId: sNewYear.id,
      exerciseId: squat.id,
      setNumber: 1,
      weightKg: 100,
      reps: 5,
    });

    await repos.workout.saveWorkoutSet(set1);
    await repos.workout.saveWorkoutSet(set2);

    const report = await repos.workout.getWeeklyMuscleVolume("2026-12-28", "maandag");

    expect(report.totalCompletedWorksets).toBe(2);
    expect(report.muscleGroups.borst.primarySets).toBe(1);
    expect(report.muscleGroups.benen.primarySets).toBe(1);
    expect(report.weekStartDate).toBe("2026-12-28");
    expect(report.weekEndDate).toBe("2027-01-03");
  });
});
