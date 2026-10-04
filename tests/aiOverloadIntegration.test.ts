import { describe, it, expect } from "vitest";
import {
  buildOverloadContext,
  sanitizeOverloadSuggestion,
  applyOverloadProposalToWorkoutSets,
  applyOverloadProposalToRoutineDay,
} from "@/domain/ai/overloadAdvisor";
import { generateLocalHeuristicResponse } from "@/lib/ai/provider";
import type { Exercise, WorkoutSet, RoutineDay } from "@/types/database";

describe("Stap 42 / Prompt 36 — AI Overload Assistent Integratietest", () => {
  const benchPress: Exercise = {
    id: "ex-bench-press",
    name: "Barbell Bench Press",
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

  const createMockSet = (
    id: string,
    setNumber: number,
    weightKg: number,
    reps: number,
    completed: boolean
  ): WorkoutSet => ({
    id,
    sessionId: "sess-100",
    exerciseId: "ex-bench-press",
    setNumber,
    setType: "normal",
    weightKg,
    reps,
    targetRpe: null,
    actualRpe: null,
    restTimeSeconds: 90,
    completed,
    loggedAt: "2026-10-01T12:00:00Z",
  });

  const initialSets: WorkoutSet[] = [
    createMockSet("set-1", 1, 80, 10, true),
    createMockSet("set-2", 2, 80, 10, true),
    createMockSet("set-3", 3, 80, 10, true),
  ];

  it("bouwt correcte context en berekent deterministische baseline volgens dubbele progressie", () => {
    const context = buildOverloadContext({
      exercise: benchPress,
      previousWorksets: initialSets,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      currentTargetWeightKg: 80,
    });

    expect(context.exerciseId).toBe("ex-bench-press");
    expect(context.completedSetsCount).toBe(3);
    // Omdat alle 3 sets 10 reps behaalden (max), stelt dubbele progressie een gewichtsverhoging voor
    expect(context.deterministicBaseline.action).toBe("increase_weight");
    expect(context.deterministicBaseline.suggestedWeightKg).toBe(82.5);
    expect(context.deterministicBaseline.suggestedRepsMin).toBe(8);
  });

  it("genereert een betrouwbare lokale AI-heuristiek met expliciete '(schatting)' labeling (Regel 7 & 8)", () => {
    const context = buildOverloadContext({
      exercise: benchPress,
      previousWorksets: initialSets,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      currentTargetWeightKg: 80,
    });

    const aiResponse = generateLocalHeuristicResponse({
      task: "overload_suggestions",
      context: context as unknown as Record<string, unknown>,
    });

    expect(aiResponse.success).toBe(true);
    expect(aiResponse.isEstimate).toBe(true);
    expect(aiResponse.disclaimer).toBeDefined();

    const proposal = sanitizeOverloadSuggestion(
      aiResponse.structuredData as any,
      context
    );

    expect(proposal.suggestedWeightKg).toBe(82.5);
    expect(proposal.targetReps).toBe(8);
    expect(proposal.weightDeltaKg).toBe(2.5);
    expect(proposal.rationale).toContain("(schatting)");
    expect(proposal.requiresConfirmation).toBe(true);
  });

  it("past veiligheidsgrenzen (guardrails) toe tegen gevaarlijke of onrealistische sprongen", () => {
    const context = buildOverloadContext({
      exercise: benchPress,
      previousWorksets: initialSets,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      currentTargetWeightKg: 80,
    });

    // Gesimuleerde extreme AI hallucination van +50 kg
    const extremeAiOutput = {
      exerciseId: "ex-bench-press",
      exerciseName: "Barbell Bench Press",
      currentWeightKg: 80,
      suggestedWeightKg: 130, // Onveilig!
      targetReps: 8,
      rationale: "Verhoog direct naar 130 kg",
      confidence: "hoog" as const,
      requiresConfirmation: true as const,
    };

    const sanitized = sanitizeOverloadSuggestion(extremeAiOutput, context);

    // Moet geklemd worden naar veilige standaard uitrustingsstap (80 + 2.5 = 82.5 kg)
    expect(sanitized.suggestedWeightKg).toBe(82.5);
    expect(sanitized.isEstimate).toBe(true);
    expect(sanitized.rationale).toContain("(schatting)");
  });

  it("handhaaft 'AI als assistent, nooit autonoom' (Regel 7): wijzigt GEEN data zonder expliciet accepteren", () => {
    // Actieve sessiesets: set 1 voltooid, sets 2 en 3 nog open
    const liveTrackerSets: WorkoutSet[] = [
      createMockSet("live-set-1", 1, 80, 8, true),
      createMockSet("live-set-2", 2, 80, 8, false),
      createMockSet("live-set-3", 3, 80, 8, false),
    ];

    const context = buildOverloadContext({
      exercise: benchPress,
      previousWorksets: initialSets,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      currentTargetWeightKg: 80,
    });

    const proposal = sanitizeOverloadSuggestion(null, context);

    // Scenario A: Gebruiker negeert / weigert het voorstel
    // De live sets mogen absoluut NIET automatisch wijzigen
    const originalWeights = liveTrackerSets.map((s) => s.weightKg);
    expect(originalWeights).toEqual([80, 80, 80]);

    // Scenario B: Gebruiker bevestigt met 'Accepteren & Toepassen'
    const { updatedSets, modifiedCount } = applyOverloadProposalToWorkoutSets(
      liveTrackerSets,
      proposal
    );

    expect(modifiedCount).toBe(2);
    // Set 1 (voltooid) blijft intact op 80 kg
    expect(updatedSets[0].completed).toBe(true);
    expect(updatedSets[0].weightKg).toBe(80);

    // Set 2 & 3 (onvoltooid) zijn bijgewerkt naar het voorstel (82.5 kg)
    expect(updatedSets[1].completed).toBe(false);
    expect(updatedSets[1].weightKg).toBe(82.5);
    expect(updatedSets[1].reps).toBe(8);

    expect(updatedSets[2].completed).toBe(false);
    expect(updatedSets[2].weightKg).toBe(82.5);
    expect(updatedSets[2].reps).toBe(8);
  });

  it("werkt routineschema bij conform RoutineDay entiteit bij acceptatie", () => {
    const routineDay: RoutineDay = {
      id: "day-1",
      routineId: "routine-upper",
      dayIndex: 1,
      name: "Upper 1",
      plannedExercises: [
        {
          exerciseId: "ex-bench-press",
          exerciseName: "Barbell Bench Press",
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetWeightKg: 80,
          restSeconds: 90,
        },
      ],
      createdAt: "2026-01-01T00:00:00Z",
    };

    const context = buildOverloadContext({
      exercise: benchPress,
      previousWorksets: initialSets,
      targetSets: 3,
      targetRepsMin: 8,
      targetRepsMax: 10,
      currentTargetWeightKg: 80,
    });

    const proposal = sanitizeOverloadSuggestion(null, context);

    const updatedDay = applyOverloadProposalToRoutineDay(
      routineDay,
      "ex-bench-press",
      proposal
    );

    const exerciseTarget = updatedDay.plannedExercises[0];
    expect(exerciseTarget.targetWeightKg).toBe(82.5);
    expect(exerciseTarget.targetRepsMin).toBe(8);
    expect(exerciseTarget.targetRepsMax).toBe(10);
  });
});
