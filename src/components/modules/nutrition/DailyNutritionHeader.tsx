"use client";

import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Flame,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { DailyNutritionTotals } from "@/domain/nutrition/diary";
import {
  getLocalDateString,
  addDaysToDateString,
  formatFriendlyDate,
  parseLocalDate,
} from "@/domain/dates/calendar";
import { calculateMacroDistribution } from "@/domain/nutrition/calculations";

interface DailyNutritionHeaderProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  totals: DailyNutritionTotals;
}

export function DailyNutritionHeader({
  selectedDate,
  onDateChange,
  totals,
}: DailyNutritionHeaderProps) {
  const todayStr = getLocalDateString();
  const isToday = selectedDate === todayStr;

  const friendlyLabel = formatFriendlyDate(selectedDate, todayStr);
  const parsedDate = parseLocalDate(selectedDate);
  const fullDateLabel = parsedDate.toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const handlePrevDay = () => {
    onDateChange(addDaysToDateString(selectedDate, -1));
  };

  const handleNextDay = () => {
    onDateChange(addDaysToDateString(selectedDate, 1));
  };

  const handleJumpToToday = () => {
    onDateChange(todayStr);
  };

  const macroDist = calculateMacroDistribution(
    totals.proteinGrams,
    totals.carbsGrams,
    totals.fatGrams
  );

  return (
    <div className="space-y-4">
      {/* Datum Navigatie Balk */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrevDay}
            aria-label="Vorige dag"
            leftIcon={<ChevronLeft className="w-4 h-4" />}
          >
            Vorige
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleNextDay}
            aria-label="Volgende dag"
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Volgende
          </Button>

          {!isToday && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleJumpToToday}
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold"
            >
              Vandaag
            </Button>
          )}
        </div>

        {/* Datum indicator met HTML datumkiezer */}
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-base font-bold text-slate-900 dark:text-white capitalize block">
              {friendlyLabel}
            </span>
            <span className="text-xs text-slate-500 capitalize">
              {fullDateLabel}
            </span>
          </div>

          <div className="relative">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) onDateChange(e.target.value);
              }}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
              aria-label="Kies datum"
            />
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors pointer-events-none">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Dagtotaal Macro Cockpit */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Energie
            </span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totals.calories} <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
          <span className="text-[11px] text-slate-400">Dagtotaal</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              Eiwit
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {macroDist.proteinPercentage}%
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totals.proteinGrams} <span className="text-xs font-normal text-slate-400">g</span>
          </p>
          <span className="text-[11px] text-slate-400">{macroDist.proteinCalories} kcal</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
              Koolhydraten
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {macroDist.carbsPercentage}%
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totals.carbsGrams} <span className="text-xs font-normal text-slate-400">g</span>
          </p>
          <span className="text-[11px] text-slate-400">{macroDist.carbsCalories} kcal</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-sky-600 dark:text-sky-400">
              Vetten
            </span>
            <span className="text-[11px] font-bold text-slate-400">
              {macroDist.fatPercentage}%
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totals.fatGrams} <span className="text-xs font-normal text-slate-400">g</span>
          </p>
          <span className="text-[11px] text-slate-400">{macroDist.fatCalories} kcal</span>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Vezels
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {totals.fiberGrams} <span className="text-xs font-normal text-slate-400">g</span>
          </p>
          <span className="text-[11px] text-slate-400">Darmgezondheid</span>
        </Card>
      </div>

      {/* Visuele Macro Energieverhouding Balk */}
      {totals.calories > 0 && (
        <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
          <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            <div
              style={{ width: `${macroDist.proteinPercentage}%` }}
              className="bg-emerald-500 h-full"
              title={`Eiwit: ${macroDist.proteinPercentage}%`}
            />
            <div
              style={{ width: `${macroDist.carbsPercentage}%` }}
              className="bg-amber-500 h-full"
              title={`Koolhydraten: ${macroDist.carbsPercentage}%`}
            />
            <div
              style={{ width: `${macroDist.fatPercentage}%` }}
              className="bg-sky-500 h-full"
              title={`Vet: ${macroDist.fatPercentage}%`}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              {macroDist.proteinPercentage}% Eiwit
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              {macroDist.carbsPercentage}% Koolhydraten
            </span>
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block" />
              {macroDist.fatPercentage}% Vet
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
