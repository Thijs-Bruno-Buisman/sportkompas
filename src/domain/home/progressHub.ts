import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  BodyMeasurement,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import {
  getLocalDateString,
  parseLocalDate,
  addDaysToDateString,
} from "@/domain/dates/calendar";
import { calculateSetVolume } from "@/domain/strength/volumeAndPR";

export type ProgressHubPeriod = "14d" | "30d" | "90d";

export interface DailyCorrelationPoint {
  calendarDate: string; // YYYY-MM-DD
  dayLabel: string; // bv. "12 okt"
  dayName: string; // bv. "Maandag"

  // Krachttraining
  workoutVolumeKg: number;
  workoutSetsCount: number;
  hasWorkout: boolean;

  // Cardio
  cardioKm: number;
  cardioDurationMinutes: number;
  cardioCaloriesBurned: number;
  hasCardio: boolean;

  // Voeding
  caloriesConsumed: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  hasNutrition: boolean;

  // Energiebalans
  netCalories: number; // caloriesConsumed - cardioCaloriesBurned
  targetCalories: number;
  calorieDifference: number; // netCalories - targetCalories (negatief = deficit)

  // Gewicht
  actualWeightKg: number | null; // Echte weging op deze dag
  trendWeightKg: number | null; // Laatst bekende / geïnterpoleerde gewicht voor continue lijn
}

export interface ProgressObservation {
  type: "weight_balance" | "nutrition_training" | "cardio_impact" | "volume_trend";
  title: string;
  description: string;
  sentiment: "positive" | "neutral" | "warning";
}

export interface ProgressHubSummary {
  period: ProgressHubPeriod;
  startDate: string;
  endDate: string;
  dataPoints: DailyCorrelationPoint[];

  // Krachttraining
  totalWorkoutVolumeKg: number;
  totalWorkoutsCount: number;
  avgVolumePerWorkoutKg: number;

  // Cardio
  totalCardioKm: number;
  totalCardioDurationMinutes: number;
  totalCardioCaloriesBurned: number;
  totalCardioSessionsCount: number;

  // Voeding & Energie
  totalCaloriesConsumed: number;
  avgDailyCaloriesConsumed: number;
  totalNetCalories: number;
  avgDailyNetCalories: number;
  totalCalorieDeficitOrSurplus: number;

  // Trainingsdagen vs Rustdagen Voeding
  trainingDaysCount: number;
  restDaysCount: number;
  avgCaloriesTrainingDays: number;
  avgProteinTrainingDays: number;
  avgCaloriesRestDays: number;
  avgProteinRestDays: number;

  // Gewichtscorrelatie
  startWeightKg: number | null;
  endWeightKg: number | null;
  actualWeightChangeKg: number | null;
  expectedWeightChangeKg: number; // totalCalorieDeficitOrSurplus / 7700
  weightCorrelationAccuracyPct: number | null;

  // Slimme Feitelijke Observaties
  observations: ProgressObservation[];
}

