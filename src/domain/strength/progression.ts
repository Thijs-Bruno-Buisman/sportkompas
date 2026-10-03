/**
 * Domeinlogica voor Trainingsgeschiedenis en Oefenprogressie (Prompt 13)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Regels:
 * 1. Bereken gewichtsvolume alleen voor passende oefeningen met duidelijke definitie.
 * 2. Nul en ontbrekend (null) verschillen expliciet (0 kg is niet gelijk aan niet-ingevuld/onbekend).
 * 3. Meng assisted, lichaamsgewicht en externe belasting NOOIT tot één onduidelijke score.
 * 4. Lichaamsgewichtvolume mag alleen als voldoende historische lichaamsgegevens beschikbaar zijn
 *    en de definitie expliciet zichtbaar is.
 * 5. Conversie naar lb is zuiver presentatie; canonieke data blijft altijd kg.
 */

import type {
  WorkoutSession,
  WorkoutSet,
  Exercise,
  ExerciseMeasurementType,
} from "@/types/database";
import { estimate1RM } from "./volumeAndPR";
import { kgToLbs } from "../units";

export type DateFilterType = "all" | "7d" | "30d" | "90d" | "1y" | "custom";

export interface CustomDateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
}

export interface ExerciseHistoryPoint {
  calendarDate: string; // YYYY-MM-DD
  startTime?: string;
  sessionId: string;
  sessionTitle: string;
  measurementType: ExerciseMeasurementType;
  isAssisted: boolean;
  completedSetsCount: number;
  maxWeightKg: number | null; // null indien geen gewichtsoefening, 0 indien 0 kg getild
  maxReps: number;
  worksetVolumeKg: number; // 0 indien niet-passend of assisted
  volumeDefinition: string; // Uitleg van de gekozen volumeberekening
  averageRpe: number | null; // null indien geen RPE gelogd (0 bestaat niet op 1-10 schaal)
  averageRir: number | null;
  estimated1RM: number | null; // null indien geen gewichtsoefening
}

/**
 * Berekent de begindatum voor een vooraf gedefinieerd datumfilter.
 */
export function getStartDateForFilter(
  filterType: DateFilterType,
  customRange?: CustomDateRange,
  now = new Date()
): string | null {
  if (filterType === "all") return null;

  if (filterType === "custom") {
    return customRange?.startDate || null;
  }

  const d = new Date(now);

  switch (filterType) {
    case "7d":
      d.setDate(d.getDate() - 7);
      break;
    case "30d":
      d.setDate(d.getDate() - 30);
      break;
    case "90d":
      d.setDate(d.getDate() - 90);
      break;
    case "1y":
      d.setFullYear(d.getFullYear() - 1);
      break;
    default:
      return null;
  }

  return d.toISOString().split("T")[0];
}

/**
 * Filtert workoutsessies op datumbereik en zoekopdracht (oefening of naam).
 */
