"use client";

import React from "react";
import { Target, Sliders, Flame, Sparkles } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DailyNutritionTargets, NutritionProgress } from "@/domain/nutrition/goals";

interface NutritionBudgetCardProps {
  targets: DailyNutritionTargets;
  progress: NutritionProgress;
  onOpenGoalsModal: () => void;
  onOpenAiAdvisor?: () => void;
}

export function NutritionBudgetCard({
  targets,
  progress,
  onOpenGoalsModal,
  onOpenAiAdvisor,
}: NutritionBudgetCardProps) {
  const getStrategyLabel = (strategy?: string) => {
    switch (strategy) {
      case "afvallen_rustig":
        return "Afvallen (rustig -300 kcal)";
      case "afvallen_standaard":
        return "Afvallen (standaard -500 kcal)";
      case "afvallen_agressief":
        return "Afvallen (agressief -750 kcal)";
      case "aankomen_lean":
        return "Spiermassa (lean +250 kcal)";
      case "aankomen_bulken":
        return "Bulken (+500 kcal)";
      case "aangepast":
        return "Aangepast doel";
      case "onderhoud":
      default:
        return "Gewicht behouden (onderhoud)";
    }
  };

  const getRemainingColor = (remaining: number) => {
    if (remaining < 0) return "text-rose-600 dark:text-rose-400";
    if (remaining <= 200) return "text-amber-600 dark:text-amber-400";
    return "text-emerald-600 dark:text-emerald-400";
  };

  const calRemaining = progress.calories.remaining;
  const calPercent = Math.min(100, progress.calories.percentage);

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
      <CardHeader className="py-3 px-4 sm:px-5 flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Calorie- &amp; Macrobudget
            </CardTitle>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {getStrategyLabel(targets.strategy)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenAiAdvisor && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenAiAdvisor}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Vraag AI assistent om voedingsadvies op maat voor trainings- of rustdagen"
            >
              AI Advies
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={onOpenGoalsModal}
            leftIcon={<Sliders className="w-3.5 h-3.5" />}
            className="text-xs"
          >
            Doel Wijzigen
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5 space-y-4">
        {/* Calorie Progressie Blok */}
        <div className="bg-slate-50 dark:bg-slate-950/40 p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>Caloriebalans</span>
            </div>
            <span className={`text-xs font-black ${getRemainingColor(calRemaining)}`}>
              {calRemaining >= 0 ? `${calRemaining} kcal over` : `${Math.abs(calRemaining)} kcal over doel`}
            </span>
          </div>

          <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                calRemaining < 0
                  ? "bg-rose-500"
                  : progress.calories.percentage >= 90
                  ? "bg-amber-500"
                  : "bg-emerald-500"
              }`}
              style={{ width: `${calPercent}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span>Inname: <strong className="text-slate-800 dark:text-slate-200">{progress.calories.consumed}</strong> kcal</span>
            <span>Doel: <strong className="text-slate-800 dark:text-slate-200">{progress.calories.target}</strong> kcal</span>
          </div>
        </div>

        {/* 4 Macro Balken */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Eiwit */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Eiwit</span>
              <span className="text-[10px] text-slate-400">{progress.protein.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(100, progress.protein.percentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>{progress.protein.consumed}g / {progress.protein.target}g</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {progress.protein.remaining >= 0 ? `${progress.protein.remaining}g over` : "bereikt"}
              </span>
            </div>
          </div>

          {/* Koolhydraten */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Koolhydraten</span>
              <span className="text-[10px] text-slate-400">{progress.carbs.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-300"
                style={{ width: `${Math.min(100, progress.carbs.percentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>{progress.carbs.consumed}g / {progress.carbs.target}g</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">
                {progress.carbs.remaining >= 0 ? `${progress.carbs.remaining}g over` : `${Math.abs(progress.carbs.remaining)}g +`}
              </span>
            </div>
          </div>

          {/* Vetten */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Vetten</span>
              <span className="text-[10px] text-slate-400">{progress.fat.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-sky-500 transition-all duration-300"
                style={{ width: `${Math.min(100, progress.fat.percentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>{progress.fat.consumed}g / {progress.fat.target}g</span>
              <span className="font-semibold text-sky-600 dark:text-sky-400">
                {progress.fat.remaining >= 0 ? `${progress.fat.remaining}g over` : `${Math.abs(progress.fat.remaining)}g +`}
              </span>
            </div>
          </div>

          {/* Vezels */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">Vezels</span>
              <span className="text-[10px] text-slate-400">{progress.fiber.percentage}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-purple-500 transition-all duration-300"
                style={{ width: `${Math.min(100, progress.fiber.percentage)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-500">
              <span>{progress.fiber.consumed}g / {progress.fiber.target}g</span>
              <span className="font-semibold text-purple-600 dark:text-purple-400">
                {progress.fiber.remaining >= 0 ? `${progress.fiber.remaining}g over` : "bereikt"}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
