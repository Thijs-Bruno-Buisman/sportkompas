import type {
  MealLog,
  WaterLog,
  WorkoutSession,
  CardioSession,
  ScheduledSession,
  BodyMeasurement,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import { getLocalDateString } from "@/domain/dates/calendar";

export type WorkoutDayState =
  | "geen_schema"
  | "rustdag"
  | "gepland"
  | "actief"
  | "afgerond";

export type EnergyBalanceStatus = "deficit" | "onderhoud" | "surplus";

export interface DailyCockpitSummary {
  calendarDate: string;
  isToday: boolean;
  greeting: string;

  // Voeding & Macro's
  caloriesConsumed: number;
  proteinConsumedGrams: number;
  carbsConsumedGrams: number;
  fatConsumedGrams: number;
  fiberConsumedGrams: number;
  mealCount: number;

  // Doelen
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetWaterMl: number;

  // Hydratatie
  waterConsumedMl: number;
  waterProgressPercentage: number;
  isWaterGoalMet: boolean;

  // Cardio
  cardioDistanceKm: number;
  cardioDurationMinutes: number;
  cardioCaloriesBurned: number;
  cardioSessionsCount: number;

  // Energiebalans (Inname - Cardioverbranding vs Doel)
  netCalories: number;
  calorieBudgetRemaining: number; // target - netCalories
  energyBalanceStatus: EnergyBalanceStatus;
  calorieProgressPercentage: number;

  // Krachttraining Status
  workoutState: WorkoutDayState;
  workoutTitle: string;
  workoutCompletedSets: number;
  workoutTotalVolumeKg: number;
  isWorkoutActiveNow: boolean;

  // Lichaam & Herstel
  latestWeightKg: number | null;
  weightMeasuredToday: boolean;
  recovery: {
    sleepHours: number | null;
    restingHeartRate: number | null;
    soreness: number | null;
  } | null;

  // Totaalscore van de dag (0..100%)
  dayCompletionScore: number;
}

/**
 * Bepaalt de gepaste Nederlandse begroeting op basis van de lokale tijd.
 */
export function getGreeting(now: Date = new Date()): string {
  const hours = now.getHours();
  if (hours >= 5 && hours < 12) {
    return "Goedemorgen";
  }
  if (hours >= 12 && hours < 18) {
    return "Goedemiddag";
  }
  if (hours >= 18 && hours < 23) {
    return "Goedenavond";
  }
  return "Goedenacht";
}

export interface BuildCockpitSummaryParams {
  calendarDate: string;
  todayDateStr?: string;
  meals: MealLog[];
  waterLogs: WaterLog[];
  cardioSessions: CardioSession[];
  workoutSessions: WorkoutSession[];
  scheduledSession?: ScheduledSession | null;
  activeWorkoutSession?: WorkoutSession | null;
  activeRoutineName?: string | null;
  measurements?: BodyMeasurement[];
  recoveryLog?: RecoveryLog | null;
  targets: DailyNutritionTargets;
  currentDate?: Date;
}

/**
 * Pure domeinfunctie voor het samenstellen van de holistische dagsamenvatting.
 */
export function calculateDailyCockpitSummary({
  calendarDate,
  todayDateStr = getLocalDateString(),
  meals,
  waterLogs,
  cardioSessions,
  workoutSessions,
  scheduledSession,
  activeWorkoutSession,
  activeRoutineName,
  measurements = [],
  recoveryLog,
  targets,
  currentDate = new Date(),
}: BuildCockpitSummaryParams): DailyCockpitSummary {
  const isToday = calendarDate === todayDateStr;
  const greeting = getGreeting(currentDate);

  // 1. Voeding
  let caloriesConsumed = 0;
  let proteinConsumedGrams = 0;
  let carbsConsumedGrams = 0;
  let fatConsumedGrams = 0;
  let fiberConsumedGrams = 0;

  for (const m of meals) {
    caloriesConsumed += m.totalCalories;
    proteinConsumedGrams += m.totalProteinGrams;
    carbsConsumedGrams += m.totalCarbsGrams;
    fatConsumedGrams += m.totalFatGrams;
    if (m.totalFiberGrams !== undefined) {
      fiberConsumedGrams += m.totalFiberGrams;
    } else {
      for (const item of m.items) {
        fiberConsumedGrams += item.fiberGrams || 0;
      }
    }
  }

  caloriesConsumed = Math.round(caloriesConsumed);
  proteinConsumedGrams = Math.round(proteinConsumedGrams * 10) / 10;
  carbsConsumedGrams = Math.round(carbsConsumedGrams * 10) / 10;
  fatConsumedGrams = Math.round(fatConsumedGrams * 10) / 10;
  fiberConsumedGrams = Math.round(fiberConsumedGrams * 10) / 10;

  // 2. Hydratatie
  const waterConsumedMl = waterLogs.reduce((sum, w) => sum + w.amountMl, 0);
  const targetWater = targets.waterMl || 2500;
  const waterProgressPercentage = Math.min(
    100,
    Math.round((waterConsumedMl / targetWater) * 100)
  );
  const isWaterGoalMet = waterConsumedMl >= targetWater;

  // 3. Cardio
  let totalDistanceMeters = 0;
  let totalDurationSeconds = 0;
  let cardioCaloriesBurned = 0;

  for (const c of cardioSessions) {
    totalDistanceMeters += c.distanceMeters || 0;
    totalDurationSeconds += c.durationSeconds || 0;
    cardioCaloriesBurned += c.estimatedCaloriesBurned || 0;
  }

  const cardioDistanceKm = Math.round((totalDistanceMeters / 1000) * 10) / 10;
  const cardioDurationMinutes = Math.round(totalDurationSeconds / 60);

  // 4. Energiebalans
  const netCalories = caloriesConsumed - cardioCaloriesBurned;
  const targetCal = targets.calories || 2200;
  const calorieBudgetRemaining = targetCal - netCalories;

  let energyBalanceStatus: EnergyBalanceStatus = "onderhoud";
  if (calorieBudgetRemaining > 150) {
    energyBalanceStatus = "deficit";
  } else if (calorieBudgetRemaining < -150) {
    energyBalanceStatus = "surplus";
  }

  const calorieProgressPercentage = Math.min(
    100,
    Math.round((caloriesConsumed / targetCal) * 100)
  );

  // 5. Krachttraining Status
  const completedWorkoutToday = workoutSessions.find(
    (s) => s.calendarDate === calendarDate && s.status === "afgerond"
  );
  const isWorkoutActiveNow =
    activeWorkoutSession !== null &&
    activeWorkoutSession !== undefined &&
    activeWorkoutSession.status === "actief" &&
    activeWorkoutSession.calendarDate === calendarDate;

  let workoutState: WorkoutDayState = "geen_schema";
  let workoutTitle = "Geen geplande workout";
  let workoutCompletedSets = 0;
  let workoutTotalVolumeKg = 0;

  if (isWorkoutActiveNow) {
    workoutState = "actief";
    workoutTitle =
      activeWorkoutSession?.snapshot?.routineDayName ||
      activeWorkoutSession?.snapshot?.routineName ||
      "Training Bezig";
  } else if (completedWorkoutToday) {
    workoutState = "afgerond";
    workoutTitle =
      completedWorkoutToday.snapshot?.routineDayName ||
      completedWorkoutToday.snapshot?.routineName ||
      "Training Voltooid";
    // Volume kan eventueel worden berekend of ingevuld
    workoutCompletedSets = completedWorkoutToday.snapshot?.exercises?.length
      ? completedWorkoutToday.snapshot.exercises.reduce(
          (sum, ex) => sum + (ex.targetSets || 0),
          0
        )
      : 0;
  } else if (scheduledSession) {
    if (scheduledSession.status === "afgerond") {
      workoutState = "afgerond";
      workoutTitle = "Training Voltooid";
    } else if (scheduledSession.status === "gepland") {
      workoutState = "gepland";
      workoutTitle = "Geplande Training";
    } else {
      workoutState = "rustdag";
      workoutTitle = "Rustdag";
    }
  } else if (activeRoutineName) {
    workoutState = "rustdag";
    workoutTitle = "Rustdag";
  }

  // 6. Lichaamsgewicht & Herstel
  const todayMeasurement = measurements.find(
    (m) => m.calendarDate === calendarDate
  );
  const latestWeightKg = todayMeasurement
    ? todayMeasurement.weightKg
    : measurements.length > 0
    ? measurements[measurements.length - 1].weightKg
    : null;
  const weightMeasuredToday = Boolean(todayMeasurement);

  let recoveryData: DailyCockpitSummary["recovery"] = null;
  if (recoveryLog) {
    recoveryData = {
      sleepHours: recoveryLog.sleepDurationMinutes
        ? Math.round((recoveryLog.sleepDurationMinutes / 60) * 10) / 10
        : null,
      restingHeartRate: recoveryLog.restingHeartRateBpm ?? null,
      soreness: recoveryLog.sorenessRating ?? null,
    };
  }

  // 7. Dagsamenvatting completion score (0..100)
  // Verdeeld over 4 pijlers:
  // - Training/Rust: 25 punten
  // - Voeding geregistreerd: 25 punten
  // - Waterdoel behaald (of >75%): tot 25 punten
  // - Lichaam of cardio activiteit: tot 25 punten
  let score = 0;

  // Training / Rust
  if (workoutState === "afgerond" || workoutState === "rustdag") {
    score += 25;
  } else if (workoutState === "actief") {
    score += 15;
  }

  // Voeding
  if (meals.length > 0) {
    if (caloriesConsumed >= targetCal * 0.8 && caloriesConsumed <= targetCal * 1.2) {
      score += 25;
    } else {
      score += 15;
    }
  }

  // Water
  score += Math.round((waterProgressPercentage / 100) * 25);

  // Activiteit of gewicht
  if (cardioSessions.length > 0 || weightMeasuredToday || recoveryLog) {
    score += 25;
  }

  const dayCompletionScore = Math.min(100, Math.max(0, score));

  return {
    calendarDate,
    isToday,
    greeting,
    caloriesConsumed,
    proteinConsumedGrams,
    carbsConsumedGrams,
    fatConsumedGrams,
    fiberConsumedGrams,
    mealCount: meals.length,
    targetCalories: targetCal,
    targetProteinGrams: targets.proteinGrams || 150,
    targetCarbsGrams: targets.carbsGrams || 240,
    targetFatGrams: targets.fatGrams || 70,
    targetWaterMl: targetWater,
    waterConsumedMl,
    waterProgressPercentage,
    isWaterGoalMet,
    cardioDistanceKm,
    cardioDurationMinutes,
    cardioCaloriesBurned,
    cardioSessionsCount: cardioSessions.length,
    netCalories,
    calorieBudgetRemaining,
    energyBalanceStatus,
    calorieProgressPercentage,
    workoutState,
    workoutTitle,
    workoutCompletedSets,
    workoutTotalVolumeKg,
    isWorkoutActiveNow,
    latestWeightKg,
    weightMeasuredToday,
    recovery: recoveryData,
    dayCompletionScore,
  };
}
