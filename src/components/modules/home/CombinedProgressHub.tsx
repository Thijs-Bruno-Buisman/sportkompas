"use client";

import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Scale,
  Flame,
  Dumbbell,
  Activity,
  Layers,
  Sparkles,
  Info,
  Calendar,
  CheckCircle2,
  PieChart,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  BodyMeasurement,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import {
  calculateProgressHubSummary,
  type ProgressHubPeriod,
  type DailyCorrelationPoint,
} from "@/domain/home/progressHub";

interface CombinedProgressHubProps {
  workoutSessions: WorkoutSession[];
  workoutSets: WorkoutSet[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  measurements: BodyMeasurement[];
  targets: DailyNutritionTargets;
  referenceDate?: string;
}

export function CombinedProgressHub({
  workoutSessions,
  workoutSets,
  cardioSessions,
  mealLogs,
  measurements,
  targets,
  referenceDate,
}: CombinedProgressHubProps) {
  const [period, setPeriod] = useState<ProgressHubPeriod>("30d");
  const [activeView, setActiveView] = useState<"correlatie" | "volume_cardio" | "training_vs_rust">("correlatie");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);

  const summary = useMemo(() => {
    return calculateProgressHubSummary({
      period,
      referenceDate,
      workoutSessions,
      workoutSets,
      cardioSessions,
      mealLogs,
      measurements,
      targets,
    });
  }, [
    period,
    referenceDate,
    workoutSessions,
    workoutSets,
    cardioSessions,
    mealLogs,
    measurements,
    targets,
  ]);

  const periods: Array<{ id: ProgressHubPeriod; label: string }> = [
    { id: "14d", label: "14 Dagen" },
    { id: "30d", label: "30 Dagen" },
    { id: "90d", label: "90 Dagen" },
  ];

  // SVG Grafiekafmetingen
  const chartHeight = 220;
  const paddingBottom = 32;
  const paddingTop = 20;
  const paddingLeft = 45;
  const paddingRight = 45;
  const availableHeight = chartHeight - paddingBottom - paddingTop;

  // Schaalberekeningen voor Calorieën (links) & Gewicht (rechts)
  const maxCalories = useMemo(() => {
    const highest = summary.dataPoints.reduce((max, pt) => {
      return Math.max(max, pt.caloriesConsumed, pt.targetCalories, pt.cardioCaloriesBurned);
    }, 2200);
    return Math.ceil((highest * 1.15) / 500) * 500;
  }, [summary]);

  const { minWeight, maxWeight } = useMemo(() => {
    const weights = summary.dataPoints
      .map((p) => p.trendWeightKg)
      .filter((w): w is number => w !== null);

    if (weights.length === 0) {
      return { minWeight: 60, maxWeight: 90 };
    }
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    // Geef marge van 2 kg boven en onder
    return {
      minWeight: Math.max(0, Math.floor(min - 2)),
      maxWeight: Math.ceil(max + 2),
    };
  }, [summary]);

  // Schaal voor trainingsvolume
  const maxVolume = useMemo(() => {
    const highestVol = summary.dataPoints.reduce((max, pt) => {
      return Math.max(max, pt.workoutVolumeKg);
    }, 1000);
    return Math.max(2000, Math.ceil((highestVol * 1.2) / 1000) * 1000);
  }, [summary]);

  const getCalorieY = (val: number) => {
    if (maxCalories <= 0) return chartHeight - paddingBottom;
    const ratio = Math.min(1, Math.max(0, val / maxCalories));
    return chartHeight - paddingBottom - ratio * availableHeight;
  };

  const getWeightY = (weight: number) => {
    const range = maxWeight - minWeight;
    if (range <= 0) return chartHeight - paddingBottom;
    const ratio = Math.min(1, Math.max(0, (weight - minWeight) / range));
    return chartHeight - paddingBottom - ratio * availableHeight;
  };

  const getVolumeY = (vol: number) => {
    if (maxVolume <= 0) return chartHeight - paddingBottom;
    const ratio = Math.min(1, Math.max(0, valRatio(vol, maxVolume)));
    return chartHeight - paddingBottom - ratio * availableHeight;
  };

  function valRatio(val: number, max: number) {
    return Math.min(1, Math.max(0, val / max));
  }

  const hoveredPoint =
    hoveredPointIndex !== null && summary.dataPoints[hoveredPointIndex]
      ? summary.dataPoints[hoveredPointIndex]
      : null;

