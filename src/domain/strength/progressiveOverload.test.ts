import { describe, it, expect } from "vitest";
import {
  calculateProgressiveOverload,
  getDefaultEquipmentStep,
  type ProgressiveOverloadInput,
} from "./progressiveOverload";
import type { Exercise, WorkoutSet } from "@/types/database";

describe("Progressieve Overload & Dubbele Progressie (Prompt 15)", () => {
  const mockBenchPress: Exercise = {
    id: "ex-bench",
    name: "Barbell Bench Press",
    category: "kracht",
    primaryMuscleGroup: "borst",
    secondaryMuscleGroups: ["schouders", "armen"],
    equipment: "barbell",
    measurementType: "gewicht_herhalingen",
    isCustom: false,
    isArchived: false,
    instructions: "Druk de halterstang gecontroleerd uit.",
    provenance: { source: "system" },
    createdAt: "2026-10-01T10:00:00Z",
  };

  const mockDumbbellCurl: Exercise = {
    id: "ex-curl",
    name: "Dumbbell Bicep Curl",
    category: "kracht",
    primaryMuscleGroup: "armen",
    secondaryMuscleGroups: [],
    equipment: "dumbbell",
    measurementType: "gewicht_herhalingen",
    isCustom: false,
    isArchived: false,
    instructions: "Curl de dumbbells op.",
    provenance: { source: "system" },
    createdAt: "2026-10-01T10:00:00Z",
  };

  const mockAssistedPullup: Exercise = {
    id: "ex-assist",
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
    createdAt: "2026-10-01T10:00:00Z",
  };

  const makeSet = (
    setNumber: number,
    weightKg: number,
    reps: number,
    completed = true,
    actualRpe: number | null = null,
    isAssisted = false
  ): WorkoutSet => ({
    id: `set-${setNumber}`,
    sessionId: "sess-1",
    exerciseId: "any",
    setNumber,
    setType: "normal",
    weightKg,
    reps,
    actualRpe,
    targetRpe: null,
    restTimeSeconds: 90,
    completed,
    isAssisted,
    loggedAt: "2026-10-01T10:05:00Z",
  });

  describe("Standaard apparatuurstappen", () => {
    it("kent de juiste stappen toe per type uitrusting", () => {
      expect(getDefaultEquipmentStep("barbell")).toBe(2.5);
      expect(getDefaultEquipmentStep("dumbbell")).toBe(2.0);
      expect(getDefaultEquipmentStep("machine")).toBe(2.5);
      expect(getDefaultEquipmentStep("kabel")).toBe(2.5);
      expect(getDefaultEquipmentStep("kettlebell")).toBe(4.0);
      expect(getDefaultEquipmentStep("machine", true)).toBe(2.5);
    });
  });

  describe("Succesvolle dubbele progressie (Bovengrens bereikt)", () => {
    it("stelt gewichtsverhoging voor zodra alle werksets de bovengrens van 12 reps bereiken", () => {
      const sets = [
        makeSet(1, 80, 12, true, 8),
        makeSet(2, 80, 12, true, 8.5),
        makeSet(3, 80, 12, true, 8.5),
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: {
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 12,
          targetWeightKg: 80,
          targetRpe: 8,
        },
        previousWorksets: sets,
      };

      const suggestion = calculateProgressiveOverload(input);

      expect(suggestion.action).toBe("increase_weight");
      expect(suggestion.isReadyForIncrease).toBe(true);
      expect(suggestion.currentWeightKg).toBe(80);
      expect(suggestion.suggestedWeightKg).toBe(82.5); // 80 + 2.5 kg barbell step
      expect(suggestion.weightChangeKg).toBe(2.5);
      expect(suggestion.suggestedRepsMin).toBe(8); // Reset naar min reps van het bereik
      expect(suggestion.rationale).toContain("Alle 3 sets bereikten de bovengrens");
      expect(suggestion.disclaimer).toBeTruthy();
    });

    it("gebruikt de dumbbell-stap van 2 kg voor dumbbell oefeningen", () => {
      const sets = [
        makeSet(1, 14, 12, true),
        makeSet(2, 14, 12, true),
        makeSet(3, 14, 12, true),
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockDumbbellCurl,
        plannedTarget: { targetRepsMin: 8, targetRepsMax: 12 },
        previousWorksets: sets,
      };

      const suggestion = calculateProgressiveOverload(input);
      expect(suggestion.action).toBe("increase_weight");
      expect(suggestion.suggestedWeightKg).toBe(16); // 14 + 2.0 kg
      expect(suggestion.weightChangeKg).toBe(2.0);
    });

    it("respecteert een handmatige microloading stap (bv. 1.0 kg)", () => {
      const sets = [
        makeSet(1, 100, 10, true),
        makeSet(2, 100, 10, true),
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: { targetRepsMin: 6, targetRepsMax: 10 },
        previousWorksets: sets,
        equipmentStepKg: 1.0,
      };

      const suggestion = calculateProgressiveOverload(input);
      expect(suggestion.suggestedWeightKg).toBe(101);
      expect(suggestion.weightChangeKg).toBe(1.0);
    });
  });

  describe("Rep-progressie (Nog niet alle sets op max reps)", () => {
    it("stelt voor om herhalingen uit te bouwen als sets variëren tussen min en max (bv. 12, 11, 10)", () => {
      const sets = [
        makeSet(1, 80, 12, true),
        makeSet(2, 80, 11, true),
        makeSet(3, 80, 10, true),
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: { targetRepsMin: 8, targetRepsMax: 12 },
        previousWorksets: sets,
      };

      const suggestion = calculateProgressiveOverload(input);

      expect(suggestion.action).toBe("increase_reps");
      expect(suggestion.isReadyForIncrease).toBe(false);
      expect(suggestion.suggestedWeightKg).toBe(80); // Behoud 80 kg
      expect(suggestion.weightChangeKg).toBe(0);
      expect(suggestion.rationale).toContain("Nog niet alle werksets bereikten de bovengrens");
    });
  });

  describe("Inspanningsbeveiliging (RPE / RIR management)", () => {
    it("adviseert gewichtsbehoud als sets max reps haalden maar werkelijke RPE substantieel te hoog was", () => {
      // Doel RPE was 8, maar werkelijk RPE was 10 (tot falen op alle sets)
      const sets = [
        makeSet(1, 80, 12, true, 10),
        makeSet(2, 80, 12, true, 10),
        makeSet(3, 80, 12, true, 9.5),
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: {
          targetRepsMin: 8,
          targetRepsMax: 12,
          targetRpe: 8,
        },
        previousWorksets: sets,
      };

      const suggestion = calculateProgressiveOverload(input);

      expect(suggestion.action).toBe("maintain_weight");
      expect(suggestion.isReadyForIncrease).toBe(false);
      expect(suggestion.suggestedWeightKg).toBe(80);
      expect(suggestion.rationale).toContain("RPE");
      expect(suggestion.rationale).toContain("Advies: behoud");
    });
  });

  describe("Assisted oefeningen (Omgekeerde progressie)", () => {
    it("stelt vermindering van tegengewicht voor zodra alle werksets max reps behalen", () => {
      const sets = [
        makeSet(1, 30, 10, true, null, true),
        makeSet(2, 30, 10, true, null, true),
        makeSet(3, 30, 10, true, null, true),
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockAssistedPullup,
        plannedTarget: { targetRepsMin: 6, targetRepsMax: 10 },
        previousWorksets: sets,
      };

      const suggestion = calculateProgressiveOverload(input);

      expect(suggestion.action).toBe("reduce_assistance");
      expect(suggestion.isReadyForIncrease).toBe(true);
      expect(suggestion.currentWeightKg).toBe(30);
      expect(suggestion.suggestedWeightKg).toBe(27.5); // 30 - 2.5 kg minder hulp!
      expect(suggestion.weightChangeKg).toBe(-2.5);
      expect(suggestion.rationale).toContain("verminder de machinehulp met 2.5 kg");
    });
  });

  describe("Ondergrens en gemiste herhalingen", () => {
    it("stelt gewichtsbehoud voor als een set onder de min reps valt (bv. 6 reps bij doel 8)", () => {
      const sets = [
        makeSet(1, 90, 8, true),
        makeSet(2, 90, 7, true), // Onder 8 reps
        makeSet(3, 90, 5, true), // Onder 8 reps
      ];

      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: { targetRepsMin: 8, targetRepsMax: 12 },
        previousWorksets: sets,
      };

      const suggestion = calculateProgressiveOverload(input);

      expect(suggestion.action).toBe("maintain_weight");
      expect(suggestion.suggestedWeightKg).toBe(90);
      expect(suggestion.rationale).toContain("vielen onder het minimumrepbereik");
    });
  });

  describe("Onvoldoende gegevens", () => {
    it("geeft vriendelijke status wanneer er geen eerdere afgeronde werksets zijn", () => {
      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: { targetRepsMin: 8, targetRepsMax: 12, targetWeightKg: 60 },
        previousWorksets: [],
      };

      const suggestion = calculateProgressiveOverload(input);

      expect(suggestion.action).toBe("insufficient_data");
      expect(suggestion.isReadyForIncrease).toBe(false);
      expect(suggestion.suggestedWeightKg).toBe(60);
      expect(suggestion.rationale).toContain("Er zijn nog geen eerdere afgeronde werksets");
    });

    it("sluit niet-afgeronde sets of warming-up sets uit", () => {
      const incompleteSet = makeSet(1, 80, 12, false); // completed === false
      const warmupSet = {
        ...makeSet(2, 40, 15, true),
        setType: "warmup" as const,
      };

      const input: ProgressiveOverloadInput = {
        exercise: mockBenchPress,
        plannedTarget: { targetRepsMin: 8, targetRepsMax: 12 },
        previousWorksets: [incompleteSet, warmupSet],
      };

      const suggestion = calculateProgressiveOverload(input);
      expect(suggestion.action).toBe("insufficient_data");
    });
  });
});
