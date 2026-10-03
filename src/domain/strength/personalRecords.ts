/**
 * Domeinlogica voor Persoonlijke Records (PR's) en Geschatte 1RM (Prompt 14)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Regels:
 * 1. Duidelijke categorieën: zwaarste gewicht, meeste reps bij een bepaald gewicht,
 *    geschatte 1RM en minste tegengewicht (assisted).
 * 2. 1RM-schattingen:
 *    - Wetenschappelijk rep-bereik: uitsluitend voor 1 t/m 10 herhalingen.
 *    - Alleen voor geschikte oefeningen (gewicht_herhalingen, extra_gewicht).
 *    - Nooit voor assisted of lichaamsgewicht zonder gewicht.
 *    - Formule transparantie (Epley/Brzycki) met zichtbare "Geschat" markering.
 * 3. Alleen afgeronde geldige sets (completed === true, weight >= 0, reps > 0).
 * 4. Gelijke score (tie) is GEEN nieuw record; het oudere record behoudt de eer.
 * 5. Volledig dynamisch: verwijderen van een sessie herstelt direct het voorgaande record.
 */

import type {
  WorkoutSession,
  WorkoutSet,
  Exercise,
  ExerciseMeasurementType,
} from "@/types/database";

export type PRCategory =
  | "max_weight" // Zwaarste gewicht ooit succesvol getild
  | "reps_at_weight" // Meeste reps bij een specifiek gewicht
  | "estimated_1rm" // Hoogste geschatte 1RM (1 <= reps <= 10)
  | "max_volume_set" // Hoogste tonnage in 1 werkset (reps * weight)
  | "least_assistance"; // Minste tegengewicht op assisted machine

export interface AchievedPR {
  id: string;
  category: PRCategory;
  categoryLabel: string;
  exerciseId: string;
  exerciseName: string;
  sessionId: string;
  setId: string;
  calendarDate: string; // YYYY-MM-DD
  weightKg: number;
  reps: number;
  value: number; // Numerieke vergelijkingswaarde (kg, reps, of geschatte 1RM)
  previousValue: number | null;
  formattedValue: string; // bv. "110 kg", "12 reps @ 100 kg", "135 kg (Epley)"
  description: string; // bv. "Zwaarste gewicht: 110 kg (+5 kg)"
  isEstimated: boolean;
  isAssisted?: boolean;
  formulaUsed?: "epley" | "brzycki";
}

export interface Eligible1RMResult {
  estimated1RMKg: number;
  formula: "epley" | "brzycki";
  formulaExplanation: string;
  isEligible: true;
}

/**
 * Berekent de geschatte 1RM conform wetenschappelijke validatiegrenzen.
 *
 * Beperkingen:
 * - Reps moet tussen 1 en 10 liggen. Boven 10 reps is een 1RM-schatting wetenschappelijk
 *   onbetrouwbaar en wordt null geretourneerd.
 * - Alleen geschikt voor 'gewicht_herhalingen' en 'extra_gewicht'.
 */
export function calculateEligible1RM(
  weightKg: number,
  reps: number,
  measurementType: ExerciseMeasurementType,
  formula: "epley" | "brzycki" = "epley"
): Eligible1RMResult | null {
  // 1. Alleen geschikte meetmethodes
  if (
    measurementType !== "gewicht_herhalingen" &&
    measurementType !== "extra_gewicht"
  ) {
    return null;
  }

  // 2. Grenzenbewaking: 1 t/m 10 herhalingen
  if (reps < 1 || reps > 10 || weightKg <= 0) {
    return null;
  }

  // 1 rep is exact het getilde gewicht
  if (reps === 1) {
    return {
      estimated1RMKg: Math.round(weightKg * 10) / 10,
      formula,
      formulaExplanation: "1RM is gemeten (1 herhaling)",
      isEligible: true,
    };
  }

  let est: number;
  let formulaExplanation: string;

  if (formula === "brzycki") {
    est = weightKg * (36 / (37 - reps));
    formulaExplanation = "Brzycki: gewicht × (36 / (37 - reps))";
  } else {
    // Epley (standaard en meest gangbaar)
    est = weightKg * (1 + reps / 30);
    formulaExplanation = "Epley: gewicht × (1 + reps / 30)";
  }

  return {
    estimated1RMKg: Math.round(est * 10) / 10,
    formula,
    formulaExplanation,
    isEligible: true,
  };
}

