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

describe("Stap 12 — Training Afronden en Corrigeren (Prompt 12)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-workout-step12";

  let benchPressExercise: Exercise;
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
    benchPressExercise = allEx.find(
      (e) => e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001"
    )!;

    // Maak een testschema aan
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
        notes: "Focus op borstspanning",
      },
    ];

    testRoutine = {
      id: routineId,
      name: "Kracht Schema Stap 12",
      description: "Testschema voor afronden en corrigeren",
      version: 1,
      isActive: true,
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    testDay1 = {
      id: day1Id,
      routineId,
      dayIndex: 1,
      name: "Borst Dag",
      plannedExercises: day1Exercises,
      createdAt: new Date().toISOString(),
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
  // 1. AFRONDEN MET INCOMPLETE SETS KEUZE (DISCARD VS MARK_COMPLETED)
  // =========================================================================
  describe("Incomplete sets afhandeling bij afronden", () => {
    it("verwijdert niet-voltooide sets bij de optie 'discard' (aanbevolen)", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-15"
      );

      const initialSets = await repos.workout.getSetsForSession(session.id);
      expect(initialSets.length).toBe(3);

      // Vink set 1 en 2 af als voltooid met 80 kg x 8 reps
      await repos.workout.saveWorkoutSet({
        ...initialSets[0],
        weightKg: 80,
        reps: 8,
        completed: true,
        completedAt: new Date().toISOString(),
      });
      await repos.workout.saveWorkoutSet({
        ...initialSets[1],
        weightKg: 80,
        reps: 8,
        completed: true,
        completedAt: new Date().toISOString(),
      });
      // Set 3 blijft onvoltooid (completed: false)

      // Rond sessie af met 'discard'
      const finished = await repos.workout.finishSession(session.id, {
        overallRpe: 8,
        notes: "Set 3 overgeslagen wegens vermoeidheid",
        incompleteSetsAction: "discard",
      });

      expect(finished).not.toBeNull();
      expect(finished!.status).toBe("afgerond");
      expect(finished!.overallRpe).toBe(8);
      expect(finished!.notes).toBe("Set 3 overgeslagen wegens vermoeidheid");

      // Controleer sets in database: set 3 moet verwijderd zijn!
      const remainingSets = await repos.workout.getSetsForSession(session.id);
      expect(remainingSets.length).toBe(2);
      expect(remainingSets.every((s) => s.completed)).toBe(true);

      // Volume telt alleen set 1 en 2 (80*8 + 80*8 = 1280 kg)
      const volume = await repos.workout.calculateSessionVolume(session.id);
      expect(volume).toBe(1280);
    });

    it("markeert resterende sets als voltooid bij optie 'mark_completed'", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-15"
      );

      const initialSets = await repos.workout.getSetsForSession(session.id);
      expect(initialSets.length).toBe(3);

      // Vink alleen set 1 af
      await repos.workout.saveWorkoutSet({
        ...initialSets[0],
        weightKg: 80,
        reps: 10,
        completed: true,
        completedAt: new Date().toISOString(),
      });
      // Stel gewicht in voor set 2 en 3 maar laat completed: false
      await repos.workout.saveWorkoutSet({
        ...initialSets[1],
        weightKg: 80,
        reps: 8,
        completed: false,
      });
      await repos.workout.saveWorkoutSet({
        ...initialSets[2],
        weightKg: 80,
        reps: 6,
        completed: false,
      });

      // Rond sessie af met 'mark_completed'
      const finished = await repos.workout.finishSession(session.id, {
        overallRpe: 9,
        incompleteSetsAction: "mark_completed",
      });

      expect(finished).not.toBeNull();
      expect(finished!.status).toBe("afgerond");

      // Controleer dat alle 3 sets bewaard zijn en completed: true hebben
      const finalSets = await repos.workout.getSetsForSession(session.id);
      expect(finalSets.length).toBe(3);
      expect(finalSets.every((s) => s.completed)).toBe(true);
      expect(finalSets[1].completedAt).toBeDefined();
      expect(finalSets[2].completedAt).toBeDefined();

      // Volume telt alle 3 sets (80*10 + 80*8 + 80*6 = 800 + 640 + 480 = 1920 kg)
      const volume = await repos.workout.calculateSessionVolume(session.id);
      expect(volume).toBe(1920);
    });
  });

  // =========================================================================
  // 2. KOPPELING AAN GEPLANDE SESSIE ZONDER DUPLICATEN
  // =========================================================================
  describe("Koppeling aan geplande sessie", () => {
    it("werkt gekoppelde geplande sessie atomair bij naar status 'afgerond' zonder duplicaten", async () => {
      const today = "2026-10-15";
      const schedSession = await repos.workout.scheduleSession({
        calendarDate: today,
        routineId: testRoutine.id,
        routineDayId: testDay1.id,
      });

      expect(schedSession.status).toBe("gepland");

      // Start de training vanuit de geplande sessie
      const activeSession = await repos.workout.startWorkoutFromScheduledSession(
        schedSession.id
      );
      expect(activeSession.scheduledSessionId).toBe(schedSession.id);

      // Afronden
      const finished = await repos.workout.finishSession(activeSession.id, {
        overallRpe: 7.5,
      });
      expect(finished!.status).toBe("afgerond");

      // Controleer geplande sessie in database
      const updatedSched = await repos.workout.getScheduledSessionById(
        schedSession.id
      );
      expect(updatedSched).not.toBeNull();
      expect(updatedSched!.status).toBe("afgerond");
      expect(updatedSched!.completedSessionId).toBe(activeSession.id);

      // Verifieer dat er geen extra geplande sessies zijn aangemaakt
      const allScheduled = await repos.workout.scheduledSessions.getAll();
      expect(allScheduled.length).toBe(1);
    });
  });

  // =========================================================================
  // 3. DUBBELKLIKKEN & IDEMPOTENTIE
  // =========================================================================
  describe("Dubbelklikken en Idempotentie", () => {
    it("is veilig tegen tweemaal op afronden drukken en levert geen duplicaten of crashes op", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-15"
      );

      // Gelijktijdig tweemaal afronden simuleren
      const [res1, res2] = await Promise.all([
        repos.workout.finishSession(session.id, { overallRpe: 8 }),
        repos.workout.finishSession(session.id, { overallRpe: 8 }),
      ]);

      expect(res1).not.toBeNull();
      expect(res2).not.toBeNull();
      expect(res1!.id).toBe(session.id);
      expect(res2!.id).toBe(session.id);
      expect(res1!.status).toBe("afgerond");
      expect(res2!.status).toBe("afgerond");

      // Verifieer dat er precies 1 sessie in de database staat
      const allSessions = await repos.workout.sessions.getAll();
      expect(allSessions.length).toBe(1);

      // Nogmaals aanroepen op een reeds afgeronde sessie geeft netjes de afgeronde sessie terug
      const res3 = await repos.workout.finishSession(session.id);
      expect(res3!.status).toBe("afgerond");
    });
  });

  // =========================================================================
  // 4. STORAGE FAILURE RESILIENCE
  // =========================================================================
  describe("Weerbaarheid bij opslagfouten", () => {
    it("behoudt actieve sessiestatus als opslag faalt tijdens afronden", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-15"
      );

      // Simuleer een niet-bestaande ID
      const nonExistentId = "non-existent-session-id";
      const result = await repos.workout.finishSession(nonExistentId);
      expect(result).toBeNull();

      // De actieve sessie moet ongewijzigd actief blijven!
      const active = await repos.workout.getActiveWorkoutSession();
      expect(active).not.toBeNull();
      expect(active!.id).toBe(session.id);
      expect(active!.status).toBe("actief");
    });
  });

  // =========================================================================
  // 5. AFGERONDE TRAINING BEWERKEN & LIVE VOLUME HERBEREKENING
  // =========================================================================
  describe("Afgeronde training bewerken", () => {
    it("kan datum, RPE en notities aanpassen en synchroniseert met gekoppelde planning", async () => {
      const sched = await repos.workout.scheduleSession({
        calendarDate: "2026-10-10",
        routineId: testRoutine.id,
        routineDayId: testDay1.id,
      });
      const session = await repos.workout.startWorkoutFromScheduledSession(sched.id);
      await repos.workout.finishSession(session.id, { overallRpe: 7 });

      // Pas datum en notities aan
      const updated = await repos.workout.updateCompletedSession(session.id, {
        calendarDate: "2026-10-11",
        overallRpe: 8.5,
        notes: "Datum gecorrigeerd en RPE verhoogd",
      });

      expect(updated.calendarDate).toBe("2026-10-11");
      expect(updated.overallRpe).toBe(8.5);
      expect(updated.notes).toBe("Datum gecorrigeerd en RPE verhoogd");

      // Gekoppelde geplande sessie heeft nu ook de nieuwe datum
      const updatedSched = await repos.workout.getScheduledSessionById(sched.id);
      expect(updatedSched!.calendarDate).toBe("2026-10-11");
    });

    it("herberekent direct volume en PR's wanneer sets worden aangepast of toegevoegd", async () => {
      const session = await repos.workout.startWorkoutFromDay(
        testRoutine.id,
        testDay1.id,
        "2026-10-15"
      );

      const sets = await repos.workout.getSetsForSession(session.id);
      // Set 1: 80 kg x 8 reps
      await repos.workout.saveWorkoutSet({
        ...sets[0],
        weightKg: 80,
        reps: 8,
        completed: true,
      });
      // Set 2 & 3 discard
      await repos.workout.finishSession(session.id, {
        incompleteSetsAction: "discard",
      });

      expect(await repos.workout.calculateSessionVolume(session.id)).toBe(640);
      let prs = await repos.workout.getExercisePRs(benchPressExercise.id);
      expect(prs.maxWeightKg).toBe(80);
      expect(prs.totalVolumeKg).toBe(640);

      // Corrigeer gewicht van set 1 naar 100 kg
      await repos.workout.updateWorkoutSet(sets[0].id, {
        weightKg: 100,
      });

      // Volume moet nu 100 * 8 = 800 zijn
      expect(await repos.workout.calculateSessionVolume(session.id)).toBe(800);
      prs = await repos.workout.getExercisePRs(benchPressExercise.id);
      expect(prs.maxWeightKg).toBe(100);
      expect(prs.totalVolumeKg).toBe(800);

      // Voeg een nieuwe set toe aan de voltooide training
      const addedSet = await repos.workout.addSetToSession(
        session.id,
        benchPressExercise.id,
        {
          weightKg: 110,
          reps: 5,
          completed: true,
        }
      );

      expect(addedSet.setNumber).toBe(2);
      // Volume = 800 + (110 * 5) = 800 + 550 = 1350 kg
      expect(await repos.workout.calculateSessionVolume(session.id)).toBe(1350);
      prs = await repos.workout.getExercisePRs(benchPressExercise.id);
      expect(prs.maxWeightKg).toBe(110);
      expect(prs.totalVolumeKg).toBe(1350);
      expect(prs.totalCompletedSets).toBe(2);

      // Verwijder de toegevoegde set
      await repos.workout.deleteWorkoutSet(addedSet.id);
      expect(await repos.workout.calculateSessionVolume(session.id)).toBe(800);
      prs = await repos.workout.getExercisePRs(benchPressExercise.id);
      expect(prs.maxWeightKg).toBe(100);
      expect(prs.totalVolumeKg).toBe(800);
    });
  });

  // =========================================================================
  // 6. VEILIG VERWIJDEREN VAN EEN AFGERONDE TRAINING
  // =========================================================================
  describe("Veilig verwijderen van een afgeronde training", () => {
    it("verwijdert sessie en sets en herstelt gekoppelde geplande sessie naar status 'gepland'", async () => {
      const sched = await repos.workout.scheduleSession({
        calendarDate: "2026-10-20",
        routineId: testRoutine.id,
        routineDayId: testDay1.id,
      });

      const session = await repos.workout.startWorkoutFromScheduledSession(sched.id);
      await repos.workout.finishSession(session.id, { overallRpe: 8 });

      // Verifieer dat het voltooid en gekoppeld is
      let loadedSched = await repos.workout.getScheduledSessionById(sched.id);
      expect(loadedSched!.status).toBe("afgerond");
      expect(loadedSched!.completedSessionId).toBe(session.id);

      // Verwijder de voltooide training
      await repos.workout.deleteCompletedSession(session.id);

      // 1. Sessie moet weg zijn
      const deletedSession = await repos.workout.getSessionById(session.id);
      expect(deletedSession).toBeNull();

      // 2. Sets moeten gewist zijn
      const setsAfterDelete = await repos.workout.getSetsForSession(session.id);
      expect(setsAfterDelete.length).toBe(0);

      // 3. Geplande sessie moet hersteld zijn naar 'gepland' met completedSessionId = null
      loadedSched = await repos.workout.getScheduledSessionById(sched.id);
      expect(loadedSched).not.toBeNull();
      expect(loadedSched!.status).toBe("gepland");
      expect(loadedSched!.completedSessionId).toBeNull();

      // 4. PR's voor bench press worden direct herberekend en tellen de gewiste workout niet meer mee
      const prs = await repos.workout.getExercisePRs(benchPressExercise.id);
      expect(prs.totalCompletedSets).toBe(0);
      expect(prs.totalVolumeKg).toBe(0);
      expect(prs.maxWeightKg).toBe(0);
    });
  });
});
