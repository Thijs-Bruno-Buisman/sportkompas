"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingDown,
  TrendingUp,
  Flame,
  Droplets,
  Wheat,
  Scale,
  Calendar,
  Info,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MealLog, WaterLog, CardioSession } from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import {
  type NutritionPeriodFilter,
  type DailyNutritionStat,
  calculateNutritionPeriodSummary,
} from "@/domain/nutrition/statistics";
import { getLocalDateString } from "@/domain/dates/calendar";

interface NutritionHistoryChartsProps {
  mealLogs: MealLog[];
  waterLogs: WaterLog[];
  cardioSessions?: CardioSession[];
  targets: DailyNutritionTargets;
  referenceDate?: string;
  onNavigateToDiary?: (date: string) => void;
}

export function NutritionHistoryCharts({
  mealLogs,
  waterLogs,
  cardioSessions = [],
  targets,
  referenceDate = getLocalDateString(),
  onNavigateToDiary,
}: NutritionHistoryChartsProps) {
  const [period, setPeriod] = useState<NutritionPeriodFilter>("7d");
  const [showCardioBurn, setShowCardioBurn] = useState(true);
  const [hoveredDayIndex, setHoveredDayIndex] = useState<number | null>(null);
  const [showDetailsTable, setShowDetailsTable] = useState(false);

  // Bereken samenvatting en grafiekdata
  const summary = useMemo(() => {
    return calculateNutritionPeriodSummary({
      period,
      mealLogs,
      waterLogs,
      cardioSessions,
      targets,
      referenceDate,
    });
  }, [period, mealLogs, waterLogs, cardioSessions, targets, referenceDate]);

  const periods: Array<{ id: NutritionPeriodFilter; label: string }> = [
    { id: "7d", label: "7 Dagen" },
    { id: "14d", label: "14 Dagen" },
    { id: "30d", label: "30 Dagen" },
    { id: "deze_week", label: "Deze Week" },
    { id: "deze_maand", label: "Deze Maand" },
  ];

  // SVG Grafiekafmetingen
  const chartHeight = 220;
  const paddingBottom = 32;
  const paddingTop = 24;
  const availableHeight = chartHeight - paddingBottom - paddingTop;

  // Bepaal de maximale calorieënwaarde voor de Y-as schaal
  const maxCalories = useMemo(() => {
    const highestVal = summary.dailyStats.reduce((max, d) => {
      const dayMax = Math.max(d.calories, d.targetCalories, d.cardioBurnCalories);
      return Math.max(max, dayMax);
    }, summary.targetCaloriesDaily || 2200);

    // Afronden naar bovenliggend veelvoud van 500 kcal met wat hoofdruimte
    return Math.ceil((highestVal * 1.15) / 500) * 500;
  }, [summary]);

  const getYCoordinate = (val: number) => {
    if (maxCalories <= 0) return chartHeight - paddingBottom;
    const ratio = Math.min(1, Math.max(0, val / maxCalories));
    return chartHeight - paddingBottom - ratio * availableHeight;
  };

  const targetLineY = getYCoordinate(summary.targetCaloriesDaily);

  // Doel macro-percentages ter vergelijking (bijv. 30% / 45% / 25%)
  const targetMacroCalories =
    targets.proteinGrams * 4 + targets.carbsGrams * 4 + targets.fatGrams * 9;
  const targetProteinPct =
    targetMacroCalories > 0
      ? Math.round(((targets.proteinGrams * 4) / targetMacroCalories) * 100)
      : 30;
  const targetCarbsPct =
    targetMacroCalories > 0
      ? Math.round(((targets.carbsGrams * 4) / targetMacroCalories) * 100)
      : 45;
  const targetFatPct =
    targetMacroCalories > 0
      ? Math.round(((targets.fatGrams * 9) / targetMacroCalories) * 100)
      : 25;

  const hoveredStat: DailyNutritionStat | null =
    hoveredDayIndex !== null && summary.dailyStats[hoveredDayIndex]
      ? summary.dailyStats[hoveredDayIndex]
      : null;

  return (
    <div className="space-y-6">
      {/* 1. PERIODE SELECTOR & ACTIES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {periods.map((p) => {
            const isActive = period === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setPeriod(p.id);
                  setHoveredDayIndex(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={showCardioBurn}
              onChange={(e) => setShowCardioBurn(e.target.checked)}
              className="rounded-sm border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              Toon Cardio-verbranding
            </span>
          </label>
        </div>
      </div>

      {/* 2. STATISTIEKEN RIBBON / KERNMETRIEKEN */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Gemiddelde Calorieën per dag */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Gem. Calorieën / dag</span>
            <Flame className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {summary.avgDailyCalories > 0
                ? summary.avgDailyCalories.toLocaleString("nl-NL")
                : "—"}
            </span>
            <span className="text-xs text-slate-500">
              / {summary.targetCaloriesDaily.toLocaleString("nl-NL")} kcal
            </span>
          </div>
          <div className="mt-2 text-xs">
            {summary.avgDailyCalories > 0 ? (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  Math.abs(summary.dailyCalorieDifference) <= 150
                    ? "text-emerald-600 dark:text-emerald-400"
                    : summary.dailyCalorieDifference > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-blue-600 dark:text-blue-400"
                }`}
              >
                {summary.dailyCalorieDifference > 0 ? "+" : ""}
                {summary.dailyCalorieDifference} kcal verschil
              </span>
            ) : (
              <span className="text-slate-400">Nog geen logs</span>
            )}
          </div>
        </Card>

        {/* Wekelijkse Balans & Geschat Gewichtseffect */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Wekelijkse Balans</span>
            <Scale className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {summary.loggedDaysCount > 0 ? (
                <>
                  {summary.weeklyCalorieBalance > 0 ? "+" : ""}
                  {summary.weeklyCalorieBalance.toLocaleString("nl-NL")}
                  <span className="text-sm font-normal text-slate-500 ml-1">kcal/wk</span>
                </>
              ) : (
                "—"
              )}
            </span>
          </div>
          <div className="mt-2 text-xs">
            {summary.loggedDaysCount > 0 ? (
              <span
                className={`inline-flex items-center gap-1 font-medium ${
                  summary.estimatedFatChangeKgPerWeek < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : summary.estimatedFatChangeKgPerWeek > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-500"
                }`}
              >
                {summary.estimatedFatChangeKgPerWeek < 0 ? (
                  <TrendingDown className="w-3.5 h-3.5 inline" />
                ) : summary.estimatedFatChangeKgPerWeek > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 inline" />
                ) : null}
                {summary.estimatedFatChangeKgPerWeek > 0 ? "+" : ""}
                {summary.estimatedFatChangeKgPerWeek} kg/wk vetbalans
              </span>
            ) : (
              <span className="text-slate-400">Geen trenddata</span>
            )}
          </div>
        </Card>

        {/* Doeltreffendheid / Consistentie */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Consistentie op Doel</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {summary.loggedDaysCount > 0
                ? `${summary.consistencyPercentage}%`
                : "—"}
            </span>
            <span className="text-xs text-slate-500">
              ({summary.onTargetDaysCount}/{summary.loggedDaysCount} dagen)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            {summary.loggedDaysCount > 0
              ? `${summary.loggedDaysCount} van ${summary.totalDays} dagen gelogd`
              : "Geen dagen ingevoerd"}
          </div>
        </Card>

        {/* Gemiddeld Eiwit per dag */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">
            <span>Gem. Eiwit / dag</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              {summary.avgDailyProteinGrams > 0
                ? `${summary.avgDailyProteinGrams}g`
                : "—"}
            </span>
            <span className="text-xs text-slate-500">
              / {targets.proteinGrams}g doel
            </span>
          </div>
          <div className="mt-2 text-xs">
            {summary.avgDailyProteinGrams > 0 ? (
              <span
                className={`font-medium ${
                  summary.avgDailyProteinGrams >= targets.proteinGrams * 0.9
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-amber-600 dark:text-amber-400"
                }`}
              >
                {Math.round(
                  (summary.avgDailyProteinGrams / targets.proteinGrams) * 100
                )}
                % van streefwaarde
              </span>
            ) : (
              <span className="text-slate-400">Nog geen data</span>
            )}
          </div>
        </Card>
      </div>

      {/* 3. HOOFDGRAFIEK: DAGELIJKSE CALORIE-INNAME & DOELLIJN (PURE SVG) */}
      <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" />
              Dagelijkse Calorie-inname vs. Doel
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Beweeg over een staaf voor detailwaarden van die dag.
            </p>
          </div>

          {/* Legenda */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-500" />
              Op doel (±10%)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-amber-500" />
              Boven doel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-sky-500" />
              Onder doel
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
              Streefdoel ({summary.targetCaloriesDaily} kcal)
            </span>
          </div>
        </div>

        {/* SVG Container */}
        <div className="relative w-full overflow-x-auto pb-2">
          <div className="min-w-[500px]">
            <svg
              viewBox={`0 0 ${Math.max(500, summary.dailyStats.length * 48)} ${chartHeight}`}
              className="w-full h-56 select-none"
            >
              {/* Rasterlijnen voor Y-as */}
              {[0, 0.25, 0.5, 0.75, 1].map((step, idx) => {
                const val = Math.round(maxCalories * step);
                const y = getYCoordinate(val);
                return (
                  <g key={`grid-${idx}`}>
                    <line
                      x1={40}
                      y1={y}
                      x2="100%"
                      y2={y}
                      stroke="currentColor"
                      strokeDasharray="3 3"
                      className="text-slate-200 dark:text-slate-800"
                      strokeWidth="1"
                    />
                    <text
                      x={35}
                      y={y + 3}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Doellijn (Dashed horizontal) */}
              {summary.targetCaloriesDaily > 0 && (
                <g>
                  <line
                    x1={40}
                    y1={targetLineY}
                    x2="100%"
                    y2={targetLineY}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="5 4"
                    strokeOpacity="0.8"
                  />
                </g>
              )}

              {/* Staven per dag */}
              {summary.dailyStats.map((day, idx) => {
                const totalBars = summary.dailyStats.length;
                const svgWidth = Math.max(500, totalBars * 48);
                const chartAreaWidth = svgWidth - 55;
                const slotWidth = chartAreaWidth / totalBars;
                const barWidth = Math.min(28, Math.max(12, slotWidth * 0.65));
                const barX = 48 + idx * slotWidth + (slotWidth - barWidth) / 2;

                const barY = getYCoordinate(day.calories);
                const barHeight = Math.max(
                  0,
                  chartHeight - paddingBottom - barY
                );

                // Kleurkeuze o.b.v. status
                let barFill = "#cbd5e1"; // slate-300 leeg
                if (day.hasMealData) {
                  if (day.adherenceStatus === "op_doel") barFill = "#10B981"; // emerald-500
                  else if (day.adherenceStatus === "boven_doel") barFill = "#F59E0B"; // amber-500
                  else if (day.adherenceStatus === "onder_doel") barFill = "#0ea5e9"; // sky-500
                }

                const isHovered = hoveredDayIndex === idx;

                return (
                  <g
                    key={day.calendarDate}
                    className="cursor-pointer transition-opacity"
                    onMouseEnter={() => setHoveredDayIndex(idx)}
                    onClick={() => {
                      if (onNavigateToDiary) onNavigateToDiary(day.calendarDate);
                    }}
                  >
                    {/* Hover highlight background */}
                    {isHovered && (
                      <rect
                        x={48 + idx * slotWidth}
                        y={paddingTop - 10}
                        width={slotWidth}
                        height={availableHeight + 15}
                        fill="currentColor"
                        className="text-slate-100 dark:text-slate-800/60"
                        rx="4"
                      />
                    )}

                    {/* Calorie Bar */}
                    {day.hasMealData && day.calories > 0 ? (
                      <rect
                        x={barX}
                        y={barY}
                        width={barWidth}
                        height={barHeight}
                        fill={barFill}
                        rx="4"
                        className="transition-all duration-200"
                        opacity={isHovered ? 1 : 0.9}
                      />
                    ) : (
                      /* Lege dag indicator */
                      <rect
                        x={barX}
                        y={chartHeight - paddingBottom - 4}
                        width={barWidth}
                        height={4}
                        fill="currentColor"
                        className="text-slate-300 dark:text-slate-700"
                        rx="2"
                      />
                    )}

                    {/* Cardio Burn Indicator (optioneel overlay streepje of vlammetje) */}
                    {showCardioBurn && day.cardioBurnCalories > 0 && (
                      <circle
                        cx={barX + barWidth / 2}
                        cy={Math.max(
                          paddingTop + 6,
                          getYCoordinate(day.calories) - 10
                        )}
                        r={3.5}
                        fill="#F97316" // orange-500
                      />
                    )}

                    {/* X-as Label (Datum) */}
                    <text
                      x={barX + barWidth / 2}
                      y={chartHeight - paddingBottom + 16}
                      textAnchor="middle"
                      className={`text-[10px] select-none ${
                        isHovered
                          ? "font-bold fill-emerald-600 dark:fill-emerald-400"
                          : "fill-slate-500 dark:fill-slate-400 font-medium"
                      }`}
                    >
                      {day.dayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hover Details Card onder de grafiek */}
        {hoveredStat ? (
          <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {hoveredStat.dayName} {hoveredStat.dayLabel} ({hoveredStat.calendarDate})
                </span>
                {hoveredStat.hasMealData ? (
                  <Badge
                    variant={
                      hoveredStat.adherenceStatus === "op_doel"
                        ? "success"
                        : hoveredStat.adherenceStatus === "boven_doel"
                        ? "warning"
                        : "default"
                    }
                  >
                    {hoveredStat.adherenceStatus === "op_doel"
                      ? "Op Doel"
                      : hoveredStat.adherenceStatus === "boven_doel"
                      ? "Boven Doel"
                      : "Onder Doel"}
                  </Badge>
                ) : (
                  <Badge variant="default">Geen maaltijden ingevoerd</Badge>
                )}
              </div>
              <div className="mt-1 flex items-center gap-3 text-slate-600 dark:text-slate-300">
                <span>
                  Calorieën:{" "}
                  <strong className="text-slate-900 dark:text-slate-100">
                    {hoveredStat.calories} kcal
                  </strong>{" "}
                  (doel: {hoveredStat.targetCalories})
                </span>
                {hoveredStat.cardioBurnCalories > 0 && (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <Flame className="w-3 h-3 inline" /> -{hoveredStat.cardioBurnCalories} kcal cardio
                  </span>
                )}
                {hoveredStat.cardioBurnCalories > 0 && (
                  <span className="text-slate-500">
                    Netto: {hoveredStat.netCalories} kcal
                  </span>
                )}
              </div>
            </div>

            {/* Macro waarden voor geselecteerde dag */}
            {hoveredStat.hasMealData && (
              <div className="flex flex-wrap items-center gap-3 pt-2 md:pt-0 border-t md:border-t-0 border-slate-200 dark:border-slate-700">
                <div className="text-center px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Eiwit</div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {hoveredStat.proteinGrams}g
                  </div>
                </div>
                <div className="text-center px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Koolhydraten</div>
                  <div className="font-semibold text-sky-600 dark:text-sky-400">
                    {hoveredStat.carbsGrams}g
                  </div>
                </div>
                <div className="text-center px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Vetten</div>
                  <div className="font-semibold text-amber-600 dark:text-amber-400">
                    {hoveredStat.fatGrams}g
                  </div>
                </div>
                <div className="text-center px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Vezels</div>
                  <div className="font-semibold text-indigo-600 dark:text-indigo-400">
                    {hoveredStat.fiberGrams}g
                  </div>
                </div>
                <div className="text-center px-2 py-1 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400">Water</div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">
                    {hoveredStat.waterMl} ml
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-2 text-center text-xs text-slate-400 italic">
            Klik of beweeg over een staaf om de details van een specifieke dag te zien
          </div>
        )}
      </Card>

      {/* 4. MACRONUTRIËNTEN ENERGIEVERDELING & BALANS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Macro Verdeling Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Wheat className="w-5 h-5 text-emerald-500" />
              Macronutriënten Energieverdeling
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Werkelijke verdeling van calorieën uit eiwitten, koolhydraten en vetten over de periode.
            </p>

            {/* Gestapelde Progressiebalk voor Macro's */}
            <div className="space-y-2">
              <div className="h-6 w-full rounded-xl overflow-hidden flex bg-slate-100 dark:bg-slate-800 shadow-inner">
                {summary.macroDistribution.totalMacroCalories > 0 ? (
                  <>
                    <div
                      style={{
                        width: `${summary.macroDistribution.protein.percentage}%`,
                      }}
                      className="bg-emerald-500 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                      title={`Eiwit: ${summary.macroDistribution.protein.percentage}%`}
                    >
                      {summary.macroDistribution.protein.percentage > 10 &&
                        `${Math.round(summary.macroDistribution.protein.percentage)}%`}
                    </div>
                    <div
                      style={{
                        width: `${summary.macroDistribution.carbs.percentage}%`,
                      }}
                      className="bg-sky-500 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                      title={`Koolhydraten: ${summary.macroDistribution.carbs.percentage}%`}
                    >
                      {summary.macroDistribution.carbs.percentage > 10 &&
                        `${Math.round(summary.macroDistribution.carbs.percentage)}%`}
                    </div>
                    <div
                      style={{
                        width: `${summary.macroDistribution.fat.percentage}%`,
                      }}
                      className="bg-amber-500 transition-all duration-300 flex items-center justify-center text-[10px] text-white font-bold"
                      title={`Vetten: ${summary.macroDistribution.fat.percentage}%`}
                    >
                      {summary.macroDistribution.fat.percentage > 10 &&
                        `${Math.round(summary.macroDistribution.fat.percentage)}%`}
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">
                    Geen maaltijddata in deze periode
                  </div>
                )}
              </div>

              {/* Target vergelijkingsbalk */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1">
                <span>Streefverdeling:</span>
                <span className="font-mono">
                  {targetProteinPct}% Eiwit • {targetCarbsPct}% Koolhydraten • {targetFatPct}% Vet
                </span>
              </div>
            </div>

            {/* 3 Macro Detail Blokken */}
            <div className="grid grid-cols-3 gap-3 mt-5">
              {/* Eiwit */}
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  Eiwitten
                </div>
                <div className="mt-2 text-lg font-bold text-emerald-900 dark:text-emerald-100">
                  {summary.macroDistribution.protein.percentage}%
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {summary.macroDistribution.protein.grams}g (
                  {summary.macroDistribution.protein.calories} kcal)
                </div>
                <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">
                  4 kcal per gram
                </div>
              </div>

              {/* Koolhydraten */}
              <div className="p-3 rounded-xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Koolhydraten
                </div>
                <div className="mt-2 text-lg font-bold text-sky-900 dark:text-sky-100">
                  {summary.macroDistribution.carbs.percentage}%
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {summary.macroDistribution.carbs.grams}g (
                  {summary.macroDistribution.carbs.calories} kcal)
                </div>
                <div className="text-[10px] text-sky-600 dark:text-sky-400 mt-1">
                  4 kcal per gram
                </div>
              </div>

              {/* Vetten */}
              <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Vetten
                </div>
                <div className="mt-2 text-lg font-bold text-amber-900 dark:text-amber-100">
                  {summary.macroDistribution.fat.percentage}%
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-400">
                  {summary.macroDistribution.fat.grams}g (
                  {summary.macroDistribution.fat.calories} kcal)
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                  9 kcal per gram
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 flex items-center gap-1.5">
            <Info className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Totaal geconsumeerde macro-energie:{" "}
              <strong className="text-slate-700 dark:text-slate-300">
                {summary.macroDistribution.totalMacroCalories.toLocaleString("nl-NL")} kcal
              </strong>
            </span>
          </div>
        </Card>

        {/* Vezels & Hydratatie Card */}
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-1">
              <Droplets className="w-5 h-5 text-blue-500" />
              Vezels & Hydratatie Trends
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Consistentie van gezonde spijsvertering en dagelijkse vochtinname.
            </p>

            <div className="space-y-5">
              {/* Vezels Voortgang */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Wheat className="w-4 h-4 text-indigo-500" />
                    Gemiddelde Vezelinname
                  </span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-bold">
                    {summary.avgDailyFiberGrams}g / {targets.fiberGrams}g per dag
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(
                        100,
                        (summary.avgDailyFiberGrams / (targets.fiberGrams || 30)) * 100
                      )}%`,
                    }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      summary.avgDailyFiberGrams >= (targets.fiberGrams || 30)
                        ? "bg-indigo-600"
                        : "bg-indigo-400"
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  De Gezondheidsraad adviseert 30 tot 40 gram vezels per dag voor een gezonde darmflora en verzadiging.
                </p>
              </div>

              {/* Water Voortgang */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Hydratatie Consistentie
                  </span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    {summary.waterGoalMetDaysCount} van {summary.totalDays} dagen ({summary.waterAdherencePercentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, summary.waterAdherencePercentage)}%`,
                    }}
                    className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Gemiddeld <strong>{summary.avgDailyWaterMl} ml</strong> vocht per dag geregistreerd (streefdoel: {targets.waterMl} ml).
                </p>
              </div>
            </div>
          </div>

          {/* Uitersten */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">Hoogste inname</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {summary.highestCalorieDay
                  ? `${summary.highestCalorieDay.calories} kcal`
                  : "—"}
              </div>
              <div className="text-[10px] text-slate-500">
                {summary.highestCalorieDay?.date || ""}
              </div>
            </div>
            <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="text-[10px] text-slate-400">Laagste inname</div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {summary.lowestCalorieDay
                  ? `${summary.lowestCalorieDay.calories} kcal`
                  : "—"}
              </div>
              <div className="text-[10px] text-slate-500">
                {summary.lowestCalorieDay?.date || ""}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* 5. UITVOUWBARE TABEL MET ALLE DAGEN */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setShowDetailsTable(!showDetailsTable)}
          className="w-full flex items-center justify-between text-left text-sm font-semibold text-slate-900 dark:text-slate-100"
        >
          <span className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Dagoverzicht Tabel ({summary.dailyStats.length} dagen)
          </span>
          <span className="text-xs text-slate-500 flex items-center gap-1 font-normal">
            {showDetailsTable ? "Verberg tabel" : "Toon details"}
            {showDetailsTable ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </span>
        </button>

        {showDetailsTable && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-medium">
                  <th className="pb-2">Datum</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2">Inname</th>
                  <th className="pb-2">Cardio</th>
                  <th className="pb-2">Netto</th>
                  <th className="pb-2">Eiwit</th>
                  <th className="pb-2">Koolh.</th>
                  <th className="pb-2">Vet</th>
                  <th className="pb-2">Vezels</th>
                  <th className="pb-2">Water</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {summary.dailyStats.map((d) => (
                  <tr
                    key={d.calendarDate}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="py-2.5 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {d.dayLabel} ({d.calendarDate})
                    </td>
                    <td className="py-2.5">
                      {d.hasMealData ? (
                        <Badge
                          variant={
                            d.adherenceStatus === "op_doel"
                              ? "success"
                              : d.adherenceStatus === "boven_doel"
                              ? "warning"
                              : "default"
                          }
                        >
                          {d.adherenceStatus === "op_doel"
                            ? "Op doel"
                            : d.adherenceStatus === "boven_doel"
                            ? "Boven"
                            : "Onder"}
                        </Badge>
                      ) : (
                        <span className="text-slate-400 italic">Geen log</span>
                      )}
                    </td>
                    <td className="py-2.5 font-semibold text-slate-900 dark:text-slate-100">
                      {d.hasMealData ? `${d.calories} kcal` : "—"}
                    </td>
                    <td className="py-2.5 text-amber-600 dark:text-amber-400">
                      {d.cardioBurnCalories > 0
                        ? `-${d.cardioBurnCalories} kcal`
                        : "—"}
                    </td>
                    <td className="py-2.5 text-slate-700 dark:text-slate-300">
                      {d.hasMealData ? `${d.netCalories} kcal` : "—"}
                    </td>
                    <td className="py-2.5 text-emerald-600 dark:text-emerald-400">
                      {d.hasMealData ? `${d.proteinGrams}g` : "—"}
                    </td>
                    <td className="py-2.5 text-sky-600 dark:text-sky-400">
                      {d.hasMealData ? `${d.carbsGrams}g` : "—"}
                    </td>
                    <td className="py-2.5 text-amber-600 dark:text-amber-400">
                      {d.hasMealData ? `${d.fatGrams}g` : "—"}
                    </td>
                    <td className="py-2.5 text-indigo-600 dark:text-indigo-400">
                      {d.hasMealData ? `${d.fiberGrams}g` : "—"}
                    </td>
                    <td className="py-2.5 text-blue-600 dark:text-blue-400">
                      {d.waterMl > 0 ? `${d.waterMl} ml` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
