import type { MealLog, WaterLog, CardioSession } from "@/types/database";
import type { DailyNutritionTargets } from "./goals";
import {
  getLocalDateString,
  parseLocalDate,
  addDaysToDateString,
  getWeekStartDate,
} from "@/domain/dates/calendar";

export type NutritionPeriodFilter =
  | "7d"
  | "14d"
  | "30d"
  | "deze_week"
  | "deze_maand";

export interface DateRange {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  dates: string[]; // Chronologisch geordend
}

export interface MacroDistributionEntry {
  grams: number;
  calories: number;
  percentage: number; // 0..100
}

export interface MacroDistribution {
  totalMacroCalories: number;
  protein: MacroDistributionEntry;
  carbs: MacroDistributionEntry;
  fat: MacroDistributionEntry;
}

export type CalorieAdherenceStatus =
  | "geen_data"
  | "onder_doel"
  | "op_doel"
  | "boven_doel";

export interface DailyNutritionStat {
  calendarDate: string; // YYYY-MM-DD
  dayLabel: string; // bv. "Ma 14" of "14 okt"
  dayName: string; // bv. "Maandag"
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
  waterMl: number;
  cardioBurnCalories: number;
  netCalories: number; // calories - cardioBurnCalories
  targetCalories: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatGrams: number;
  targetFiberGrams: number;
  targetWaterMl: number;
  calorieDifference: number; // calories - targetCalories
  hasMealData: boolean;
  hasWaterData: boolean;
  adherenceStatus: CalorieAdherenceStatus;
}

export interface NutritionPeriodSummary {
  period: NutritionPeriodFilter;
  startDate: string;
  endDate: string;
  totalDays: number;
  loggedDaysCount: number; // Aantal dagen waarop maaltijden zijn ingevoerd

  // Periode Totalen
  totalCaloriesIntake: number;
  totalCardioBurnCalories: number;
  totalNetCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  totalFiberGrams: number;
  totalWaterMl: number;

  // Daggemiddelden (berekend over gelogde dagen)
  avgDailyCalories: number;
  avgDailyNetCalories: number;
  avgDailyProteinGrams: number;
  avgDailyCarbsGrams: number;
  avgDailyFatGrams: number;
  avgDailyFiberGrams: number;
  avgDailyWaterMl: number;

  // Doelvergelijking & Wekelijkse Balans
  targetCaloriesDaily: number;
  dailyCalorieDifference: number; // avgDailyCalories - targetCaloriesDaily (negatief = deficit, positief = surplus)
  weeklyCalorieBalance: number; // dailyCalorieDifference * 7
  estimatedFatChangeKgPerWeek: number; // weeklyCalorieBalance / 7700 (~7700 kcal per kg lichaamsvet)

  // Doeltreffendheid & Consistentie
  onTargetDaysCount: number;
  overTargetDaysCount: number;
  underTargetDaysCount: number;
  consistencyPercentage: number; // % van gelogde dagen binnen ±10% van het doel
  waterGoalMetDaysCount: number;
  waterAdherencePercentage: number; // % van dagen met voldoende water

  // Macro-distributie over de periode
  macroDistribution: MacroDistribution;

  // Uitersten
  highestCalorieDay: { date: string; calories: number } | null;
  lowestCalorieDay: { date: string; calories: number } | null;

  // Dagelijkse records voor grafieken
  dailyStats: DailyNutritionStat[];
}

/**
 * Berekent het datumbereik en de lijst van opeenvolgende dagen voor een gekozen filterperiode.
 */
export function getDateRangeForNutritionPeriod(
  period: NutritionPeriodFilter,
  referenceDateStr: string = getLocalDateString()
): DateRange {
  const refDate = parseLocalDate(referenceDateStr);

  let startDate: string;
  let endDate: string;

  if (period === "7d") {
    startDate = addDaysToDateString(referenceDateStr, -6);
    endDate = referenceDateStr;
  } else if (period === "14d") {
    startDate = addDaysToDateString(referenceDateStr, -13);
    endDate = referenceDateStr;
  } else if (period === "30d") {
    startDate = addDaysToDateString(referenceDateStr, -29);
    endDate = referenceDateStr;
  } else if (period === "deze_week") {
    startDate = getWeekStartDate(referenceDateStr, "maandag");
    endDate = addDaysToDateString(startDate, 6); // Zondag
  } else if (period === "deze_maand") {
    const year = refDate.getFullYear();
    const month = refDate.getMonth(); // 0-based
    const firstDay = new Date(year, month, 1, 12, 0, 0);
    const lastDay = new Date(year, month + 1, 0, 12, 0, 0);
    startDate = getLocalDateString(firstDay);
    endDate = getLocalDateString(lastDay);
  } else {
    startDate = addDaysToDateString(referenceDateStr, -6);
    endDate = referenceDateStr;
  }

  // Genereer alle opeenvolgende dagen
  const dates: string[] = [];
  let cur = startDate;
  while (cur <= endDate) {
    dates.push(cur);
    cur = addDaysToDateString(cur, 1);
  }

  return { startDate, endDate, dates };
}

