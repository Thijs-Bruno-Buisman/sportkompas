import { describe, it, expect } from "vitest";
import {
  buildOverloadContext,
  sanitizeOverloadSuggestion,
  applyOverloadProposalToWorkoutSets,
  applyOverloadProposalToRoutineDay,
} from "./overloadAdvisor";
import type { Exercise, WorkoutSet, RoutineDay } from "@/types/database";

const mockExercise: Exercise = {
  id: "ex-bench",
  name: "Bench Press",
  category: "kracht",
  primaryMuscleGroup: "borst",
  secondaryMuscleGroups: ["armen", "schouders"],
  equipment: "barbell",
  measurementType: "gewicht_herhalingen",
  isCustom: false,
  isArchived: false,
  instructions: "",
  provenance: { source: "user" },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const mockAssistedExercise: Exercise = {
  id: "ex-pullup",
  name: "Assisted Pull-up",
  category: "kracht",
  primaryMuscleGroup: "rug",
  secondaryMuscleGroups: ["armen"],
  equipment: "machine",
  measurementType: "assisted",
  isCustom: false,
  isArchived: false,
  instructions: "",
  provenance: { source: "user" },
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const createMockSet = (
  id: string,
  setNumber: number,
  weightKg: number,
  reps: number,
  completed: boolean
): WorkoutSet => ({
  id,
  sessionId: "sess-1",
  exerciseId: "ex-bench",
  setNumber,
  setType: "normal",
  weightKg,
  reps,
  targetRpe: null,
  actualRpe: null,
  restTimeSeconds: 90,
  completed,
  loggedAt: "2026-10-01T10:00:00Z",
});

describe("overloadAdvisor domain logic", () => {
  describe("buildOverloadContext", () => {
    it("stelt context samen inclusief eerdere werksets en deterministische baseline", () => {
      const sets: WorkoutSet[] = [
        createMockSet("s1", 1, 80, 10, true),
        createMockSet("s2", 2, 80, 10, true),
        createMockSet("s3", 3, 80, 10, true),
      ];

      const context = buildOverloadContext({
        exercise: mockExercise,
        previousWorksets: sets,
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        currentTargetWeightKg: 80,
      });

      expect(context.exerciseId).toBe("ex-bench");
      expect(context.currentWeightKg).toBe(80);
      expect(context.completedSetsCount).toBe(3);
      expect(context.recentSetsSummary).toHaveLength(3);
      // Omdat alle 3 sets 10 reps (max) haalden, moet baseline verhoging voorstellen
      expect(context.deterministicBaseline.action).toBe("increase_weight");
      expect(context.deterministicBaseline.suggestedWeightKg).toBe(82.5);
    });
  });

  describe("sanitizeOverloadSuggestion", () => {
    it("begrenst onrealistische gewichtssprongen (guardrails)", () => {
      const context = buildOverloadContext({
        exercise: mockExercise,
        previousWorksets: [createMockSet("s1", 1, 60, 10, true)],
        targetRepsMin: 8,
        targetRepsMax: 10,
        currentTargetWeightKg: 60,
      });

      // AI stelt opeens 90 kg voor (+30 kg sprong!)
      const rawAi = {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        currentWeightKg: 60,
        suggestedWeightKg: 90,
        targetReps: 8,
        rationale: "Probeer veel zwaarder te gaan",
        confidence: "hoog" as const,
        requiresConfirmation: true as const,
      };

      const sanitized = sanitizeOverloadSuggestion(rawAi, context);

      // Moet begrensd zijn tot maximaal toelaatbare sprong (60 + 2.5 kg = 62.5 kg)
      expect(sanitized.suggestedWeightKg).toBe(62.5);
      expect(sanitized.isEstimate).toBe(true);
      expect(sanitized.rationale).toContain("(schatting)");
      expect(sanitized.requiresConfirmation).toBe(true);
    });

    it("handelt assisted oefeningen correct af (minder hulp is progressie)", () => {
      const assistedSet: WorkoutSet = {
        ...createMockSet("s1", 1, 25, 10, true),
        exerciseId: "ex-pullup",
      };

      const context = buildOverloadContext({
        exercise: mockAssistedExercise,
        previousWorksets: [assistedSet],
        targetRepsMin: 8,
        targetRepsMax: 10,
        currentTargetWeightKg: 25,
      });

      const rawAi = {
        exerciseId: "ex-pullup",
        exerciseName: "Assisted Pull-up",
        currentWeightKg: 25,
        suggestedWeightKg: 22.5,
        targetReps: 8,
        rationale: "Verminder de machinehulp met 2,5 kg",
        confidence: "hoog" as const,
        requiresConfirmation: true as const,
      };

      const sanitized = sanitizeOverloadSuggestion(rawAi, context);
      expect(sanitized.suggestedWeightKg).toBe(22.5);
      expect(sanitized.action).toBe("reduce_assistance");
      expect(sanitized.weightDeltaKg).toBe(-2.5);
    });
  });

  describe("applyOverloadProposalToWorkoutSets", () => {
    it("werkt alleen onvoltooide sets bij en laat voltooide sets ongewijzigd", () => {
      const sets: WorkoutSet[] = [
        createMockSet("s1", 1, 70, 8, true),  // Voltooid
        createMockSet("s2", 2, 70, 8, false), // Onvoltooid
        createMockSet("s3", 3, 70, 8, false), // Onvoltooid
      ];

      const proposal = {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        currentWeightKg: 70,
        suggestedWeightKg: 72.5,
        targetReps: 10,
        targetSets: 3,
        weightDeltaKg: 2.5,
        action: "increase_weight" as const,
        rationale: "Verhoog naar 72.5 kg (schatting)",
        confidence: "hoog" as const,
        isEstimate: true as const,
        source: "gemini" as const,
        requiresConfirmation: true as const,
        equipmentStepKg: 2.5,
        disclaimer: "Let op techniek",
      };

      const result = applyOverloadProposalToWorkoutSets(sets, proposal);

      expect(result.modifiedCount).toBe(2);
      // Set 1 (voltooid) moet nog steeds 70 kg zijn!
      expect(result.updatedSets[0].weightKg).toBe(70);
      expect(result.updatedSets[0].reps).toBe(8);
      expect(result.updatedSets[0].completed).toBe(true);

      // Set 2 en 3 moeten geüpdatet zijn naar het voorstel
      expect(result.updatedSets[1].weightKg).toBe(72.5);
      expect(result.updatedSets[1].reps).toBe(10);
      expect(result.updatedSets[2].weightKg).toBe(72.5);
      expect(result.updatedSets[2].reps).toBe(10);
    });
  });

  describe("applyOverloadProposalToRoutineDay", () => {
    it("werkt het specifieke doelgewicht en herhalingen in een routine dag bij", () => {
      const routineDay: RoutineDay = {
        id: "day-push",
        routineId: "rout-1",
        dayIndex: 1,
        name: "Push Dag",
        plannedExercises: [
          {
            exerciseId: "ex-bench",
            exerciseName: "Bench Press",
            targetSets: 3,
            targetRepsMin: 8,
            targetRepsMax: 10,
            targetWeightKg: 70,
            restSeconds: 90,
          },
        ],
        createdAt: "2026-01-01T00:00:00Z",
      };

      const proposal = {
        exerciseId: "ex-bench",
        exerciseName: "Bench Press",
        currentWeightKg: 70,
        suggestedWeightKg: 72.5,
        targetReps: 8,
        targetSets: 3,
        weightDeltaKg: 2.5,
        action: "increase_weight" as const,
        rationale: "Klaar voor verhoging naar 72.5 kg (schatting)",
        confidence: "hoog" as const,
        isEstimate: true as const,
        source: "gemini" as const,
        requiresConfirmation: true as const,
        equipmentStepKg: 2.5,
        disclaimer: "Let op techniek",
      };

      const updatedDay = applyOverloadProposalToRoutineDay(
        routineDay,
        "ex-bench",
        proposal
      );

      const updatedEx = updatedDay.plannedExercises[0];
      expect(updatedEx.targetWeightKg).toBe(72.5);
      expect(updatedEx.targetRepsMin).toBe(8);
      expect(updatedEx.targetRepsMax).toBe(10);
    });
  });
});
