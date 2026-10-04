"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Dumbbell,
  Activity,
  Utensils,
  User,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useDatabase } from "@/lib/db";
import { useProfile } from "@/lib/hooks/useProfile";
import { TodayTrainingCard } from "@/components/modules/planning/TodayTrainingCard";
import { HomeRecentPRsWidget } from "@/components/modules/history/HomeRecentPRsWidget";
import { HomeFavoriteExercisesWidget } from "@/components/modules/history/HomeFavoriteExercisesWidget";
import { WeeklyConsistencyWidget } from "@/components/modules/history/WeeklyConsistencyWidget";
import { HomeCockpitDashboard } from "@/components/modules/home/HomeCockpitDashboard";
import { CombinedProgressHub } from "@/components/modules/home/CombinedProgressHub";
import { ActivityStreakHeatmap } from "@/components/modules/home/ActivityStreakHeatmap";
import { getLocalDateString, addDaysToDateString } from "@/domain/dates/calendar";
import {
  calculateDailyCockpitSummary,
  type DailyCockpitSummary,
} from "@/domain/home/cockpit";
import {
  DEFAULT_NUTRITION_TARGETS,
  type DailyNutritionTargets,
} from "@/domain/nutrition/goals";
import type {
  ScheduledSession,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
  BodyMeasurement,
} from "@/types/database";

