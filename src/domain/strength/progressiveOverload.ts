/**
 * Domeinlogica voor Progressieve Overload Suggesties (Prompt 15)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Principes:
 * 1. Deterministische dubbele progressie (Double Progression):
 *    - Eerst herhalingen verhogen binnen het ingestelde repbereik (targetRepsMin t/m targetRepsMax).
 *    - Pas wanneer ALLE afgeronde werksets de bovengrens (targetRepsMax) bereiken,
 *      wordt een kleine instelbare gewichtsstap voorgesteld en resetten de reps naar targetRepsMin.
 * 2. Doel-RPE / RIR integratie:
 *    - Als een doel-RPE/RIR is ingesteld én de werkelijke RPE substantieel te hoog was
 *      (bijv. werkelijk RPE 10 / failure terwijl doel RPE 8 was), adviseert de regel
 *      om het gewicht te behouden om blessures en overbelasting te voorkomen.
 * 3. Apparatuurspecifieke stappen:
 *    - Barbell: standaard +2,5 kg
 *    - Dumbbell: standaard +2 kg (+1 kg per dumbbell)
 *    - Kabel / Machine: standaard +2,5 kg
 *    - Kettlebell: standaard +4 kg
 *    - Assisted: -2,5 kg (minder tegengewicht)
 * 4. Transparante aanleiding & verantwoording:
 *    - Altijd een heldere uitleg van de reden (waarom gewichtsverhoging, waarom reps of waarom behoud).
 * 5. Voorstel-principe:
 *    - Suggesties zijn altijd voorstellen; nooit garanties op resultaat of blessurevrij trainen.
 */

import type {
  WorkoutSet,
  Exercise,
  PlannedExerciseInDay,
  EquipmentType,
} from "@/types/database";

export type ProgressionAction =
  | "increase_weight"    // Alle sets bereikten bovengrens reps -> verhoog gewicht, reps naar min
  | "increase_reps"      // Werk naar de bovengrens reps op ditzelfde gewicht
  | "maintain_weight"    // Behoud hetzelfde gewicht (bv. wisselende prestatie of te hoge RPE)
  | "reduce_assistance"  // Assisted oefening: verlaag tegengewicht met 1 stap
  | "insufficient_data"; // Geen eerdere voltooide werksets beschikbaar

export interface ProgressiveOverloadTarget {
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetWeightKg?: number | null;
  targetRpe?: number | null;
  targetRir?: number | null;
}

export interface ProgressiveOverloadInput {
  exercise: Exercise;
  plannedTarget?: ProgressiveOverloadTarget;
  previousWorksets: WorkoutSet[];
  equipmentStepKg?: number; // Optionele handmatige override van de gewichtsstap
}

export interface ProgressiveOverloadSuggestion {
  exerciseId: string;
  exerciseName: string;
  action: ProgressionAction;
  actionLabel: string;
  currentWeightKg: number;
  suggestedWeightKg: number;
  suggestedRepsMin: number;
  suggestedRepsMax: number;
  suggestedSets: number;
  weightChangeKg: number; // bv. +2.5 of -2.5 (of 0)
  rationale: string; // Concrete uitleg / aanleiding
  rpeContext?: string; // Optionele toelichting op waargenomen inspanning
  isReadyForIncrease: boolean;
  equipmentType: string;
  confidence: "hoog" | "gemiddeld" | "laag";
  disclaimer: string;
}

/**
 * Bepaalt de standaard gewichtsstap op basis van de uitrusting van de oefening.
 */
export function getDefaultEquipmentStep(
  equipment: EquipmentType | string,
  isAssisted = false
): number {
  if (isAssisted) {
    return 2.5; // Standaard 2.5 kg minder machinehulp
  }

  switch (equipment) {
    case "barbell":
      return 2.5; // Standaard 2x 1.25 kg schijven
    case "dumbbell":
      return 2.0; // Standaard sprong per dumbbellpaar
    case "kabel":
    case "machine":
      return 2.5;
    case "kettlebell":
      return 4.0; // Standaard kettlebell sprong (bv. 12 -> 16 -> 20 kg)
    case "lichaamsgewicht":
      return 0.0;
    default:
      return 2.5;
  }
}

/**
 * Berekent een uitlegbare progressieve overload suggestie voor de volgende sessie.
 */
