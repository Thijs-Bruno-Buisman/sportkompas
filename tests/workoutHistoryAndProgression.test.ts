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
  WorkoutSet,
} from "@/types/database";
import Dexie from "dexie";
import {
  filterWorkoutSessions,
  getStartDateForFilter,
  buildExerciseProgressionPoints,
  convertProgressionPointsToLbs,
} from "@/domain/strength/progression";

describe("Stap 13 — Trainingsgeschiedenis en Oefenprogressie (Prompt 13)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-step13-history";

  let benchPressExercise: Exercise;
  let pullUpAssistedExercise: Exercise;
  let pushUpBodyweightExercise: Exercise;

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);

    // Initialiseer standaardoefeningen
    await repos.exercises.ensureDefaultExercises();
    const allEx = await repos.exercises.getAll();

    benchPressExercise = allEx.find(
      (e) =>
        e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001" ||
        e.name.toLowerCase().includes("bankdrukken")
    )!;

    // Voeg een assisted oefening en lichaamsgewicht oefening toe
    pullUpAssistedExercise = await repos.exercises.save({
      id: crypto.randomUUID(),
      name: "Assisted Pull-up Machine",
      category: "kracht",
      primaryMuscleGroup: "rug",
      secondaryMuscleGroups: ["armen"],
      equipment: "machine",
      measurementType: "assisted",
      instructions: "Stel tegengewicht in en trek jezelf op.",
      provenance: { source: "user" },
      isCustom: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    pushUpBodyweightExercise = await repos.exercises.save({
      id: crypto.randomUUID(),
      name: "Classic Push-up",
      category: "lichaamsgewicht",
      primaryMuscleGroup: "borst",
      secondaryMuscleGroups: ["armen", "core"],
      equipment: "lichaamsgewicht",
      measurementType: "lichaamsgewicht",
      instructions: "Plaats handen op schouderbreedte en druk op.",
      provenance: { source: "user" },
      isCustom: true,
      isArchived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  afterEach(async () => {
    if (db.isOpen()) {
      db.close();
    }
    await Dexie.delete(testDbName);
  });

  // Helper voor consistente snapshots in tests
  const makeMockSnap = (exerciseId: string, exerciseName: string) => ({
    exerciseId,
    exerciseName,
    primaryMuscleGroup: "benen" as const,
    measurementType: "gewicht_herhalingen" as const,
    targetSets: 3,
    restSeconds: 90,
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
    snapshot: { exercises: [makeMockSnap("e1", "Squat")] },
    overallRpe: null,
    notes: "",
    provenance: { source: "user" },
    updatedAt: `${overrides.calendarDate}T11:00:00Z`,
    ...overrides,
  });

  // =========================================================================
  // 1. DATUMFILTERS & ZOEKEN IN GESCHIEDENIS
  // =========================================================================
  describe("Geschiedenisfilters en zoekfunctionaliteit", () => {
    it("filtert correct op 7d, 30d, 90d, 1y en custom datumbereik", () => {
      const fixedNow = new Date("2026-10-15T12:00:00Z");

      const testSessions: WorkoutSession[] = [
        createMockSession({
          id: "s1",
          calendarDate: "2026-10-14", // 1 dag geleden (in 7d)
          snapshot: { exercises: [makeMockSnap("e1", "Squat")] },
        }),
        createMockSession({
          id: "s2",
          calendarDate: "2026-10-01", // 14 dagen geleden (in 30d, niet in 7d)
          snapshot: { exercises: [makeMockSnap("e2", "Bench")] },
        }),
        createMockSession({
          id: "s3",
          calendarDate: "2026-08-15", // ~61 dagen geleden (in 90d, niet in 30d)
          snapshot: { exercises: [makeMockSnap("e3", "Deadlift")] },
          notes: "Zware rugsessie met deadlifts",
        }),
        createMockSession({
          id: "s4",
          calendarDate: "2025-12-01", // ~10 maanden geleden (in 1y, niet in 90d)
          snapshot: { exercises: [makeMockSnap("e1", "Squat")] },
        }),
        createMockSession({
          id: "s5",
          calendarDate: "2024-01-01", // > 1 jaar geleden
          snapshot: { exercises: [makeMockSnap("e1", "Squat")] },
        }),
      ];

      // 7 dagen filter
      const res7d = filterWorkoutSessions(testSessions, "7d", { now: fixedNow });
      expect(res7d.map((s) => s.id)).toEqual(["s1"]);

      // 30 dagen filter
      const res30d = filterWorkoutSessions(testSessions, "30d", { now: fixedNow });
      expect(res30d.map((s) => s.id)).toEqual(["s1", "s2"]);

      // 90 dagen filter
      const res90d = filterWorkoutSessions(testSessions, "90d", { now: fixedNow });
      expect(res90d.map((s) => s.id)).toEqual(["s1", "s2", "s3"]);

      // 1 jaar filter
      const res1y = filterWorkoutSessions(testSessions, "1y", { now: fixedNow });
      expect(res1y.map((s) => s.id)).toEqual(["s1", "s2", "s3", "s4"]);

      // All filter
      const resAll = filterWorkoutSessions(testSessions, "all", { now: fixedNow });
      expect(resAll.length).toBe(5);

      // Custom datum bereik filter (2026-08-01 tot 2026-10-05)
      const resCustom = filterWorkoutSessions(testSessions, "custom", {
        customRange: { startDate: "2026-08-01", endDate: "2026-10-05" },
        now: fixedNow,
      });
      expect(resCustom.map((s) => s.id)).toEqual(["s2", "s3"]);

      // Zoeken op oefening naam "deadlift"
      const resSearchEx = filterWorkoutSessions(testSessions, "all", {
        searchQuery: "deadlift",
      });
      expect(resSearchEx.map((s) => s.id)).toEqual(["s3"]);

      // Zoeken op notitie "zware rugsessie"
      const resSearchNotes = filterWorkoutSessions(testSessions, "all", {
        searchQuery: "rugsessie",
      });
      expect(resSearchNotes.map((s) => s.id)).toEqual(["s3"]);
    });

    it("doorzoekt sessies via repository searchSessions methode", async () => {
      // Voeg 2 sessies toe in database
      const s1 = await repos.workout.startEmptyWorkout({
        workoutName: "Full Body Krachttraining",
        notes: "Goede focus op core",
      });
      await repos.workout.finishSession(s1.id);

      const s2 = await repos.workout.startEmptyWorkout({
        workoutName: "Leg Day Squats",
        notes: "Knie voelde stabiel",
      });
      await repos.workout.finishSession(s2.id);

      const search1 = await repos.workout.searchSessions("Body");
      expect(search1.length).toBe(1);
      expect(search1[0].id).toBe(s1.id);

      const search2 = await repos.workout.searchSessions("stabiel");
      expect(search2.length).toBe(1);
      expect(search2[0].id).toBe(s2.id);
    });
  });

  // =========================================================================
  // 2. OEFENPROGRESSIE EN GRAFIEKPUNTEN VOOR EXTERNE BELASTING
  // =========================================================================
  describe("Progressieberekening voor externe belasting (gewicht & reps)", () => {
    it("berekent max weight, reps, volume en 1RM per sessie", async () => {
      // Sessie 1: 80 kg x 8 reps, 85 kg x 6 reps
      const s1 = await repos.workout.startEmptyWorkout({
        calendarDate: "2026-10-10",
        workoutName: "Borst Sessie 1",
      });
      await repos.workout.addExerciseToActiveSession(s1.id, {
        exerciseId: benchPressExercise.id,
        targetSets: 2,
      });
      const s1Sets = await repos.workout.getSetsForSession(s1.id);
      await repos.workout.saveWorkoutSet({
        ...s1Sets[0],
        weightKg: 80,
        reps: 8,
        actualRpe: 8,
        completed: true,
      });
      await repos.workout.saveWorkoutSet({
        ...s1Sets[1],
        weightKg: 85,
        reps: 6,
        actualRpe: 9,
        completed: true,
      });
      await repos.workout.finishSession(s1.id);

      // Sessie 2: 90 kg x 5 reps (nieuw PR gewicht)
      const s2 = await repos.workout.startEmptyWorkout({
        calendarDate: "2026-10-12",
        workoutName: "Borst Sessie 2",
      });
      await repos.workout.addExerciseToActiveSession(s2.id, {
        exerciseId: benchPressExercise.id,
        targetSets: 1,
      });
      const s2Sets = await repos.workout.getSetsForSession(s2.id);
      await repos.workout.saveWorkoutSet({
        ...s2Sets[0],
        weightKg: 90,
        reps: 5,
        actualRpe: 9.5,
        completed: true,
      });
      await repos.workout.finishSession(s2.id);

      const progression = await repos.workout.getExerciseProgression(
        benchPressExercise.id
      );

      expect(progression.points.length).toBe(2);

      // Sessie 1 controle
      const p1 = progression.points[0];
      expect(p1.maxWeightKg).toBe(85);
      expect(p1.maxReps).toBe(8);
      // Volume: (80 * 8) + (85 * 6) = 640 + 510 = 1150 kg
      expect(p1.worksetVolumeKg).toBe(1150);
      expect(p1.averageRpe).toBe(8.5); // (8 + 9) / 2
      expect(p1.estimated1RM).toBeGreaterThan(100);

      // Sessie 2 controle
      const p2 = progression.points[1];
      expect(p2.maxWeightKg).toBe(90);
      expect(p2.maxReps).toBe(5);
      expect(p2.worksetVolumeKg).toBe(450); // 90 * 5
      expect(p2.averageRpe).toBe(9.5);
    });
  });

  // =========================================================================
  // 3. ASSISTED EN LICHAAMSGEWICHT OEFENINGEN
  // =========================================================================
  describe("Assisted en lichaamsgewicht oefeningen", () => {
    it("geeft 0 tonnage volume voor assisted machines en markeert minder tegengewicht als progressie", async () => {
      // Sessie 1: 30 kg tegengewicht hulp x 8 reps
      const s1 = await repos.workout.startEmptyWorkout({
        calendarDate: "2026-10-10",
        workoutName: "Rug 1",
      });
      await repos.workout.addExerciseToActiveSession(s1.id, {
        exerciseId: pullUpAssistedExercise.id,
        targetSets: 1,
      });
      const sets1 = await repos.workout.getSetsForSession(s1.id);
      await repos.workout.saveWorkoutSet({
        ...sets1[0],
        weightKg: 30, // 30 kg hulp
        reps: 8,
        completed: true,
        isAssisted: true,
      });
      await repos.workout.finishSession(s1.id);

      // Sessie 2: 20 kg tegengewicht hulp (minder hulp = sterker!)
      const s2 = await repos.workout.startEmptyWorkout({
        calendarDate: "2026-10-12",
        workoutName: "Rug 2",
      });
      await repos.workout.addExerciseToActiveSession(s2.id, {
        exerciseId: pullUpAssistedExercise.id,
        targetSets: 1,
      });
      const sets2 = await repos.workout.getSetsForSession(s2.id);
      await repos.workout.saveWorkoutSet({
        ...sets2[0],
        weightKg: 20, // 20 kg hulp
        reps: 8,
        completed: true,
        isAssisted: true,
      });
      await repos.workout.finishSession(s2.id);

      const progression = await repos.workout.getExerciseProgression(
        pullUpAssistedExercise.id
      );

      expect(progression.points.length).toBe(2);

      // Volume tonnage moet 0 zijn (geen extern getild gewicht)
      expect(progression.points[0].worksetVolumeKg).toBe(0);
      expect(progression.points[1].worksetVolumeKg).toBe(0);
      expect(progression.points[0].volumeDefinition).toContain("Assisted machine");

      // Inverted progression check: 20 kg hulp is een betere prestatie dan 30 kg hulp
      expect(progression.points[1].maxWeightKg).toBe(20);
      expect(progression.points[0].maxWeightKg).toBe(30);
    });

    it("behandelt lichaamsgewicht volume correct met en zonder bekend lichaamsgewicht", () => {
      const mockSession = createMockSession({
        id: "s-pushup",
        calendarDate: "2026-10-15",
        snapshot: {
          exercises: [
            {
              exerciseId: pushUpBodyweightExercise.id,
              exerciseName: pushUpBodyweightExercise.name,
              primaryMuscleGroup: "borst",
              measurementType: "lichaamsgewicht",
              targetSets: 3,
              restSeconds: 60,
            },
          ],
        },
      });

      const mockSets: WorkoutSet[] = [
        {
          id: "set-pu-1",
          sessionId: "s-pushup",
          exerciseId: pushUpBodyweightExercise.id,
          setNumber: 1,
          setType: "normal",
          weightKg: 0,
          reps: 25,
          completed: true,
          targetRpe: null,
          actualRpe: null,
          restTimeSeconds: 60,
          loggedAt: "2026-10-15T10:05:00Z",
        },
      ];

      // Zonder bekend lichaamsgewicht
      const pointsWithoutWeight = buildExerciseProgressionPoints(
        pushUpBodyweightExercise,
        [mockSession],
        mockSets,
        null
      );
      expect(pointsWithoutWeight[0].worksetVolumeKg).toBe(0);
      expect(pointsWithoutWeight[0].maxReps).toBe(25);
      expect(pointsWithoutWeight[0].volumeDefinition).toContain(
        "Lichaamsgewicht"
      );

      // Met bekend lichaamsgewicht van 75 kg
      const pointsWithWeight = buildExerciseProgressionPoints(
        pushUpBodyweightExercise,
        [mockSession],
        mockSets,
        75
      );
      // Volume = 75 kg * 25 reps = 1875 kg
      expect(pointsWithWeight[0].worksetVolumeKg).toBe(1875);
      expect(pointsWithWeight[0].volumeDefinition).toContain("75 kg lichaamsgewicht");
    });
  });

  // =========================================================================
  // 4. PRESENTATIE LB CONVERSIE ZONDER MUTATIE VAN DE DATABASE
  // =========================================================================
  describe("Eenheidsconversie (kg naar lb) zonder databasemutatie", () => {
    it("converteert progressiepunten naar lbs zuiver in het domein terwijl IndexedDB in kg blijft", async () => {
      const s = await repos.workout.startEmptyWorkout({ workoutName: "Test Lbs" });
      await repos.workout.addExerciseToActiveSession(s.id, {
        exerciseId: benchPressExercise.id,
        targetSets: 1,
      });
      const sets = await repos.workout.getSetsForSession(s.id);
      await repos.workout.saveWorkoutSet({
        ...sets[0],
        weightKg: 100, // 100 kg
        reps: 10,
        completed: true,
      });
      await repos.workout.finishSession(s.id);

      const metricProgression = await repos.workout.getExerciseProgression(
        benchPressExercise.id
      );
      expect(metricProgression.points[0].maxWeightKg).toBe(100);
      expect(metricProgression.points[0].worksetVolumeKg).toBe(1000);

      // Presentatie conversie naar lbs
      const imperialPoints = convertProgressionPointsToLbs(
        metricProgression.points
      );
      // 100 kg ≈ 220.46 lbs
      expect(imperialPoints[0].maxWeightKg).toBe(220.5);
      expect(imperialPoints[0].worksetVolumeKg).toBe(2204.6);

      // Controleer dat de database onveranderd 100 kg bewaart
      const dbSets = await repos.workout.getSetsForSession(s.id);
      expect(dbSets[0].weightKg).toBe(100);
    });
  });

  // =========================================================================
  // 5. BEWERKEN EN VERWIJDEREN WERKT DIRECT DOOR IN PROGRESSIE
  // =========================================================================
  describe("Real-time updates bij bewerken en verwijderen van oude sessies", () => {
    it("werkt progressie direct bij als een set in een oude sessie wordt gewijzigd of verwijderd", async () => {
      const s = await repos.workout.startEmptyWorkout({
        workoutName: "Oude Sessie",
      });
      await repos.workout.addExerciseToActiveSession(s.id, {
        exerciseId: benchPressExercise.id,
        targetSets: 1,
      });
      const sets = await repos.workout.getSetsForSession(s.id);
      await repos.workout.saveWorkoutSet({
        ...sets[0],
        weightKg: 80,
        reps: 8,
        completed: true,
      });
      await repos.workout.finishSession(s.id);

      let prog = await repos.workout.getExerciseProgression(
        benchPressExercise.id
      );
      expect(prog.points[0].maxWeightKg).toBe(80);
      expect(prog.points[0].worksetVolumeKg).toBe(640);

      // Pas het gewicht van de voltooide set aan naar 95 kg
      await repos.workout.updateWorkoutSet(sets[0].id, {
        weightKg: 95,
      });

      // Progressie reflecteert direct de gecorrigeerde set
      prog = await repos.workout.getExerciseProgression(benchPressExercise.id);
      expect(prog.points[0].maxWeightKg).toBe(95);
      expect(prog.points[0].worksetVolumeKg).toBe(760);

      // Verwijder de hele sessie
      await repos.workout.deleteCompletedSession(s.id);

      // Progressie moet nu 0 datapunten bevatten
      prog = await repos.workout.getExerciseProgression(benchPressExercise.id);
      expect(prog.points.length).toBe(0);
    });
  });

  // =========================================================================
  // 6. ENKELPUNTS EN LEGE STATUSSEN
  // =========================================================================
  describe("Enkelpunts en lege status van grafieken", () => {
    it("geeft een lege array voor ongetrainde oefeningen zonder te crashen", async () => {
      const prog = await repos.workout.getExerciseProgression(
        benchPressExercise.id
      );
      expect(prog.points).toEqual([]);
      expect(prog.exercise?.id).toBe(benchPressExercise.id);
    });

    it("levert exact 1 datapunt bij 1 voltooide sessie voor stabiele grafiekweergave", async () => {
      const s = await repos.workout.startEmptyWorkout({
        workoutName: "Eerste Keer",
      });
      await repos.workout.addExerciseToActiveSession(s.id, {
        exerciseId: benchPressExercise.id,
        targetSets: 1,
      });
      const sets = await repos.workout.getSetsForSession(s.id);
      await repos.workout.saveWorkoutSet({
        ...sets[0],
        weightKg: 70,
        reps: 10,
        completed: true,
      });
      await repos.workout.finishSession(s.id);

      const prog = await repos.workout.getExerciseProgression(
        benchPressExercise.id
      );
      expect(prog.points.length).toBe(1);
      expect(prog.points[0].maxWeightKg).toBe(70);
      expect(prog.points[0].completedSetsCount).toBe(1);
    });
  });
});