/**
 * Berekent de macro-energieverdeling in grammen, calorieën en percentages.
 * - Eiwit: 4 kcal / gram
 * - Koolhydraten: 4 kcal / gram
 * - Vetten: 9 kcal / gram
 */
export function calculateMacroDistribution(
  proteinGrams: number,
  carbsGrams: number,
  fatGrams: number
): MacroDistribution {
  const safeProtein = Math.max(0, proteinGrams);
  const safeCarbs = Math.max(0, carbsGrams);
  const safeFat = Math.max(0, fatGrams);

  const proteinKcal = safeProtein * 4;
  const carbsKcal = safeCarbs * 4;
  const fatKcal = safeFat * 9;
  const totalMacroCalories = proteinKcal + carbsKcal + fatKcal;

  if (totalMacroCalories <= 0) {
    return {
      totalMacroCalories: 0,
      protein: { grams: 0, calories: 0, percentage: 0 },
      carbs: { grams: 0, calories: 0, percentage: 0 },
      fat: { grams: 0, calories: 0, percentage: 0 },
    };
  }

  return {
    totalMacroCalories: Math.round(totalMacroCalories),
    protein: {
      grams: Math.round(safeProtein * 10) / 10,
      calories: Math.round(proteinKcal),
      percentage: Math.round((proteinKcal / totalMacroCalories) * 1000) / 10,
    },
    carbs: {
      grams: Math.round(safeCarbs * 10) / 10,
      calories: Math.round(carbsKcal),
      percentage: Math.round((carbsKcal / totalMacroCalories) * 1000) / 10,
    },
    fat: {
      grams: Math.round(safeFat * 10) / 10,
      calories: Math.round(fatKcal),
      percentage: Math.round((fatKcal / totalMacroCalories) * 1000) / 10,
    },
  };
}

/**
 * Bepaalt de calorie-adherence status van een dag ten opzichte van het streefdoel.
 * Binnen ±10% (met een minimum tolerantie van 150 kcal) wordt als 'op_doel' beschouwd.
 */
export function determineCalorieAdherence(
  calories: number,
  targetCalories: number,
  hasMealData: boolean
): CalorieAdherenceStatus {
  if (!hasMealData || calories <= 0) {
    return "geen_data";
  }

  if (targetCalories <= 0) {
    return "op_doel";
  }

  const tolerance = Math.max(150, targetCalories * 0.1);
  const minThreshold = targetCalories - tolerance;
  const maxThreshold = targetCalories + tolerance;

  if (calories < minThreshold) {
    return "onder_doel";
  }
  if (calories > maxThreshold) {
    return "boven_doel";
  }
  return "op_doel";
}

export interface CalculateNutritionPeriodSummaryParams {
  period: NutritionPeriodFilter;
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  cardioSessions?: CardioSession[];
  targets: DailyNutritionTargets;
  referenceDate?: string;
}

/**
 * Hoofdberekening voor voedingsstatistieken, daggrafieken en wekelijkse balans.
 */
