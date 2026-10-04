/**
 * Domeinlogica voor AI Wekelijkse & Periodieke Reviews (Stap 44 / Prompt 38)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Belangrijke principes:
 * 1. AI als Assistent (Regel 7):
 *    - Geeft een holistische, positieve en constructieve wekelijkse terugblik.
 *    - Nooit medische diagnoses of claims; zuiver sport- en herstelinzichten.
 *    - Schattingen (bijv. totale calorieverbranding of geschatte vorderingen) altijd gelabeld met '(schatting)'.
 * 2. Echte Data-aggregatie (Regel 3):
 *    - Berekend op basis van werkelijke workouts, werksets, cardio, voeding en rustdagen.
 * 3. Graceful Fallback (Regel 8):
 *    - Werkt 100% lokaal zonder API-sleutel via deterministische analyse.
 */

import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";
import type { WeeklyReview } from "@/lib/ai/schemas";

export interface WeeklyReviewContextInput {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  workouts: WorkoutSession[];
  workoutSets: WorkoutSet[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  recoveryLogs: RecoveryLog[];
  weeklyWorkoutGoal?: number;
  userNote?: string;
}

export interface PreparedWeeklyReviewContext {
  startDate: string;
  endDate: string;
  daysCount: number;
  // Kracht statistieken
  completedWorkoutsCount: number;
  totalSetsCount: number;
  totalVolumeKg: number;
  muscleGroupsTrained: string[];
  // Cardio statistieken
  cardioSessionsCount: number;
  totalCardioDistanceKm: number;
  totalCardioDurationMinutes: number;
  estimatedCardioCalories: number;
  // Voedingsstatistieken
  loggedNutritionDaysCount: number;
  avgDailyCalories: number;
  avgDailyProteinGrams: number;
  avgDailyWaterMl: number;
  // Herstel & Rust
  restDaysCount: number;
  avgRecoveryScore: number | null;
  weeklyWorkoutGoal: number;
  userNote?: string;
}

export interface AiWeeklyReviewProposal {
  headline: string;
  periodLabel: string;
  volumeAssessment: string;
  recoveryAssessment: string;
  nutritionAssessment: string;
  keyHighlights: string[];
  focusNextWeek: string;
  isEstimate: true;
  source: "gemini" | "lokale_heuristiek";
  disclaimer: string;
}

export const AI_WEEKLY_REVIEW_DISCLAIMER =
  "Deze wekelijkse review is een indicatieve synthese van je geregistreerde activiteiten en herstel. SportKompas stelt geen medische diagnoses. Luister altijd naar je eigen lichaam bij het plannen van je volgende trainingsweek.";

/**
 * Aggregeert alle activiteiten over de geselecteerde periode tot een heldere context.
 */
export function buildWeeklyReviewContext(
  input: WeeklyReviewContextInput
): PreparedWeeklyReviewContext {
  const {
    startDate,
    endDate,
    workouts,
    workoutSets,
    cardioSessions,
    mealLogs,
    waterLogs,
    recoveryLogs,
    weeklyWorkoutGoal = 3,
    userNote,
  } = input;

  // Filter binnen periode
  const inRangeWorkouts = workouts.filter(
    (w) => w.calendarDate >= startDate && w.calendarDate <= endDate && w.status === "afgerond"
  );
  const workoutIds = new Set(inRangeWorkouts.map((w) => w.id));

  const inRangeSets = workoutSets.filter(
    (s) => workoutIds.has(s.sessionId) && s.completed && s.setType !== "warmup"
  );

  const inRangeCardio = cardioSessions.filter(
    (c) => c.calendarDate >= startDate && c.calendarDate <= endDate && c.status !== "geannuleerd"
  );

  const inRangeMeals = mealLogs.filter(
    (m) => m.calendarDate >= startDate && m.calendarDate <= endDate
  );

  const inRangeWater = waterLogs.filter(
    (w) => w.calendarDate >= startDate && w.calendarDate <= endDate
  );

  const inRangeRecovery = recoveryLogs.filter(
    (r) => r.calendarDate >= startDate && r.calendarDate <= endDate
  );

  // 1. Kracht Volume & Spiergroepen
  let totalVolumeKg = 0;
  const muscleGroupsSet = new Set<string>();

  for (const set of inRangeSets) {
    const w = set.weightKg ?? 0;
    const r = set.reps ?? 0;
    totalVolumeKg += w * r;
  }

  for (const session of inRangeWorkouts) {
    if (session.snapshot?.exercises) {
      for (const ex of session.snapshot.exercises) {
        if (ex.primaryMuscleGroup) {
          muscleGroupsSet.add(ex.primaryMuscleGroup);
        }
      }
    }
  }

  // 2. Cardio totalen
  let totalCardioDistanceMeters = 0;
  let totalCardioDurationSeconds = 0;
  let estimatedCardioCalories = 0;

  for (const c of inRangeCardio) {
    totalCardioDistanceMeters += c.distanceMeters || 0;
    totalCardioDurationSeconds += c.durationSeconds || 0;
    estimatedCardioCalories += c.estimatedCaloriesBurned || 0;
  }

  // 3. Voeding gemiddelden
  const uniqueNutritionDays = new Set(inRangeMeals.map((m) => m.calendarDate));
  let totalCalories = 0;
  let totalProtein = 0;

  for (const meal of inRangeMeals) {
    if (meal.items) {
      for (const item of meal.items) {
        totalCalories += item.calories || 0;
        totalProtein += item.proteinGrams || 0;
      }
    }
  }

  const daysWithNutrition = uniqueNutritionDays.size;
  const avgDailyCalories = daysWithNutrition > 0 ? Math.round(totalCalories / daysWithNutrition) : 0;
  const avgDailyProteinGrams = daysWithNutrition > 0 ? Math.round(totalProtein / daysWithNutrition) : 0;

  let totalWaterMl = 0;
  for (const w of inRangeWater) {
    totalWaterMl += w.amountMl || 0;
  }
  const avgDailyWaterMl = daysWithNutrition > 0 ? Math.round(totalWaterMl / daysWithNutrition) : 0;

  // 4. Rustdagen & Herstel
  const activityDates = new Set<string>();
  inRangeWorkouts.forEach((w) => activityDates.add(w.calendarDate));
  inRangeCardio.forEach((c) => activityDates.add(c.calendarDate));

  // Aantal dagen in periode berekenen
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const daysDiff = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)) + 1);
  const restDaysCount = Math.max(0, daysDiff - activityDates.size);

  const recoveryScores = inRangeRecovery
    .map((r) => {
      let points = 0;
      let count = 0;
      if (typeof r.sleepQualityRating === "number") {
        points += (r.sleepQualityRating / 5) * 100;
        count++;
      }
      if (typeof r.sorenessRating === "number") {
        points += ((6 - r.sorenessRating) / 5) * 100;
        count++;
      }
      if (typeof r.stressRating === "number") {
        points += ((6 - r.stressRating) / 5) * 100;
        count++;
      }
      return count > 0 ? Math.round(points / count) : null;
    })
    .filter((s): s is number => typeof s === "number");
  const avgRecoveryScore =
    recoveryScores.length > 0
      ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length)
      : null;

  return {
    startDate,
    endDate,
    daysCount: daysDiff,
    completedWorkoutsCount: inRangeWorkouts.length,
    totalSetsCount: inRangeSets.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    muscleGroupsTrained: Array.from(muscleGroupsSet),
    cardioSessionsCount: inRangeCardio.length,
    totalCardioDistanceKm: Math.round((totalCardioDistanceMeters / 1000) * 10) / 10,
    totalCardioDurationMinutes: Math.round(totalCardioDurationSeconds / 60),
    estimatedCardioCalories: Math.round(estimatedCardioCalories),
    loggedNutritionDaysCount: daysWithNutrition,
    avgDailyCalories,
    avgDailyProteinGrams,
    avgDailyWaterMl,
    restDaysCount,
    avgRecoveryScore,
    weeklyWorkoutGoal,
    userNote,
  };
}