/**
 * Bepaalt of een voltooide set een PR vestigt ten opzichte van een reeks eerdere sets.
 */
export function evaluateSetForPRs(
  candidateSet: WorkoutSet,
  exercise: Exercise,
  session: WorkoutSession,
  historicalSets: WorkoutSet[],
  formula: "epley" | "brzycki" = "epley"
): AchievedPR[] {
  // 1. Onvoltooide sets vestigen NOOIT een PR
  if (!candidateSet.completed) {
    return [];
  }

  const weight = typeof candidateSet.weightKg === "number" ? candidateSet.weightKg : 0;
  const reps = typeof candidateSet.reps === "number" ? candidateSet.reps : 0;

  // 2. Minimaal 1 herhaling vereist
  if (reps < 1) {
    return [];
  }

  const measurementType = exercise.measurementType || "gewicht_herhalingen";
  const isAssisted = measurementType === "assisted" || Boolean(candidateSet.isAssisted);

  // Filter historische sets voor dezelfde oefening die geldig voltooid zijn
  const validHistory = historicalSets.filter(
    (s) => s.exerciseId === exercise.id && s.completed && s.id !== candidateSet.id
  );

  const prs: AchievedPR[] = [];

  // =========================================================================
  // CATEGORIE 1 & 2: GEWICHT (EXTERN GEWICHT VS ASSISTED TEGENGEWICHT)
  // =========================================================================
  if (isAssisted) {
    // Assisted: Minder gewicht = betere prestatie (omgekeerde progressie)
    if (weight >= 0) {
      const priorAssistanceWeights = validHistory
        .map((s) => s.weightKg)
        .filter((w): w is number => typeof w === "number" && w >= 0);

      const previousLeast =
        priorAssistanceWeights.length > 0 ? Math.min(...priorAssistanceWeights) : null;

      // Alleen een PR als het minder tegengewicht is dan het vorige minimum (geen ties!)
      if (previousLeast === null || weight < previousLeast) {
        const diff = previousLeast !== null ? Math.round((previousLeast - weight) * 10) / 10 : null;
        prs.push({
          id: `${candidateSet.id}-least_assistance`,
          category: "least_assistance",
          categoryLabel: "Minste Machinehulp",
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sessionId: session.id,
          setId: candidateSet.id,
          calendarDate: session.calendarDate,
          weightKg: weight,
          reps,
          value: weight,
          previousValue: previousLeast,
          formattedValue: `${weight} kg hulp`,
          description:
            previousLeast !== null
              ? `Minste tegengewicht ooit: ${weight} kg (${diff} kg minder hulp!)`
              : `Eerste machinehulp record: ${weight} kg`,
          isEstimated: false,
          isAssisted: true,
        });
      }
    }
  } else {
    // Reguliere externe belasting: Zwaarder gewicht = PR
    if (weight > 0) {
      const priorWeights = validHistory
        .filter((s) => !s.isAssisted)
        .map((s) => s.weightKg)
        .filter((w): w is number => typeof w === "number" && w > 0);

      const previousMaxWeight = priorWeights.length > 0 ? Math.max(...priorWeights) : null;

      // Alleen een PR als het strikt zwaarder is dan voorheen (geen ties!)
      if (previousMaxWeight === null || weight > previousMaxWeight) {
        const diff = previousMaxWeight !== null ? Math.round((weight - previousMaxWeight) * 10) / 10 : null;
        prs.push({
          id: `${candidateSet.id}-max_weight`,
          category: "max_weight",
          categoryLabel: "Zwaarste Gewicht",
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          sessionId: session.id,
          setId: candidateSet.id,
          calendarDate: session.calendarDate,
          weightKg: weight,
          reps,
          value: weight,
          previousValue: previousMaxWeight,
          formattedValue: `${weight} kg`,
          description:
            previousMaxWeight !== null
              ? `Nieuw zwaarste gewicht: ${weight} kg (+${diff} kg)`
              : `Eerste gewichtsrecord: ${weight} kg`,
          isEstimated: false,
        });
      }
    }
  }

  // =========================================================================
  // CATEGORIE 3: REPS BIJ EEN BEPAALD GEWICHT (REPS AT WEIGHT)
  // =========================================================================
  // Alleen als er al eerder op ditzelfde gewicht getraind is óf het gewicht > 0 is
  if (!isAssisted && weight > 0 && reps > 1) {
    const priorSetsAtSameWeight = validHistory.filter(
      (s) => !s.isAssisted && s.weightKg === weight && typeof s.reps === "number"
    );

    const priorMaxRepsAtWeight =
      priorSetsAtSameWeight.length > 0
        ? Math.max(...priorSetsAtSameWeight.map((s) => s.reps))
        : null;

    // Als we al eerder dit gewicht tilden, en nu méér reps halen: Rep Record!
    if (priorMaxRepsAtWeight !== null && reps > priorMaxRepsAtWeight) {
      const diff = reps - priorMaxRepsAtWeight;
      prs.push({
        id: `${candidateSet.id}-reps_at_weight`,
        category: "reps_at_weight",
        categoryLabel: "Rep Record bij Gewicht",
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sessionId: session.id,
        setId: candidateSet.id,
        calendarDate: session.calendarDate,
        weightKg: weight,
        reps,
        value: reps,
        previousValue: priorMaxRepsAtWeight,
        formattedValue: `${reps} herhalingen @ ${weight} kg`,
        description: `Meeste herhalingen op ${weight} kg: ${reps} reps (+${diff} herhalingen)`,
        isEstimated: false,
      });
    }
  }

  // =========================================================================
  // CATEGORIE 4: GESCHATTE 1RM (ALLEEN VOOR GESCHIKTE OEFENINGEN & 1-10 REPS)
  // =========================================================================
  const eligible1RM = calculateEligible1RM(weight, reps, measurementType, formula);
  if (eligible1RM) {
    const prior1RMs: number[] = [];
    for (const priorSet of validHistory) {
      if (
        !priorSet.isAssisted &&
        typeof priorSet.weightKg === "number" &&
        typeof priorSet.reps === "number"
      ) {
        const prior1RM = calculateEligible1RM(
          priorSet.weightKg,
          priorSet.reps,
          measurementType,
          formula
        );
        if (prior1RM) {
          prior1RMs.push(prior1RM.estimated1RMKg);
        }
      }
    }

    const previousMax1RM = prior1RMs.length > 0 ? Math.max(...prior1RMs) : null;

    // Alleen een PR als de geschatte 1RM strikt hoger is dan het vorige record
    if (previousMax1RM === null || eligible1RM.estimated1RMKg > previousMax1RM) {
      const diff =
        previousMax1RM !== null
          ? Math.round((eligible1RM.estimated1RMKg - previousMax1RM) * 10) / 10
          : null;

      const formulaName = formula === "brzycki" ? "Brzycki" : "Epley";

      prs.push({
        id: `${candidateSet.id}-estimated_1rm`,
        category: "estimated_1rm",
        categoryLabel: `Geschatte 1RM (${formulaName})`,
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sessionId: session.id,
        setId: candidateSet.id,
        calendarDate: session.calendarDate,
        weightKg: weight,
        reps,
        value: eligible1RM.estimated1RMKg,
        previousValue: previousMax1RM,
        formattedValue: `${eligible1RM.estimated1RMKg} kg (Geschat: ${formulaName})`,
        description:
          previousMax1RM !== null
            ? `Nieuwe geschatte 1RM: ${eligible1RM.estimated1RMKg} kg (+${diff} kg gebaseerd op ${weight} kg × ${reps})`
            : `Eerste geschatte 1RM: ${eligible1RM.estimated1RMKg} kg (gebaseerd op ${weight} kg × ${reps})`,
        isEstimated: true,
        formulaUsed: formula,
      });
    }
  }

  // =========================================================================
  // CATEGORIE 5: MAX SET VOLUME (TONNAGE IN ÉÉN SET)
  // =========================================================================
  if (!isAssisted && weight > 0 && reps > 0) {
    const candidateVolume = Math.round(weight * reps * 10) / 10;

    const priorSetVolumes = validHistory
      .filter((s) => !s.isAssisted && typeof s.weightKg === "number" && typeof s.reps === "number")
      .map((s) => Math.round((s.weightKg || 0) * (s.reps || 0) * 10) / 10);

    const previousMaxVolume = priorSetVolumes.length > 0 ? Math.max(...priorSetVolumes) : null;

    if (previousMaxVolume === null || candidateVolume > previousMaxVolume) {
      prs.push({
        id: `${candidateSet.id}-max_volume_set`,
        category: "max_volume_set",
        categoryLabel: "Zwaarste Set-Volume",
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        sessionId: session.id,
        setId: candidateSet.id,
        calendarDate: session.calendarDate,
        weightKg: weight,
        reps,
        value: candidateVolume,
        previousValue: previousMaxVolume,
        formattedValue: `${candidateVolume.toLocaleString("nl-NL")} kg volume`,
        description: `Hoogste werksetvolume ooit: ${candidateVolume.toLocaleString("nl-NL")} kg (${weight} kg × ${reps})`,
        isEstimated: false,
      });
    }
  }

  return prs;
}