export function calculateNutritionPeriodSummary({
  period,
  mealLogs,
  waterLogs,
  cardioSessions = [],
  targets,
  referenceDate = getLocalDateString(),
}: CalculateNutritionPeriodSummaryParams): NutritionPeriodSummary {
  const { startDate, endDate, dates } = getDateRangeForNutritionPeriod(
    period,
    referenceDate
  );

  // Indexeer maaltijden per datum
  const mealsByDate = new Map<string, MealLog[]>();
  for (const meal of mealLogs) {
    if (meal.calendarDate >= startDate && meal.calendarDate <= endDate) {
      const list = mealsByDate.get(meal.calendarDate) || [];
      list.push(meal);
      mealsByDate.set(meal.calendarDate, list);
    }
  }

  // Indexeer water per datum
  const waterByDate = new Map<string, number>();
  for (const w of waterLogs) {
    if (w.calendarDate >= startDate && w.calendarDate <= endDate) {
      const current = waterByDate.get(w.calendarDate) || 0;
      waterByDate.set(w.calendarDate, current + w.amountMl);
    }
  }

  // Indexeer cardio calorieën per datum
  const cardioBurnByDate = new Map<string, number>();
  for (const s of cardioSessions) {
    if (s.calendarDate >= startDate && s.calendarDate <= endDate) {
      const current = cardioBurnByDate.get(s.calendarDate) || 0;
      cardioBurnByDate.set(
        s.calendarDate,
        current + (s.estimatedCaloriesBurned || 0)
      );
    }
  }

  let totalCaloriesIntake = 0;
  let totalCardioBurnCalories = 0;
  let totalProteinGrams = 0;
  let totalCarbsGrams = 0;
  let totalFatGrams = 0;
  let totalFiberGrams = 0;
  let totalWaterMl = 0;

  let loggedDaysCount = 0;
  let onTargetDaysCount = 0;
  let overTargetDaysCount = 0;
  let underTargetDaysCount = 0;
  let waterGoalMetDaysCount = 0;

  let highestCalorieDay: { date: string; calories: number } | null = null;
  let lowestCalorieDay: { date: string; calories: number } | null = null;

  const dailyStats: DailyNutritionStat[] = dates.map((calendarDate) => {
    const dayDate = parseLocalDate(calendarDate);
    const dayLabel = dayDate.toLocaleDateString("nl-NL", {
      weekday: "short",
      day: "numeric",
    });
    const dayName = dayDate.toLocaleDateString("nl-NL", { weekday: "long" });

    const dayMeals = mealsByDate.get(calendarDate) || [];
    const hasMealData = dayMeals.length > 0;

    let dayCalories = 0;
    let dayProtein = 0;
    let dayCarbs = 0;
    let dayFat = 0;
    let dayFiber = 0;

    for (const log of dayMeals) {
      dayCalories += log.totalCalories;
      dayProtein += log.totalProteinGrams;
      dayCarbs += log.totalCarbsGrams;
      dayFat += log.totalFatGrams;

      if (log.totalFiberGrams !== undefined) {
        dayFiber += log.totalFiberGrams;
      } else {
        for (const it of log.items) {
          dayFiber += it.fiberGrams || 0;
        }
      }
    }

    const dayWater = waterByDate.get(calendarDate) || 0;
    const hasWaterData = dayWater > 0;
    const dayCardioBurn = cardioBurnByDate.get(calendarDate) || 0;
    const netCalories = dayCalories - dayCardioBurn;

    const roundedCalories = Math.round(dayCalories);
    const roundedProtein = Math.round(dayProtein * 10) / 10;
    const roundedCarbs = Math.round(dayCarbs * 10) / 10;
    const roundedFat = Math.round(dayFat * 10) / 10;
    const roundedFiber = Math.round(dayFiber * 10) / 10;

    const adherenceStatus = determineCalorieAdherence(
      roundedCalories,
      targets.calories,
      hasMealData
    );

    if (hasMealData) {
      loggedDaysCount++;
      totalCaloriesIntake += roundedCalories;
      totalProteinGrams += roundedProtein;
      totalCarbsGrams += roundedCarbs;
      totalFatGrams += roundedFat;
      totalFiberGrams += roundedFiber;

      if (adherenceStatus === "op_doel") onTargetDaysCount++;
      else if (adherenceStatus === "boven_doel") overTargetDaysCount++;
      else if (adherenceStatus === "onder_doel") underTargetDaysCount++;

      // Houd uitersten bij
      if (
        highestCalorieDay === null ||
        roundedCalories > highestCalorieDay.calories
      ) {
        highestCalorieDay = { date: calendarDate, calories: roundedCalories };
      }
      if (
        lowestCalorieDay === null ||
        roundedCalories < lowestCalorieDay.calories
      ) {
        lowestCalorieDay = { date: calendarDate, calories: roundedCalories };
      }
    }

    totalCardioBurnCalories += dayCardioBurn;
    totalWaterMl += dayWater;

    if (dayWater >= targets.waterMl && targets.waterMl > 0) {
      waterGoalMetDaysCount++;
    }

    return {
      calendarDate,
      dayLabel,
      dayName,
      calories: roundedCalories,
      proteinGrams: roundedProtein,
      carbsGrams: roundedCarbs,
      fatGrams: roundedFat,
      fiberGrams: roundedFiber,
      waterMl: dayWater,
      cardioBurnCalories: dayCardioBurn,
      netCalories,
      targetCalories: targets.calories,
      targetProteinGrams: targets.proteinGrams,
      targetCarbsGrams: targets.carbsGrams,
      targetFatGrams: targets.fatGrams,
      targetFiberGrams: targets.fiberGrams,
      targetWaterMl: targets.waterMl,
      calorieDifference: roundedCalories - targets.calories,
      hasMealData,
      hasWaterData,
      adherenceStatus,
    };
  });

  const totalNetCalories = totalCaloriesIntake - totalCardioBurnCalories;

  // Daggemiddelden over gelogde dagen (om te voorkomen dat lege dagen een geflatteerd laag gemiddelde geven)
  const divisor = loggedDaysCount > 0 ? loggedDaysCount : 1;
  const avgDailyCalories =
    loggedDaysCount > 0 ? Math.round(totalCaloriesIntake / divisor) : 0;
  const avgDailyNetCalories =
    loggedDaysCount > 0 ? Math.round(totalNetCalories / divisor) : 0;
  const avgDailyProteinGrams =
    loggedDaysCount > 0 ? Math.round((totalProteinGrams / divisor) * 10) / 10 : 0;
  const avgDailyCarbsGrams =
    loggedDaysCount > 0 ? Math.round((totalCarbsGrams / divisor) * 10) / 10 : 0;
  const avgDailyFatGrams =
    loggedDaysCount > 0 ? Math.round((totalFatGrams / divisor) * 10) / 10 : 0;
  const avgDailyFiberGrams =
    loggedDaysCount > 0 ? Math.round((totalFiberGrams / divisor) * 10) / 10 : 0;
  const avgDailyWaterMl =
    dates.length > 0 ? Math.round(totalWaterMl / dates.length) : 0;

  // Wekelijkse Balans
  const dailyCalorieDifference =
    loggedDaysCount > 0 ? avgDailyCalories - targets.calories : 0;
  const weeklyCalorieBalance = dailyCalorieDifference * 7;
  // ~7700 kcal deficit of surplus = ~1 kg vetverandering
  const estimatedFatChangeKgPerWeek =
    Math.round((weeklyCalorieBalance / 7700) * 100) / 100;

  // Consistentie
  const consistencyPercentage =
    loggedDaysCount > 0
      ? Math.round((onTargetDaysCount / loggedDaysCount) * 100)
      : 0;

  const waterAdherencePercentage =
    dates.length > 0
      ? Math.round((waterGoalMetDaysCount / dates.length) * 100)
      : 0;

  // Macro-distributie
  const macroDistribution = calculateMacroDistribution(
    totalProteinGrams,
    totalCarbsGrams,
    totalFatGrams
  );

  return {
    period,
    startDate,
    endDate,
    totalDays: dates.length,
    loggedDaysCount,
    totalCaloriesIntake,
    totalCardioBurnCalories,
    totalNetCalories,
    totalProteinGrams: Math.round(totalProteinGrams * 10) / 10,
    totalCarbsGrams: Math.round(totalCarbsGrams * 10) / 10,
    totalFatGrams: Math.round(totalFatGrams * 10) / 10,
    totalFiberGrams: Math.round(totalFiberGrams * 10) / 10,
    totalWaterMl,
    avgDailyCalories,
    avgDailyNetCalories,
    avgDailyProteinGrams,
    avgDailyCarbsGrams,
    avgDailyFatGrams,
    avgDailyFiberGrams,
    avgDailyWaterMl,
    targetCaloriesDaily: targets.calories,
    dailyCalorieDifference,
    weeklyCalorieBalance,
    estimatedFatChangeKgPerWeek,
    onTargetDaysCount,
    overTargetDaysCount,
    underTargetDaysCount,
    consistencyPercentage,
    waterGoalMetDaysCount,
    waterAdherencePercentage,
    macroDistribution,
    highestCalorieDay,
    lowestCalorieDay,
    dailyStats,
  };
}
