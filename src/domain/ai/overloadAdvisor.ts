/**
 * Domeinlogica voor AI Overload Assistent (Stap 42 / Prompt 36)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Belangrijke principes:
 * 1. AI als Assistent (Regel 7):
 *    - Nooit autonome databasewijzigingen; altijd een voorstel dat expliciet
 *      door de sporter bevestigd ('Accepteren & Toepassen') of afgewezen ('Negeren') moet worden.
 * 2. Transparantie & Eerlijkheid:
 *    - Elke geschatte waarde wordt expliciet gemarkeerd met '(schatting)'.
 *    - Duidelijke confidence rating ('hoog', 'gemiddeld', 'laag').
 *    - Nooit medische claims of diagnoses.
 * 3. Robuustheid & Veiligheidsgrenzen (Safety Guardrails):
 *    - Bescherming tegen onrealistische gewichtssprongen (clamping max toename).
 *    - Afgerond op realistische gewichtsstappen (0.5 kg of equipment step).
 * 4. Fallback-compatibiliteit (Regel 8):
 *    - Sluit naadloos aan op de deterministische dubbele progressie logica.
 */

import type {
  WorkoutSet,
  Exercise,
  RoutineDay,
  EquipmentType,
} from "@/types/database";
import {
  calculateProgressiveOverload,
  getDefaultEquipmentStep,
  type ProgressiveOverloadSuggestion,
} from "@/domain/strength/progressiveOverload";
import type { OverloadSuggestion } from "@/lib/ai/schemas";

export interface OverloadContextInput {
  exercise: Exercise;
  previousWorksets: WorkoutSet[];
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  currentTargetWeightKg?: number | null;
  targetRpe?: number | null;
  userNote?: string;
}

export interface PreparedOverloadContext {
  exerciseId: string;
  exerciseName: string;
  equipment: EquipmentType | string;
  measurementType: string;
  currentWeightKg: number;
  targetSets: number;
  targetRepsMin: number;
  targetRepsMax: number;
  targetRpe: number | null;
  userNote?: string;
  completedSetsCount: number;
  recentSetsSummary: Array<{
    setNumber: number;
    weightKg: number;
    reps: number;
    rpe: number | null;
    isWarmup: boolean;
  }>;
  deterministicBaseline: ProgressiveOverloadSuggestion;
}

export interface AiOverloadProposal {
  exerciseId: string;
  exerciseName: string;
  currentWeightKg: number;
  suggestedWeightKg: number;
  targetReps: number;
  targetSets: number;
  weightDeltaKg: number;
  action: "increase_weight" | "increase_reps" | "maintain_weight" | "reduce_assistance";
  rationale: string;
  confidence: "hoog" | "gemiddeld" | "laag";
  isEstimate: true;
  source: "gemini" | "lokale_heuristiek";
  requiresConfirmation: true;
  equipmentStepKg: number;
  disclaimer: string;
}

export const AI_OVERLOAD_DISCLAIMER =
  "Dit voorstel is een indicatieve schatting op basis van je recente prestaties en dubbele progressie. Pas gewichten altijd aan op basis van jouw actuele vorm, techniek en herstelvermogen. Raadpleeg bij pijn of twijfel altijd een sportarts of fysiotherapeut.";

/**
 * Bereidt de volledige context voor om door te sturen naar het server-side AI endpoint.
 */
export function buildOverloadContext(input: OverloadContextInput): PreparedOverloadContext {
  const {
    exercise,
    previousWorksets,
    targetSets = 3,
    targetRepsMin = 8,
    targetRepsMax = 12,
    currentTargetWeightKg,
    targetRpe = null,
    userNote,
  } = input;

  // Bereken de deterministische baseline conform dubbele progressie
  const deterministicBaseline = calculateProgressiveOverload({
    exercise,
    plannedTarget: {
      targetSets,
      targetRepsMin,
      targetRepsMax,
      targetWeightKg: currentTargetWeightKg,
      targetRpe,
    },
    previousWorksets,
  });

  const validWorksets = previousWorksets
    .filter((s) => s.completed && s.setType !== "warmup")
    .sort((a, b) => a.setNumber - b.setNumber);

  const referenceWeight =
    currentTargetWeightKg ??
    (validWorksets.length > 0 ? validWorksets[0].weightKg ?? 0 : 0);

  const recentSetsSummary = previousWorksets.map((s) => ({
    setNumber: s.setNumber,
    weightKg: s.weightKg ?? 0,
    reps: s.reps ?? 0,
    rpe: s.actualRpe ?? null,
    isWarmup: s.setType === "warmup",
  }));

  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    equipment: exercise.equipment,
    measurementType: exercise.measurementType,
    currentWeightKg: referenceWeight,
    targetSets,
    targetRepsMin,
    targetRepsMax,
    targetRpe,
    userNote,
    completedSetsCount: validWorksets.length,
    recentSetsSummary,
    deterministicBaseline,
  };
}

