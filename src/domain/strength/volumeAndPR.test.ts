import { describe, it, expect } from "vitest";
import {
  calculateSetVolume,
  calculateSessionVolume,
  estimate1RM,
  calculateExercisePRs,
} from "./volumeAndPR";
import type { WorkoutSet } from "@/types/database";

describe("volumeAndPR domain berekeningen", () => {
  describe("calculateSetVolume", () => {
    it("geeft 0 terug voor onvoltooide sets", () => {
      expect(
        calculateSetVolume({ weightKg: 100, reps: 5, completed: false })
      ).toBe(0);
    });

    it("geeft 0 terug voor assisted oefeningen (tegengewicht telt niet mee als positief extern volume)", () => {
      expect(
        calculateSetVolume({
          weightKg: 25,
          reps: 8,
          completed: true,
          isAssisted: true,
        })
      ).toBe(0);
    });

    it("berekent correct volume voor een voltooide werkset", () => {
      expect(
        calculateSetVolume({ weightKg: 80, reps: 8, completed: true })
      ).toBe(640);
    });

    it("ondersteunt decimale gewichten accuraat", () => {
      expect(
        calculateSetVolume({ weightKg: 22.5, reps: 10, completed: true })
      ).toBe(225);
    });

    it("geeft 0 voor 0 gewicht of negatief gewicht", () => {
      expect(
        calculateSetVolume({ weightKg: 0, reps: 10, completed: true })
      ).toBe(0);
      expect(
        calculateSetVolume({ weightKg: -10, reps: 10, completed: true })
      ).toBe(0);
    });
  });

  describe("calculateSessionVolume", () => {
    it("sommeert uitsluitend voltooide sets en negeert onvoltooide of assisted sets", () => {
      const sets = [
        { weightKg: 100, reps: 5, completed: true }, // 500
        { weightKg: 100, reps: 5, completed: true }, // 500
        { weightKg: 100, reps: 5, completed: false }, // 0 (niet voltooid)
        { weightKg: 30, reps: 10, completed: true, isAssisted: true }, // 0 (assisted)
        { weightKg: 60, reps: 10, completed: true }, // 600
      ];

      expect(calculateSessionVolume(sets)).toBe(1600);
    });

    it("geeft 0 bij een lege lijst van sets", () => {
      expect(calculateSessionVolume([])).toBe(0);
    });
  });

  describe("estimate1RM", () => {
    it("geeft exact gewicht terug bij 1 herhaling", () => {
      expect(estimate1RM(100, 1)).toBe(100);
      expect(estimate1RM(142.5, 1)).toBe(142.5);
    });

    it("berekent 1RM volgens Epley formule", () => {
      // 100 * (1 + 10 / 30) = 133.333... -> 133.3
      expect(estimate1RM(100, 10, "epley")).toBe(133.3);
    });

    it("berekent 1RM volgens Brzycki formule", () => {
      // 100 * (36 / (37 - 10)) = 100 * (36 / 27) = 133.333... -> 133.3
      expect(estimate1RM(100, 10, "brzycki")).toBe(133.3);
    });

    it("behandelt randgevallen veilig zonder NaN of oneindig", () => {
      expect(estimate1RM(0, 5)).toBe(0);
      expect(estimate1RM(100, 0)).toBe(0);
      expect(estimate1RM(-50, 5)).toBe(0);
      expect(estimate1RM(100, 40, "brzycki")).toBe(100);
    });
  });

  describe("calculateExercisePRs", () => {
    const exerciseId = "ex-bench-press";

    const baseSet = (id: string, weightKg: number, reps: number, completed = true): WorkoutSet => ({
      id,
      sessionId: "session-1",
      exerciseId,
      setNumber: 1,
      setType: "normal",
      weightKg,
      reps,
      targetRpe: null,
      actualRpe: null,
      restTimeSeconds: 90,
      completed,
      loggedAt: new Date().toISOString(),
    });

    it("berekent PR's accuraat uit historische sets", () => {
      const sets: WorkoutSet[] = [
        baseSet("s1", 80, 8, true), // 640 vol, 101.3 1RM
        baseSet("s2", 90, 5, true), // 450 vol, 105.0 1RM
        baseSet("s3", 100, 3, true), // 300 vol, 110.0 1RM -> maxWeight: 100, max1RM: 110
        baseSet("s4", 110, 1, false), // niet voltooid! Moet genegeerd worden
      ];

      const prs = calculateExercisePRs(exerciseId, sets);

      expect(prs.maxWeightKg).toBe(100);
      expect(prs.maxWeightSetId).toBe("s3");
      expect(prs.maxEstimated1RM).toBe(110);
      expect(prs.maxVolumeInSingleSet).toBe(640);
      expect(prs.totalCompletedSets).toBe(3);
      expect(prs.totalVolumeKg).toBe(1390);
    });

    it("herberekent direct wanneer een set wordt aangepast of verwijderd", () => {
      let sets: WorkoutSet[] = [
        baseSet("s1", 80, 8, true),
        baseSet("s2", 100, 3, true),
      ];

      expect(calculateExercisePRs(exerciseId, sets).maxWeightKg).toBe(100);

      // Gebruiker verwijdert of corrigeert s2 naar 90 kg
      sets = [
        baseSet("s1", 80, 8, true),
        baseSet("s2", 90, 3, true),
      ];

      expect(calculateExercisePRs(exerciseId, sets).maxWeightKg).toBe(90);

      // Gebruiker verwijdert s2 volledig
      sets = [baseSet("s1", 80, 8, true)];

      expect(calculateExercisePRs(exerciseId, sets).maxWeightKg).toBe(80);
      expect(calculateExercisePRs(exerciseId, sets).totalCompletedSets).toBe(1);
    });
  });
});

