import type {
  WorkoutSession,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import {
  getLocalDateString,
  parseLocalDate,
  addDaysToDateString,
  getWeekStartDate,
} from "@/domain/dates/calendar";

export type HeatmapPeriodWeeks = 8 | 12;

export interface ActivityDay {
  calendarDate: string; // YYYY-MM-DD
  dayLabel: string; // bv. "14 okt"
  dayName: string; // bv. "Maandag"
  dayOfWeekIndex: number; // 0 = Ma, 6 = Zo

  // Pijlers
  hasWorkout: boolean;
  workoutCount: number;
  hasCardio: boolean;
  cardioMinutes: number;
  hasNutrition: boolean;
  nutritionCalories: number;
  isWaterMet: boolean;
  waterMl: number;
  hasRecovery: boolean;
  isRestDay: boolean;

  // Samengesteld niveau: 0 (inactief/rust), 1 (licht/enkele log), 2 (goed actief), 3 (zeer actief)
  intensityLevel: 0 | 1 | 2 | 3;
  activitiesCount: number; // Aantal verschillende pijlers actief (0..4)
  summaryText: string;
}

export interface ActivityHeatmapWeek {
  weekNumber: number; // 1-52
  startDate: string;
  endDate: string;
  days: ActivityDay[]; // Altijd 7 dagen (Ma t/m Zo)
  activeDaysCount: number;
}

export interface ConsistencyFeedback {
  title: string;
  message: string;
  tone: "positive" | "supportive" | "encouraging";
}

export interface ActivityStreaksSummary {
  referenceDate: string;
  weeksCount: HeatmapPeriodWeeks;
  startDate: string;
  endDate: string;

  // Streaks
  currentDailyStreak: number; // Aantal opeenvolgende dagen met activiteit/log
  longestDailyStreak: number; // Record streak in de geanalyseerde periode
  isStreakActiveToday: boolean; // Is vandaag al actief

  // Totalen
  totalDays: number;
  totalActiveDays: number;
  totalRestDays: number;
  activityPercentage: number; // (activeDays / totalDays) * 100

  // Pijlerverdeling
  pillarStats: {
    workoutDays: number;
    cardioDays: number;
    nutritionDays: number;
    waterTargetDays: number;
    recoveryLoggedDays: number;
  };

  // Heatmap matrix per week (Ma-Zo)
  weeks: ActivityHeatmapWeek[];

  // Rustige, schuldvrije feedback
  feedback: ConsistencyFeedback;
}

export interface CalculateActivityStreaksParams {
  referenceDate?: string;
  weeksCount?: HeatmapPeriodWeeks;
  workoutSessions: WorkoutSession[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  recoveryLogs: RecoveryLog[];
  targets: DailyNutritionTargets;
  weeklyWorkoutGoal?: number;
}

/**
 * Pure domeinberekening voor holistische activiteitstreaks en multi-week kalender heatmaps.
 */
export function calculateActivityStreaks({
  referenceDate = getLocalDateString(),
  weeksCount = 8,
  workoutSessions,
  cardioSessions,
  mealLogs,
  waterLogs,
  recoveryLogs,
  targets,
  weeklyWorkoutGoal = 3,
}: CalculateActivityStreaksParams): ActivityStreaksSummary {
  // 1. Bereken de start- en einddatum van de volledige heatmap (altijd afgerond op hele weken Ma t/m Zo)
  const currentWeekStart = getWeekStartDate(referenceDate, "maandag");
  const currentWeekEnd = addDaysToDateString(currentWeekStart, 6);
  // Ga (weeksCount - 1) weken terug vanaf de start van de huidige week
  const totalDaysToSubtract = (weeksCount - 1) * 7;
  const heatmapStartDate = addDaysToDateString(currentWeekStart, -totalDaysToSubtract);
  const heatmapEndDate = currentWeekEnd;

  // 2. Indexeer alle data per calendarDate
  const workoutsByDate = new Map<string, number>();
  for (const w of workoutSessions) {
    if (w.status === "afgerond") {
      workoutsByDate.set(w.calendarDate, (workoutsByDate.get(w.calendarDate) || 0) + 1);
    }
  }

  const cardioByDate = new Map<string, number>(); // minuten
  for (const c of cardioSessions) {
    const mins = Math.round((c.durationSeconds || 0) / 60);
    cardioByDate.set(c.calendarDate, (cardioByDate.get(c.calendarDate) || 0) + mins);
  }

  const mealsByDate = new Map<string, number>(); // calorieën
  for (const m of mealLogs) {
    mealsByDate.set(m.calendarDate, (mealsByDate.get(m.calendarDate) || 0) + m.totalCalories);
  }

  const waterByDate = new Map<string, number>(); // ml
  for (const w of waterLogs) {
    waterByDate.set(w.calendarDate, (waterByDate.get(w.calendarDate) || 0) + w.amountMl);
  }

  const recoveryByDate = new Map<string, boolean>();
  for (const r of recoveryLogs) {
    recoveryByDate.set(r.calendarDate, true);
  }

  // 3. Bouw ActivityDay voor elke dag in de periode
  const allDaysMap = new Map<string, ActivityDay>();
  let cur = heatmapStartDate;
  while (cur <= heatmapEndDate) {
    const d = parseLocalDate(cur);
    // Maandag = 0, Zondag = 6
    const jsDay = d.getDay(); // 0 = Zo, 1 = Ma...
    const dayOfWeekIndex = jsDay === 0 ? 6 : jsDay - 1;

    const dayLabel = d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
    const dayName = d.toLocaleDateString("nl-NL", { weekday: "long" });

    const workoutCount = workoutsByDate.get(cur) || 0;
    const hasWorkout = workoutCount > 0;

    const cardioMinutes = cardioByDate.get(cur) || 0;
    const hasCardio = cardioMinutes > 0;

    const nutritionCalories = mealsByDate.get(cur) || 0;
    const hasNutrition = nutritionCalories > 0;

    const waterMl = waterByDate.get(cur) || 0;
    const isWaterMet = waterMl >= (targets.waterMl || 2000);

    const hasRecovery = recoveryByDate.get(cur) || false;

    // Is het een rustdag? (Geen zware workout en geen cardio)
    const isRestDay = !hasWorkout && !hasCardio;

    // Tel actieve pijlers
    let activePillars = 0;
    if (hasWorkout) activePillars++;
    if (hasCardio) activePillars++;
    if (hasNutrition) activePillars++;
    if (isWaterMet || hasRecovery) activePillars++;

    // Bepaal intensiteitsniveau voor de visualisatie
    let intensityLevel: 0 | 1 | 2 | 3 = 0;
    if (hasWorkout && (hasCardio || hasNutrition)) {
      intensityLevel = 3;
    } else if (hasWorkout || (hasCardio && hasNutrition)) {
      intensityLevel = 2;
    } else if (hasCardio || hasNutrition || isWaterMet || hasRecovery) {
      intensityLevel = 1;
    }

    // Samenvattingstekst
    const parts: string[] = [];
    if (hasWorkout) parts.push(`${workoutCount}x krachttraining`);
    if (hasCardio) parts.push(`${cardioMinutes}m cardio`);
    if (hasNutrition) parts.push(`${nutritionCalories} kcal`);
    if (isWaterMet) parts.push(`${waterMl}ml water`);
    if (hasRecovery) parts.push("herstel gelogd");
    if (parts.length === 0) parts.push("Rustdag / geen logs");

    const summaryText = parts.join(" • ");

    allDaysMap.set(cur, {
      calendarDate: cur,
      dayLabel,
      dayName,
      dayOfWeekIndex,
      hasWorkout,
      workoutCount,
      hasCardio,
      cardioMinutes,
      hasNutrition,
      nutritionCalories,
      isWaterMet,
      waterMl,
      hasRecovery,
      isRestDay,
      intensityLevel,
      activitiesCount: activePillars,
      summaryText,
    });

    cur = addDaysToDateString(cur, 1);
  }

  // 4. Streaks berekenen tot en met referenceDate
  // Een dag is 'actief' als er ten minste 1 geregistreerde activiteit is (kracht, cardio, voeding, waterdoel of herstel)
  const isDayActive = (dateStr: string) => {
    const day = allDaysMap.get(dateStr);
    return Boolean(day && day.activitiesCount > 0);
  };

  const isStreakActiveToday = isDayActive(referenceDate);

  // Huidige streak bepalen:
  // Als vandaag actief is: tel opeenvolgende dagen achterwaarts vanaf vandaag.
  // Als vandaag nog niet actief is: controleer gisteren. Als gisteren actief was, telt de streak vanaf gisteren (vandaag is immers nog niet voorbij).
  let currentDailyStreak = 0;
  let checkDate = isStreakActiveToday ? referenceDate : addDaysToDateString(referenceDate, -1);

  while (isDayActive(checkDate)) {
    currentDailyStreak++;
    checkDate = addDaysToDateString(checkDate, -1);
  }

  // Langste streak bepalen over de hele periode (tot referenceDate)
  let longestDailyStreak = 0;
  let runningStreak = 0;

  cur = heatmapStartDate;
  while (cur <= referenceDate) {
    if (isDayActive(cur)) {
      runningStreak++;
      if (runningStreak > longestDailyStreak) {
        longestDailyStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
    cur = addDaysToDateString(cur, 1);
  }

  // 5. Groepeer dagen in weken voor de Heatmap
  const weeks: ActivityHeatmapWeek[] = [];
  let weekDays: ActivityDay[] = [];
  cur = heatmapStartDate;

  while (cur <= heatmapEndDate) {
    const day = allDaysMap.get(cur)!;
    weekDays.push(day);

    if (day.dayOfWeekIndex === 6) {
      // Zondag bereikt: week afsluiten
      const startDate = weekDays[0].calendarDate;
      const endDate = weekDays[weekDays.length - 1].calendarDate;
      const dStart = parseLocalDate(startDate);
      // Weeknummer schatting
      const weekNumber = getWeekNumber(dStart);
      const activeDaysCount = weekDays.filter((d) => d.activitiesCount > 0).length;

      weeks.push({
        weekNumber,
        startDate,
        endDate,
        days: weekDays,
        activeDaysCount,
      });
      weekDays = [];
    }

    cur = addDaysToDateString(cur, 1);
  }

  // 6. Totalen en statistieken
  let totalActiveDays = 0;
  let totalRestDays = 0;
  let workoutDays = 0;
  let cardioDays = 0;
  let nutritionDays = 0;
  let waterTargetDays = 0;
  let recoveryLoggedDays = 0;

  for (const day of allDaysMap.values()) {
    if (day.calendarDate <= referenceDate) {
      if (day.activitiesCount > 0) totalActiveDays++;
      else totalRestDays++;

      if (day.hasWorkout) workoutDays++;
      if (day.hasCardio) cardioDays++;
      if (day.hasNutrition) nutritionDays++;
      if (day.isWaterMet) waterTargetDays++;
      if (day.hasRecovery) recoveryLoggedDays++;
    }
  }

  const totalEvaluatedDays = totalActiveDays + totalRestDays;
  const activityPercentage =
    totalEvaluatedDays > 0 ? Math.round((totalActiveDays / totalEvaluatedDays) * 100) : 0;

  // 7. Rustige, motiverende en schuldvrije feedback
  let feedback: ConsistencyFeedback;

  if (currentDailyStreak >= 7) {
    feedback = {
      title: `${currentDailyStreak} Dagen Geweldige Consistentie!`,
      message: `Je bent al ${currentDailyStreak} dagen achter elkaar doelbewust bezig met je gezondheid. Consistentie bouwt duurzame gewoontes op.`,
      tone: "positive",
    };
  } else if (currentDailyStreak >= 3) {
    feedback = {
      title: "Mooie streak in opbouw",
      message: `${currentDailyStreak} actieve dagen op rij. Blijf gefocust op de dag van vandaag en vergeet niet dat herstel net zo waardevol is als inspanning.`,
      tone: "supportive",
    };
  } else if (totalActiveDays >= Math.round(totalEvaluatedDays * 0.5)) {
    feedback = {
      title: "Stabiel en gebalanceerd ritme",
      message: `Je bent op meer dan de helft van de dagen actief geweest. Balans tussen activiteit en rust is de sleutel tot blessurevrij trainen.`,
      tone: "supportive",
    };
  } else {
    feedback = {
      title: "Elke dag is een nieuwe start",
      message: "Kies vandaag één kleine, haalbare actie: een korte wandeling, voldoende water of een gezonde maaltijd. Geen druk, puur voor jezelf.",
      tone: "encouraging",
    };
  }

  return {
    referenceDate,
    weeksCount,
    startDate: heatmapStartDate,
    endDate: heatmapEndDate,
    currentDailyStreak,
    longestDailyStreak,
    isStreakActiveToday,
    totalDays: totalEvaluatedDays,
    totalActiveDays,
    totalRestDays,
    activityPercentage,
    pillarStats: {
      workoutDays,
      cardioDays,
      nutritionDays,
      waterTargetDays,
      recoveryLoggedDays,
    },
    weeks,
    feedback,
  };
}

/**
 * Hulpfunctie om het ISO-weeknummer te bepalen.
 */
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