export default function HomePage() {
  const { repositories, isDemoMode, dataVersion, toggleDemoMode, refreshData } =
    useDatabase();
  const { profile } = useProfile();

  const [selectedDate, setSelectedDate] = useState<string>(() =>
    getLocalDateString()
  );
  const [summary, setSummary] = useState<DailyCockpitSummary | null>(null);
  const [scheduledSession, setScheduledSession] =
    useState<ScheduledSession | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Historische datasets voor Voortgang Hub & Activiteit Heatmap
  const [historyWorkouts, setHistoryWorkouts] = useState<WorkoutSession[]>([]);
  const [historySets, setHistorySets] = useState<WorkoutSet[]>([]);
  const [historyCardio, setHistoryCardio] = useState<CardioSession[]>([]);
  const [historyMeals, setHistoryMeals] = useState<MealLog[]>([]);
  const [historyWater, setHistoryWater] = useState<WaterLog[]>([]);
  const [historyRecovery, setHistoryRecovery] = useState<RecoveryLog[]>([]);
  const [weeklyWorkoutGoal, setWeeklyWorkoutGoal] = useState<number>(3);
  const [historyMeasurements, setHistoryMeasurements] = useState<
    BodyMeasurement[]
  >([]);
  const [nutritionTargets, setNutritionTargets] =
    useState<DailyNutritionTargets>(DEFAULT_NUTRITION_TARGETS);

  const loadCockpitData = useCallback(
    async (date: string) => {
      setIsLoading(true);
      try {
        const historyStartDate = addDaysToDateString(date, -90);

        const [
          mealsToday,
          waterLogsToday,
          cardioToday,
          workoutSessions,
          workoutSets,
          allCardio,
          rangeMeals,
          rangeWater,
          allRecovery,
          weeklyGoal,
          scheduled,
          activeWorkout,
          activeRoutine,
          measurements,
          recoveryLog,
          targets,
        ] = await Promise.all([
          repositories.nutrition.getMealsByDate(date),
          repositories.nutrition.getWaterLogsByDate(date),
          repositories.cardio.getSessionsByDate(date),
          repositories.workout.sessions.getAll(),
          repositories.workout.sets.getAll(),
          repositories.cardio.getAll(),
          repositories.nutrition.getMealsForDateRange(historyStartDate, date),
          repositories.nutrition.getWaterLogsForDateRange(historyStartDate, date),
          repositories.recovery.getAll(),
          repositories.settings.getWeeklyWorkoutGoal(),
          repositories.workout.getScheduledSessionForDate(date),
          repositories.workout.getActiveWorkoutSession(),
          repositories.workout.getActiveRoutine(),
          repositories.measurements.getAll(),
          repositories.recovery.getRecoveryByDate(date),
          repositories.settings.getNutritionTargets(profile),
        ]);

        setScheduledSession(scheduled);
        setHistoryWorkouts(workoutSessions);
        setHistorySets(workoutSets);
        setHistoryCardio(allCardio);
        setHistoryMeals(rangeMeals);
        setHistoryWater(rangeWater);
        setHistoryRecovery(allRecovery);
        setWeeklyWorkoutGoal(weeklyGoal);
        setHistoryMeasurements(measurements);

        const safeTargets = targets || DEFAULT_NUTRITION_TARGETS;
        setNutritionTargets(safeTargets);

        const calculatedSummary = calculateDailyCockpitSummary({
          calendarDate: date,
          todayDateStr: getLocalDateString(),
          meals: mealsToday,
          waterLogs: waterLogsToday,
          cardioSessions: cardioToday,
          workoutSessions,
          scheduledSession: scheduled,
          activeWorkoutSession: activeWorkout,
          activeRoutineName: activeRoutine?.routine?.name || null,
          measurements,
          recoveryLog,
          targets: safeTargets,
        });

        setSummary(calculatedSummary);
      } catch (err) {
        console.error("Fout bij laden van cockpit data:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [repositories, profile]
  );

  useEffect(() => {
    loadCockpitData(selectedDate);
  }, [loadCockpitData, selectedDate, isDemoMode, dataVersion]);

  const handleAddWater = async (amount: number) => {
    await repositories.nutrition.logWater(selectedDate, amount);
    refreshData();
    await loadCockpitData(selectedDate);
  };

  const handleLogWeight = async (weightKg: number, notes?: string) => {
    await repositories.measurements.logWeightOnly(selectedDate, weightKg, notes);
    refreshData();
    await loadCockpitData(selectedDate);
  };

  return (
    <div className="space-y-6">
      {/* 1. CENTRALE COCKPIT DASHBOARD (DAGSAMENVATTING & ACTIES) */}
      {summary ? (
        <HomeCockpitDashboard
          summary={summary}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          profile={profile}
          isDemoMode={isDemoMode}
          onAddWater={handleAddWater}
          onLogWeight={handleLogWeight}
          onToggleDemoMode={toggleDemoMode}
        />
      ) : (
        <div className="h-64 flex items-center justify-center text-sm text-slate-400">
          Cockpit laden...
        </div>
      )}

      {/* 2. GEPLANDE TRAINING DETAIL KAART (INDIEN INGESCHREVEN OF ACTIEF) */}
      {scheduledSession && scheduledSession.status === "gepland" && (
        <section className="space-y-3">
          <TodayTrainingCard />
        </section>
      )}

      {/* 3. DEMOMODUS OPROEP IN ECHTE LEGE DATABASE */}
      {!isDemoMode && summary && summary.dayCompletionScore === 0 && (
        <Card className="border-dashed border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/10">
          <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-sm text-slate-900 dark:text-white">
                  SportKompas eerst uitproberen?
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Schakel over naar Demomodus om alle functionaliteiten,
                trainingsschema&apos;s, PR&apos;s en analyses te verkennen met
                realistische voorbeelddata. Je echte database blijft 100%
                gescheiden.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-emerald-500 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              onClick={() => toggleDemoMode(true)}
            >
              Verken met Demomodus
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 4. MULTI-PIJLER CONSISTENTIE & ACTIVITEIT HEATMAP */}
      <section>
        <ActivityStreakHeatmap
          workoutSessions={historyWorkouts}
          cardioSessions={historyCardio}
          mealLogs={historyMeals}
          waterLogs={historyWater}
          recoveryLogs={historyRecovery}
          targets={nutritionTargets}
          referenceDate={selectedDate}
          weeklyWorkoutGoal={weeklyWorkoutGoal}
        />
      </section>

      {/* 5. KRACHTTRAINING CONSISTENTIE & WEEKDOEL WIDGET */}
      <section>
        <WeeklyConsistencyWidget />
      </section>

      {/* 5. GECOMBINEERDE VOORTGANG HUB & HOLISTISCHE ANALYTICS */}
      <section>
        <CombinedProgressHub
          workoutSessions={historyWorkouts}
          workoutSets={historySets}
          cardioSessions={historyCardio}
          mealLogs={historyMeals}
          measurements={historyMeasurements}
          targets={nutritionTargets}
          referenceDate={selectedDate}
        />
      </section>

      {/* 6. PERSOONLIJKE RECORDS & FAVORIETE OEFENINGEN WIDGETS */}
      <section className="space-y-4">
        <HomeRecentPRsWidget />
        <HomeFavoriteExercisesWidget />
      </section>

      {/* 7. DE VIER KERNMODULES NAVIGATIE */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
          Modules
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Krachttraining */}
          <Link href="/training" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Dumbbell className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Krachttraining
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Sessies loggen met grote knoppen, rusttimers, 1RM schatting en
                    PR-detectie.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Cardio */}
          <Link href="/cardio" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Activity className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Cardio
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Hardlopen, wielrennen en roeien met tempo min/km, afstanden en
                    hartslagzones.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Voeding */}
          <Link href="/voeding" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Utensils className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Voeding &amp; Macro&apos;s
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Calorieën, eiwitten en waterinname bijhouden voor optimale
                    prestaties en herstel.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Profiel & Metingen */}
          <Link href="/profiel" className="group block">
            <Card className="h-full hover:border-emerald-500/50 transition-all hover:shadow-md">
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <User className="w-6 h-6" />
                  </div>
                  <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all shrink-0" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white tracking-tight">
                    Profiel &amp; Metingen
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    Gewichtslogboek, TDEE/BMR calculaties, themainstellingen en
                    demomodus beheer.
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
