import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import type {
  WorkoutRoutine,
  RoutineDay,
  PlannedExerciseInDay,
  Exercise,
  WorkoutSession,
} from "@/types/database";
import Dexie from "dexie";
import {
  startRestTimer,
  getRemainingSeconds,
  pauseRestTimer,
  resumeRestTimer,
  adjustRestTimer,
  formatTimerDisplay,
  saveTimerStateToStorage,
  loadTimerStateFromStorage,
  REST_TIMER_STORAGE_KEY,
} from "@/domain/strength/restTimer";

describe("Stap 11 — Rusttimer en Oefennotities (Prompt 11)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-prompt11-rest-notes";

  let benchPressExercise: Exercise;
  let testRoutine: WorkoutRoutine;
  let testDay: RoutineDay;

  beforeEach(async () => {
    if (typeof globalThis.localStorage === "undefined") {
      const store: Record<string, string> = {};
      (globalThis as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = String(v);
        },
        removeItem: (k: string) => {
          delete store[k];
        },
        clear: () => {
          for (const k in store) delete store[k];
        },
        key: (i: number) => Object.keys(store)[i] ?? null,
        length: 0,
      };
    }

    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);

    // Vul database met standaardoefeningen
    await repos.exercises.ensureDefaultExercises();
    const allEx = await repos.exercises.getAll();
    benchPressExercise = allEx.find(
      (e) => e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001"
    )!;

    const routineId = crypto.randomUUID();
    const dayId = crypto.randomUUID();
    const now = new Date().toISOString();

    const dayExercises: PlannedExerciseInDay[] = [
      {
        exerciseId: benchPressExercise.id,
        exerciseName: benchPressExercise.name,
        measurementType: "gewicht_herhalingen",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: 80,
        restSeconds: 90,
      },
    ];

    testRoutine = {
      id: routineId,
      name: "Borst Focus",
      description: "Testroutine voor prompt 11",
      version: 1,
      isActive: true,
      isArchived: false,
      provenance: { source: "user", isDemo: false },
      createdAt: now,
      updatedAt: now,
    };

    testDay = {
      id: dayId,
      routineId,
      dayIndex: 1,
      name: "Borstdag",
      plannedExercises: dayExercises,
      createdAt: now,
    };

    await repos.workout.saveRoutineWithDays(testRoutine, [testDay]);
  });

  afterEach(async () => {
    await db.close();
    if (typeof localStorage !== "undefined") {
      localStorage.clear();
    }
  });

  // ===========================================================================
  // 1. RUSTTIMER: TIMESTAMPS, ACHTERGRONDVEILIGHEID EN BEDIENING
  // ===========================================================================
  describe("Rusttimer Functionaliteit & Achtergrondgedrag", () => {
    const fixedNow = 1775000000000;

    it("berekent resterende tijd zuiver uit timestamps en niet alleen interval-ticks", () => {
      const timer = startRestTimer(90, "Bankdrukken", undefined, fixedNow);
      expect(timer.totalDurationSeconds).toBe(90);
      expect(timer.targetEndTimeMs).toBe(fixedNow + 90 * 1000);

      // Meteen bij de start
      expect(getRemainingSeconds(timer, fixedNow)).toBe(90);

      // Na 10 seconden
      expect(getRemainingSeconds(timer, fixedNow + 10 * 1000)).toBe(80);
    });

    it("klopt exact na 30 seconden achtergrondgebruik / tab-switch", () => {
      const timer = startRestTimer(90, "Bankdrukken", undefined, fixedNow);

      // Simuleer dat de tab of browser 30 seconden verborgen was
      const after30s = fixedNow + 30 * 1000;
      const remaining = getRemainingSeconds(timer, after30s);

      // Moet exact 60 seconden zijn (90 - 30)
      expect(remaining).toBe(60);
    });

    it("raakt niet negatief na afloop van de timer", () => {
      const timer = startRestTimer(60, "Bankdrukken", undefined, fixedNow);

      // Simuleer tijd ver na afloop (bv. 120s later)
      const afterExpiry = fixedNow + 120 * 1000;
      expect(getRemainingSeconds(timer, afterExpiry)).toBe(0);
    });

    it("ondersteunt pauze, hervatten en plus/min 15 seconden", () => {
      const timer = startRestTimer(90, "Bankdrukken", undefined, fixedNow);

      // 1. Pauzeren na 20 seconden (resterend: 70s)
      const paused = pauseRestTimer(timer, fixedNow + 20 * 1000);
      expect(paused.isPaused).toBe(true);
      expect(paused.remainingWhenPaused).toBe(70);

      // Tijd loopt niet door tijdens pauze
      expect(getRemainingSeconds(paused, fixedNow + 100 * 1000)).toBe(70);

      // 2. +15 seconden toevoegen tijdens pauze
      const extended = adjustRestTimer(paused, 15, fixedNow);
      expect(extended.remainingWhenPaused).toBe(85);

      // 3. -15 seconden aftrekken
      const shortened = adjustRestTimer(extended, -15, fixedNow);
      expect(shortened.remainingWhenPaused).toBe(70);

      // 4. Hervatten op nieuw tijdstip
      const resumeNow = fixedNow + 50 * 1000;
      const resumed = resumeRestTimer(shortened, resumeNow);
      expect(resumed.isPaused).toBe(false);
      expect(resumed.targetEndTimeMs).toBe(resumeNow + 70 * 1000);
      expect(getRemainingSeconds(resumed, resumeNow)).toBe(70);

      // 10 seconden na hervatten
      expect(getRemainingSeconds(resumed, resumeNow + 10 * 1000)).toBe(60);
    });

    it("slaat timerstatus op in storage en herlaadt correct", () => {
      const timer = startRestTimer(90, "Bankdrukken", undefined, fixedNow);
      saveTimerStateToStorage(timer);

      const loaded = loadTimerStateFromStorage();
      expect(loaded).not.toBeNull();
      expect(loaded?.targetEndTimeMs).toBe(timer.targetEndTimeMs);
      expect(loaded?.totalDurationSeconds).toBe(90);

      // Schoon storage op bij overslaan/annuleren
      saveTimerStateToStorage(null);
      expect(loadTimerStateFromStorage()).toBeNull();
    });

    it("formatteert mm:ss weergave correct", () => {
      expect(formatTimerDisplay(90)).toBe("01:30");
      expect(formatTimerDisplay(15)).toBe("00:15");
      expect(formatTimerDisplay(0)).toBe("00:00");
    });
  });

  // ===========================================================================
  // 2. OEFENINGNOTITIES: SESSIE NOTITIE VS BLIJVENDE TECHNIEKNOTITIE
  // ===========================================================================
  describe("Oefeningnotities Scheiding & Geschiedenis", () => {
    it("bewaart sessie-oefennotitie en blijvende technieknotitie als twee strikt gescheiden entiteiten", async () => {
      // 1. Sla een blijvende technieknotitie op voor Bankdrukken in de bibliotheek
      const updatedExercise = await repos.exercises.updateTechniqueNotes(
        benchPressExercise.id,
        "Pinken op de ringen; bankje op stand 2; schouderbladen ingetrokken"
      );
      expect(updatedExercise.techniqueNotes).toBe(
        "Pinken op de ringen; bankje op stand 2; schouderbladen ingetrokken"
      );

      // 2. Start trainingssessie 1
      const session1 = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay.id,
        "2026-03-20"
      );

      // 3. Sla een sessie-specifieke trainingsnotitie op voor deze training
      const updatedSession1 = await repos.workout.updateSessionExerciseNotes(
        session1.id,
        0,
        "Set 2 voelde zwaar, rechterschouder een beetje stijf"
      );

      expect(updatedSession1.snapshot.exercises[0].notes).toBe(
        "Set 2 voelde zwaar, rechterschouder een beetje stijf"
      );

      // 4. Verifieer dat de sessienotitie de blijvende technieknotitie in de bibliotheek NIET heeft overschreven!
      const exerciseInDb = await repos.exercises.getById(benchPressExercise.id);
      expect(exerciseInDb?.techniqueNotes).toBe(
        "Pinken op de ringen; bankje op stand 2; schouderbladen ingetrokken"
      );

      // 5. Verifieer ook omgekeerd: wijzig de technieknotitie en controleer dat de sessienotitie intact blijft
      await repos.exercises.updateTechniqueNotes(
        benchPressExercise.id,
        "Aangepast: Brede greep hanteren"
      );
      const reloadedSession = await repos.workout.getSessionById(session1.id);
      expect(reloadedSession?.snapshot.exercises[0].notes).toBe(
        "Set 2 voelde zwaar, rechterschouder een beetje stijf"
      );
    });

    it("toont bij de volgende sessie relevante eerdere notities van de vorige voltooide training", async () => {
      // Sessie 1 uitvoeren en afronden
      const session1 = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay.id,
        "2026-03-20"
      );

      // Voeg een sessienotitie toe aan sessie 1
      await repos.workout.updateSessionExerciseNotes(
        session1.id,
        0,
        "Volgende keer 82.5 kg proberen, 80kg ging soepel"
      );

      // Voltooi ten minste één set zodat de sessie telt als voltooide prestatie
      const sets = await repos.workout.getSetsForSessionAndExercise(
        session1.id,
        benchPressExercise.id
      );
      await repos.workout.saveWorkoutSet({
        ...sets[0],
        weightKg: 80,
        reps: 10,
        completed: true,
        completedAt: new Date().toISOString(),
      });

      // Rond sessie 1 af
      await repos.workout.finishSession(session1.id, 8, "Prima training");

      // Start sessie 2 (een week later)
      const session2 = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay.id,
        "2026-03-27"
      );

      // Vraag eerdere prestaties op voor Bankdrukken (met uitsluiting van sessie 2)
      const previousPerformance =
        await repos.workout.getPreviousPerformanceForExercise(
          benchPressExercise.id,
          session2.id
        );

      expect(previousPerformance).not.toBeNull();
      // De notitie van sessie 1 moet exact terugkomen als exerciseNotes!
      expect(previousPerformance?.exerciseNotes).toBe(
        "Volgende keer 82.5 kg proberen, 80kg ging soepel"
      );
      expect(previousPerformance?.sessionDate).toBe("2026-03-20");
    });
  });
});