/**
 * Detecteert alle PR's die behaald zijn in een specifieke sessie.
 *
 * Vergelijkt chronologisch tegen alle voorgaande sessies.
 */
export function detectSessionPRs(
  targetSession: WorkoutSession,
  allSessions: WorkoutSession[],
  allSets: WorkoutSet[],
  exercises: Exercise[],
  formula: "epley" | "brzycki" = "epley"
): AchievedPR[] {
  // Sorteer sessies chronologisch van oud naar nieuw
  const sortedSessions = [...allSessions].sort((a, b) => {
    const cmp = (a.calendarDate || "").localeCompare(b.calendarDate || "");
    if (cmp !== 0) return cmp;
    return (a.startTime || a.startedAt || "").localeCompare(b.startTime || b.startedAt || "");
  });

  const targetIndex = sortedSessions.findIndex((s) => s.id === targetSession.id);
  if (targetIndex === -1 && targetSession.status !== "afgerond") {
    // Sessie is mogelijk nog actief
  }

  // Verzamel alle voltooide sets die vóór deze sessie plaatsvonden
  const priorSessions =
    targetIndex !== -1 ? sortedSessions.slice(0, targetIndex) : sortedSessions;
  const priorSessionIds = new Set(priorSessions.map((s) => s.id));

  const accumulatedPriorSets = allSets.filter(
    (s) => priorSessionIds.has(s.sessionId) && s.completed
  );

  // Sets van deze sessie
  const targetSessionSets = allSets
    .filter((s) => s.sessionId === targetSession.id)
    .sort((a, b) => a.setNumber - b.setNumber);

  const sessionPRs: AchievedPR[] = [];

  // Houd tussentijds opgebouwde sets in de actieve sessie bij zodat set 2 set 1 kan overtreffen
  const currentAccumulated = [...accumulatedPriorSets];

  for (const set of targetSessionSets) {
    if (!set.completed) continue;

    const exercise = exercises.find((e) => e.id === set.exerciseId);
    if (!exercise) continue;

    const detected = evaluateSetForPRs(set, exercise, targetSession, currentAccumulated, formula);
    sessionPRs.push(...detected);

    currentAccumulated.push(set);
  }

  return sessionPRs;
}

