import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import type {
  WorkoutRoutine,
  RoutineDay,
  PlannedExerciseInDay,
  Exercise,
} from "@/types/database";
import Dexie from "dexie";

describe("Stap 09 — Training Starten, Hervatten en Actieve Sessies (Prompt 09)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-workout-step09";

  let benchPressExercise: Exercise;
  let squatExercise: Exercise;
  let testRoutine: WorkoutRoutine;
  let testDay1: RoutineDay;

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);

    // Vul database met standaardoefeningen
    await repos.exercises.ensureDefaultExercises();
    const allEx = await repos.exercises.getAll();
    benchPressExercise = allEx.find((e) => e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001")!;
    squatExercise = allEx.find((e) => e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e002")!;

    // Maak een testschema aan
    const now = new Date().toISOString();
    const routineId = crypto.randomUUID();
    const day1Id = crypto.randomUUID();

    const day1Exercises: PlannedExerciseInDay[] = [
      {
        exerciseId: benchPressExercise.id,
        exerciseName: benchPressExercise.name,
        measurementType: "gewicht_herhalingen",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: 80,
        effortScale: "rpe",
        targetRpe: 8,
        restSeconds: 90,
        notes: "Focus op tempo",
      },
      {
        exerciseId: squatExercise.id,
        exerciseName: squatExercise.name,
        measurementType: "gewicht_herhalingen",
        targetSets: 4,
        targetRepsMin: 5,
        targetRepsMax: 5,
        targetWeightKg: 100,
        effortScale: "rir",
        targetRir: 2,
        restSeconds: 120,
      },
    ];

    testRoutine = {
      id: routineId,
      name: "Kracht Basis 2-Dagen",
      description: "Testschema voor actieve sessies",
      version: 1,
      isActive: true,
      isArchived: false,
      provenance: { source: "user", isDemo: false },
      createdAt: now,
      updatedAt: now,
    };

    testDay1 = {
      id: day1Id,
      routineId,
      dayIndex: 1,
      name: "Bovenlichaam Focus",
      plannedExercises: day1Exercises,
      createdAt: now,
    };

    await repos.workout.saveRoutineWithDays(testRoutine, [testDay1]);
  });

  afterEach(async () => {
    if (db.isOpen()) {
      db.close();
    }
    await Dexie.delete(testDbName);
  });

  // =========================================================================
  // 1. TRAINING STARTEN (VANUIT PLANNING, DAG OF VRIJE TRAINING)
  // =========================================================================
  describe("1. Training starten met frozen snapshot en sessie-status", () => {
    it("startWorkoutFromDay start een actieve sessie met frozen snapshot en pre-populated sets", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.status).toBe("actief");
      expect(session.currentExerciseIndex).toBe(0);
      expect(session.activeExerciseId).toBe(benchPressExercise.id);
      expect(session.startedAt).toBeDefined();

      // Snapshot controle
      expect(session.snapshot.routineName).toBe("Kracht Basis 2-Dagen");
      expect(session.snapshot.routineDayName).toBe("Bovenlichaam Focus");
      expect(session.snapshot.exercises.length).toBe(2);
      expect(session.snapshot.exercises[0].exerciseId).toBe(benchPressExercise.id);
      expect(session.snapshot.exercises[0].targetSets).toBe(3);
      expect(session.snapshot.exercises[0].targetWeightKg).toBe(80);

      // Pre-populated sets controle
      const allSets = await repos.workout.getSetsForSession(session.id);
      // 3 sets voor bench press + 4 sets voor squat = 7 sets in totaal
      expect(allSets.length).toBe(7);

      const benchSets = allSets.filter((s) => s.exerciseId === benchPressExercise.id);
      expect(benchSets.length).toBe(3);
      expect(benchSets[0].setNumber).toBe(1);
      expect(benchSets[0].weightKg).toBe(80);
      expect(benchSets[0].reps).toBe(8); // min reps van repRange
      expect(benchSets[0].completed).toBe(false);

      const squatSets = allSets.filter((s) => s.exerciseId === squatExercise.id);
      expect(squatSets.length).toBe(4);
      expect(squatSets[0].weightKg).toBe(100);
      expect(squatSets[0].reps).toBe(5);
      expect(squatSets[0].completed).toBe(false);
    });

    it("startWorkoutFromScheduledSession start vanuit geplande sessie en markeert gepland als afgerond", async () => {
      // Plan eerst een sessie in
      const scheduled = await repos.workout.scheduleSession({
        routineId: testRoutine.id,
        routineDayId: testDay1.id,
        calendarDate: "2026-10-02",
      });

      expect(scheduled.status).toBe("gepland");

      // Start actieve training vanuit de geplande sessie
      const session = await repos.workout.startWorkoutFromScheduledSession(scheduled.id);

      expect(session.status).toBe("actief");
      expect(session.scheduledSessionId).toBe(scheduled.id);

      // Controleer dat de geplande sessie nu afgerond is en wijst naar de sessie
      const updatedScheduled = await repos.workout.getScheduledSessionById(scheduled.id);
      expect(updatedScheduled?.status).toBe("afgerond");
      expect(updatedScheduled?.completedSessionId).toBe(session.id);
    });

    it("startEmptyWorkout start een vrije training zonder voorgedefinieerde oefeningen", async () => {
      const session = await repos.workout.startEmptyWorkout({
        workoutName: "Mijn spontane training",
        calendarDate: "2026-10-02",
      });

      expect(session.status).toBe("actief");
      expect(session.snapshot.routineName).toBe("Mijn spontane training");
      expect(session.snapshot.exercises.length).toBe(0);
      expect(session.currentExerciseIndex).toBe(0);
      expect(session.activeExerciseId).toBeNull();

      const sets = await repos.workout.getSetsForSession(session.id);
      expect(sets.length).toBe(0);
    });
  });

  // =========================================================================
  // 2. ENKELE ACTIEVE SESSIE & CONFLICT DETECTIE
  // =========================================================================
  describe("2. Regel: maximaal één actieve training tegelijkertijd", () => {
    it("getActiveWorkoutSession retourneert de momenteel actieve sessie", async () => {
      expect(await repos.workout.getActiveWorkoutSession()).toBeNull();

      const started = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      const active = await repos.workout.getActiveWorkoutSession();
      expect(active).not.toBeNull();
      expect(active?.id).toBe(started.id);
    });

    it("starten van een tweede sessie gooit een foutmelding als er al een actief is", async () => {
      await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      await expect(
        repos.workout.startEmptyWorkout({ workoutName: "Tweede poging" })
      ).rejects.toThrow("Er is al een actieve training bezig");
    });
  });

  // =========================================================================
  // 3. PERSISTENTIE & SESSIE NAVIGATIE BIJ HERVATTEN
  // =========================================================================
  describe("3. Sessienavigatie en persistentie bij reload", () => {
    it("updateActiveSessionExercise update huidige oefeningindex en activeExerciseId persistent", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      expect(session.currentExerciseIndex).toBe(0);
      expect(session.activeExerciseId).toBe(benchPressExercise.id);

      // Verander naar de tweede oefening (squat, index 1)
      await repos.workout.updateActiveSessionExercise(session.id, 1);

      // Herlaad sessie direct uit de database (simuleert pagina refresh)
      const reloaded = await repos.workout.getSessionById(session.id);
      expect(reloaded?.currentExerciseIndex).toBe(1);
      expect(reloaded?.activeExerciseId).toBe(squatExercise.id);
    });

    it("wijzigingen in het originele schema beïnvloeden de actieve snapshot niet", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      // Wijzig het originele schema
      await repos.workout.saveRoutineWithDays(
        {
          ...testRoutine,
          name: "Totaal Nieuwe Schemanaam",
        },
        [testDay1]
      );

      // Snapshot in de actieve sessie moet ongewijzigd blijven
      const activeSession = await repos.workout.getSessionById(session.id);
      expect(activeSession?.snapshot.routineName).toBe("Kracht Basis 2-Dagen");
    });
  });

  // =========================================================================
  // 4. OEFENING TOEVOEGEN EN VERWIJDEREN TIJDENS ACTIEVE SESSIE
  // =========================================================================
  describe("4. Oefening toevoegen en verwijderen tijdens actieve sessie", () => {
    it("addExerciseToActiveSession voegt een oefening toe aan de snapshot en maakt initiële sets aan", async () => {
      const session = await repos.workout.startEmptyWorkout({
        workoutName: "Vrije Training",
        calendarDate: "2026-10-02",
      });

      expect(session.snapshot.exercises.length).toBe(0);

      // Voeg bankdrukken toe met 3 sets van 10 reps op 75kg
      await repos.workout.addExerciseToActiveSession(session.id, {
        exerciseId: benchPressExercise.id,
        exerciseName: benchPressExercise.name,
        primaryMuscleGroup: benchPressExercise.primaryMuscleGroup,
        targetSets: 3,
        targetRepsMin: 10,
        targetRepsMax: 10,
        targetWeightKg: 75,
        restSeconds: 90,
      });

      const updated = await repos.workout.getSessionById(session.id);
      expect(updated?.snapshot.exercises.length).toBe(1);
      expect(updated?.snapshot.exercises[0].exerciseName).toBe(benchPressExercise.name);
      expect(updated?.snapshot.exercises[0].targetWeightKg).toBe(75);

      const sets = await repos.workout.getSetsForSessionAndExercise(
        session.id,
        benchPressExercise.id
      );
      expect(sets.length).toBe(3);
      expect(sets[0].weightKg).toBe(75);
      expect(sets[0].reps).toBe(10);
      expect(sets[0].completed).toBe(false);
    });

    it("removeExerciseFromActiveSession verwijdert de oefening en de bijbehorende sets", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      expect(session.snapshot.exercises.length).toBe(2);

      // Verwijder de eerste oefening (bench press op index 0)
      await repos.workout.removeExerciseFromActiveSession(session.id, 0);

      const updated = await repos.workout.getSessionById(session.id);
      expect(updated?.snapshot.exercises.length).toBe(1);
      expect(updated?.snapshot.exercises[0].exerciseId).toBe(squatExercise.id);

      // Bench press sets moeten opgeruimd zijn
      const benchSets = await repos.workout.getSetsForSessionAndExercise(
        session.id,
        benchPressExercise.id
      );
      expect(benchSets.length).toBe(0);

      // Squat sets moeten nog intact zijn
      const squatSets = await repos.workout.getSetsForSessionAndExercise(
        session.id,
        squatExercise.id
      );
      expect(squatSets.length).toBe(4);
    });
  });

  // =========================================================================
  // 5. SETS LOGGEN, VOLTOOIEN EN VORIGE PRESTATIES
  // =========================================================================
  describe("5. Sets loggen, aanpassen en eerdere prestaties ophalen", () => {
    it("saveWorkoutSet update werkelijk gewicht, reps en markeert set als voltooid", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      const sets = await repos.workout.getSetsForSessionAndExercise(
        session.id,
        benchPressExercise.id
      );
      const set1 = sets[0];

      // Gebruiker voert set uit: 82.5 kg x 9 reps op RPE 8.5
      await repos.workout.saveWorkoutSet({
        ...set1,
        weightKg: 82.5,
        reps: 9,
        actualRpe: 8.5,
        completed: true,
      });

      const updatedSets = await repos.workout.getSetsForSessionAndExercise(
        session.id,
        benchPressExercise.id
      );
      const updatedSet1 = updatedSets.find((s) => s.id === set1.id);
      expect(updatedSet1?.weightKg).toBe(82.5);
      expect(updatedSet1?.reps).toBe(9);
      expect(updatedSet1?.actualRpe).toBe(8.5);
      expect(updatedSet1?.completed).toBe(true);
      expect(updatedSet1?.loggedAt).toBeDefined();
    });

    it("getPreviousPerformanceForExercise haalt sets op van de meest recente voltooide sessie", async () => {
      // 1. Maak een eerdere voltooide sessie aan met bench press
      const oldSession = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-09-25"
      );

      const oldSets = await repos.workout.getSetsForSessionAndExercise(
        oldSession.id,
        benchPressExercise.id
      );

      // Voltooi 2 van de sets met 77.5kg
      await repos.workout.saveWorkoutSet({
        ...oldSets[0],
        weightKg: 77.5,
        reps: 10,
        completed: true,
      });
      await repos.workout.saveWorkoutSet({
        ...oldSets[1],
        weightKg: 77.5,
        reps: 8,
        completed: true,
      });

      // Rond de oude training netjes af
      await repos.workout.finishActiveSession(oldSession.id, {
        sessionRpe: 7,
        notes: "Goeie oude training",
      });

      // 2. Start nu een nieuwe actieve sessie vandaag
      const newSession = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      // Haal vorige prestatie op voor bench press
      const prev = await repos.workout.getPreviousPerformanceForExercise(
        benchPressExercise.id,
        newSession.id
      );

      expect(prev).not.toBeNull();
      expect(prev?.workoutName).toBe("Kracht Basis 2-Dagen - Bovenlichaam Focus");
      expect(prev?.calendarDate).toBe("2026-09-25");
      expect(prev?.sets.length).toBe(2);
      expect(prev?.sets[0].weightKg).toBe(77.5);
      expect(prev?.sets[0].reps).toBe(10);
      expect(prev?.sets[1].reps).toBe(8);
    });
  });

  // =========================================================================
  // 6. AFSLUITEN & ANNULEREN / DISCARD KEUZES
  // =========================================================================
  describe("6. Training afronden, onderbreken of weggooien", () => {
    it("finishActiveSession voltooit de actieve sessie en maakt status voltooid", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      await repos.workout.finishActiveSession(session.id, {
        sessionRpe: 8,
        notes: "Prima training, goede pomp",
      });

      const finished = await repos.workout.getSessionById(session.id);
      expect(finished?.status).toBe("afgerond");
      expect(finished?.overallRpe).toBe(8);
      expect(finished?.notes).toBe("Prima training, goede pomp");
      expect(finished?.durationMinutes).toBeGreaterThanOrEqual(0);

      // Er is geen actieve training meer
      expect(await repos.workout.getActiveWorkoutSession()).toBeNull();
    });

    it("cancelOrDiscardActiveSession met keep_draft behoudt de training actief", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      await repos.workout.cancelOrDiscardActiveSession(session.id, "keep_draft");

      const draft = await repos.workout.getActiveWorkoutSession();
      expect(draft).not.toBeNull();
      expect(draft?.id).toBe(session.id);
      expect(draft?.status).toBe("actief");
    });

    it("cancelOrDiscardActiveSession met mark_cancelled zet status op geannuleerd", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-02"
      );

      await repos.workout.cancelOrDiscardActiveSession(session.id, "mark_cancelled");

      const cancelled = await repos.workout.getSessionById(session.id);
      expect(cancelled?.status).toBe("geannuleerd");
      expect(cancelled?.cancelledAt).toBeDefined();

      // Geen actieve training meer
      expect(await repos.workout.getActiveWorkoutSession()).toBeNull();
    });

    it("cancelOrDiscardActiveSession met discard_delete verwijdert sessie, sets en herstelt planning", async () => {
      const scheduled = await repos.workout.scheduleSession({
        routineId: testRoutine.id,
        routineDayId: testDay1.id,
        calendarDate: "2026-10-02",
      });

      const session = await repos.workout.startWorkoutFromScheduledSession(scheduled.id);

      // Controleer dat er sets en sessie zijn
      expect((await repos.workout.getSetsForSession(session.id)).length).toBeGreaterThan(0);

      // Gebruiker kiest: Gooi training volledig weg
      await repos.workout.cancelOrDiscardActiveSession(session.id, "discard_delete");

      // Sessie moet verwijderd zijn
      expect(await repos.workout.getSessionById(session.id)).toBeNull();

      // Sets moeten opgeruimd zijn
      const sets = await repos.workout.getSetsForSession(session.id);
      expect(sets.length).toBe(0);

      // Geplande sessie moet gereset zijn naar 'gepland' zonder completedSessionId
      const resetScheduled = await repos.workout.getScheduledSessionById(scheduled.id);
      expect(resetScheduled?.status).toBe("gepland");
      expect(resetScheduled?.completedSessionId).toBeFalsy();

      // Geen actieve sessie meer
      expect(await repos.workout.getActiveWorkoutSession()).toBeNull();
    });
  });
});
