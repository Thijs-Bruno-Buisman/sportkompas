"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDatabase } from "@/lib/db";
import type { ConsistencyReport } from "@/domain/strength/muscleVolume";
import {
  Calendar,
  Flame,
  CheckCircle2,
  Moon,
  Dumbbell,
  Target,
  Sparkles,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
} from "lucide-react";

export interface WeeklyConsistencyWidgetProps {
  className?: string;
  historyWeeksCount?: number;
}

export function WeeklyConsistencyWidget({
  className = "",
  historyWeeksCount = 4,
}: WeeklyConsistencyWidgetProps) {
  const { repositories, dataVersion } = useDatabase();

  const [report, setReport] = useState<ConsistencyReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<number>(3);

  const loadConsistency = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await repositories.workout.getWeeklyConsistency(historyWeeksCount);
      setReport(data);
      setSelectedGoal(data.weeklyGoal);
    } catch (err) {
      console.error("Fout bij laden van consistentie:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, historyWeeksCount]);

  useEffect(() => {
    loadConsistency();
  }, [loadConsistency, dataVersion]);

  const handleUpdateGoal = async (newGoal: number) => {
    try {
      await repositories.settings.setWeeklyWorkoutGoal(newGoal);
      setSelectedGoal(newGoal);
      setIsEditingGoal(false);
      await loadConsistency();
    } catch (err) {
      console.error("Fout bij opslaan weekdoel:", err);
    }
  };

  if (isLoading) {
    return (
      <Card className={`p-5 border-border animate-pulse ${className}`}>
        <div className="h-5 w-40 bg-muted rounded mb-3" />
        <div className="h-10 w-full bg-muted rounded" />
      </Card>
    );
  }

  if (!report) return null;

  const { currentWeek, historicalWeeks, weeklyGoal, consistencyPercentage, currentStreakWeeks } =
    report;

  const currentCompleted = currentWeek.completedWorkoutsCount;
  const progressPercent = Math.min(100, Math.round((currentCompleted / weeklyGoal) * 100));

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Target className="w-4 h-4" />
              </span>
              <CardTitle className="text-lg font-bold">
                Trainingsconsistentie &amp; Weekdoel
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Behaalde trainingsweken en herstel. Rustdagen tellen nooit als falen.
            </p>
          </div>

          {/* DOEL AANPASSEN OF STATUS */}
          <div className="flex items-center gap-2">
            {isEditingGoal ? (
              <div className="flex items-center gap-1.5 p-1 rounded-lg bg-muted border border-border">
                <span className="text-xs font-semibold px-1 text-muted-foreground">
                  Doel:
                </span>
                {[2, 3, 4, 5].map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleUpdateGoal(g)}
                    className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${
                      selectedGoal === g
                        ? "bg-emerald-500 text-white shadow-xs"
                        : "text-foreground hover:bg-card"
                    }`}
                  >
                    {g}x
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsEditingGoal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground px-1"
                >
                  &times;
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Badge
                  variant={currentWeek.isGoalMet ? "success" : "default"}
                  className="text-xs font-semibold"
                >
                  Doel: {weeklyGoal} trainingen/week
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingGoal(true)}
                  className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  Wijzig
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* HUIDIGE WEEK VOORTGANG MET GROTE INDICATOREN */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-border space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              Deze Week ({currentWeek.label})
            </span>
            <span className="font-bold text-foreground">
              {currentCompleted} van {weeklyGoal} trainingen{" "}
              {currentWeek.isGoalMet && (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold ml-1">
                  (Doel behaald! 🎯)
                </span>
              )}
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                currentWeek.isGoalMet
                  ? "bg-emerald-500"
                  : "bg-emerald-400 dark:bg-emerald-500"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* 7 DAGEN UITGESPREID (MAANDAG T/M ZONDAG) */}
          <div className="grid grid-cols-7 gap-1.5 pt-1">
            {currentWeek.days.map((day) => {
              const isWorkout = day.isWorkoutDay;
              const isRest = day.isRestDay;
              const isFuture = day.isFuture;
              const isToday = day.isToday;

              return (
                <div
                  key={day.dateStr}
                  className={`flex flex-col items-center justify-between p-2 rounded-xl text-center min-h-[58px] transition-all border ${
                    isToday
                      ? "ring-2 ring-emerald-500/80 border-emerald-500 bg-card shadow-xs"
                      : "border-border bg-card/60"
                  }`}
                >
                  <span
                    className={`text-[10px] font-bold ${
                      isToday
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-muted-foreground"
                    }`}
                  >
                    {day.dayNameShort}
                  </span>

                  {/* DAGSTATUS ICOON */}
                  <div className="my-1">
                    {isWorkout ? (
                      <span
                        className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs"
                        title="Workout voltooid!"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </span>
                    ) : isRest ? (
                      // RUSTDAG IS HERSTEL (POSITIEF / NEUTRAAL, NOOIT ROOD KRUIS)
                      <span
                        className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center border border-border"
                        title="Rustdag (Herstel & spieropbouw)"
                      >
                        <Moon className="w-3 h-3 text-slate-400" />
                      </span>
                    ) : (
                      // TOEKOMSTIGE DAG
                      <span className="w-2 h-2 rounded-full bg-muted-foreground/30 mt-2" />
                    )}
                  </div>

                  <span className="text-[9px] text-muted-foreground truncate w-full">
                    {isWorkout ? "Training" : isRest ? "Rust" : ""}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* HISTORISCHE CONSISTENTIE (AFGELOPEN WEKEN) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {/* Consistency score */}
          <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Consistentie (afgelopen {report.totalWeeksEvaluated} weken)
                </span>
                <span className="text-base font-bold text-foreground">
                  {consistencyPercentage}% van weken behaald
                </span>
              </div>
            </div>

            <Badge variant="outline" className="text-xs font-semibold shrink-0">
              {report.weeksGoalMetCount}/{report.totalWeeksEvaluated} wkn
            </Badge>
          </div>

          {/* Streak tracker */}
          <div className="p-3.5 rounded-xl bg-card border border-border flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Flame className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Actieve Wekenstreak
                </span>
                <span className="text-base font-bold text-foreground">
                  {currentStreakWeeks}{" "}
                  {currentStreakWeeks === 1 ? "week" : "weken"} op rij
                </span>
              </div>
            </div>

            {currentStreakWeeks > 0 && (
              <Badge variant="warning" className="text-xs font-semibold shrink-0">
                🔥 Actief
              </Badge>
            )}
          </div>
        </div>

        {/* VERPLICHTE RESPECTVOLLE RUST-DISCLAIMER (PROMPT 16 & AGENTS.MD) */}
        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            {report.disclaimer ||
              "Consistentie geeft aan in hoeveel weken je jouw persoonlijke streefdoel hebt behaald. Rustdagen zijn essentieel voor herstel en tellen nooit als falen."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