/**
 * Genereert een deterministische wekelijkse review op basis van geaggregeerde context (lokale fallback).
 */
export function generateDeterministicWeeklyReview(
  context: PreparedWeeklyReviewContext
): WeeklyReview {
  const {
    completedWorkoutsCount,
    weeklyWorkoutGoal,
    totalVolumeKg,
    muscleGroupsTrained,
    cardioSessionsCount,
    totalCardioDistanceKm,
    restDaysCount,
    loggedNutritionDaysCount,
    avgDailyCalories,
    avgDailyProteinGrams,
  } = context;

  // 1. Headline
  let headline = "Wekelijkse Voortgang & Herstelbalans";
  if (completedWorkoutsCount >= weeklyWorkoutGoal && completedWorkoutsCount > 0) {
    headline = "Sterke Trainingsweek: Doelen Behaald!";
  } else if (completedWorkoutsCount === 0 && cardioSessionsCount > 0) {
    headline = "Actieve Cardio- & Herstelweek";
  } else if (completedWorkoutsCount === 0 && cardioSessionsCount === 0) {
    headline = "Rustige Week: Ideaal Moment voor een Frisse Start";
  }

  // 2. Volume beoordeling
  let volumeAssessment = "";
  if (completedWorkoutsCount > 0) {
    const muscleText =
      muscleGroupsTrained.length > 0
        ? ` (${muscleGroupsTrained.join(", ")})`
        : "";
    volumeAssessment = `Je hebt ${completedWorkoutsCount} krachttraining(en) afgerond met een totaal volume van ${totalVolumeKg.toLocaleString(
      "nl-NL"
    )} kg tonnage over ${context.totalSetsCount} werksets. Spiergroepen aangepakt${muscleText}.`;
  } else {
    volumeAssessment =
      "Er zijn deze week geen krachttrainingen geregistreerd. Een geplande herstelweek kan waardevol zijn voor gewrichten en pezen.";
  }

  if (cardioSessionsCount > 0) {
    volumeAssessment += ` Daarnaast voltooide je ${cardioSessionsCount} cardiosessie(s) (${totalCardioDistanceKm} km, ~${context.estimatedCardioCalories} kcal verbrand (schatting)).`;
  }

  // 3. Herstel beoordeling
  let recoveryAssessment = "";
  if (restDaysCount >= 2 && restDaysCount <= 4) {
    recoveryAssessment = `Met ${restDaysCount} rustdagen heb je een evenwichtige verhouding tussen trainingsprikkels en fysiologisch spierherstel behouden.`;
  } else if (restDaysCount < 2) {
    recoveryAssessment = `Je hebt hard gewerkt (${restDaysCount} rustdag(en)). Let de komende week goed op voldoende slaap en hersteltijd om overbelasting te voorkomen.`;
  } else {
    recoveryAssessment = `Met ${restDaysCount} rustdagen heeft je lichaam volop hersteltijd gehad. Je bent uitgerust voor de komende trainingscyclus.`;
  }

  // 4. Voeding beoordeling
  let nutritionAssessment = "";
  if (loggedNutritionDaysCount > 0) {
    nutritionAssessment = `Voeding bijgehouden op ${loggedNutritionDaysCount} dag(en) met een gemiddelde inname van ~${avgDailyCalories} kcal en ~${avgDailyProteinGrams}g eiwit per dag (schatting).`;
  } else {
    nutritionAssessment =
      "Er zijn deze week weinig tot geen voedingslogs vastgelegd. Regelmatige eiwit- en waterinname blijft de sleutel tot optimaal herstel.";
  }

  // 5. Highlights (Positieve bekrachtiging)
  const keyHighlights: string[] = [];
  if (completedWorkoutsCount >= weeklyWorkoutGoal && weeklyWorkoutGoal > 0) {
    keyHighlights.push(`Weekdoel behaald: ${completedWorkoutsCount} van ${weeklyWorkoutGoal} krachttrainingen voltooid`);
  } else if (completedWorkoutsCount > 0) {
    keyHighlights.push(`${completedWorkoutsCount} intensieve krachttraining(en) geregistreerd`);
  }

  if (totalVolumeKg > 5000) {
    keyHighlights.push(`Indrukwekkend werksetvolume van ${totalVolumeKg.toLocaleString("nl-NL")} kg tonnage`);
  }

  if (cardioSessionsCount > 0) {
    keyHighlights.push(`${totalCardioDistanceKm} km cardio afgelegd voor cardiovasculaire gezondheid`);
  }

  if (avgDailyProteinGrams >= 120) {
    keyHighlights.push(`Consistente eiwitinname van gemiddeld ~${avgDailyProteinGrams}g per dag (schatting)`);
  }

  if (restDaysCount >= 2) {
    keyHighlights.push(`Gezonde herstelbalans met ${restDaysCount} rustdagen`);
  }

  if (keyHighlights.length === 0) {
    keyHighlights.push("Consistent gebruik van SportKompas als persoonlijke gids");
    keyHighlights.push("Goede basis gelegd om de komende week nieuwe gewoontes op te bouwen");
  }

  // 6. Focus volgende week
  let focusNextWeek = "Houd dit ritme vast en focus op progressieve overload en voldoende hydratatie.";
  if (completedWorkoutsCount === 0) {
    focusNextWeek = "Plan minimaal 2 vaste trainingsmomenten in de kalender en begin met een rustig opbouwvolume.";
  } else if (loggedNutritionDaysCount === 0) {
    focusNextWeek = "Probeer komende week minimaal 3 dagen je maaltijden te loggen voor meer inzicht in je eiwitinname.";
  } else if (restDaysCount < 2) {
    focusNextWeek = "Bouw bewust minimaal 2 volledige rustdagen in om je centrale zenuwstelsel te laten herstellen.";
  }

  return {
    headline,
    volumeAssessment,
    recoveryAssessment,
    nutritionAssessment,
    keyHighlights: keyHighlights.slice(0, 3), // Max 3 sterke highlights
    focusNextWeek,
  };
}

