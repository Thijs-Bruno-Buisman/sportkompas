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
  calculateEligible1RM,
  detectSessionPRs,
  detectAllPRsAcrossHistory,
  getRecentAchievedPRs,
} from "@/domain/strength/personalRecords";

describe("Stap 14 — Persoonlijke Records en Geschatte 1RM (Integratietests)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-step14-prs";

  let benchPress: Exercise;
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
      routineName: "Workout",
      exercises: [
        {
          exerciseId: benchPress.id,
          exerciseName: benchPress.name,
          measurementType: benchPress.measurementType,
          primaryMuscleGroup: benchPress.primaryMuscleGroup,
          targetSets: 1,
          restSeconds: 90,
        },
      ],
    },
    overallRpe: null,
    notes: "",
    provenance: { source: "user" },
    createdAt: `${overrides.calendarDate}T10:00:00Z`,
    updatedAt: `${overrides.calendarDate}T11:00:00Z`,
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
    ...overrides,
  });

  it("beperkt 1RM schattingen strikt tot 1 t/m 10 herhalingen en geschikte meettypes", () => {
    // 1 rep = 100% (geen schatting)
    const oneRep = calculateEligible1RM(100, 1, "gewicht_herhalingen", "epley");
    expect(oneRep).not.toBeNull();
    expect(oneRep?.estimated1RMKg).toBe(100);

    // 8 reps = geldige Epley schatting
    const eightReps = calculateEligible1RM(100, 8, "gewicht_herhalingen", "epley");
    expect(eightReps).not.toBeNull();
    expect(eightReps?.estimated1RMKg).toBe(126.7);
    expect(eightReps?.formula).toBe("epley");

    // 10 reps = maximale grens
    const tenReps = calculateEligible1RM(100, 10, "gewicht_herhalingen", "epley");
    expect(tenReps).not.toBeNull();
    expect(tenReps?.estimated1RMKg).toBe(133.3);

    // 11 reps = buiten het wetenschappelijke rep-bereik (> 10 reps)
    const elevenReps = calculateEligible1RM(100, 11, "gewicht_herhalingen", "epley");
    expect(elevenReps).toBeNull();

    // 15 reps = buiten bereik
    const fifteenReps = calculateEligible1RM(100, 15, "gewicht_herhalingen", "epley");
    expect(fifteenReps).toBeNull();

    // Ongeldig meettype (bv. assisted of tijd) mag NOOIT een 1RM krijgen
    const assisted = calculateEligible1RM(30, 8, "assisted", "epley");
    expect(assisted).toBeNull();

    const tijd = calculateEligible1RM(60, 1, "tijd", "epley");
    expect(tijd).toBeNull();
  });

  it("kent geen PR toe bij gelijke prestatie (tie-bescherming)", async () => {
    const session1Id = crypto.randomUUID();
    const session1 = createMockSession({
      id: session1Id,
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session1);
    await repos.workout.sets.save(
      createMockSet({
        sessionId: session1Id,
        exerciseId: benchPress.id,
        setNumber: 1,
        weightKg: 80,
        reps: 8,
        actualRpe: 8,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      })
    );

    const prsSessie1 = await repos.workout.getSessionPRs(session1Id);
    expect(prsSessie1.length).toBeGreaterThan(0);
    const maxWeightPR1 = prsSessie1.find((p) => p.category === "max_weight");
    expect(maxWeightPR1?.value).toBe(80);

    // Sessie 2: Exact hetzelfde gewicht en reps (80 kg x 8 reps) -> TIE!
    const session2Id = crypto.randomUUID();
    const session2 = createMockSession({
      id: session2Id,
      calendarDate: "2026-10-03",
    });
    await repos.workout.sessions.save(session2);
    await repos.workout.sets.save(
      createMockSet({
        sessionId: session2Id,
        exerciseId: benchPress.id,
        setNumber: 1,
        weightKg: 80,
        reps: 8,
        actualRpe: 8,
        completed: true,
        loggedAt: "2026-10-03T10:05:00Z",
      })
    );

    // In sessie 2 mag GEEN enkel PR geclaimd worden omdat 80 kg x 8 al eerder behaald was
    const prsSessie2 = await repos.workout.getSessionPRs(session2Id);
    expect(prsSessie2.length).toBe(0);
  });

  it("geeft geen PR voor incomplete of overgeslagen sets", async () => {
    const session1Id = crypto.randomUUID();
    const session1 = createMockSession({
      id: session1Id,
      calendarDate: "2026-10-01",
    });
    await repos.workout.sessions.save(session1);

    // Set met 200 kg maar completed === false
    await repos.workout.sets.save(
      createMockSet({
        sessionId: session1Id,
        exerciseId: benchPress.id,
        setNumber: 1,
        weightKg: 200,
        reps: 5,
        completed: false, // NIET VOLTOOID
        loggedAt: "2026-10-01T10:05:00Z",
      })
    );

    const prs = await repos.workout.getSessionPRs(session1Id);
    expect(prs.length).toBe(0);
  });

  it("ondersteunt omgekeerde progressie bij assisted oefeningen (minder tegengewicht = PR)", async () => {
    // Sessie 1: 30 kg hulp
    const s1Id = crypto.randomUUID();
    await repos.workout.sessions.save(
      createMockSession({
        id: s1Id,
        calendarDate: "2026-10-01",
      })
    );
    await repos.workout.sets.save(
      createMockSet({
        sessionId: s1Id,
        exerciseId: assistedPullup.id,
        setNumber: 1,
        weightKg: 30,
        reps: 6,
        isAssisted: true,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      })
    );

    const s1PRs = await repos.workout.getSessionPRs(s1Id);
    const leastAssist1 = s1PRs.find((p) => p.category === "least_assistance");
    expect(leastAssist1).toBeDefined();
    expect(leastAssist1?.value).toBe(30);

    // Sessie 2: 25 kg hulp (minder hulp = BETER!)
    const s2Id = crypto.randomUUID();
    await repos.workout.sessions.save(
      createMockSession({
        id: s2Id,
        calendarDate: "2026-10-03",
      })
    );
    await repos.workout.sets.save(
      createMockSet({
        sessionId: s2Id,
        exerciseId: assistedPullup.id,
        setNumber: 1,
        weightKg: 25,
        reps: 6,
        isAssisted: true,
        completed: true,
        loggedAt: "2026-10-03T10:05:00Z",
      })
    );

    const s2PRs = await repos.workout.getSessionPRs(s2Id);
    const leastAssist2 = s2PRs.find((p) => p.category === "least_assistance");
    expect(leastAssist2).toBeDefined();
    expect(leastAssist2?.value).toBe(25);
    expect(leastAssist2?.previousValue).toBe(30);

    // Sessie 3: 35 kg hulp (meer hulp = slechter, GEEN PR)
    const s3Id = crypto.randomUUID();
    await repos.workout.sessions.save(
      createMockSession({
        id: s3Id,
        calendarDate: "2026-10-05",
      })
    );
    await repos.workout.sets.save(
      createMockSet({
        sessionId: s3Id,
        exerciseId: assistedPullup.id,
        setNumber: 1,
        weightKg: 35,
        reps: 6,
        isAssisted: true,
        completed: true,
        loggedAt: "2026-10-05T10:05:00Z",
      })
    );

    const s3PRs = await repos.workout.getSessionPRs(s3Id);
    expect(s3PRs.some((p) => p.category === "least_assistance")).toBe(false);
  });

  it("herberekent dynamisch bij verwijdering van een sessie zonder achterblijvende vervuilde data", async () => {
    // Sessie 1: 80 kg
    const s1Id = crypto.randomUUID();
    await repos.workout.sessions.save(
      createMockSession({
        id: s1Id,
        calendarDate: "2026-10-01",
      })
    );
    await repos.workout.sets.save(
      createMockSet({
        sessionId: s1Id,
        exerciseId: benchPress.id,
        setNumber: 1,
        weightKg: 80,
        reps: 5,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      })
    );

    // Sessie 2: 100 kg (nieuw PR!)
    const s2Id = crypto.randomUUID();
    await repos.workout.sessions.save(
      createMockSession({
        id: s2Id,
        calendarDate: "2026-10-03",
      })
    );
    await repos.workout.sets.save(
      createMockSet({
        sessionId: s2Id,
        exerciseId: benchPress.id,
        setNumber: 1,
        weightKg: 100,
        reps: 5,
        completed: true,
        loggedAt: "2026-10-03T10:05:00Z",
      })
    );

    // Huidige allPRs bevat 100 kg
    let allPRs = await repos.workout.getAllPRs();
    const benchPRs = allPRs.filter((p) => p.exerciseId === benchPress.id && p.category === "max_weight");
    expect(benchPRs.some((p) => p.value === 100)).toBe(true);

    // Gebruiker verwijdert per ongeluk of met opzet sessie 2
    await repos.workout.deleteCompletedSession(s2Id);

    // Herberekening: 100 kg is weg, 80 kg is weer het hoogste actieve record!
    allPRs = await repos.workout.getAllPRs();
    const updatedBenchPRs = allPRs.filter((p) => p.exerciseId === benchPress.id && p.category === "max_weight");
    expect(updatedBenchPRs.some((p) => p.value === 100)).toBe(false);
    expect(updatedBenchPRs.some((p) => p.value === 80)).toBe(true);
  });

  it("ondersteunt favoriete oefeningen in AppSettings en SettingsRepository", async () => {
    const initialFavs = await repos.settings.getFavoriteExerciseIds();
    expect(Array.isArray(initialFavs)).toBe(true);

    // Voeg bench press toe als favoriet
    const updated1 = await repos.settings.toggleFavoriteExerciseId(benchPress.id);
    expect(updated1).toContain(benchPress.id);

    // Controleer persistentie
    const persisted = await repos.settings.getFavoriteExerciseIds();
    expect(persisted).toContain(benchPress.id);

    // Toggle nogmaals verwijdert hem weer
    const updated2 = await repos.settings.toggleFavoriteExerciseId(benchPress.id);
    expect(updated2).not.toContain(benchPress.id);
  });
});