export function filterWorkoutSessions(
  sessions: WorkoutSession[],
  filterType: DateFilterType,
  options?: {
    customRange?: CustomDateRange;
    searchQuery?: string;
    exerciseId?: string;
    now?: Date;
  }
): WorkoutSession[] {
  const startDate = getStartDateForFilter(
    filterType,
    options?.customRange,
    options?.now
  );
  const endDate =
    filterType === "custom" && options?.customRange?.endDate
      ? options.customRange.endDate
      : null;

  const q = options?.searchQuery?.toLowerCase().trim() || "";
  const exId = options?.exerciseId;

  return sessions.filter((session) => {
    // 1. Datumfilter
    if (startDate && session.calendarDate < startDate) return false;
    if (endDate && session.calendarDate > endDate) return false;

    // 2. Filter op specifieke oefening ID
    if (exId) {
      const hasExercise = session.snapshot.exercises.some(
        (e) => e.exerciseId === exId
      );
      if (!hasExercise) return false;
    }

    // 3. Tekstuele zoekopdracht
    if (q) {
      const title = `${session.snapshot.routineDayName || ""} ${
        session.snapshot.routineName || ""
      }`.toLowerCase();
      const hasTitleMatch = title.includes(q);
      const hasExerciseMatch = session.snapshot.exercises.some((e) =>
        e.exerciseName.toLowerCase().includes(q)
      );
      const hasDateMatch = session.calendarDate.includes(q);
      const hasNotesMatch = session.notes?.toLowerCase().includes(q);

      if (!hasTitleMatch && !hasExerciseMatch && !hasDateMatch && !hasNotesMatch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Bouwt chronologische datapunten voor oefenprogressiegrafieken en tabellen.
 *
 * Scheidt externe belasting, assisted machines en lichaamsgewicht strikt.
 * Behandelt 0 en null/undefined als fundamenteel verschillend.
 */
export function buildExerciseProgressionPoints(
  exercise: Exercise,
  completedSessions: WorkoutSession[],
  allSets: WorkoutSet[],
  userBodyweightKg?: number | null
): ExerciseHistoryPoint[] {
  // Alleen voltooide sessies waarin deze oefening voorkwam
  const finishedSessions = completedSessions.filter(
    (s) =>
      s.status === "afgerond" &&
      s.snapshot.exercises.some((e) => e.exerciseId === exercise.id)
  );

  // Alleen voltooide sets voor deze oefening
  const exerciseSets = allSets.filter(
    (s) => s.exerciseId === exercise.id && s.completed === true
  );

  // Groepeer sets per sessionId
  const setsBySession = new Map<string, WorkoutSet[]>();
  for (const set of exerciseSets) {
    const list = setsBySession.get(set.sessionId) || [];
    list.push(set);
    setsBySession.set(set.sessionId, list);
  }

  const points: ExerciseHistoryPoint[] = [];

  for (const session of finishedSessions) {
    const sessionSets = setsBySession.get(session.id) || [];
    if (sessionSets.length === 0) continue;

    const measurementType = exercise.measurementType || "gewicht_herhalingen";
    const isAssisted =
      measurementType === "assisted" || sessionSets.some((s) => s.isAssisted);

    let maxWeightKg: number | null = null;
    let maxReps = 0;
    let worksetVolumeKg = 0;
    let volumeDefinition = "";
    let estimated1RM: number | null = null;

    // RPE en RIR verzameling
    const rpeValues: number[] = [];
    const rirValues: number[] = [];

    // Max reps bepalen
    for (const s of sessionSets) {
      if (typeof s.reps === "number" && s.reps > maxReps) {
        maxReps = s.reps;
      }
      if (typeof s.actualRpe === "number" && s.actualRpe > 0) {
        rpeValues.push(s.actualRpe);
      }
      if (typeof s.actualRir === "number" && s.actualRir >= 0) {
        rirValues.push(s.actualRir);
      }
    }

    // Onderscheid meettypes conform de productregels
    if (isAssisted) {
      // ASSISTED: Gewichten zijn tegengewichten (machinehulp)
      // Minder tegengewicht = betere prestatie
      const weights = sessionSets
        .filter((s) => typeof s.weightKg === "number")
        .map((s) => s.weightKg);

      maxWeightKg = weights.length > 0 ? Math.min(...weights) : null;
      worksetVolumeKg = 0; // Wordt niet opgeteld bij positief volume
      volumeDefinition =
        "Assisted machine: gewicht is tegengewicht (hulp). Minder hulp betekent meer eigen getild gewicht (omgekeerde progressie).";
      estimated1RM = null;
    } else if (measurementType === "lichaamsgewicht") {
      // LICHAAMSGEWICHT:
      if (typeof userBodyweightKg === "number" && userBodyweightKg > 0) {
        // Lichaamsgewichtvolume mag ALLEEN berekend worden als lichaamsgewicht bekend is
        // én de gekozen definitie expliciet zichtbaar is!
        worksetVolumeKg = sessionSets.reduce((sum, s) => {
          const added = typeof s.weightKg === "number" ? s.weightKg : 0;
          return sum + (userBodyweightKg + added) * s.reps;
        }, 0);
        worksetVolumeKg = Math.round(worksetVolumeKg * 100) / 100;
        volumeDefinition = `Lichaamsgewicht volume: (${userBodyweightKg} kg lichaamsgewicht + extra gewicht) × herhalingen.`;
      } else {
        worksetVolumeKg = 0;
        volumeDefinition =
          "Lichaamsgewicht: progressie wordt bijgehouden in herhalingen (geen actueel lichaamsgewicht geregistreerd).";
      }

      // Max gewicht is alleen van toepassing als er extra gewicht is toegevoegd
      const addedWeights = sessionSets
        .filter((s) => typeof s.weightKg === "number" && s.weightKg > 0)
        .map((s) => s.weightKg);
      maxWeightKg = addedWeights.length > 0 ? Math.max(...addedWeights) : null;
      estimated1RM = null;
    } else if (measurementType === "tijd") {
      // TIJD / DUUR:
      maxWeightKg = null;
      worksetVolumeKg = 0;
      volumeDefinition = "Tijdsduur: progressie wordt gemeten in seconden.";
      estimated1RM = null;
    } else {
      // STANDAARD EXTERNE BELASTING (gewicht_herhalingen / extra_gewicht)
      const validWeights = sessionSets
        .filter((s) => typeof s.weightKg === "number")
        .map((s) => s.weightKg);

      maxWeightKg = validWeights.length > 0 ? Math.max(...validWeights) : null;

      // Bereken werksetvolume
      worksetVolumeKg = sessionSets.reduce((sum, s) => {
        const w = typeof s.weightKg === "number" ? s.weightKg : 0;
        const r = typeof s.reps === "number" ? s.reps : 0;
        if (w > 0 && r > 0) {
          return sum + w * r;
        }
        return sum;
      }, 0);
      worksetVolumeKg = Math.round(worksetVolumeKg * 100) / 100;
      volumeDefinition = "Werksetvolume = gewicht (kg) × herhalingen per voltooide set.";

      // Bereken hoogste geschatte 1RM voor deze sessie
      let highest1RM = 0;
      for (const s of sessionSets) {
        if (s.weightKg > 0 && s.reps > 0) {
          const est = estimate1RM(s.weightKg, s.reps);
          if (est > highest1RM) highest1RM = est;
        }
      }
      estimated1RM = highest1RM > 0 ? highest1RM : null;
    }

    // Gemiddelde RPE en RIR
    const averageRpe =
      rpeValues.length > 0
        ? Math.round(
            (rpeValues.reduce((a, b) => a + b, 0) / rpeValues.length) * 10
          ) / 10
        : null;

    const averageRir =
      rirValues.length > 0
        ? Math.round(
            (rirValues.reduce((a, b) => a + b, 0) / rirValues.length) * 10
          ) / 10
        : null;

    const sessionTitle =
      session.snapshot.routineDayName ||
      session.snapshot.routineName ||
      "Workout";

    points.push({
      calendarDate: session.calendarDate,
      startTime: session.startTime || session.startedAt,
      sessionId: session.id,
      sessionTitle,
      measurementType,
      isAssisted,
      completedSetsCount: sessionSets.length,
      maxWeightKg,
      maxReps,
      worksetVolumeKg,
      volumeDefinition,
      averageRpe,
      averageRir,
      estimated1RM,
    });
  }

  // Sorteer chronologisch van oud naar nieuw (nodig voor grafieken over tijd)
  return points.sort((a, b) => {
    const dateCmp = a.calendarDate.localeCompare(b.calendarDate);
    if (dateCmp !== 0) return dateCmp;
    return (a.startTime || "").localeCompare(b.startTime || "");
  });
}

/**
 * Converteert gewichtswaarden in de geschiedenispunten naar lbs voor weergave.
 * Wijzigt GEEN canonieke databasegegevens.
 */
export function convertProgressionPointsToLbs(
  points: ExerciseHistoryPoint[]
): ExerciseHistoryPoint[] {
  return points.map((p) => ({
    ...p,
    maxWeightKg:
      p.maxWeightKg !== null ? kgToLbs(p.maxWeightKg) : null,
    worksetVolumeKg:
      p.worksetVolumeKg > 0 ? kgToLbs(p.worksetVolumeKg) : 0,
    estimated1RM:
      p.estimated1RM !== null ? kgToLbs(p.estimated1RM) : null,
  }));
}