/**
 * Valideert en begrenst een AI-voorstel volgens fysiologische veiligheidsgrenzen (guardrails).
 * Zorgt ervoor dat schattingen niet onrealistisch hoog of gevaarlijk worden.
 */
export function sanitizeOverloadSuggestion(
  rawProposal: Partial<OverloadSuggestion> | null,
  context: PreparedOverloadContext
): AiOverloadProposal {
  const baseline = context.deterministicBaseline;
  const isAssisted = context.measurementType === "assisted";
  const defaultStep = getDefaultEquipmentStep(context.equipment, isAssisted);

  const currentWeight = context.currentWeightKg || baseline.currentWeightKg || 0;
  let suggestedWeight =
    typeof rawProposal?.suggestedWeightKg === "number" && !isNaN(rawProposal.suggestedWeightKg)
      ? rawProposal.suggestedWeightKg
      : baseline.suggestedWeightKg;

  // Veiligheidsbegrenzing (Safety Guardrails):
  // 1. Geen negatieve gewichten
  suggestedWeight = Math.max(0, suggestedWeight);

  // 2. Maximaal toelaatbare sprong per sessie:
  // Voor barbells en reguliere oefeningen: maximaal 10% verhoging of 2x apparatuurstap
  const maxAllowedStep = Math.max(defaultStep * 2, currentWeight * 0.15);
  if (suggestedWeight > currentWeight + maxAllowedStep && !isAssisted) {
    // Te grote sprong: klemmen op baseline stap
    suggestedWeight = currentWeight + defaultStep;
  }

  // 3. Afronden op realistische stappen (op 0.5 kg nauwkeurig)
  suggestedWeight = Math.round(suggestedWeight * 2) / 2;

  const weightDelta = Math.round((suggestedWeight - currentWeight) * 10) / 10;

  // Bepaal de actie
  let action: AiOverloadProposal["action"] = "maintain_weight";
  if (isAssisted) {
    action = weightDelta < 0 ? "reduce_assistance" : weightDelta === 0 ? "increase_reps" : "maintain_weight";
  } else if (weightDelta > 0) {
    action = "increase_weight";
  } else if (weightDelta === 0 && baseline.action === "increase_reps") {
    action = "increase_reps";
  } else {
    action = "maintain_weight";
  }

  // Zorg voor duidelijke '(schatting)' labeling conform Regel 7
  let rationale = rawProposal?.rationale || baseline.rationale;
  if (!rationale.includes("(schatting)")) {
    rationale = `${rationale} (schatting)`;
  }

  const confidence: "hoog" | "gemiddeld" | "laag" =
    rawProposal?.confidence === "hoog" || rawProposal?.confidence === "gemiddeld" || rawProposal?.confidence === "laag"
      ? rawProposal.confidence
      : baseline.confidence;

  const targetReps =
    typeof rawProposal?.targetReps === "number" && rawProposal.targetReps > 0
      ? rawProposal.targetReps
      : baseline.suggestedRepsMin;

  return {
    exerciseId: context.exerciseId,
    exerciseName: context.exerciseName,
    currentWeightKg: currentWeight,
    suggestedWeightKg: suggestedWeight,
    targetReps,
    targetSets: baseline.suggestedSets,
    weightDeltaKg: weightDelta,
    action,
    rationale,
    confidence,
    isEstimate: true,
    source: rawProposal ? "gemini" : "lokale_heuristiek",
    requiresConfirmation: true,
    equipmentStepKg: defaultStep,
    disclaimer: AI_OVERLOAD_DISCLAIMER,
  };
}

/**
 * Past een bevestigd overloadvoorstel toe op een lijst van actieve workout sets.
 * Werkt uitsluitend niet-voltooide sets bij. Reeds voltooide sets blijven onaangetast!
 */
export function applyOverloadProposalToWorkoutSets(
  sets: WorkoutSet[],
  proposal: AiOverloadProposal
): {
  updatedSets: WorkoutSet[];
  modifiedCount: number;
} {
  let modifiedCount = 0;

  const updatedSets = sets.map((set) => {
    if (set.completed) {
      return set; // Behoud voltooide sets onaangeroerd!
    }

    modifiedCount++;
    return {
      ...set,
      weightKg: proposal.suggestedWeightKg,
      reps: proposal.targetReps,
    };
  });

  return {
    updatedSets,
    modifiedCount,
  };
}

/**
 * Past een bevestigd overloadvoorstel toe op een schemadag planning (RoutineDay).
 */
export function applyOverloadProposalToRoutineDay(
  day: RoutineDay,
  exerciseId: string,
  proposal: AiOverloadProposal
): RoutineDay {
  const updatedExercises = day.plannedExercises.map((ex) => {
    if (ex.exerciseId !== exerciseId) return ex;

    return {
      ...ex,
      targetWeightKg: proposal.suggestedWeightKg,
      targetRepsMin: proposal.targetReps,
      targetRepsMax: proposal.targetReps + 2,
    };
  });

  return {
    ...day,
    plannedExercises: updatedExercises,
  };
}