/**
 * Valideert en verrijkt de AI-wekelijkse review voor weergave in de UI.
 */
export function sanitizeWeeklyReview(
  rawReview: Partial<WeeklyReview> | null,
  context: PreparedWeeklyReviewContext
): AiWeeklyReviewProposal {
  const fallback = generateDeterministicWeeklyReview(context);

  const headline = rawReview?.headline || fallback.headline;
  let volumeAssessment = rawReview?.volumeAssessment || fallback.volumeAssessment;
  let recoveryAssessment = rawReview?.recoveryAssessment || fallback.recoveryAssessment;
  let nutritionAssessment = rawReview?.nutritionAssessment || fallback.nutritionAssessment;
  const focusNextWeek = rawReview?.focusNextWeek || fallback.focusNextWeek;

  // Zorg voor '(schatting)' op relevante statistische claims
  if (!volumeAssessment.includes("(schatting)") && context.estimatedCardioCalories > 0) {
    volumeAssessment = `${volumeAssessment} (schatting)`;
  }
  if (!nutritionAssessment.includes("(schatting)") && context.loggedNutritionDaysCount > 0) {
    nutritionAssessment = `${nutritionAssessment} (schatting)`;
  }

  const keyHighlights =
    Array.isArray(rawReview?.keyHighlights) && rawReview.keyHighlights.length > 0
      ? rawReview.keyHighlights
      : fallback.keyHighlights;

  const periodLabel = `${context.startDate} t/m ${context.endDate}`;

  return {
    headline,
    periodLabel,
    volumeAssessment,
    recoveryAssessment,
    nutritionAssessment,
    keyHighlights,
    focusNextWeek,
    isEstimate: true,
    source: rawReview ? "gemini" : "lokale_heuristiek",
    disclaimer: AI_WEEKLY_REVIEW_DISCLAIMER,
  };
}
