import { describe, it, expect } from "vitest";
import {
  calculateWeeklyMuscleVolume,
  calculateWeeklyConsistency,
  getMuscleVolumeStatus,
} from "./muscleVolume";
import type {
  WorkoutSession,
  WorkoutSet,
  Exercise,
} from "@/types/database";

describe("Stap 16 — Spiergroepen Volume & Wekelijkse Consistentie (Domeintests)", () => {
  const benchPress: Exercise = {
    id: "ex-bench",
    name: "Bankdrukken (Barbell)",
    category: "kracht",
    primaryMuscleGroup: "borst",
    secondaryMuscleGroups: ["schouders", "armen"],
    equipment: "barbell",
    measurementType: "gewicht_herhalingen",
    isCustom: false,
    isArchived: false,
    instructions: "Barbell bench press",
    provenance: { source: "system" },
    createdAt: "2026-01-01T00:00:00Z",
  };

  const squat: Exercise = {
    id: "ex-squat",
    name: "Barbell Squat",
    category: "kracht",
    primaryMuscleGroup: "benen",
    secondaryMuscleGroups: ["core"],
    equipment: "barbell",
    measurementType: "gewicht_herhalingen",
    isCustom: false,
    isArchived: false,
    instructions: "Squat",
    provenance: { source: "system" },
    createdAt: "2026-01-01T00:00:00Z",
  };

  const createSession = (
    id: string,
    calendarDate: string,
    status: "afgerond" | "actief" | "geannuleerd" = "afgerond"
  ): WorkoutSession => ({
    id,
    calendarDate,
    startTime: `${calendarDate}T10:00:00Z`,
    endTime: `${calendarDate}T11:00:00Z`,
    status,
    routineId: null,
    routineDayId: null,
    routineVersion: null,
    snapshot: {
      routineName: "Test Routine",
      exercises: [],
    },
    overallRpe: null,
    notes: "",
    provenance: { source: "user" },
  });

  const createSet = (
    id: string,
    sessionId: string,
    exerciseId: string,
    weightKg: number,
    reps: number,
    completed = true,
    setType: "normal" | "warmup" | "drop" = "normal"
  ): WorkoutSet => ({
    id,
    sessionId,
    exerciseId,
    setNumber: 1,
    setType,
    weightKg,
    reps,
    targetRpe: null,
    actualRpe: null,
    restTimeSeconds: 90,
    completed,
    loggedAt: new Date().toISOString(),
    completedAt: completed ? new Date().toISOString() : undefined,
  });

  describe("calculateWeeklyMuscleVolume (Spiergroepen volume)", () => {
    it("telt primaire spiergroepen als 1.0 en secundaire apart als 0.5 zonder dubbeltelling", () => {
      const session = createSession("s1", "2026-10-05");
      // 3 werksets bankdrukken (80 kg x 10)
      const sets = [
        createSet("set1", "s1", benchPress.id, 80, 10),
        createSet("set2", "s1", benchPress.id, 80, 10),
        createSet("set3", "s1", benchPress.id, 80, 10),
      ];

      const report = calculateWeeklyMuscleVolume({
        sessions: [session],
        sets,
        exercises: [benchPress],
        weekStartDate: "2026-10-05", // Maandag 5 okt 2026
      });

      expect(report.totalCompletedWorksets).toBe(3);
      expect(report.totalTonnageKg).toBe(2400); // 3 * 80 * 10

      // Primaire spiergroep (borst)
      const borst = report.muscleGroups.borst;
      expect(borst.primarySets).toBe(3);
      expect(borst.secondarySets).toBe(0);
      expect(borst.fractionalTotalSets).toBe(3);
      expect(borst.totalTonnageKg).toBe(2400);

      // Secundaire spiergroepen (schouders en armen) tellen NIET als 3 volledige sets
      const schouders = report.muscleGroups.schouders;
      expect(schouders.primarySets).toBe(0);
      expect(schouders.secondarySets).toBe(3);
      expect(schouders.fractionalTotalSets).toBe(1.5); // 3 * 0.5

      const armen = report.muscleGroups.armen;
      expect(armen.primarySets).toBe(0);
      expect(armen.secondarySets).toBe(3);
      expect(armen.fractionalTotalSets).toBe(1.5); // 3 * 0.5

      // Overige spiergroepen zijn leeg
      expect(report.muscleGroups.benen.primarySets).toBe(0);
      expect(report.muscleGroups.benen.secondarySets).toBe(0);
    });

    it("sluit opwarmsets en incomplete sets standaard uit van de telling", () => {
      const session = createSession("s1", "2026-10-06");
      const sets = [
        // 2 warming-up sets (mogen NIET meetellen)
        createSet("w1", "s1", benchPress.id, 40, 15, true, "warmup"),
        createSet("w2", "s1", benchPress.id, 60, 10, true, "warmup"),
        // 1 incomplete set (mag NIET meetellen)
        createSet("inc1", "s1", benchPress.id, 80, 0, false, "normal"),
        // 2 geldige werksets
        createSet("ws1", "s1", benchPress.id, 80, 10, true, "normal"),
        createSet("ws2", "s1", benchPress.id, 80, 10, true, "normal"),
      ];

      const report = calculateWeeklyMuscleVolume({
        sessions: [session],
        sets,
        exercises: [benchPress],
        weekStartDate: "2026-10-05",
      });

      expect(report.totalCompletedWorksets).toBe(2);
      expect(report.muscleGroups.borst.primarySets).toBe(2);
      expect(report.muscleGroups.schouders.secondarySets).toBe(2);
    });

    it("negeert sessies die geannuleerd of nog actief zijn", () => {
      const sActive = createSession("s-active", "2026-10-06", "actief");
      const sCancelled = createSession("s-cancelled", "2026-10-07", "geannuleerd");
      const sFinished = createSession("s-done", "2026-10-08", "afgerond");

      const sets = [
        createSet("setA", "s-active", squat.id, 100, 5),
        createSet("setC", "s-cancelled", squat.id, 100, 5),
        createSet("setD", "s-done", squat.id, 100, 5),
      ];

      const report = calculateWeeklyMuscleVolume({
        sessions: [sActive, sCancelled, sFinished],
        sets,
        exercises: [squat],
        weekStartDate: "2026-10-05",
      });

      expect(report.totalCompletedWorksets).toBe(1);
      expect(report.muscleGroups.benen.primarySets).toBe(1);
    });

    it("verwerkt correct de maand- en jaargrens (31 december naar 1 januari)", () => {
      // Week van maandag 28 dec 2026 t/m zondag 3 jan 2027
      const sOldYear = createSession("s-old", "2026-12-31");
      const sNewYear = createSession("s-new", "2027-01-01");
      const sOutOfWeek = createSession("s-out", "2027-01-04"); // Volgende week

      const sets = [
        createSet("set1", "s-old", benchPress.id, 80, 10),
        createSet("set2", "s-new", squat.id, 100, 5),
        createSet("set3", "s-out", benchPress.id, 80, 10),
      ];

      const report = calculateWeeklyMuscleVolume({
        sessions: [sOldYear, sNewYear, sOutOfWeek],
        sets,
        exercises: [benchPress, squat],
        weekStartDate: "2026-12-28",
      });

      expect(report.totalCompletedWorksets).toBe(2);
      expect(report.muscleGroups.borst.primarySets).toBe(1);
      expect(report.muscleGroups.benen.primarySets).toBe(1);
      expect(report.weekStartDate).toBe("2026-12-28");
      expect(report.weekEndDate).toBe("2027-01-03");
    });

    it("maakt de telmethode en disclaimer zichtbaar zonder overtraining claims", () => {
      const report = calculateWeeklyMuscleVolume({
        sessions: [],
        sets: [],
        exercises: [],
        weekStartDate: "2026-10-05",
      });

      expect(report.countingMethodDescription).toContain("Primaire spiergroepen tellen als 1,0 set");
      expect(report.countingMethodDescription).toContain("Secundaire hulpspiergroepen tellen apart mee als 0,5 set");
      expect(report.disclaimer).toContain("voorkomt op zichzelf geen overtraining");
    });
  });

  describe("calculateWeeklyConsistency (Wekelijkse Consistentie & Trainingsdoel)", () => {
    it("berekent consistentie als behaalde trainingsweken t.o.v. het weekdoel", () => {
      // Doel: 3 trainingen per week
      // Week 1 (vorige week): 3 trainingen -> Gehaald
      // Week 2 (huidige week): 2 trainingen -> Nog niet gehaald
      const s1 = createSession("s1", "2026-09-28");
      const s2 = createSession("s2", "2026-09-30");
      const s3 = createSession("s3", "2026-10-02");

      const s4 = createSession("s4", "2026-10-05");
      const s5 = createSession("s5", "2026-10-07");

      const report = calculateWeeklyConsistency({
        sessions: [s1, s2, s3, s4, s5],
        weeklyGoal: 3,
        referenceDateStr: "2026-10-08", // Donderdag in huidige week
        weekStartsOn: "maandag",
        historyWeeksCount: 2,
      });

      expect(report.weeklyGoal).toBe(3);
      expect(report.currentWeek.completedWorkoutsCount).toBe(2);
      expect(report.currentWeek.isGoalMet).toBe(false);

      expect(report.historicalWeeks[0].completedWorkoutsCount).toBe(3);
      expect(report.historicalWeeks[0].isGoalMet).toBe(true);

      // 1 van 2 weken gehaald = 50%
      expect(report.totalWeeksEvaluated).toBe(2);
      expect(report.weeksGoalMetCount).toBe(1);
      expect(report.consistencyPercentage).toBe(50);
    });

    it("toont rustdagen respectvol als herstel en NOOIT als falen", () => {
      const s1 = createSession("s1", "2026-10-05"); // Maandag getraind

      const report = calculateWeeklyConsistency({
        sessions: [s1],
        weeklyGoal: 3,
        referenceDateStr: "2026-10-07", // Woensdag vandaag
        weekStartsOn: "maandag",
        historyWeeksCount: 1,
      });

      const days = report.currentWeek.days;
      expect(days).toHaveLength(7);

      // Maandag = Workout
      expect(days[0].isWorkoutDay).toBe(true);
      expect(days[0].isRestDay).toBe(false);

      // Dinsdag = Rustdag (gepasseerd zonder training) -> herstellende rustdag
      expect(days[1].isWorkoutDay).toBe(false);
      expect(days[1].isRestDay).toBe(true);

      // Donderdag = Toekomst (nog niet gepasseerd)
      expect(days[3].isFuture).toBe(true);
      expect(days[3].isRestDay).toBe(false);

      expect(report.disclaimer).toContain("Rustdagen zijn essentieel voor herstel en tellen nooit als falen");
    });

    it("respecteert weekStartsOn: zondag", () => {
      const report = calculateWeeklyConsistency({
        sessions: [],
        weeklyGoal: 3,
        referenceDateStr: "2026-10-07", // Woensdag
        weekStartsOn: "zondag",
        historyWeeksCount: 1,
      });

      // Bij zondag start de week op 2026-10-04 (Zondag) ipv 2026-10-05
      expect(report.currentWeek.weekStartDate).toBe("2026-10-04");
      expect(report.currentWeek.weekEndDate).toBe("2026-10-10");
    });
  });

  describe("getMuscleVolumeStatus", () => {
    it("categoriseert sets correct volgens indicatieve richtlijnen", () => {
      expect(getMuscleVolumeStatus(0)).toBe("geen");
      expect(getMuscleVolumeStatus(5)).toBe("laag");
      expect(getMuscleVolumeStatus(12)).toBe("optimaal");
      expect(getMuscleVolumeStatus(25)).toBe("hoog");
    });
  });
});