export function calculateProgressiveOverload(
  input: ProgressiveOverloadInput
): ProgressiveOverloadSuggestion {
  const { exercise, plannedTarget, previousWorksets, equipmentStepKg } = input;
  const isAssisted = exercise.measurementType === "assisted";
  const disclaimer =
    "Dit voorstel is een indicatieve richtlijn op basis van dubbele progressie. Pas gewichten en herhalingen altijd aan op jouw actuele techniek, vermoeidheid en herstel.";

  // Bepaal repbereik
  const targetRepsMin =
    plannedTarget?.targetRepsMin ?? (isAssisted ? 6 : 8);
  const targetRepsMax =
    plannedTarget?.targetRepsMax ?? (plannedTarget?.targetRepsMin ? plannedTarget.targetRepsMin + 2 : 12);
  const targetSets =
    plannedTarget?.targetSets ?? (previousWorksets.length > 0 ? previousWorksets.length : 3);

  const stepKg =
    typeof equipmentStepKg === "number" && equipmentStepKg > 0
      ? equipmentStepKg
      : getDefaultEquipmentStep(exercise.equipment, isAssisted);

  // Filter uitsluitend voltooide werksets (geen warming-up)
  const validWorksets = previousWorksets
    .filter((s) => s.completed && s.setType !== "warmup")
    .sort((a, b) => a.setNumber - b.setNumber);

  // 1. RANDGEVAL: ONVOLDOENDE DATA
  if (validWorksets.length === 0) {
    const fallbackWeight = plannedTarget?.targetWeightKg ?? 0;
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      action: "insufficient_data",
      actionLabel: "Nog geen gegevens",
      currentWeightKg: fallbackWeight,
      suggestedWeightKg: fallbackWeight,
      suggestedRepsMin: targetRepsMin,
      suggestedRepsMax: targetRepsMax,
      suggestedSets: targetSets,
      weightChangeKg: 0,
      rationale:
        "Er zijn nog geen eerdere afgeronde werksets geregistreerd voor deze oefening. Begin met een comfortabel opwerkgewicht en leg je eerste sets vast.",
      isReadyForIncrease: false,
      equipmentType: exercise.equipment,
      confidence: "laag",
      disclaimer,
    };
  }

  // Analyseer de eerdere werksets
  const repCounts = validWorksets.map((s) => s.reps || 0);
  const weights = validWorksets.map((s) => s.weightKg || 0);
  const mostCommonWeight = getDominantWeight(weights);

  // Bereken RPE statistieken
  const rpeValues = validWorksets
    .map((s) => s.actualRpe)
    .filter((r): r is number => typeof r === "number" && r > 0);
  const avgRpe =
    rpeValues.length > 0
      ? Math.round((rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10) / 10
      : null;

  const targetRpe = plannedTarget?.targetRpe ?? null;

  // Controleer of alle werksets de rep-bovengrens hebben gehaald
  const allSetsHitCeiling = repCounts.every((r) => r >= targetRepsMax);
  const anySetBelowFloor = repCounts.some((r) => r < targetRepsMin);
  const setsHitCeilingCount = repCounts.filter((r) => r >= targetRepsMax).length;

  // ---------------------------------------------------------------------------
  // 2. ASSISTED OEFENINGEN (OMGEKEERDE PROGRESSIE: MINDER TEGENGEWICHT IS BETER)
  // ---------------------------------------------------------------------------
  if (isAssisted) {
    if (allSetsHitCeiling) {
      // Mag het tegengewicht omlaag?
      const newAssistance = Math.max(0, Math.round((mostCommonWeight - stepKg) * 100) / 100);
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        action: "reduce_assistance",
        actionLabel: `Minder hulp (-${stepKg} kg)`,
        currentWeightKg: mostCommonWeight,
        suggestedWeightKg: newAssistance,
        suggestedRepsMin: targetRepsMin,
        suggestedRepsMax: targetRepsMax,
        suggestedSets: targetSets,
        weightChangeKg: -stepKg,
        rationale: `Alle ${validWorksets.length} werksets behaalden de bovengrens van ${targetRepsMax} herhalingen op ${mostCommonWeight} kg machinehulp. Voorstel: verminder de machinehulp met ${stepKg} kg naar ${newAssistance} kg bij ${targetRepsMin} herhalingen.`,
        isReadyForIncrease: true,
        equipmentType: exercise.equipment,
        confidence: "hoog",
        disclaimer,
      };
    } else {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        action: "increase_reps",
        actionLabel: "Meer herhalingen",
        currentWeightKg: mostCommonWeight,
        suggestedWeightKg: mostCommonWeight,
        suggestedRepsMin: targetRepsMin,
        suggestedRepsMax: targetRepsMax,
        suggestedSets: targetSets,
        weightChangeKg: 0,
        rationale: `${setsHitCeilingCount} van de ${validWorksets.length} sets bereikten de ${targetRepsMax} herhalingen (${repCounts.join(", ")} reps). Bouw eerst alle sets uit naar ${targetRepsMax} reps voordat je het tegengewicht verlaagt.`,
        isReadyForIncrease: false,
        equipmentType: exercise.equipment,
        confidence: "hoog",
        disclaimer,
      };
    }
  }

  // ---------------------------------------------------------------------------
  // 3. ALLE WERKSETS BEREIKTEN DE BOVENGRENS (KANDIDAAT VOOR GEWICHTSVERHOGING)
  // ---------------------------------------------------------------------------
  if (allSetsHitCeiling) {
    // RPE Controle: Was de sessie te zwaar ondanks het halen van de reps?
    // Als doel RPE 8 was, maar werkelijke RPE 9.5 of 10, eerst consolideren
    if (targetRpe !== null && avgRpe !== null && avgRpe >= targetRpe + 1.5) {
      return {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        action: "maintain_weight",
        actionLabel: "Consolideren (RPE hoog)",
        currentWeightKg: mostCommonWeight,
        suggestedWeightKg: mostCommonWeight,
        suggestedRepsMin: targetRepsMin,
        suggestedRepsMax: targetRepsMax,
        suggestedSets: targetSets,
        weightChangeKg: 0,
        rationale: `Alle sets haalden ${targetRepsMax} reps, maar de gemiddelde inspanning was RPE ${avgRpe} (terwijl het doel RPE ${targetRpe} was). Advies: behoud ${mostCommonWeight} kg tot de sets met meer controle en reserve voelen.`,
        rpeContext: `Gemiddelde RPE ${avgRpe} vs doel RPE ${targetRpe}`,
        isReadyForIncrease: false,
        equipmentType: exercise.equipment,
        confidence: "gemiddeld",
        disclaimer,
      };
    }

    // Volledig geslaagde dubbele progressie -> Verhoog gewicht met apparatuurstap!
    const newWeight = Math.round((mostCommonWeight + stepKg) * 100) / 100;
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      action: "increase_weight",
      actionLabel: `Gewicht verhogen (+${stepKg} kg)`,
      currentWeightKg: mostCommonWeight,
      suggestedWeightKg: newWeight,
      suggestedRepsMin: targetRepsMin,
      suggestedRepsMax: targetRepsMax,
      suggestedSets: targetSets,
      weightChangeKg: stepKg,
      rationale: `Alle ${validWorksets.length} sets bereikten de bovengrens (${targetRepsMax} reps) op ${mostCommonWeight} kg. Voorstel: +${stepKg} kg naar ${newWeight} kg bij ${targetRepsMin} herhalingen.`,
      rpeContext: avgRpe ? `Gemiddelde RPE was ${avgRpe}` : undefined,
      isReadyForIncrease: true,
      equipmentType: exercise.equipment,
      confidence: "hoog",
      disclaimer,
    };
  }

  // ---------------------------------------------------------------------------
  // 4. NIET ALLE SETS BEREIKTEN DE BOVENGRENS (REP-PROGRESSIE)
  // ---------------------------------------------------------------------------
  if (anySetBelowFloor) {
    // Sets vielen onder het minimumbereik (bv. minder dan 8 reps)
    const lowestRep = Math.min(...repCounts);
    return {
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      action: "maintain_weight",
      actionLabel: "Behoud gewicht",
      currentWeightKg: mostCommonWeight,
      suggestedWeightKg: mostCommonWeight,
      suggestedRepsMin: targetRepsMin,
      suggestedRepsMax: targetRepsMax,
      suggestedSets: targetSets,
      weightChangeKg: 0,
      rationale: `Een of meer sets vielen onder het minimumrepbereik van ${targetRepsMin} herhalingen (laagste set: ${lowestRep} reps op ${mostCommonWeight} kg). Behoud hetzelfde gewicht en focus op consistente uitvoering.`,
      rpeContext: avgRpe ? `Gemiddelde RPE was ${avgRpe}` : undefined,
      isReadyForIncrease: false,
      equipmentType: exercise.equipment,
      confidence: "gemiddeld",
      disclaimer,
    };
  }

  // Tussen min en max: Dubbele progressie fase 1 (meer reps maken op hetzelfde gewicht)
  return {
    exerciseId: exercise.id,
    exerciseName: exercise.name,
    action: "increase_reps",
    actionLabel: "Herhalingen opbouwen",
    currentWeightKg: mostCommonWeight,
    suggestedWeightKg: mostCommonWeight,
    suggestedRepsMin: targetRepsMin,
    suggestedRepsMax: targetRepsMax,
    suggestedSets: targetSets,
    weightChangeKg: 0,
    rationale: `Nog niet alle werksets bereikten de bovengrens (${repCounts.join(", ")} reps vs ${targetRepsMax} doel). Probeer eerst alle sets uit te bouwen naar ${targetRepsMax} herhalingen op ${mostCommonWeight} kg voordat je het gewicht verhoogt.`,
    rpeContext: avgRpe ? `Gemiddelde RPE was ${avgRpe}` : undefined,
    isReadyForIncrease: false,
    equipmentType: exercise.equipment,
    confidence: "hoog",
    disclaimer,
  };
}

/**
 * Hulpprogramma: Zoekt het meest representatieve gewicht uit een serie werksets.
 */
function getDominantWeight(weights: number[]): number {
  if (weights.length === 0) return 0;
  // Tel frequentie
  const freq = new Map<number, number>();
  for (const w of weights) {
    freq.set(w, (freq.get(w) || 0) + 1);
  }
  let dominant = weights[0];
  let maxCount = 0;
  for (const [w, count] of freq.entries()) {
    if (count > maxCount || (count === maxCount && w > dominant)) {
      maxCount = count;
      dominant = w;
    }
  }
  return dominant;
}