export interface CalculateProgressHubParams {
  period: ProgressHubPeriod;
  referenceDate?: string;
  workoutSessions: WorkoutSession[];
  workoutSets: WorkoutSet[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  measurements: BodyMeasurement[];
  targets: DailyNutritionTargets;
}

/**
 * Pure domeinberekening voor holistische correlaties en gecombineerde trends.
 */
export function calculateProgressHubSummary({
  period,
  referenceDate = getLocalDateString(),
  workoutSessions,
  workoutSets,
  cardioSessions,
  mealLogs,
  measurements,
  targets,
}: CalculateProgressHubParams): ProgressHubSummary {
  // 1. Datumbereik bepalen
  const daysCount = period === "14d" ? 14 : period === "90d" ? 90 : 30;
  const startDate = addDaysToDateString(referenceDate, -(daysCount - 1));
  const endDate = referenceDate;

  // Genereer alle dagen in chronologische volgorde
  const dates: string[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    dates.push(cur);
    cur = addDaysToDateString(cur, 1);
  }

  // 2. Indexeer sets per sessie
  const setsBySession = new Map<string, WorkoutSet[]>();
  for (const s of workoutSets) {
    const list = setsBySession.get(s.sessionId) || [];
    list.push(s);
    setsBySession.set(s.sessionId, list);
  }

  // 3. Indexeer workouts per datum (alleen afgerond)
  const workoutsByDate = new Map<
    string,
    { volumeKg: number; setsCount: number }
  >();
  for (const w of workoutSessions) {
    if (w.status === "afgerond" && w.calendarDate >= startDate && w.calendarDate <= endDate) {
      const sessSets = setsBySession.get(w.id) || [];
      let vol = 0;
      let completedSets = 0;
      for (const set of sessSets) {
        if (set.completed) {
          vol += calculateSetVolume(set);
          completedSets++;
        }
      }
      const existing = workoutsByDate.get(w.calendarDate) || { volumeKg: 0, setsCount: 0 };
      workoutsByDate.set(w.calendarDate, {
        volumeKg: existing.volumeKg + Math.round(vol),
        setsCount: existing.setsCount + completedSets,
      });
    }
  }

  // 4. Indexeer cardio per datum
  const cardioByDate = new Map<
    string,
    { km: number; durationMin: number; calories: number }
  >();
  for (const c of cardioSessions) {
    if (c.calendarDate >= startDate && c.calendarDate <= endDate) {
      const existing = cardioByDate.get(c.calendarDate) || { km: 0, durationMin: 0, calories: 0 };
      cardioByDate.set(c.calendarDate, {
        km: existing.km + (c.distanceMeters || 0) / 1000,
        durationMin: existing.durationMin + Math.round((c.durationSeconds || 0) / 60),
        calories: existing.calories + (c.estimatedCaloriesBurned || 0),
      });
    }
  }

  // 5. Indexeer voeding per datum
  const mealsByDate = new Map<
    string,
    { calories: number; protein: number; carbs: number; fat: number }
  >();
  for (const m of mealLogs) {
    if (m.calendarDate >= startDate && m.calendarDate <= endDate) {
      const existing = mealsByDate.get(m.calendarDate) || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      mealsByDate.set(m.calendarDate, {
        calories: existing.calories + m.totalCalories,
        protein: existing.protein + m.totalProteinGrams,
        carbs: existing.carbs + m.totalCarbsGrams,
        fat: existing.fat + m.totalFatGrams,
      });
    }
  }

  // 6. Indexeer gewichtsmetingen chronologisch
  const sortedMeasurements = [...measurements].sort((a, b) =>
    a.calendarDate.localeCompare(b.calendarDate)
  );
  const weightByDate = new Map<string, number>();
  for (const m of sortedMeasurements) {
    weightByDate.set(m.calendarDate, m.weightKg);
  }

  // Bepaal een initieel gewicht vóór of op de startdatum voor de trendlijn
  let lastKnownWeight: number | null = null;
  for (const m of sortedMeasurements) {
    if (m.calendarDate <= startDate) {
      lastKnownWeight = m.weightKg;
    }
  }

  // 7. Aggregeer dagelijkse punten
  let totalWorkoutVolumeKg = 0;
  let totalWorkoutsCount = 0;
  let totalCardioKm = 0;
  let totalCardioDurationMinutes = 0;
  let totalCardioCaloriesBurned = 0;
  let totalCardioSessionsCount = 0;
  let totalCaloriesConsumed = 0;
  let loggedNutritionDays = 0;

  let trainingDaysCalories = 0;
  let trainingDaysProtein = 0;
  let trainingDaysCount = 0;

  let restDaysCalories = 0;
  let restDaysProtein = 0;
  let restDaysCount = 0;

  const dataPoints: DailyCorrelationPoint[] = dates.map((calendarDate) => {
    const d = parseLocalDate(calendarDate);
    const dayLabel = d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    const dayName = d.toLocaleDateString("nl-NL", { weekday: "long" });

    // Kracht
    const wData = workoutsByDate.get(calendarDate);
    const hasWorkout = Boolean(wData && (wData.volumeKg > 0 || wData.setsCount > 0));
    const workoutVolumeKg = wData ? wData.volumeKg : 0;
    const workoutSetsCount = wData ? wData.setsCount : 0;

    if (hasWorkout) {
      totalWorkoutVolumeKg += workoutVolumeKg;
      totalWorkoutsCount++;
    }

    // Cardio
    const cData = cardioByDate.get(calendarDate);
    const hasCardio = Boolean(cData && (cData.km > 0 || cData.calories > 0));
    const cardioKm = cData ? Math.round(cData.km * 10) / 10 : 0;
    const cardioDurationMinutes = cData ? cData.durationMin : 0;
    const cardioCaloriesBurned = cData ? cData.calories : 0;

    if (hasCardio) {
      totalCardioKm += cardioKm;
      totalCardioDurationMinutes += cardioDurationMinutes;
      totalCardioCaloriesBurned += cardioCaloriesBurned;
      totalCardioSessionsCount++;
    }

    // Voeding
    const mData = mealsByDate.get(calendarDate);
    const hasNutrition = Boolean(mData && mData.calories > 0);
    const caloriesConsumed = mData ? Math.round(mData.calories) : 0;
    const proteinGrams = mData ? Math.round(mData.protein * 10) / 10 : 0;
    const carbsGrams = mData ? Math.round(mData.carbs * 10) / 10 : 0;
    const fatGrams = mData ? Math.round(mData.fat * 10) / 10 : 0;

    if (hasNutrition) {
      totalCaloriesConsumed += caloriesConsumed;
      loggedNutritionDays++;

      if (hasWorkout) {
        trainingDaysCalories += caloriesConsumed;
        trainingDaysProtein += proteinGrams;
        trainingDaysCount++;
      } else {
        restDaysCalories += caloriesConsumed;
        restDaysProtein += proteinGrams;
        restDaysCount++;
      }
    }

    // Balans
    const netCalories = caloriesConsumed - cardioCaloriesBurned;
    const targetCalories = targets.calories || 2200;
    const calorieDifference = netCalories - targetCalories;

    // Gewicht
    const actualWeightKg = weightByDate.get(calendarDate) ?? null;
    if (actualWeightKg !== null) {
      lastKnownWeight = actualWeightKg;
    }
    const trendWeightKg = lastKnownWeight;

    return {
      calendarDate,
      dayLabel,
      dayName,
      workoutVolumeKg,
      workoutSetsCount,
      hasWorkout,
      cardioKm,
      cardioDurationMinutes,
      cardioCaloriesBurned,
      hasCardio,
      caloriesConsumed,
      proteinGrams,
      carbsGrams,
      fatGrams,
      hasNutrition,
      netCalories,
      targetCalories,
      calorieDifference,
      actualWeightKg,
      trendWeightKg,
    };
  });

  // Gemiddelden berekenen
  const avgVolumePerWorkoutKg =
    totalWorkoutsCount > 0 ? Math.round(totalWorkoutVolumeKg / totalWorkoutsCount) : 0;
  const avgDailyCaloriesConsumed =
    loggedNutritionDays > 0 ? Math.round(totalCaloriesConsumed / loggedNutritionDays) : 0;
  const totalNetCalories = totalCaloriesConsumed - totalCardioCaloriesBurned;
  const avgDailyNetCalories =
    loggedNutritionDays > 0 ? Math.round(totalNetCalories / loggedNutritionDays) : 0;

  // Trainingsdagen vs Rustdagen
  const avgCaloriesTrainingDays =
    trainingDaysCount > 0 ? Math.round(trainingDaysCalories / trainingDaysCount) : 0;
  const avgProteinTrainingDays =
    trainingDaysCount > 0 ? Math.round((trainingDaysProtein / trainingDaysCount) * 10) / 10 : 0;

  const avgCaloriesRestDays =
    restDaysCount > 0 ? Math.round(restDaysCalories / restDaysCount) : 0;
  const avgProteinRestDays =
    restDaysCount > 0 ? Math.round((restDaysProtein / restDaysCount) * 10) / 10 : 0;

  // Cumulatief deficit / surplus over gelogde dagen
  const targetDaily = targets.calories || 2200;
  const totalCalorieDeficitOrSurplus =
    loggedNutritionDays > 0 ? totalNetCalories - targetDaily * loggedNutritionDays : 0;
  const expectedWeightChangeKg =
    Math.round((totalCalorieDeficitOrSurplus / 7700) * 100) / 100;

  // Werkelijke gewichtsverandering bepalen
  const measuredPoints = dataPoints.filter((p) => p.actualWeightKg !== null);
  let startWeightKg: number | null = null;
  let endWeightKg: number | null = null;
  let actualWeightChangeKg: number | null = null;
  let weightCorrelationAccuracyPct: number | null = null;

  if (measuredPoints.length >= 2) {
    startWeightKg = measuredPoints[0].actualWeightKg;
    endWeightKg = measuredPoints[measuredPoints.length - 1].actualWeightKg;
    if (startWeightKg !== null && endWeightKg !== null) {
      actualWeightChangeKg = Math.round((endWeightKg - startWeightKg) * 100) / 100;

      // Bereken correlatie-accuratesse indien beide in dezelfde richting gaan
      if (Math.abs(actualWeightChangeKg) > 0.1 && Math.abs(expectedWeightChangeKg) > 0.1) {
        const ratio = Math.min(
          actualWeightChangeKg / expectedWeightChangeKg,
          expectedWeightChangeKg / actualWeightChangeKg
        );
        if (ratio > 0) {
          weightCorrelationAccuracyPct = Math.min(100, Math.round(ratio * 100));
        }
      }
    }
  }

  // 8. Genereer feitelijke, transparante observaties
  const observations: ProgressObservation[] = [];

  // Observatie 1: Gewicht en energiebalans
  if (actualWeightChangeKg !== null) {
    if (actualWeightChangeKg < -0.2 && totalCalorieDeficitOrSurplus < -1000) {
      observations.push({
        type: "weight_balance",
        title: "Gewichtsverlies bevestigd door caloriebalans",
        description: `Je gewicht daalde met ${Math.abs(actualWeightChangeKg)} kg bij een netto calorietekort van ${Math.abs(totalCalorieDeficitOrSurplus).toLocaleString("nl-NL")} kcal.`,
        sentiment: "positive",
      });
    } else if (actualWeightChangeKg > 0.2 && totalCalorieDeficitOrSurplus > 1000) {
      observations.push({
        type: "weight_balance",
        title: "Gewichtstoename in lijn met calorieoverschot",
        description: `Je gewicht steeg met +${actualWeightChangeKg} kg bij een cumulatief overschot van +${totalCalorieDeficitOrSurplus.toLocaleString("nl-NL")} kcal.`,
        sentiment: "neutral",
      });
    } else {
      observations.push({
        type: "weight_balance",
        title: "Stabiel lichaamsgewicht",
        description: `Je gewichtsverschil was ${actualWeightChangeKg > 0 ? "+" : ""}${actualWeightChangeKg} kg over deze periode.`,
        sentiment: "positive",
      });
    }
  }

  // Observatie 2: Trainingsdagen vs Rustdagen
  if (trainingDaysCount > 0 && restDaysCount > 0) {
    const diffCal = avgCaloriesTrainingDays - avgCaloriesRestDays;
    if (Math.abs(diffCal) >= 100) {
      observations.push({
        type: "nutrition_training",
        title: diffCal > 0 ? "Hogere inname op trainingsdagen" : "Lagere inname op trainingsdagen",
        description: `Op trainingsdagen eet je gemiddeld ${Math.abs(diffCal)} kcal ${diffCal > 0 ? "meer" : "minder"} (${avgCaloriesTrainingDays} kcal) dan op rustdagen (${avgCaloriesRestDays} kcal).`,
        sentiment: "neutral",
      });
    }

    if (avgProteinTrainingDays >= targets.proteinGrams) {
      observations.push({
        type: "nutrition_training",
        title: "Eiwitdoel consequent behaald op trainingsdagen",
        description: `Gemiddeld ${avgProteinTrainingDays}g eiwit op trainingsdagen (doel: ${targets.proteinGrams}g).`,
        sentiment: "positive",
      });
    }
  }

  // Observatie 3: Cardio impact
  if (totalCardioCaloriesBurned > 500) {
    observations.push({
      type: "cardio_impact",
      title: "Significante cardio-bijdrage aan energiebalans",
      description: `Met ${totalCardioSessionsCount} cardio-sessies (${totalCardioKm} km) verbrandde je in totaal ${totalCardioCaloriesBurned.toLocaleString("nl-NL")} kcal.`,
      sentiment: "positive",
    });
  }

  // Observatie 4: Trainingsvolume
  if (totalWorkoutsCount >= 2 && totalWorkoutVolumeKg > 0) {
    observations.push({
      type: "volume_trend",
      title: "Solide trainingsvolume gerealiseerd",
      description: `In totaal ${totalWorkoutVolumeKg.toLocaleString("nl-NL")} kg verplaatst over ${totalWorkoutsCount} krachttrainingen (gemiddeld ${avgVolumePerWorkoutKg.toLocaleString("nl-NL")} kg per workout).`,
      sentiment: "positive",
    });
  }

  return {
    period,
    startDate,
    endDate,
    dataPoints,
    totalWorkoutVolumeKg,
    totalWorkoutsCount,
    avgVolumePerWorkoutKg,
    totalCardioKm: Math.round(totalCardioKm * 10) / 10,
    totalCardioDurationMinutes,
    totalCardioCaloriesBurned,
    totalCardioSessionsCount,
    totalCaloriesConsumed,
    avgDailyCaloriesConsumed,
    totalNetCalories,
    avgDailyNetCalories,
    totalCalorieDeficitOrSurplus,
    trainingDaysCount,
    restDaysCount,
    avgCaloriesTrainingDays,
    avgProteinTrainingDays,
    avgCaloriesRestDays,
    avgProteinRestDays,
    startWeightKg,
    endWeightKg,
    actualWeightChangeKg,
    expectedWeightChangeKg,
    weightCorrelationAccuracyPct,
    observations,
  };
}