/**
 * Haalt alle PR's op die behaald zijn binnen een bepaalde periode (bv. laatste 7 dagen voor Home).
 */
export function getRecentAchievedPRs(
  allSessions: WorkoutSession[],
  allSets: WorkoutSet[],
  exercises: Exercise[],
  days = 7,
  now = new Date(),
  formula: "epley" | "brzycki" = "epley"
): AchievedPR[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().split("T")[0];

  const recentSessions = allSessions.filter(
    (s) => s.status === "afgerond" && s.calendarDate >= cutoffStr
  );

  const allRecentPRs: AchievedPR[] = [];

  for (const session of recentSessions) {
    const sessionPRs = detectSessionPRs(session, allSessions, allSets, exercises, formula);
    allRecentPRs.push(...sessionPRs);
  }

  // Sorteer nieuwste eerst
  return allRecentPRs.sort((a, b) => b.calendarDate.localeCompare(a.calendarDate));
}

/**
 * Detecteert alle PR's over de gehele trainingshistorie.
 */
export function detectAllPRsAcrossHistory(
  allSessions: WorkoutSession[],
  allSets: WorkoutSet[],
  exercises: Exercise[],
  formula: "epley" | "brzycki" = "epley"
): AchievedPR[] {
  const completedSessions = allSessions
    .filter((s) => s.status === "afgerond")
    .sort((a, b) => {
      const cmp = (a.calendarDate || "").localeCompare(b.calendarDate || "");
      if (cmp !== 0) return cmp;
      return (a.startTime || "").localeCompare(b.startTime || "");
    });

  const allPRs: AchievedPR[] = [];
  for (const session of completedSessions) {
    const sessionPRs = detectSessionPRs(
      session,
      completedSessions,
      allSets,
      exercises,
      formula
    );
    allPRs.push(...sessionPRs);
  }

  return allPRs;
}

