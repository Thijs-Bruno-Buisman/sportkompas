"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAi } from "@/lib/hooks/useAi";
import {
  buildWeeklyReviewContext,
  sanitizeWeeklyReview,
  type AiWeeklyReviewProposal,
  AI_WEEKLY_REVIEW_DISCLAIMER,
} from "@/domain/ai/weeklyReview";
import { getLocalDateString, addDaysToDateString } from "@/domain/dates/calendar";
import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  WaterLog,
  RecoveryLog,
} from "@/types/database";
import type { WeeklyReview } from "@/lib/ai/schemas";
import {
  Sparkles,
  Dumbbell,
  Activity,
  Utensils,
  Target,
  RefreshCw,
  Info,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface AiWeeklyReviewCardProps {
  workouts: WorkoutSession[];
  workoutSets: WorkoutSet[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  recoveryLogs: RecoveryLog[];
  weeklyWorkoutGoal?: number;
  referenceDate?: string;
}

export function AiWeeklyReviewCard({
  workouts,
  workoutSets,
  cardioSessions,
  mealLogs,
  waterLogs,
  recoveryLogs,
  weeklyWorkoutGoal = 3,
  referenceDate = getLocalDateString(),
}: AiWeeklyReviewCardProps) {
  const { requestAiTask, isLoading: isAiCalling, status } = useAi();

  const [periodDays, setPeriodDays] = useState<7 | 30>(7);
  const [userNote, setUserNote] = useState<string>("");
  const [isNoteInputOpen, setIsNoteInputOpen] = useState<boolean>(false);
  const [review, setReview] = useState<AiWeeklyReviewProposal | null>(null);

  // Bereken periode datums
  const { startDate, endDate } = useMemo(() => {
    const end = referenceDate;
    const start = addDaysToDateString(end, -(periodDays - 1));
    return { startDate: start, endDate: end };
  }, [referenceDate, periodDays]);

  // Bouw context
  const context = useMemo(() => {
    return buildWeeklyReviewContext({
      startDate,
      endDate,
      workouts,
      workoutSets,
      cardioSessions,
      mealLogs,
      waterLogs,
      recoveryLogs,
      weeklyWorkoutGoal,
      userNote: userNote.trim() || undefined,
    });
  }, [
    startDate,
    endDate,
    workouts,
    workoutSets,
    cardioSessions,
    mealLogs,
    waterLogs,
    recoveryLogs,
    weeklyWorkoutGoal,
    userNote,
  ]);

  // Review genereren via AI API met fallback naar lokale deterministische heuristiek
  const handleGenerateReview = useCallback(
    async (noteOverride?: string) => {
      const activeNote = noteOverride !== undefined ? noteOverride : userNote;
      const activeContext = buildWeeklyReviewContext({
        startDate,
        endDate,
        workouts,
        workoutSets,
        cardioSessions,
        mealLogs,
        waterLogs,
        recoveryLogs,
        weeklyWorkoutGoal,
        userNote: activeNote.trim() || undefined,
      });

      try {
        const response = await requestAiTask(
          "weekly_review",
          { preparedContext: activeContext },
          activeNote.trim()
            ? `Gebruikerservaring deze week: "${activeNote.trim()}". Neem dit mee in de review.`
            : undefined
        );

        if (response && response.structuredData) {
          const sanitized = sanitizeWeeklyReview(
            response.structuredData as WeeklyReview,
            activeContext
          );
          setReview(sanitized);
        } else {
          const fallback = sanitizeWeeklyReview(null, activeContext);
          setReview(fallback);
        }
      } catch {
        const fallback = sanitizeWeeklyReview(null, activeContext);
        setReview(fallback);
      }
    },
    [
      startDate,
      endDate,
      workouts,
      workoutSets,
      cardioSessions,
      mealLogs,
      waterLogs,
      recoveryLogs,
      weeklyWorkoutGoal,
      userNote,
      requestAiTask,
    ]
  );

  // Automatisch eerste generatie bij mount of periodewissel
  useEffect(() => {
    // Alleen opnieuw genereren als er nog geen review is voor deze specifieke periode
    handleGenerateReview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodDays, startDate, endDate]);

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
      {/* HEADER */}
      <CardHeader className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                  Periodieke Review & Inzichten
                </CardTitle>
                <Badge
                  variant="outline"
                  className="text-[10px] px-1.5 py-0 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                >
                  {review?.source === "gemini" ? "Gemini AI" : "Lokale Heuristiek"}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                <Calendar className="w-3.5 h-3.5" />
                Periode: <span className="font-medium text-slate-700 dark:text-slate-300">{startDate} t/m {endDate}</span>
              </p>
            </div>
          </div>

          {/* PERIODE SWITCHER & REFRESH KNOP */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            <div className="flex p-0.5 rounded-lg bg-slate-200/60 dark:bg-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setPeriodDays(7)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  periodDays === 7
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                7 Dagen
              </button>
              <button
                type="button"
                onClick={() => setPeriodDays(30)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  periodDays === 30
                    ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                }`}
              >
                30 Dagen
              </button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleGenerateReview()}
              disabled={isAiCalling}
              className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              title="Review verversen"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isAiCalling ? "animate-spin text-emerald-500" : ""}`}
              />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-6 space-y-5">
        {/* LAAD STATUS */}
        {isAiCalling && !review && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
            <p className="text-sm">Synthese genereren van kracht, cardio en voeding...</p>
          </div>
        )}

        {/* REVIEW INHOUD */}
        {review && (
          <>
            {/* 1. HOOFDCONCLUSIE & HIGHLIGHTS */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  {review.headline}
                </h3>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 shrink-0">
                  (schatting)
                </span>
              </div>

              {/* HIGHLIGHT PILLS */}
              <div className="flex flex-wrap gap-2 pt-1">
                {review.keyHighlights.map((highlight, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-white/80 dark:bg-slate-900/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 shadow-2xs"
                  >
                    ✓ {highlight}
                  </span>
                ))}
              </div>
            </div>

            {/* 2. DRIE PIJLERS GRID (KRACHT, CARDIO & HERSTEL, VOEDING) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Krachttraining & Volume */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Dumbbell className="w-4 h-4 text-emerald-500" />
                  Krachttraining & Volume
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {review.volumeAssessment}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-200/50 dark:border-slate-800/80">
                  <span>{context.completedWorkoutsCount} training(en)</span>
                  <span>{context.totalVolumeKg.toLocaleString("nl-NL")} kg tonnage</span>
                </div>
              </div>

              {/* Cardio & Herstelbalans */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Activity className="w-4 h-4 text-emerald-500" />
                  Cardio & Herstel
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {review.recoveryAssessment}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-200/50 dark:border-slate-800/80">
                  <span>{context.restDaysCount} rustdag(en)</span>
                  <span>{context.cardioSessionsCount} cardio ({context.totalCardioDistanceKm} km)</span>
                </div>
              </div>

              {/* Voeding & Brandstof */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  Voeding & Brandstof
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {review.nutritionAssessment}
                </p>
                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-200/50 dark:border-slate-800/80">
                  <span>~{context.avgDailyCalories} kcal/dag (schatting)</span>
                  <span>~{context.avgDailyProteinGrams}g eiwit (schatting)</span>
                </div>
              </div>
            </div>

            {/* 3. FOCUS VOOR VOLGENDE WEEK */}
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-emerald-500 text-white shrink-0 mt-0.5 shadow-2xs">
                <Target className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200 uppercase tracking-wider">
                  Focus voor komende periode
                </h4>
                <p className="text-xs text-emerald-900 dark:text-emerald-300/90 leading-relaxed">
                  {review.focusNextWeek}
                </p>
              </div>
            </div>

            {/* 4. GEBRUIKERSFEEDBACK / PERSOONLIJKE NOTITIE TOGGLE */}
            <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsNoteInputOpen((prev) => !prev)}
                className="w-full flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 py-1 transition-colors"
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                  {isNoteInputOpen
                    ? "Verberg persoonlijke weekervaring"
                    : "Eigen weekgevoel toevoegen of bijsturen"}
                </span>
                {isNoteInputOpen ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </button>

              {isNoteInputOpen && (
                <div className="space-y-2 pt-1">
                  <textarea
                    rows={2}
                    value={userNote}
                    onChange={(e) => setUserNote(e.target.value)}
                    placeholder="Bv. 'Had wat spierpijn in de schouder, maar energieniveau was hoog bij cardio...'"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => handleGenerateReview(userNote)}
                      disabled={isAiCalling}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-3"
                    >
                      {isAiCalling ? "Bezig met verwerken..." : "Review bijwerken met jouw ervaring"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. MEDISCHE DISCLAIMER & VEILIGHEID (REGEL 7) */}
            <Alert
              variant="info"
              className="text-[11px] py-2 px-3 bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 flex items-start gap-2"
            >
              <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{AI_WEEKLY_REVIEW_DISCLAIMER}</span>
            </Alert>
          </>
        )}
      </CardContent>
    </Card>
  );
}
