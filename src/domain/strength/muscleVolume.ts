/**
 * Domeinlogica voor Spiergroepen Volume & Wekelijkse Consistentie (Prompt 16)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Principes:
 * 1. Zichtbare & Transparante Telmethode:
 *    - Primaire spiergroep telt als 1.0 werkset (direct volume).
 *    - Secundaire spiergroepen tellen apart als 0.5 werkset (fractionele hulpspier-bijdrage).
 *    - Eén set wordt NOOIT ongemerkt geteld als een volledige set voor ieder betrokken spiertje.
 * 2. Strikte Werkset Definitie:
 *    - Alleen voltooide werksets (completed === true) tellen mee.
 *    - Warming-up sets (setType === "warmup") tellen standaard NIET mee.
 * 3. Consistentie & Rustdagen:
 *    - Consistentie wordt gemeten als het aantal behaalde trainingsweken t.o.v. een ingesteld weekdoel.
 *    - Rustdagen mogen NOOIT als "falen" of negatief worden weergegeven; rust is cruciaal voor herstel.
 * 4. Geen medische overtraining-claims:
 *    - Het overzicht is een transparant planning- en analysetool; geen claim dat het overtraining voorkomt.
 */

import type {
  WorkoutSession,
  WorkoutSet,
  Exercise,
  MuscleGroup,
} from "@/types/database";
import {
  parseLocalDate,
  getLocalDateString,
  addDaysToDateString,
  getWeekStartDate,
  type WeekStartDay,
} from "@/domain/dates/calendar";

export type { MuscleGroup };

export const MUSCLE_GROUPS_LIST: MuscleGroup[] = [
  "borst",
  "rug",
  "benen",
  "schouders",
  "armen",
  "core",
  "kuiten",
];

export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  borst: "Borst",
  rug: "Rug",
  benen: "Benen",
  schouders: "Schouders",
  armen: "Armen",
  core: "Core / Buik",
  kuiten: "Kuiten",
  cardio: "Cardio",
  full_body: "Full Body",
};

export type MuscleVolumeStatus = "geen" | "laag" | "optimaal" | "hoog";

export interface MuscleGroupVolumeSummary {
  muscleGroup: MuscleGroup;
  label: string;
  primarySets: number; // Aantal directe sets (1.0x)
  secondarySets: number; // Aantal indirecte sets als hulpspier (0.5x)
  fractionalTotalSets: number; // primarySets + (0.5 * secondarySets)
  totalTonnageKg: number; // Totaal getild extern gewicht (kg * reps)
  status: MuscleVolumeStatus; // Indicatieve categorisering
  contributingExercises: {
    exerciseId: string;
    exerciseName: string;
    isPrimary: boolean;
    setsCount: number;
  }[];
}

export interface WeeklyMuscleVolumeReport {
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  totalCompletedWorksets: number;
  totalTonnageKg: number;
  muscleGroups: Record<MuscleGroup, MuscleGroupVolumeSummary>;
  sortedByVolume: MuscleGroupVolumeSummary[];
  countingMethodDescription: string;
  disclaimer: string;
}

export interface DayConsistencyInfo {
  dateStr: string; // YYYY-MM-DD
  dayNameShort: string; // "Ma", "Di", etc.
  dayNameFull: string; // "Maandag", etc.
  isWorkoutDay: boolean;
  workoutsCount: number;
  isRestDay: boolean; // Geen training: neutraal en herstellend (geen falen)
  isToday: boolean;
  isFuture: boolean;
}

export interface WeekConsistencyItem {
  weekNumber: number;
  weekStartDate: string; // YYYY-MM-DD
  weekEndDate: string; // YYYY-MM-DD
  label: string;
  completedWorkoutsCount: number;
  weeklyGoal: number;
  isGoalMet: boolean;
  isCurrentWeek: boolean;
  days: DayConsistencyInfo[];
}

