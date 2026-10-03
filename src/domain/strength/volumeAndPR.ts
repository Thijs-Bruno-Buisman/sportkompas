/**
 * Domeinberekeningen voor Krachttraining Volume en Persoonlijke Records (PR's)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Regels:
 * 1. Alleen uitgevoerde/voltooide sets (completed === true) tellen mee.
 * 2. Assisted oefeningen (tegengewicht) worden niet verward met positief extern gewicht.
 * 3. 1RM schattingen via Epley en Brzycki formules met veilige grenzen.
 * 4. PR's worden dynamisch afgeleid van de actuele sets, waardoor aanpassingen
 *    of verwijderingen direct correct doorwerken.
 */

import type { WorkoutSet } from "@/types/database";

export interface SetVolumeData {
  weightKg?: number | null;
  reps?: number | null;
  completed?: boolean;
  isAssisted?: boolean;
}

export interface ExercisePRs {
  exerciseId: string;
  maxWeightKg: number;
  maxWeightSetId: string | null;
  maxEstimated1RM: number;
  max1RMFormula: "epley" | "brzycki";
  maxVolumeInSingleSet: number;
  totalCompletedSets: number;
  totalVolumeKg: number;
}

/**
 * Berekent het volume (tonnage in kg) voor één enkele set.
 * Alleen voltooide sets met positief gewicht en herhalingen tellen mee.
 * Voor assisted oefeningen is het gewicht een tegengewicht (machinehulp)
 * en wordt dit niet meegerekend in het externe positieve gewichtsvolume.
 */
export function calculateSetVolume(set: SetVolumeData): number {
  if (!set.completed) {
    return 0;
  }

  // Assisted oefening: gewicht is tegengewicht machinehulp, telt niet mee als positief extern volume
  if (set.isAssisted) {
    return 0;
  }

  const weight = typeof set.weightKg === "number" ? set.weightKg : 0;
  const reps = typeof set.reps === "number" ? set.reps : 0;

  if (weight <= 0 || reps <= 0) {
    return 0;
  }

  return Math.round(weight * reps * 100) / 100;
}

/**
 * Berekent het totale trainingsvolume (in kg) voor een reeks sets van een sessie.
 * Telt uitsluitend voltooide sets mee.
 */
export function calculateSessionVolume(sets: SetVolumeData[]): number {
  if (!sets || sets.length === 0) return 0;
  const total = sets.reduce((sum, s) => sum + calculateSetVolume(s), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Schat de 1-Repetition Maximum (1RM) op basis van gewicht en herhalingen.
 *
 * Formules:
 * - Epley: 1RM = gewicht * (1 + reps / 30)
 * - Brzycki: 1RM = gewicht * (36 / (37 - reps))
 */
export function estimate1RM(
  weightKg: number,
  reps: number,
  formula: "epley" | "brzycki" = "epley"
): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weightKg * 10) / 10;

  if (formula === "brzycki") {
    // Brzycki heeft een asymptoot bij 37 reps
    if (reps >= 37) return Math.round(weightKg * 10) / 10;
    const est = weightKg * (36 / (37 - reps));
    return Math.round(est * 10) / 10;
  }

  // Epley formule (standaard)
  const est = weightKg * (1 + reps / 30);
  return Math.round(est * 10) / 10;
}

/**
 * Leidt dynamisch de persoonlijke records (PR's) af voor een specifieke oefening
 * uit een verzameling sets (bv. alle historische sets uit voltooide sessies).
 *
 * Garandeert dat wanneer een sessie of set bewerkt of verwijderd wordt,
 * de PR's direct accuraat herberekend worden zonder achterblijvende vervuilde data.
 */
export function calculateExercisePRs(
  exerciseId: string,
  sets: WorkoutSet[],
  formula: "epley" | "brzycki" = "epley"
): ExercisePRs {
  const completedSets = sets.filter(
    (s) => s.exerciseId === exerciseId && s.completed === true
  );

  let maxWeightKg = 0;
  let maxWeightSetId: string | null = null;
  let maxEstimated1RM = 0;
  let maxVolumeInSingleSet = 0;
  let totalVolumeKg = 0;

  for (const s of completedSets) {
    const vol = calculateSetVolume(s);
    totalVolumeKg += vol;

    if (vol > maxVolumeInSingleSet) {
      maxVolumeInSingleSet = vol;
    }

    const weight = typeof s.weightKg === "number" ? s.weightKg : 0;
    const reps = typeof s.reps === "number" ? s.reps : 0;

    // Alleen niet-assisted sets tellen voor zwaarste gewicht en 1RM records
    if (!s.isAssisted && weight > 0 && reps > 0) {
      if (weight > maxWeightKg) {
        maxWeightKg = weight;
        maxWeightSetId = s.id;
      }

      const est1RM = estimate1RM(weight, reps, formula);
      if (est1RM > maxEstimated1RM) {
        maxEstimated1RM = est1RM;
      }
    }
  }

  return {
    exerciseId,
    maxWeightKg: Math.round(maxWeightKg * 100) / 100,
    maxWeightSetId,
    maxEstimated1RM: Math.round(maxEstimated1RM * 10) / 10,
    max1RMFormula: formula,
    maxVolumeInSingleSet: Math.round(maxVolumeInSingleSet * 100) / 100,
    totalCompletedSets: completedSets.length,
    totalVolumeKg: Math.round(totalVolumeKg * 100) / 100,
  };
}

