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
import {
  calculateProgressiveOverload,
  type ProgressiveOverloadSuggestion,
} from "@/domain/strength/progressiveOverload";

describe("Stap 15 — Progressieve Overload & Dubbele Progressie (Integratietests)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-step15-progressive-overload";

  let benchPress: Exercise;
  let dumbbellCurl: Exercise;
  let assistedPullup: Exercise;

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

    dumbbellCurl = await repos.exercises.save({
      id: crypto.randomUUID(),
      name: "Dumbbell Bicep Curl",
      category: "kracht",
      primaryMuscleGroup: "armen",
      secondaryMuscleGroups: [],
      equipment: "dumbbell",
      measurementType: "gewicht_herhalingen",
      isCustom: true,
      isArchived: false,
      instructions: "Dumbbell curls",
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
    });

    assistedPullup = await repos.exercises.save({
      id: crypto.randomUUID(),
      name: "Assisted Pull-up",
      category: "kracht",
      primaryMuscleGroup: "rug",
      secondaryMuscleGroups: ["armen"],
      equipment: "machine",
      measurementType: "assisted",
      isCustom: true,
      isArchived: false,
      instructions: "Assisted pull-ups",
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
    });
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
      routineName: "Borst & Armen",
      exercises: [
        {
          exerciseId: benchPress.id,
          exerciseName: benchPress.name,
          measurementType: benchPress.measurementType,
          primaryMuscleGroup: benchPress.primaryMuscleGroup,
          targetSets: 3,
          restSeconds: 90,
        },
      ],
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

  it("geeft 'insufficient_data' wanneer er nog geen eerdere afgeronde sessie bestaat", async () => {
    const suggestion = await repos.workout.getProgressionSuggestion(benchPress.id, {
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: 80,
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.action).toBe("insufficient_data");
    expect(suggestion?.isReadyForIncrease).toBe(false);
    expect(suggestion?.rationale).toContain("Er zijn nog geen eerdere afgeronde werksets");
    expect(suggestion?.disclaimer).toContain("indicatieve richtlijn");
  });

  it("stelt gewichtsverhoging voor wanneer alle werksets de max reps haalden (Double Progression)", async () => {
    // Vorige sessie met 3 sets van 80 kg × 12 reps (bovengrens)
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session);

    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 80,
      reps: 12,
    });
    const set2 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 2,
      weightKg: 80,
      reps: 12,
    });
    const set3 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 3,
      weightKg: 80,
      reps: 12,
    });

    await repos.workout.saveWorkoutSet(set1);
    await repos.workout.saveWorkoutSet(set2);
    await repos.workout.saveWorkoutSet(set3);

    const suggestion = await repos.workout.getProgressionSuggestion(benchPress.id, {
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: 80,
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.action).toBe("increase_weight");
    expect(suggestion?.isReadyForIncrease).toBe(true);
    expect(suggestion?.currentWeightKg).toBe(80);
    // Barbell standaard stap is +2.5 kg
    expect(suggestion?.suggestedWeightKg).toBe(82.5);
    expect(suggestion?.weightChangeKg).toBe(2.5);
    // Reps resetten naar ondergrens (8)
    expect(suggestion?.suggestedRepsMin).toBe(8);
    expect(suggestion?.rationale).toContain("bovengrens");
  });

  it("stelt voor om herhalingen uit te bouwen wanneer nog niet alle sets de bovengrens hebben bereikt", async () => {
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session);

    // Set 1 haalde 12, maar set 2 haalde 10 en set 3 haalde 9
    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 80,
      reps: 12,
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
      reps: 9,
    });

    await repos.workout.saveWorkoutSet(set1);
    await repos.workout.saveWorkoutSet(set2);
    await repos.workout.saveWorkoutSet(set3);

    const suggestion = await repos.workout.getProgressionSuggestion(benchPress.id, {
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: 80,
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.action).toBe("increase_reps");
    expect(suggestion?.actionLabel).toBe("Herhalingen opbouwen");
    expect(suggestion?.isReadyForIncrease).toBe(false);
    expect(suggestion?.suggestedWeightKg).toBe(80); // Geen gewichtsverhoging
    expect(suggestion?.weightChangeKg).toBe(0);
    expect(suggestion?.rationale).toContain("Probeer eerst alle sets uit te bouwen");
  });

  it("stelt voor om te consolideren (maintain_weight) bij te hoge RPE ondanks gehaalde reps", async () => {
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session);

    // 3 sets van 12 reps, maar de werkelijke RPE was 10 (absolute failure) terwijl doel 8 was
    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 80,
      reps: 12,
      actualRpe: 9.5,
    });
    const set2 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 2,
      weightKg: 80,
      reps: 12,
      actualRpe: 10,
    });
    const set3 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 3,
      weightKg: 80,
      reps: 12,
      actualRpe: 10,
    });

    await repos.workout.saveWorkoutSet(set1);
    await repos.workout.saveWorkoutSet(set2);
    await repos.workout.saveWorkoutSet(set3);

    const suggestion = await repos.workout.getProgressionSuggestion(benchPress.id, {
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 12,
      targetWeightKg: 80,
      targetRpe: 8,
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.action).toBe("maintain_weight");
    expect(suggestion?.isReadyForIncrease).toBe(false);
    expect(suggestion?.suggestedWeightKg).toBe(80);
    expect(suggestion?.rpeContext).toContain("Gemiddelde RPE 9.8 vs doel RPE 8");
    expect(suggestion?.rationale).toContain("behoud 80 kg");
  });

  it("stelt omgekeerde progressie (minder tegengewicht) voor bij Assisted machines", async () => {
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session);

    // Assisted pull-up met 30 kg tegengewicht: 3 sets van 10 reps (max reps gehaald)
    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: assistedPullup.id,
      setNumber: 1,
      weightKg: 30,
      reps: 10,
    });
    const set2 = createMockSet({
      sessionId: session.id,
      exerciseId: assistedPullup.id,
      setNumber: 2,
      weightKg: 30,
      reps: 10,
    });
    const set3 = createMockSet({
      sessionId: session.id,
      exerciseId: assistedPullup.id,
      setNumber: 3,
      weightKg: 30,
      reps: 10,
    });

    await repos.workout.saveWorkoutSet(set1);
    await repos.workout.saveWorkoutSet(set2);
    await repos.workout.saveWorkoutSet(set3);

    const suggestion = await repos.workout.getProgressionSuggestion(assistedPullup.id, {
      targetSets: 3,
      targetRepsMin: 6,
      targetRepsMax: 10,
      targetWeightKg: 30,
    });

    expect(suggestion).not.toBeNull();
    expect(suggestion?.action).toBe("reduce_assistance");
    expect(suggestion?.isReadyForIncrease).toBe(true);
    // 30 kg - 2.5 kg tegengewicht = 27.5 kg
    expect(suggestion?.suggestedWeightKg).toBe(27.5);
    expect(suggestion?.weightChangeKg).toBe(-2.5);
    expect(suggestion?.rationale).toContain("verminder de machinehulp met 2.5 kg naar 27.5 kg");
  });

  it("ondersteunt custom equipment stappen zoals microloading (bv. +1.25 kg)", async () => {
    const session = createMockSession({
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session);

    const set1 = createMockSet({
      sessionId: session.id,
      exerciseId: benchPress.id,
      setNumber: 1,
      weightKg: 100,
      reps: 5,
    });
    await repos.workout.saveWorkoutSet(set1);

    // Microloading override: 1.25 kg
    const suggestion = await repos.workout.getProgressionSuggestion(
      benchPress.id,
      {
        targetSets: 1,
        targetRepsMin: 3,
        targetRepsMax: 5,
        targetWeightKg: 100,
      },
      1.25
    );

    expect(suggestion).not.toBeNull();
    expect(suggestion?.action).toBe("increase_weight");
    expect(suggestion?.suggestedWeightKg).toBe(101.25);
    expect(suggestion?.weightChangeKg).toBe(1.25);
  });
});