export interface ConsistencyReport {
  weeklyGoal: number;
  currentWeek: WeekConsistencyItem;
  historicalWeeks: WeekConsistencyItem[]; // Chronologisch (nieuwste eerst of oudste eerst)
  totalWeeksEvaluated: number;
  weeksGoalMetCount: number;
  consistencyPercentage: number; // 0..100%
  currentStreakWeeks: number; // Aaneengesloten behaalde weken
  disclaimer: string;
}

/**
 * Bepaalt de indicatieve volumestatus op basis van wekelijkse directe sets.
 * Dit is een algemene categorisering en geen overtraining-garantie.
 */
export function getMuscleVolumeStatus(primarySets: number): MuscleVolumeStatus {
  if (primarySets === 0) return "geen";
  if (primarySets < 10) return "laag"; // Minimum effectief volume / onderhoud
  if (primarySets <= 20) return "optimaal"; // Maximaal adaptief volume
  return "hoog"; // Hoog volume
}

/**
 * Berekent het weekoverzicht van werksets per spiergroep.
 */
export function calculateWeeklyMuscleVolume(options: {
  sessions: WorkoutSession[];
  sets: WorkoutSet[];
  exercises: Exercise[] | Map<string, Exercise>;
  weekStartDate: string; // YYYY-MM-DD
  weekStartsOn?: WeekStartDay;
}): WeeklyMuscleVolumeReport {
  const {
    sessions,
    sets,
    exercises,
    weekStartDate,
    weekStartsOn = "maandag",
  } = options;

  const weekEndDate = addDaysToDateString(weekStartDate, 6);

  // Indexeer oefeningen
  const exerciseMap =
    exercises instanceof Map
      ? exercises
      : new Map(exercises.map((e) => [e.id, e]));

  // 1. Filter voltooide sessies binnen deze week
  const weekSessions = sessions.filter((s) => {
    if (s.status !== "afgerond") return false;
    const d = s.calendarDate;
    return d >= weekStartDate && d <= weekEndDate;
  });

  const weekSessionIds = new Set(weekSessions.map((s) => s.id));

  // 2. Filter uitsluitend voltooide werksets (geen warming-up)
  const validWorksets = sets.filter((s) => {
    if (!weekSessionIds.has(s.sessionId)) return false;
    if (!s.completed) return false;
    if (s.setType === "warmup") return false;
    return true;
  });

  // Initialiseer datastructuur voor spiergroepen
  const muscleData: Record<MuscleGroup, MuscleGroupVolumeSummary> = {
    borst: createInitialMuscleSummary("borst"),
    rug: createInitialMuscleSummary("rug"),
    benen: createInitialMuscleSummary("benen"),
    schouders: createInitialMuscleSummary("schouders"),
    armen: createInitialMuscleSummary("armen"),
    core: createInitialMuscleSummary("core"),
    kuiten: createInitialMuscleSummary("kuiten"),
    cardio: createInitialMuscleSummary("cardio"),
    full_body: createInitialMuscleSummary("full_body"),
  };

  let totalTonnageKg = 0;

  // 3. Verwerk sets per oefening
  for (const set of validWorksets) {
    const exercise = exerciseMap.get(set.exerciseId);
    if (!exercise) continue;

    // Bereken tonnage voor deze werkset (exclusief assisted machinehulp)
    const isAssisted = exercise.measurementType === "assisted";
    const weight = !isAssisted && typeof set.weightKg === "number" ? set.weightKg : 0;
    const reps = typeof set.reps === "number" ? set.reps : 0;
    const setTonnage = weight > 0 && reps > 0 ? weight * reps : 0;

    totalTonnageKg += setTonnage;

    // A. Primaire spiergroep = 1.0 set
    const primary = exercise.primaryMuscleGroup as MuscleGroup;
    if (muscleData[primary]) {
      muscleData[primary].primarySets += 1;
      muscleData[primary].totalTonnageKg += setTonnage;

      // Voeg bijdrage toe aan oefenlijst
      addContributingExercise(
        muscleData[primary],
        exercise.id,
        exercise.name,
        true
      );
    }

    // B. Secundaire spiergroepen = 0.5 set apart (geen dubbeltelling als volwaardige set)
    if (exercise.secondaryMuscleGroups && Array.isArray(exercise.secondaryMuscleGroups)) {
      for (const sec of exercise.secondaryMuscleGroups) {
        const secGroup = sec as MuscleGroup;
        // Tel niet dubbel als een oefening per ongeluk dezelfde groep als primair én secundair heeft
        if (secGroup !== primary && muscleData[secGroup]) {
          muscleData[secGroup].secondarySets += 1;
          addContributingExercise(
            muscleData[secGroup],
            exercise.id,
            exercise.name,
            false
          );
        }
      }
    }
  }

  // 4. Bereken fractionele totalen en statussen
  for (const mg of MUSCLE_GROUPS_LIST) {
    const summary = muscleData[mg];
    summary.fractionalTotalSets =
      Math.round((summary.primarySets + 0.5 * summary.secondarySets) * 10) / 10;
    summary.totalTonnageKg = Math.round(summary.totalTonnageKg * 10) / 10;
    summary.status = getMuscleVolumeStatus(summary.primarySets);
  }

  // Sorteer op meest getrainde primaire spiergroepen eerst
  const sortedByVolume = MUSCLE_GROUPS_LIST.map((mg) => muscleData[mg]).sort(
    (a, b) => b.primarySets - a.primarySets || b.secondarySets - a.secondarySets
  );

  return {
    weekStartDate,
    weekEndDate,
    totalCompletedWorksets: validWorksets.length,
    totalTonnageKg: Math.round(totalTonnageKg * 10) / 10,
    muscleGroups: muscleData,
    sortedByVolume,
    countingMethodDescription:
      "Primaire spiergroepen tellen als 1,0 set. Secundaire hulpspiergroepen tellen apart mee als 0,5 set (fractioneel). Opwarmsets en incomplete sets worden uitgesloten.",
    disclaimer:
      "Dit volume-overzicht toont jouw gelogde werksets per spiergroep. Het is een hulpmiddel voor trainingsplanning en voorkomt op zichzelf geen overtraining of blessures.",
  };
}

