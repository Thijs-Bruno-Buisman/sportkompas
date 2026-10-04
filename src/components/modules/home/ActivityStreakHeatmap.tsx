"use client";

import React, { useState, useMemo } from "react";
import {
  Flame,
  Trophy,
  Activity,
  Dumbbell,
  Droplet,
  Utensils,
  Moon,
  Sparkles,
  Info,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type {
  WorkoutSession,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import {
  calculateActivityStreaks,
  type HeatmapPeriodWeeks,
  type ActivityDay,
} from "@/domain/home/activityStreaks";

interface ActivityStreakHeatmapProps {
  workoutSessions: WorkoutSession[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  recoveryLogs: RecoveryLog[];
  targets: DailyNutritionTargets;
  referenceDate?: string;
  weeklyWorkoutGoal?: number;
}

export function ActivityStreakHeatmap({
  workoutSessions,
  cardioSessions,
  mealLogs,
  waterLogs,
  recoveryLogs,
  targets,
  referenceDate,
  weeklyWorkoutGoal = 3,
}: ActivityStreakHeatmapProps) {
  const [weeksCount, setWeeksCount] = useState<HeatmapPeriodWeeks>(8);
  const [selectedDay, setSelectedDay] = useState<ActivityDay | null>(null);

  const summary = useMemo(() => {
    return calculateActivityStreaks({
      referenceDate,
      weeksCount,
      workoutSessions,
      cardioSessions,
      mealLogs,
      waterLogs,
      recoveryLogs,
      targets,
      weeklyWorkoutGoal,
    });
  }, [
    referenceDate,
    weeksCount,
    workoutSessions,
    cardioSessions,
    mealLogs,
    waterLogs,
    recoveryLogs,
    targets,
    weeklyWorkoutGoal,
  ]);

  const dayLabels = ["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"];

  return (
    <Card className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
      {/* 1. HEADER MET PERIODE SELECTIE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Consistentie &amp; Activiteit Heatmap
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Multi-pijler overzicht van krachttraining, cardio, voeding en rust.
            </p>
          </div>
        </div>

        {/* 8 of 12 weken switcher */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={() => {
              setWeeksCount(8);
              setSelectedDay(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              weeksCount === 8
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            8 Weken
          </button>
          <button
            onClick={() => {
              setWeeksCount(12);
              setSelectedDay(null);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              weeksCount === 12
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
            }`}
          >
            12 Weken
          </button>
        </div>
      </div>

      {/* 2. STREAK STATS RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Huidige Streak */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Huidige Streak</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{summary.currentDailyStreak}</span>
            <span className="text-xs font-normal text-slate-500">
              {summary.currentDailyStreak === 1 ? "dag" : "dagen"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.isStreakActiveToday ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Vandaag actief ✓
              </span>
            ) : summary.currentDailyStreak > 0 ? (
              <span className="text-amber-600 dark:text-amber-400 font-medium">
                Log vandaag voor behoud
              </span>
            ) : (
              "Start vandaag je nieuwe streak"
            )}
          </div>
        </div>

        {/* Record Streak */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Langste Streak</span>
            <Trophy className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{summary.longestDailyStreak}</span>
            <span className="text-xs font-normal text-slate-500">
              {summary.longestDailyStreak === 1 ? "dag" : "dagen"}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Persoonlijk record in deze periode
          </div>
        </div>

        {/* Actieve Dagen Ratio */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Activiteitsgraad</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.activityPercentage}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            {summary.totalActiveDays} van de {summary.totalDays} dagen actief
          </div>
        </div>

        {/* Rust & Herstel */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Rust &amp; Herstel</span>
            <Moon className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-white flex items-baseline gap-1">
            <span>{summary.totalRestDays}</span>
            <span className="text-xs font-normal text-slate-500">dagen</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Essentieel voor adaptatie &amp; groei
          </div>
        </div>
      </div>

      {/* 3. KALENDER HEATMAP RASTER */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
          <span>Activiteiten over de afgelopen {weeksCount} weken</span>
          <span className="text-[11px]">Tik op een dag voor details</span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="min-w-[480px] space-y-1.5">
            {/* Dag van de week labels (rijen of kolommen: we tonen 7 rijen voor Ma t/m Zo met weken als kolommen) */}
            <div className="grid grid-flow-col auto-cols-fr gap-1.5">
              {/* Lege linkerbovenhoek voor daglabels */}
              <div className="w-6 shrink-0 flex flex-col justify-around py-0.5 text-[10px] text-slate-400 font-medium text-right pr-1">
                <span>Ma</span>
                <span>Di</span>
                <span>Wo</span>
                <span>Do</span>
                <span>Vr</span>
                <span>Za</span>
                <span>Zo</span>
              </div>

              {/* Weken kolommen */}
              {summary.weeks.map((week, wIdx) => (
                <div key={`week-${wIdx}`} className="flex flex-col gap-1.5">
                  {/* 7 dagen per week */}
                  {week.days.map((day) => {
                    const isFuture = Boolean(
                      summary.referenceDate && day.calendarDate > summary.referenceDate
                    );
                    const isSelected = selectedDay?.calendarDate === day.calendarDate;
                    const isToday = Boolean(
                      summary.referenceDate && day.calendarDate === summary.referenceDate
                    );

                    // Kleur bepalen o.b.v. intensiteitsniveau
                    let bgClass = "bg-slate-100 dark:bg-slate-800/70 border-slate-200/80 dark:border-slate-800";
                    if (day.intensityLevel === 1) {
                      bgClass = "bg-emerald-500/25 border-emerald-500/40 text-emerald-800 dark:text-emerald-200";
                    } else if (day.intensityLevel === 2) {
                      bgClass = "bg-emerald-500/60 border-emerald-500/70 text-white";
                    } else if (day.intensityLevel === 3) {
                      bgClass = "bg-emerald-500 border-emerald-400 text-white font-bold shadow-xs";
                    }

                    if (isFuture) {
                      bgClass = "bg-slate-50 dark:bg-slate-800/30 border-dashed border-slate-200 dark:border-slate-800/50 opacity-40";
                    }

                    return (
                      <button
                        key={day.calendarDate}
                        onClick={() => setSelectedDay(day)}
                        disabled={isFuture}
                        title={`${day.dayName} ${day.dayLabel}: ${day.summaryText}`}
                        className={`h-7 rounded-md border text-[10px] flex items-center justify-center transition-all ${bgClass} ${
                          isSelected
                            ? "ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-1 dark:ring-offset-slate-900 scale-105 z-10"
                            : ""
                        } ${
                          isToday && !isSelected
                            ? "ring-1.5 ring-emerald-400/80 ring-offset-1 dark:ring-offset-slate-900 font-bold"
                            : ""
                        }`}
                      >
                        {/* Toon subtiel dagnummer in het blokje */}
                        <span className="opacity-90">{day.calendarDate.slice(8)}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Weekdatums labels onderaan */}
            <div className="flex items-center justify-between pl-7 pr-1 pt-1 text-[10px] text-slate-400">
              <span>{summary.weeks[0]?.days[0]?.dayLabel}</span>
              <span>
                {summary.weeks[Math.floor(summary.weeks.length / 2)]?.days[0]?.dayLabel}
              </span>
              <span>{summary.weeks[summary.weeks.length - 1]?.days[6]?.dayLabel}</span>
            </div>
          </div>
        </div>

        {/* Legenda */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5">
            <span>Minder actief</span>
            <div className="flex items-center gap-1">
              <span className="w-3.5 h-3.5 rounded-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700" />
              <span className="w-3.5 h-3.5 rounded-xs bg-emerald-500/25 border border-emerald-500/40" />
              <span className="w-3.5 h-3.5 rounded-xs bg-emerald-500/60 border border-emerald-500/70" />
              <span className="w-3.5 h-3.5 rounded-xs bg-emerald-500 border border-emerald-400" />
            </div>
            <span>Meer actief</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full border border-emerald-500" />
              Vandaag
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-xs border border-dashed border-slate-400" />
              Toekomst
            </span>
          </div>
        </div>
      </div>

      {/* 4. DETAILPANEEL BIJ SELECTIE VAN EEN DAG */}
      {selectedDay && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 animate-in fade-in duration-150 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-white capitalize">
                {selectedDay.dayName} {selectedDay.dayLabel} ({selectedDay.calendarDate})
              </h4>
            </div>
            {selectedDay.intensityLevel > 0 ? (
              <Badge variant="success">Actieve dag</Badge>
            ) : (
              <Badge variant="default">Rustdag / Geen logs</Badge>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
            {/* Kracht */}
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Dumbbell className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Krachttraining</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDay.hasWorkout ? `${selectedDay.workoutCount} workout(s)` : "Geen"}
                </span>
              </div>
            </div>

            {/* Cardio */}
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Cardio</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDay.hasCardio ? `${selectedDay.cardioMinutes} min` : "Geen"}
                </span>
              </div>
            </div>

            {/* Voeding */}
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Utensils className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Voeding</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDay.hasNutrition ? `${selectedDay.nutritionCalories} kcal` : "Geen logs"}
                </span>
              </div>
            </div>

            {/* Water / Herstel */}
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Droplet className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block">Water &amp; Herstel</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedDay.waterMl > 0 ? `${selectedDay.waterMl} ml` : selectedDay.hasRecovery ? "Herstel geregistreerd" : "Geen"}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. RUSTIGE, SCHULDVRIJE FEEDBACK */}
      <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-2.5">
        <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
            {summary.feedback.title}
          </h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            {summary.feedback.message}
          </p>
        </div>
      </div>
    </Card>
  );
}