  return (
    <div className="space-y-6">
      {/* 1. HEADER & WEERGAVE SELECTIE */}
      <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Gecombineerde Voortgang Hub &amp; Analytics
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Holistische correlaties tussen krachttraining, cardio, calorieën en gewicht.
              </p>
            </div>
          </div>

          {/* Periode buttons */}
          <div className="flex items-center gap-1.5 self-end sm:self-auto">
            {periods.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setPeriod(p.id);
                  setHoveredPointIndex(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  period === p.id
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* View switcher tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveView("correlatie")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeView === "correlatie"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
            Calorieën vs. Lichaamsgewicht
          </button>

          <button
            onClick={() => setActiveView("volume_cardio")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeView === "volume_cardio"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <Dumbbell className="w-3.5 h-3.5 text-emerald-500" />
            Trainingsvolume &amp; Cardio
          </button>

          <button
            onClick={() => setActiveView("training_vs_rust")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              activeView === "training_vs_rust"
                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-emerald-500" />
            Trainingsdagen vs. Rustdagen
          </button>
        </div>
      </Card>

      {/* 2. HOLISTISCHE KPI RIBBON */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Totaal Volume */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Krachttrainingsvolume</span>
            <Dumbbell className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.totalWorkoutVolumeKg > 0
              ? `${summary.totalWorkoutVolumeKg.toLocaleString("nl-NL")} kg`
              : "0 kg"}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.totalWorkoutsCount > 0
              ? `${summary.totalWorkoutsCount} workouts (gem. ${summary.avgVolumePerWorkoutKg.toLocaleString("nl-NL")} kg)`
              : "Geen trainingen in deze periode"}
          </div>
        </Card>

        {/* Totaal Cardio */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Cardio Afstand &amp; Burn</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.totalCardioKm > 0 ? `${summary.totalCardioKm} km` : "0 km"}
          </div>
          <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">
            {summary.totalCardioCaloriesBurned > 0
              ? `-${summary.totalCardioCaloriesBurned.toLocaleString("nl-NL")} kcal verbrand (${summary.totalCardioDurationMinutes} min)`
              : "Geen cardio geregistreerd"}
          </div>
        </Card>

        {/* Gewichtsverloop */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Gewichtsontwikkeling</span>
            <Scale className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.actualWeightChangeKg !== null ? (
              <span
                className={
                  summary.actualWeightChangeKg < 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : summary.actualWeightChangeKg > 0
                    ? "text-amber-600 dark:text-amber-400"
                    : "text-slate-700 dark:text-slate-300"
                }
              >
                {summary.actualWeightChangeKg > 0 ? "+" : ""}
                {summary.actualWeightChangeKg} kg
              </span>
            ) : (
              "—"
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.startWeightKg && summary.endWeightKg
              ? `${summary.startWeightKg} kg → ${summary.endWeightKg} kg`
              : "Minstens 2 metingen vereist"}
          </div>
        </Card>

        {/* Netto Caloriebalans */}
        <Card className="p-4 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Netto Energiebalans</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {summary.avgDailyNetCalories > 0
              ? `${summary.avgDailyNetCalories} kcal`
              : "—"}
            <span className="text-xs font-normal text-slate-400 ml-1">/ dag</span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {summary.totalCalorieDeficitOrSurplus !== 0 ? (
              <span
                className={
                  summary.totalCalorieDeficitOrSurplus < 0
                    ? "text-emerald-600 dark:text-emerald-400 font-medium"
                    : "text-amber-600 dark:text-amber-400 font-medium"
                }
              >
                {summary.totalCalorieDeficitOrSurplus > 0 ? "+" : ""}
                {summary.totalCalorieDeficitOrSurplus.toLocaleString("nl-NL")} kcal netto balans
              </span>
            ) : (
              "Op onderhoud"
            )}
          </div>
        </Card>
      </div>

      {/* 3. MULTI-METRIC GRAFIEK CONTAINER (PURE SVG) */}
      <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {activeView === "correlatie" && (
                <>
                  <Scale className="w-5 h-5 text-emerald-500" />
                  Calorie-inname vs. Lichaamsgewicht (Dubbele As)
                </>
              )}
              {activeView === "volume_cardio" && (
                <>
                  <Dumbbell className="w-5 h-5 text-emerald-500" />
                  Krachttrainingsvolume (kg) &amp; Cardio-belasting
                </>
              )}
              {activeView === "training_vs_rust" && (
                <>
                  <PieChart className="w-5 h-5 text-emerald-500" />
                  Voeding op Trainingsdagen vs. Rustdagen
                </>
              )}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {activeView === "correlatie" &&
                "Bekijk hoe je calorie-inname (staven) correleert met het gewichtsverloop (lijn)."}
              {activeView === "volume_cardio" &&
                "Overzicht van getild tonnage per trainingssessie en cardio-inspanning."}
              {activeView === "training_vs_rust" &&
                "Vergelijk je calorie- en eiwitinname op dagen mét training versus rustdagen."}
            </p>
          </div>

          {/* Legenda o.b.v. actieve weergave */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300">
            {activeView === "correlatie" && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  Calorieën (Links)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-1 bg-purple-500 rounded-full" />
                  Gewicht kg (Rechts)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-0.5 border-t border-dashed border-emerald-500" />
                  Doel ({targets.calories} kcal)
                </span>
              </>
            )}
            {activeView === "volume_cardio" && (
              <>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-emerald-500" />
                  Volume (kg)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-xs bg-amber-500" />
                  Cardio verbranding (kcal)
                </span>
              </>
            )}
          </div>
        </div>

        {/* WEERGAVE 1 & 2: PURE SVG GRAFIEK */}
        {activeView !== "training_vs_rust" ? (
          <div className="relative w-full overflow-x-auto pb-2">
            <div className="min-w-[550px]">
              <svg
                viewBox={`0 0 ${Math.max(550, summary.dataPoints.length * 36)} ${chartHeight}`}
                className="w-full h-60 select-none"
              >
                {/* Y-as Links Raster (Calorieën of Volume) */}
                {[0, 0.33, 0.66, 1].map((step, idx) => {
                  const val =
                    activeView === "correlatie"
                      ? Math.round(maxCalories * step)
                      : Math.round(maxVolume * step);
                  const y =
                    activeView === "correlatie"
                      ? getCalorieY(val)
                      : getVolumeY(val);

                  return (
                    <g key={`grid-left-${idx}`}>
                      <line
                        x1={paddingLeft}
                        y1={y}
                        x2="100%"
                        y2={y}
                        stroke="currentColor"
                        strokeDasharray="3 3"
                        className="text-slate-200 dark:text-slate-800"
                        strokeWidth="1"
                      />
                      <text
                        x={paddingLeft - 6}
                        y={y + 3}
                        textAnchor="end"
                        className="fill-slate-400 dark:fill-slate-500 text-[10px] font-mono"
                      >
                        {val}
                      </text>
                    </g>
                  );
                })}

                {/* Y-as Rechts Labels (Gewicht in kg) bij Correlatie */}
                {activeView === "correlatie" &&
                  [minWeight, Math.round((minWeight + maxWeight) / 2), maxWeight].map(
                    (w, idx) => {
                      const y = getWeightY(w);
                      return (
                        <text
                          key={`y-weight-${idx}`}
                          x="98%"
                          y={y + 3}
                          textAnchor="end"
                          className="fill-purple-500 dark:fill-purple-400 text-[10px] font-mono font-semibold"
                        >
                          {w}kg
                        </text>
                      );
                    }
                  )}

                {/* Doellijn Calorieën (horizontaal gestreept) */}
                {activeView === "correlatie" && targets.calories > 0 && (
                  <line
                    x1={paddingLeft}
                    y1={getCalorieY(targets.calories)}
                    x2="95%"
                    y2={getCalorieY(targets.calories)}
                    stroke="#10B981"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    strokeOpacity="0.7"
                  />
                )}

                {/* Staven per dag */}
                {summary.dataPoints.map((pt, idx) => {
                  const totalBars = summary.dataPoints.length;
                  const svgWidth = Math.max(550, totalBars * 36);
                  const chartAreaWidth = svgWidth - paddingLeft - paddingRight;
                  const slotWidth = chartAreaWidth / totalBars;
                  const barWidth = Math.min(22, Math.max(10, slotWidth * 0.65));
                  const barX = paddingLeft + idx * slotWidth + (slotWidth - barWidth) / 2;

                  const isHovered = hoveredPointIndex === idx;

                  if (activeView === "correlatie") {
                    const barY = getCalorieY(pt.caloriesConsumed);
                    const barH = Math.max(0, chartHeight - paddingBottom - barY);

                    return (
                      <g
                        key={`bar-${pt.calendarDate}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                      >
                        {isHovered && (
                          <rect
                            x={paddingLeft + idx * slotWidth}
                            y={paddingTop - 5}
                            width={slotWidth}
                            height={availableHeight + 10}
                            fill="currentColor"
                            className="text-slate-100 dark:text-slate-800/60"
                            rx="4"
                          />
                        )}

                        {pt.hasNutrition && pt.caloriesConsumed > 0 ? (
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barH}
                            fill="#10B981"
                            rx="3"
                            opacity={isHovered ? 1 : 0.85}
                          />
                        ) : (
                          <rect
                            x={barX}
                            y={chartHeight - paddingBottom - 3}
                            width={barWidth}
                            height={3}
                            fill="currentColor"
                            className="text-slate-200 dark:text-slate-700"
                            rx="1.5"
                          />
                        )}

                        {/* X-as Label */}
                        {(idx % 2 === 0 || totalBars <= 14) && (
                          <text
                            x={barX + barWidth / 2}
                            y={chartHeight - paddingBottom + 16}
                            textAnchor="middle"
                            className="fill-slate-400 text-[9px] font-medium"
                          >
                            {pt.dayLabel}
                          </text>
                        )}
                      </g>
                    );
                  } else {
                    // Volume & Cardio weergave
                    const barY = getVolumeY(pt.workoutVolumeKg);
                    const barH = Math.max(0, chartHeight - paddingBottom - barY);

                    return (
                      <g
                        key={`vol-${pt.calendarDate}`}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPointIndex(idx)}
                      >
                        {isHovered && (
                          <rect
                            x={paddingLeft + idx * slotWidth}
                            y={paddingTop - 5}
                            width={slotWidth}
                            height={availableHeight + 10}
                            fill="currentColor"
                            className="text-slate-100 dark:text-slate-800/60"
                            rx="4"
                          />
                        )}

                        {pt.hasWorkout && pt.workoutVolumeKg > 0 ? (
                          <rect
                            x={barX}
                            y={barY}
                            width={barWidth}
                            height={barH}
                            fill="#10B981"
                            rx="3"
                          />
                        ) : (
                          <rect
                            x={barX}
                            y={chartHeight - paddingBottom - 3}
                            width={barWidth}
                            height={3}
                            fill="currentColor"
                            className="text-slate-200 dark:text-slate-700"
                            rx="1.5"
                          />
                        )}

                        {/* Cardio overlay indicatie (oranje stip) */}
                        {pt.hasCardio && pt.cardioCaloriesBurned > 0 && (
                          <circle
                            cx={barX + barWidth / 2}
                            cy={Math.max(paddingTop + 6, barY - 8)}
                            r={3}
                            fill="#F59E0B"
                          />
                        )}

                        {(idx % 2 === 0 || totalBars <= 14) && (
                          <text
                            x={barX + barWidth / 2}
                            y={chartHeight - paddingBottom + 16}
                            textAnchor="middle"
                            className="fill-slate-400 text-[9px] font-medium"
                          >
                            {pt.dayLabel}
                          </text>
                        )}
                      </g>
                    );
                  }
                })}

                {/* Gewichtsverloop Lijn bij Correlatie Weergave */}
                {activeView === "correlatie" && (
                  <g>
                    {/* Genereer polyline pad voor het gewicht */}
                    {(() => {
                      const totalBars = summary.dataPoints.length;
                      const svgWidth = Math.max(550, totalBars * 36);
                      const chartAreaWidth = svgWidth - paddingLeft - paddingRight;
                      const slotWidth = chartAreaWidth / totalBars;

                      const weightPoints = summary.dataPoints
                        .map((pt, i) => {
                          if (pt.trendWeightKg === null) return null;
                          const x = paddingLeft + i * slotWidth + slotWidth / 2;
                          const y = getWeightY(pt.trendWeightKg);
                          return { x, y, actual: pt.actualWeightKg !== null };
                        })
                        .filter((p): p is { x: number; y: number; actual: boolean } => p !== null);

                      if (weightPoints.length === 0) return null;

                      const polylinePoints = weightPoints.map((p) => `${p.x},${p.y}`).join(" ");

                      return (
                        <>
                          <polyline
                            points={polylinePoints}
                            fill="none"
                            stroke="#A855F7"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {/* Meetpunten waar echt gewogen is */}
                          {weightPoints
                            .filter((p) => p.actual)
                            .map((p, idx) => (
                              <circle
                                key={`wp-dot-${idx}`}
                                cx={p.x}
                                cy={p.y}
                                r={4.5}
                                fill="#A855F7"
                                stroke="#FFFFFF"
                                strokeWidth="2"
                              />
                            ))}
                        </>
                      );
                    })()}
                  </g>
                )}
              </svg>
            </div>
          </div>
        ) : (
          /* WEERGAVE 3: TRAININGSDAGEN VS RUSTDAGEN VERGELIJKING */
          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Trainingsdagen Card */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      Trainingsdagen ({summary.trainingDaysCount} dagen)
                    </h4>
                  </div>
                  <Badge variant="success">Training</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-slate-500">Gemiddelde Inname</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.avgCaloriesTrainingDays > 0
                        ? `${summary.avgCaloriesTrainingDays.toLocaleString("nl-NL")} kcal`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Gemiddeld Eiwit</span>
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {summary.avgProteinTrainingDays > 0
                        ? `${summary.avgProteinTrainingDays}g`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Rustdagen Card */}
              <div className="p-5 rounded-2xl bg-sky-50/60 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                    <h4 className="font-bold text-slate-900 dark:text-slate-100">
                      Rust- &amp; Hersteldagen ({summary.restDaysCount} dagen)
                    </h4>
                  </div>
                  <Badge variant="default">Herstel</Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <span className="text-xs text-slate-500">Gemiddelde Inname</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                      {summary.avgCaloriesRestDays > 0
                        ? `${summary.avgCaloriesRestDays.toLocaleString("nl-NL")} kcal`
                        : "—"}
                    </div>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500">Gemiddeld Eiwit</span>
                    <div className="text-2xl font-bold text-sky-600 dark:text-sky-400">
                      {summary.avgProteinRestDays > 0
                        ? `${summary.avgProteinRestDays}g`
                        : "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inzichtenbalk */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
              {summary.trainingDaysCount > 0 && summary.restDaysCount > 0 ? (
                <p>
                  Verschil tussen trainings- en rustdagen:{" "}
                  <strong>
                    {summary.avgCaloriesTrainingDays - summary.avgCaloriesRestDays > 0 ? "+" : ""}
                    {summary.avgCaloriesTrainingDays - summary.avgCaloriesRestDays} kcal
                  </strong>{" "}
                  en{" "}
                  <strong>
                    {Math.round((summary.avgProteinTrainingDays - summary.avgProteinRestDays) * 10) / 10}g eiwit
                  </strong>
                  . Voldoende eiwitinname op zowel trainings- als rustdagen ondersteunt spierherstel en spierbehoud.
                </p>
              ) : (
                <p>
                  Er is nog niet voldoende gecombineerde data van zowel trainings- als rustdagen in deze periode om een betrouwbaar verschil te berekenen.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Hover details box */}
        {hoveredPoint && activeView !== "training_vs_rust" && (
          <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 text-xs flex flex-wrap items-center justify-between gap-3 animate-in fade-in duration-150">
            <div>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {hoveredPoint.dayName} {hoveredPoint.dayLabel} ({hoveredPoint.calendarDate})
              </span>
              <div className="mt-0.5 text-slate-600 dark:text-slate-400 flex items-center gap-3">
                {hoveredPoint.hasNutrition && (
                  <span>Inname: <strong>{hoveredPoint.caloriesConsumed} kcal</strong></span>
                )}
                {hoveredPoint.hasCardio && (
                  <span className="text-amber-600 dark:text-amber-400">
                    Cardio: -{hoveredPoint.cardioCaloriesBurned} kcal ({hoveredPoint.cardioKm} km)
                  </span>
                )}
                {hoveredPoint.hasWorkout && (
                  <span className="text-emerald-600 dark:text-emerald-400">
                    Volume: {hoveredPoint.workoutVolumeKg.toLocaleString("nl-NL")} kg ({hoveredPoint.workoutSetsCount} sets)
                  </span>
                )}
              </div>
            </div>

            {hoveredPoint.actualWeightKg !== null ? (
              <Badge variant="default" className="text-purple-700 dark:text-purple-300 border-purple-300">
                Gewogen: {hoveredPoint.actualWeightKg} kg
              </Badge>
            ) : hoveredPoint.trendWeightKg !== null ? (
              <span className="text-slate-400">
                Trendgewicht: ~{hoveredPoint.trendWeightKg} kg
              </span>
            ) : null}
          </div>
        )}
      </Card>

      {/* 4. SLIMME OBSERVATIES & INZICHTEN UIT DE DATA */}
      {summary.observations.length > 0 && (
        <Card className="p-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Holistische Inzichten uit jouw Data
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {summary.observations.map((obs, idx) => (
              <div
                key={`obs-${idx}`}
                className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="font-semibold text-xs text-slate-900 dark:text-slate-100">
                    {obs.title}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-6">
                  {obs.description}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
