import type { PlannedExerciseInDay } from "@/types/database";

export interface RoutineValidationError {
  field?: string;
  dayIndex?: number;
  exerciseIndex?: number;
  message: string;
}

/**
 * Valideert een trainingsschema en alle bijbehorende dagen en oefeningen.
 * Controleert lege dagen, ongeldige repbereiken en incompatibele meettypes.
 */
export function validateRoutineData(
  routineName: string,
  days: {
    name: string;
    plannedExercises: PlannedExerciseInDay[];
  }[]
): RoutineValidationError[] {
  const errors: RoutineValidationError[] = [];

  // 1. Schemanaam
  if (!routineName.trim()) {
    errors.push({
      field: "routineName",
      message: "Vul een naam in voor het trainingsschema.",
    });
  }

  // 2. Minimaal 1 trainingsdag
  if (days.length === 0) {
    errors.push({
      field: "days",
      message: "Een schema moet minimaal 1 trainingsdag bevatten.",
    });
    return errors;
  }

  // 3. Valideer elke dag afzonderlijk
  days.forEach((day, dIdx) => {
    const dayLabel = day.name.trim() || `Dag ${dIdx + 1}`;

    if (!day.name.trim()) {
      errors.push({
        field: `day_${dIdx}_name`,
        dayIndex: dIdx,
        message: `Geef dag ${dIdx + 1} een herkenbare naam (bijv. Push, Upper of Full Body).`,
      });
    }

    // Lege dag validatie: elke dag MOET minimaal 1 oefening bevatten
    if (!day.plannedExercises || day.plannedExercises.length === 0) {
      errors.push({
        field: `day_${dIdx}_exercises`,
        dayIndex: dIdx,
        message: `Trainingsdag "${dayLabel}" heeft geen oefeningen. Voeg minimaal 1 oefening toe of verwijder de lege dag.`,
      });
      return;
    }

    // 4. Valideer elke oefening op de dag
    day.plannedExercises.forEach((pe, eIdx) => {
      const exLabel = pe.exerciseName || `Oefening ${eIdx + 1}`;

      // Sets validatie
      if (!pe.targetSets || pe.targetSets < 1) {
        errors.push({
          field: `day_${dIdx}_ex_${eIdx}_sets`,
          dayIndex: dIdx,
          exerciseIndex: eIdx,
          message: `${exLabel} (${dayLabel}): Aantal sets moet minimaal 1 zijn.`,
        });
      }

      // Meettype compatibiliteit: Tijd vs Reps
      if (pe.measurementType === "tijd") {
        if (!pe.targetDurationSeconds || pe.targetDurationSeconds < 1) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_duration`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): Duuroefeningen vereisen een tijdsduur in seconden (bijv. 45 of 60 sec).`,
          });
        }
      } else {
        // Herhalingen validatie voor reguliere, lichaamsgewicht, assisted en extra gewicht
        const repsMin = pe.targetRepsMin ?? 0;
        const repsMax = pe.targetRepsMax ?? 0;

        if (repsMin < 1) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_repsMin`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): Minimale herhalingen moet minimaal 1 zijn.`,
          });
        }

        if (repsMax < 1) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_repsMax`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): Maximale herhalingen moet minimaal 1 zijn.`,
          });
        }

        // Ongeldig repbereik (bv min: 10, max: 8)
        if (repsMin > 0 && repsMax > 0 && repsMin > repsMax) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_repsRange`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): Ongeldig repbereik. Minimale herhalingen (${repsMin}) mag niet hoger zijn dan maximale (${repsMax}).`,
          });
        }
      }

      // Doelgewicht validatie
      if (pe.targetWeightKg !== undefined && pe.targetWeightKg !== null) {
        if (pe.targetWeightKg < 0) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_weight`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): Doelgewicht mag niet negatief zijn.`,
          });
        }
      }

      // Inspanningsschaal validatie
      if (pe.effortScale === "rpe" && pe.targetRpe !== undefined && pe.targetRpe !== null) {
        if (pe.targetRpe < 1 || pe.targetRpe > 10) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_rpe`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): RPE doelwaarde moet tussen 1 en 10 liggen.`,
          });
        }
      }

      if (pe.effortScale === "rir" && pe.targetRir !== undefined && pe.targetRir !== null) {
        if (pe.targetRir < 0 || pe.targetRir > 10) {
          errors.push({
            field: `day_${dIdx}_ex_${eIdx}_rir`,
            dayIndex: dIdx,
            exerciseIndex: eIdx,
            message: `${exLabel} (${dayLabel}): RIR doelwaarde (Reps in Reserve) moet tussen 0 en 10 liggen.`,
          });
        }
      }

      // Rusttijd validatie
      if (pe.restSeconds < 0) {
        errors.push({
          field: `day_${dIdx}_ex_${eIdx}_rest`,
          dayIndex: dIdx,
          exerciseIndex: eIdx,
          message: `${exLabel} (${dayLabel}): Rusttijd mag niet negatief zijn.`,
        });
      }
    });
  });

  return errors;
}
