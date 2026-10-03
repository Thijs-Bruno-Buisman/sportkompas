import { describe, it, expect } from "vitest";
import {
  calculateEligible1RM,
  evaluateSetForPRs,
  detectSessionPRs,
  getRecentAchievedPRs,
} from "./personalRecords";
import type { WorkoutSession, WorkoutSet, Exercise } from "@/types/database";

describe("Stap 14 — Persoonlijke Records (PR) & Geschatte 1RM Domeinlogica", () => {
  const mockBenchPress: Exercise = {
    id: "ex-bench",
    name: "Bankdrukken (Barbell)",
    category: "kracht",
    primaryMuscleGroup: "borst",
    secondaryMuscleGroups: ["schouders", "armen"],
    equipment: "barbell",
    measurementType: "gewicht_herhalingen",
    isCustom: false,
    isArchived: false,
    instructions: "Druk de stang gecontroleerd uit.",
    provenance: { source: "system" },
    createdAt: "2026-01-01T00:00:00Z",
  };

  const mockAssistedPullup: Exercise = {
    id: "ex-assisted-pullup",
    name: "Assisted Pull-up Machine",
    category: "kracht",
    primaryMuscleGroup: "rug",
    secondaryMuscleGroups: ["armen"],
    equipment: "machine",
    measurementType: "assisted",
    isCustom: false,
    isArchived: false,
    instructions: "Stel tegengewicht in.",
    provenance: { source: "system" },
    createdAt: "2026-01-01T00:00:00Z",
  };

  const mockBodyweightPushup: Exercise = {
    id: "ex-pushup",
    name: "Push-up",
    category: "lichaamsgewicht",
    primaryMuscleGroup: "borst",
    secondaryMuscleGroups: ["armen"],
    equipment: "lichaamsgewicht",
    measurementType: "lichaamsgewicht",
    isCustom: false,
    isArchived: false,
    instructions: "Druk op vanaf de vloer.",
    provenance: { source: "system" },
    createdAt: "2026-01-01T00:00:00Z",
  };

  const mockSessionDay1: WorkoutSession = {
    id: "session-1",
    calendarDate: "2026-10-01",
    startTime: "2026-10-01T10:00:00Z",
    endTime: "2026-10-01T11:00:00Z",
    status: "afgerond",
    currentExerciseIndex: 0,
    activeExerciseId: null,
    routineId: null,
    routineDayId: null,
    routineVersion: null,
    snapshot: {
      routineName: "Workout Dag 1",
      routineDayName: "Borst",
      exercises: [
        {
          exerciseId: "ex-bench",
          exerciseName: "Bankdrukken (Barbell)",
          primaryMuscleGroup: "borst",
          measurementType: "gewicht_herhalingen",
          targetSets: 3,
          restSeconds: 90,
        },
      ],
    },
    overallRpe: 8,
    notes: "",
    provenance: { source: "user" },
    updatedAt: "2026-10-01T11:00:00Z",
  };

  const mockSessionDay2: WorkoutSession = {
    id: "session-2",
    calendarDate: "2026-10-08",
    startTime: "2026-10-08T10:00:00Z",
    endTime: "2026-10-08T11:00:00Z",
    status: "afgerond",
    currentExerciseIndex: 0,
    activeExerciseId: null,
    routineId: null,
    routineDayId: null,
    routineVersion: null,
    snapshot: {
      routineName: "Workout Dag 2",
      routineDayName: "Borst",
      exercises: [
        {
          exerciseId: "ex-bench",
          exerciseName: "Bankdrukken (Barbell)",
          primaryMuscleGroup: "borst",
          measurementType: "gewicht_herhalingen",
          targetSets: 3,
          restSeconds: 90,
        },
      ],
    },
    overallRpe: 8.5,
    notes: "",
    provenance: { source: "user" },
    updatedAt: "2026-10-08T11:00:00Z",
  };

  // =========================================================================
  // 1. 1RM GRENZEN EN MEETMETHODES
  // =========================================================================
  describe("calculateEligible1RM (grenzen en geschiktheid)", () => {
    it("berekent 1RM nauwkeurig bij 1 t/m 10 herhalingen voor gewichtsoefeningen", () => {
      // 1 rep = exact het getilde gewicht
      const single = calculateEligible1RM(100, 1, "gewicht_herhalingen");
      expect(single).not.toBeNull();
      expect(single!.estimated1RMKg).toBe(100);

      // 5 reps @ 100 kg met Epley: 100 * (1 + 5/30) = 116.7 kg
      const epley5 = calculateEligible1RM(100, 5, "gewicht_herhalingen", "epley");
      expect(epley5).not.toBeNull();
      expect(epley5!.estimated1RMKg).toBe(116.7);
      expect(epley5!.formulaExplanation).toContain("Epley");

      // 5 reps @ 100 kg met Brzycki: 100 * (36 / 32) = 112.5 kg
      const brzycki5 = calculateEligible1RM(100, 5, "gewicht_herhalingen", "brzycki");
      expect(brzycki5).not.toBeNull();
      expect(brzycki5!.estimated1RMKg).toBe(112.5);
      expect(brzycki5!.formulaExplanation).toContain("Brzycki");

      // 10 reps @ 100 kg (max grens van bereik)
      const maxRange = calculateEligible1RM(100, 10, "gewicht_herhalingen");
      expect(maxRange).not.toBeNull();
      expect(maxRange!.estimated1RMKg).toBe(133.3);
    });

    it("weigert 1RM berekening boven 10 herhalingen wegens onbetrouwbaarheid", () => {
      // 11 reps -> null
      const aboveRange = calculateEligible1RM(100, 11, "gewicht_herhalingen");
      expect(aboveRange).toBeNull();

      // 20 reps -> null
      const highReps = calculateEligible1RM(60, 20, "gewicht_herhalingen");
      expect(highReps).toBeNull();
    });

    it("weigert 1RM berekening voor ongeschikte meettypes (assisted, lichaamsgewicht)", () => {
      const assisted = calculateEligible1RM(30, 8, "assisted");
      expect(assisted).toBeNull();

      const bodyweight = calculateEligible1RM(0, 10, "lichaamsgewicht");
      expect(bodyweight).toBeNull();

      const timeBased = calculateEligible1RM(0, 1, "tijd");
      expect(timeBased).toBeNull();

      // extra_gewicht is wél geschikt
      const extraWeight = calculateEligible1RM(20, 5, "extra_gewicht");
      expect(extraWeight).not.toBeNull();
    });
  });

  // =========================================================================
  // 2. PR DETECTIE: VERBETERING, GELIJKE SCORE EN INCOMPLETE SETS
  // =========================================================================
  describe("PR-detectie en evaluatie", () => {
    it("geeft NOOIT een PR voor een incomplete set", () => {
      const incompleteSet: WorkoutSet = {
        id: "set-inc",
        sessionId: "session-1",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 200, // Enorm gewicht, maar niet afgerond
        reps: 10,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: false, // Incomplete!
        loggedAt: "2026-10-01T10:05:00Z",
      };

      const prs = evaluateSetForPRs(incompleteSet, mockBenchPress, mockSessionDay1, []);
      expect(prs).toEqual([]);
    });

    it("detecteert zwaarste gewicht, reps bij gewicht en geschatte 1RM bij verbetering", () => {
      const priorSet: WorkoutSet = {
        id: "set-1",
        sessionId: "session-1",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 8,
        targetRpe: null,
        actualRpe: 8,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      // Kandidaat set: 90 kg x 6 reps (zwaarder gewicht!)
      const newHeavierSet: WorkoutSet = {
        id: "set-2",
        sessionId: "session-2",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 90,
        reps: 6,
        targetRpe: null,
        actualRpe: 8.5,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-08T10:05:00Z",
      };

      const prs = evaluateSetForPRs(
        newHeavierSet,
        mockBenchPress,
        mockSessionDay2,
        [priorSet]
      );

      // Moet max_weight PR zijn (90 > 80)
      const weightPR = prs.find((p) => p.category === "max_weight");
      expect(weightPR).toBeDefined();
      expect(weightPR!.value).toBe(90);
      expect(weightPR!.previousValue).toBe(80);

      // Moet geschatte 1RM PR zijn (90 * (1 + 6/30) = 108 kg > 80 * (1 + 8/30) = 101.3 kg)
      const est1rmPR = prs.find((p) => p.category === "estimated_1rm");
      expect(est1rmPR).toBeDefined();
      expect(est1rmPR!.value).toBe(108);
      expect(est1rmPR!.previousValue).toBe(101.3);
      expect(est1rmPR!.isEstimated).toBe(true);
    });

    it("detecteert een 'reps at weight' PR wanneer meer herhalingen op ditzelfde gewicht worden gehaald", () => {
      const priorSet: WorkoutSet = {
        id: "set-1",
        sessionId: "session-1",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      // Kandidaat: Zelfde gewicht (80 kg), maar 10 herhalingen!
      const moreRepsSet: WorkoutSet = {
        id: "set-2",
        sessionId: "session-2",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 10,
        targetRpe: null,
        actualRpe: 9,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-08T10:05:00Z",
      };

      const prs = evaluateSetForPRs(
        moreRepsSet,
        mockBenchPress,
        mockSessionDay2,
        [priorSet]
      );

      // Geen max_weight PR (80 is niet zwaarder dan 80)
      expect(prs.find((p) => p.category === "max_weight")).toBeUndefined();

      // Wél reps_at_weight PR (10 reps @ 80 kg > 8 reps @ 80 kg)
      const repPR = prs.find((p) => p.category === "reps_at_weight");
      expect(repPR).toBeDefined();
      expect(repPR!.value).toBe(10);
      expect(repPR!.previousValue).toBe(8);
      expect(repPR!.formattedValue).toBe("10 herhalingen @ 80 kg");
    });

    it("behandelt GELIJKE prestaties (ties) bewust als GEEN nieuw record", () => {
      const priorSet: WorkoutSet = {
        id: "set-1",
        sessionId: "session-1",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 100,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      // Identieke set in sessie 2 (100 kg x 8 reps)
      const equalSet: WorkoutSet = {
        id: "set-2",
        sessionId: "session-2",
        exerciseId: "ex-bench",
        setNumber: 1,
        setType: "normal",
        weightKg: 100,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-08T10:05:00Z",
      };

      const prs = evaluateSetForPRs(
        equalSet,
        mockBenchPress,
        mockSessionDay2,
        [priorSet]
      );

      // Een gelijke prestatie mag NOOIT als nieuw record tellen!
      expect(prs).toEqual([]);
    });
  });

  // =========================================================================
  // 3. ASSISTED MACHINES (MINDER TEGENGEWICHT IS BETER)
  // =========================================================================
  describe("Assisted machine records (omgekeerde progressie)", () => {
    it("detecteert een PR bij MINDER tegengewicht hulp en negeert méér hulp", () => {
      const priorAssistedSet: WorkoutSet = {
        id: "set-ass-1",
        sessionId: "session-1",
        exerciseId: "ex-assisted-pullup",
        setNumber: 1,
        setType: "normal",
        weightKg: 35, // 35 kg machinehulp
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        isAssisted: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      // Verbetering: Slechts 25 kg hulp (10 kg minder tegengewicht = sterker!)
      const improvedAssistedSet: WorkoutSet = {
        id: "set-ass-2",
        sessionId: "session-2",
        exerciseId: "ex-assisted-pullup",
        setNumber: 1,
        setType: "normal",
        weightKg: 25,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        isAssisted: true,
        loggedAt: "2026-10-08T10:05:00Z",
      };

      const prs = evaluateSetForPRs(
        improvedAssistedSet,
        mockAssistedPullup,
        mockSessionDay2,
        [priorAssistedSet]
      );

      const leastAssistancePR = prs.find((p) => p.category === "least_assistance");
      expect(leastAssistancePR).toBeDefined();
      expect(leastAssistancePR!.value).toBe(25);
      expect(leastAssistancePR!.previousValue).toBe(35);

      // Achteruitgang / meer hulp (bv. 40 kg hulp) mag NOOIT een PR zijn
      const worseSet: WorkoutSet = {
        ...improvedAssistedSet,
        id: "set-ass-3",
        weightKg: 40,
      };
      const worsePRs = evaluateSetForPRs(
        worseSet,
        mockAssistedPullup,
        mockSessionDay2,
        [priorAssistedSet]
      );
      expect(worsePRs).toEqual([]);
    });
  });

  // =========================================================================
  // 4. SESSIE PR DETECTIE EN CHRONOLOGISCH HERSTEL BIJ VERWIJDERING
  // =========================================================================
  describe("detectSessionPRs en historische consistentie", () => {
    it("detecteert correct alle PR's binnen een afgeronde sessie", () => {
      const set1: WorkoutSet = {
        id: "s1-set1",
        sessionId: mockSessionDay1.id,
        exerciseId: mockBenchPress.id,
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      const set2: WorkoutSet = {
        id: "s2-set1",
        sessionId: mockSessionDay2.id,
        exerciseId: mockBenchPress.id,
        setNumber: 1,
        setType: "normal",
        weightKg: 100,
        reps: 5,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-08T10:05:00Z",
      };

      const allSessions = [mockSessionDay1, mockSessionDay2];
      const allSets = [set1, set2];

      const s2PRs = detectSessionPRs(
        mockSessionDay2,
        allSessions,
        allSets,
        [mockBenchPress]
      );

      expect(s2PRs.length).toBeGreaterThan(0);
      expect(s2PRs.some((p) => p.category === "max_weight" && p.value === 100)).toBe(true);
    });

    it("herstelt vorig record bij verwijdering van een recordbrekende sessie", () => {
      // Sessie 1: 80 kg
      // Sessie 2: 100 kg (nieuw record)
      // Als Sessie 2 wordt verwijderd uit de collectie, heeft Sessie 1 weer het record
      const set1: WorkoutSet = {
        id: "s1-set1",
        sessionId: mockSessionDay1.id,
        exerciseId: mockBenchPress.id,
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      // Zonder sessie 2 is sessie 1 het all-time record
      const sessionsRemaining = [mockSessionDay1];
      const setsRemaining = [set1];

      const s1PRs = detectSessionPRs(
        mockSessionDay1,
        sessionsRemaining,
        setsRemaining,
        [mockBenchPress]
      );

      const maxWeightPR = s1PRs.find((p) => p.category === "max_weight");
      expect(maxWeightPR).toBeDefined();
      expect(maxWeightPR!.value).toBe(80);
      // Geen sporen meer van de verwijderde 100 kg
    });
  });

  // =========================================================================
  // 5. 'DEZE WEEK' PR'S OVERZICHT (VOOR HOME)
  // =========================================================================
  describe("getRecentAchievedPRs (voor 'Deze week' overzicht)", () => {
    it("haalt alleen PR's op van de afgelopen 7 dagen", () => {
      const fixedNow = new Date("2026-10-09T12:00:00Z");

      // Sessie 1 is van 8 dagen geleden (2026-10-01) -> Buiten 'deze week'
      // Sessie 2 is van 1 dag geleden (2026-10-08) -> Binnen 'deze week'
      const set1: WorkoutSet = {
        id: "s1-set1",
        sessionId: mockSessionDay1.id,
        exerciseId: mockBenchPress.id,
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 8,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-01T10:05:00Z",
      };

      const set2: WorkoutSet = {
        id: "s2-set1",
        sessionId: mockSessionDay2.id,
        exerciseId: mockBenchPress.id,
        setNumber: 1,
        setType: "normal",
        weightKg: 100,
        reps: 6,
        targetRpe: null,
        actualRpe: null,
        restTimeSeconds: 90,
        completed: true,
        loggedAt: "2026-10-08T10:05:00Z",
      };

      const recentPRs = getRecentAchievedPRs(
        [mockSessionDay1, mockSessionDay2],
        [set1, set2],
        [mockBenchPress],
        7,
        fixedNow
      );

      // Alleen de PR's van sessie 2 (1 dag geleden) mogen geretourneerd worden
      expect(recentPRs.every((p) => p.sessionId === mockSessionDay2.id)).toBe(true);
      expect(recentPRs.some((p) => p.category === "max_weight" && p.value === 100)).toBe(true);
    });
  });
});