function createInitialMuscleSummary(
  muscleGroup: MuscleGroup
): MuscleGroupVolumeSummary {
  return {
    muscleGroup,
    label: MUSCLE_GROUP_LABELS[muscleGroup] || muscleGroup,
    primarySets: 0,
    secondarySets: 0,
    fractionalTotalSets: 0,
    totalTonnageKg: 0,
    status: "geen",
    contributingExercises: [],
  };
}

function addContributingExercise(
  summary: MuscleGroupVolumeSummary,
  exerciseId: string,
  exerciseName: string,
  isPrimary: boolean
) {
  const existing = summary.contributingExercises.find(
    (e) => e.exerciseId === exerciseId && e.isPrimary === isPrimary
  );
  if (existing) {
    existing.setsCount += 1;
  } else {
    summary.contributingExercises.push({
      exerciseId,
      exerciseName,
      isPrimary,
      setsCount: 1,
    });
  }
}

/**
 * Berekent de wekelijkse consistentie en het behalen van het trainingsdoel.
 * Rustdagen worden expliciet respectvol behandeld als herstel en NIET als falen.
 */
export function calculateWeeklyConsistency(options: {
  sessions: WorkoutSession[];
  weeklyGoal?: number; // Standaard 3 sessies per week
  referenceDateStr?: string; // YYYY-MM-DD (standaard vandaag)
  weekStartsOn?: WeekStartDay;
  historyWeeksCount?: number; // Aantal terugkijkende weken (standaard 4)
}): ConsistencyReport {
  const {
    sessions,
    weeklyGoal = 3,
    referenceDateStr = getLocalDateString(),
    weekStartsOn = "maandag",
    historyWeeksCount = 4,
  } = options;

  // Filter uitsluitend voltooide sessies
  const completedSessions = sessions.filter((s) => s.status === "afgerond");

  // Map van datum naar aantal sessies
  const sessionCountByDate = new Map<string, number>();
  for (const s of completedSessions) {
    const d = s.calendarDate;
    sessionCountByDate.set(d, (sessionCountByDate.get(d) || 0) + 1);
  }

  // Bepaal de huidige weekstart
  const currentWeekStart = getWeekStartDate(referenceDateStr, weekStartsOn);

  // Bouw weekitems voor de afgelopen N weken (inclusief huidige week)
  const allWeeks: WeekConsistencyItem[] = [];

  for (let w = 0; w < historyWeeksCount; w++) {
    // Ga w weken terug vanaf huidige week
    const weekStart = addDaysToDateString(currentWeekStart, -w * 7);
    const weekEnd = addDaysToDateString(weekStart, 6);
    const isCurrentWeek = w === 0;

    // Bouw de 7 dagen van deze week
    const days: DayConsistencyInfo[] = [];
    let weekWorkoutsCount = 0;

    for (let d = 0; d < 7; d++) {
      const dateStr = addDaysToDateString(weekStart, d);
      const dateObj = parseLocalDate(dateStr);
      const workoutsCount = sessionCountByDate.get(dateStr) || 0;
      const isWorkoutDay = workoutsCount > 0;
      const isToday = dateStr === referenceDateStr;
      const isFuture = dateStr > referenceDateStr;

      if (isWorkoutDay) {
        weekWorkoutsCount += workoutsCount;
      }

      days.push({
        dateStr,
        dayNameShort: dateObj.toLocaleDateString("nl-NL", { weekday: "short" }),
        dayNameFull: dateObj.toLocaleDateString("nl-NL", { weekday: "long" }),
        isWorkoutDay,
        workoutsCount,
        // Rustdag = geen training op die dag (en niet in de toekomst)
        isRestDay: !isWorkoutDay && !isFuture,
        isToday,
        isFuture,
      });
    }

    const isGoalMet = weekWorkoutsCount >= weeklyGoal;

    // Genereer label (bv. "Week 40: 29 sep - 5 okt")
    const startDateObj = parseLocalDate(weekStart);
    const endDateObj = parseLocalDate(weekEnd);
    const startFormatted = `${startDateObj.getDate()} ${startDateObj.toLocaleDateString("nl-NL", { month: "short" })}`;
    const endFormatted = `${endDateObj.getDate()} ${endDateObj.toLocaleDateString("nl-NL", { month: "short" })}`;
    const label = `${startFormatted} – ${endFormatted}`;

    allWeeks.push({
      weekNumber: getISOWeekNumber(parseLocalDate(weekStart)),
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      label,
      completedWorkoutsCount: weekWorkoutsCount,
      weeklyGoal,
      isGoalMet,
      isCurrentWeek,
      days,
    });
  }

  const currentWeek = allWeeks[0];
  const historicalWeeks = allWeeks.slice(1);

  // Bereken algehele consistentie ratio
  const totalWeeksEvaluated = allWeeks.length;
  const weeksGoalMetCount = allWeeks.filter((w) => w.isGoalMet).length;
  const consistencyPercentage =
    totalWeeksEvaluated > 0
      ? Math.round((weeksGoalMetCount / totalWeeksEvaluated) * 100)
      : 0;

  // Bereken actieve streak (aaneengesloten behaalde weken)
  let currentStreakWeeks = 0;
  // Als huidige week het doel al gehaald heeft, begin bij huidige week. Anders bij vorige week.
  const streakStartIndex = currentWeek.isGoalMet ? 0 : 1;
  for (let i = streakStartIndex; i < allWeeks.length; i++) {
    if (allWeeks[i].isGoalMet) {
      currentStreakWeeks++;
    } else {
      break;
    }
  }

  return {
    weeklyGoal,
    currentWeek,
    historicalWeeks,
    totalWeeksEvaluated,
    weeksGoalMetCount,
    consistencyPercentage,
    currentStreakWeeks,
    disclaimer:
      "Consistentie geeft aan in hoeveel weken je jouw persoonlijke streefdoel hebt behaald. Rustdagen zijn essentieel voor herstel en tellen nooit als falen.",
  };
}

/**
 * Berekent het ISO weeknummer voor een datum.
 */
function getISOWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
