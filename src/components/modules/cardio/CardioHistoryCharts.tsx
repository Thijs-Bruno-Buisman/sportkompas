"use client";

import React, { useState, useMemo } from "react";
import {
  BarChart3,
  TrendingUp,
  Heart,
  Flame,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { CardioSession, CardioActivityType } from "@/types/database";
import type { PeriodFilter } from "@/domain/cardio/statistics";
import {
  filterSessionsByPeriod,
  groupSessionsByBucket,
  calculatePaceTrend,
  calculateHeartRateDistribution,
} from "@/domain/cardio/statistics";
import { getActivityMetadata } from "@/domain/cardio/calculations";

interface CardioHistoryChartsProps {
  sessions: CardioSession[];
  userAge?: number | null;
}

export function CardioHistoryCharts({ sessions, userAge }: CardioHistoryChartsProps) {
  const [period, setPeriod] = useState<PeriodFilter>("30d");
  const [selectedSport, setSelectedSport] = useState<CardioActivityType | "alle">("alle");
  const [hoveredBucketIndex, setHoveredBucketIndex] = useState<number | null>(null);
  const [hoveredTrendIndex, setHoveredTrendIndex] = useState<number | null>(null);

  // 1. Filter sessies op periode en optioneel sport
  const filteredSessions = useMemo(() => {
    let result = filterSessionsByPeriod(sessions, period);
    if (selectedSport !== "alle") {
      result = result.filter((s) => s.activityType === selectedSport);
    }
    return result;
  }, [sessions, period, selectedSport]);

  // 2. Groepeer in tijdsblokken (dagen/weken/maanden) voor staafdiagram
  const buckets = useMemo(() => {
    return groupSessionsByBucket(filteredSessions, period);
  }, [filteredSessions, period]);

  // 3. Tempo-trend voor specifieke sport (val terug op de eerste beschikbare sport als 'alle' is gekozen)
  const trendSport: CardioActivityType =
    selectedSport !== "alle"
      ? selectedSport
      : (filteredSessions[0]?.activityType as CardioActivityType) || "hardlopen";

  const paceTrends = useMemo(() => {
    return calculatePaceTrend(sessions, trendSport);
  }, [sessions, trendSport]);

  // 4. Hartslagzoneverdeling
  const hrDistribution = useMemo(() => {
    return calculateHeartRateDistribution(filteredSessions, userAge);
  }, [filteredSessions, userAge]);

  // Bereken totalen binnen deze gefilterde periode
  const periodTotals = useMemo(() => {
    const totalMeters = filteredSessions.reduce((acc, s) => acc + s.distanceMeters, 0);
    const totalSeconds = filteredSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    const totalCalories = filteredSessions.reduce((acc, s) => acc + (s.estimatedCaloriesBurned ?? 0), 0);

    return {
      totalKm: (totalMeters / 1000).toFixed(1),
      totalHours: (totalSeconds / 3600).toFixed(1),
      totalCalories: totalCalories.toLocaleString("nl-NL"),
      sessionCount: filteredSessions.length,
    };
  }, [filteredSessions]);

  const periods: Array<{ id: PeriodFilter; label: string }> = [
    { id: "7d", label: "7 Dagen" },
    { id: "30d", label: "30 Dagen" },
    { id: "90d", label: "90 Dagen" },
    { id: "1j", label: "1 Jaar" },
    { id: "alles", label: "Alles" },
  ];

  const sportsList: Array<{ id: CardioActivityType | "alle"; label: string }> = [
    { id: "alle", label: "Alle Sporten" },
    { id: "hardlopen", label: "Hardlopen" },
    { id: "fietsen", label: "Fietsen" },
    { id: "wandelen", label: "Wandelen" },
    { id: "roeien", label: "Roeien" },
    { id: "zwemmen", label: "Zwemmen" },
    { id: "crosstrainer", label: "Crosstrainer" },
  ];

  const trendSportMeta = getActivityMetadata(trendSport);

  return (
    <div className="space-y-6">
      {/* FILTER & PERIODE SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Periode selector knoppen */}
        <div className="inline-flex rounded-xl p-1 bg-slate-100 dark:bg-slate-800 text-xs font-semibold overflow-x-auto">
          {periods.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setPeriod(p.id)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                period === p.id
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Sportselectie dropdown of tabs */}
        <div className="inline-flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
          {sportsList.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSelectedSport(s.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                selectedSport === s.id
                  ? "bg-emerald-600 text-white"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* PERIODE KERNCIJFERS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
            Periode Afstand
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {periodTotals.totalKm} <span className="text-xs font-normal text-slate-400">km</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
            Periode Duur
          </span>
          <span className="text-xl font-bold text-slate-900 dark:text-white">
            {periodTotals.totalHours} <span className="text-xs font-normal text-slate-400">uur</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
            Periode Calorieën
          </span>
          <span className="text-xl font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <Flame className="w-4 h-4" />
            {periodTotals.totalCalories} <span className="text-xs font-normal text-slate-400">kcal</span>
          </span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
            Periode Sessies
          </span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {periodTotals.sessionCount}
          </span>
        </div>
      </div>

      {/* GRAFIEK 1: VOLUME & AFSTAND OVER TIJD (STAAFDIAGRAM) */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-500" />
              Afstand &amp; Activiteit over Tijd
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kilometers verdeeld per {period === "7d" ? "dag" : period === "1j" || period === "alles" ? "maand" : "week"}.
            </p>
          </div>
        </div>

        {buckets.length > 0 ? (
          <div className="space-y-3">
            <div className="w-full overflow-x-auto">
              <SvgCardioBarChart
                buckets={buckets}
                hoveredIndex={hoveredBucketIndex}
                onHover={setHoveredBucketIndex}
              />
            </div>

            {/* Hover detailstrook */}
            {hoveredBucketIndex !== null && buckets[hoveredBucketIndex] && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {buckets[hoveredBucketIndex].label} ({buckets[hoveredBucketIndex].startDate})
                  </strong>
                  <span className="text-slate-500 ml-2">
                    {buckets[hoveredBucketIndex].sessionCount} sessies &bull; {Math.round(buckets[hoveredBucketIndex].totalDurationSeconds / 60)} min
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {(buckets[hoveredBucketIndex].totalDistanceMeters / 1000).toFixed(2)} km
                  </span>
                  <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-0.5">
                    <Flame className="w-3 h-3" />
                    {buckets[hoveredBucketIndex].totalCalories} kcal
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-slate-400">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Geen cardiosessies in deze periode
            </p>
            <p className="text-xs mt-1">
              Selecteer een groter tijdsvenster (zoals 1 Jaar of Alles) om historische grafieken te bekijken.
            </p>
          </div>
        )}
      </Card>

      {/* GRAFIEK 2: TEMPO-ONTWIKKELING (PACE TREND LIJNDIAGRAM) */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Tempo-ontwikkeling: {trendSportMeta.label}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {trendSport === "fietsen" || trendSport === "crosstrainer"
                ? "Snelheid in km/u over tijd (hoger is sneller)."
                : "Tempo in min/km over tijd (omlaag/sneller tempo)."
              }
            </p>
          </div>
          <Badge variant="outline" className="text-xs font-semibold capitalize">
            {trendSportMeta.label} ({paceTrends.length} sessies)
          </Badge>
        </div>

        {paceTrends.length > 0 ? (
          <div className="space-y-3">
            <div className="w-full overflow-x-auto">
              <SvgPaceTrendChart
                data={paceTrends}
                sport={trendSport}
                hoveredIndex={hoveredTrendIndex}
                onHover={setHoveredTrendIndex}
              />
            </div>

            {/* Hover detailstrook */}
            {hoveredTrendIndex !== null && paceTrends[hoveredTrendIndex] && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs flex flex-wrap items-center justify-between gap-2">
                <div>
                  <strong className="text-slate-900 dark:text-white font-semibold">
                    {paceTrends[hoveredTrendIndex].calendarDate}
                  </strong>
                  <span className="text-slate-500 ml-2">
                    {(paceTrends[hoveredTrendIndex].distanceMeters / 1000).toFixed(2)} km &bull; {Math.round(paceTrends[hoveredTrendIndex].durationSeconds / 60)} min
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {paceTrends[hoveredTrendIndex].formattedMetric}
                  </span>
                  {paceTrends[hoveredTrendIndex].avgHeartRateBpm && (
                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-500" />
                      {paceTrends[hoveredTrendIndex].avgHeartRateBpm} bpm
                    </span>
                  )}
                  {paceTrends[hoveredTrendIndex].rpe && (
                    <Badge variant="outline" className="text-[10px]">
                      RPE {paceTrends[hoveredTrendIndex].rpe}/10
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-slate-400">
            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
              Nog geen tempo-data voor {trendSportMeta.label.toLowerCase()}
            </p>
            <p className="text-xs mt-1">
              Log meerdere sessies van deze sport om je tempo-ontwikkeling te visualiseren.
            </p>
          </div>
        )}
      </Card>

      {/* GRAFIEK 3: HARTSLAGZONES VERDELING */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            Hartslagzone Verdeling (Gellish Z1 - Z5)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Verdeling over aerobe basistraining (Zone 2) versus drempel en intensiteit ({hrDistribution.totalWithHeartRate} gemeten sessies).
          </p>
        </div>

        {hrDistribution.totalWithHeartRate > 0 ? (
          <div className="space-y-3">
            {hrDistribution.distribution.map((z) => (
              <div key={z.zone} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {z.name}
                  </span>
                  <span className="text-slate-500">
                    <strong className="text-slate-900 dark:text-white">{z.count}</strong> {z.count === 1 ? "sessie" : "sessies"} ({z.percentage}%)
                  </span>
                </div>

                {/* Progressiebar */}
                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      z.zone === 1
                        ? "bg-slate-400"
                        : z.zone === 2
                        ? "bg-sky-500"
                        : z.zone === 3
                        ? "bg-emerald-500"
                        : z.zone === 4
                        ? "bg-amber-500"
                        : "bg-rose-500"
                    }`}
                    style={{ width: `${z.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="h-32 flex flex-col items-center justify-center text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-slate-400 text-xs">
            Geen hartslagmetingen geregistreerd in de geselecteerde sessies.
          </div>
        )}
      </Card>
    </div>
  );
}

// =========================================================================
// Pure SVG Bar Chart (Hydration safe, responsive, touch hitzones)
// =========================================================================
function SvgCardioBarChart({
  buckets,
  hoveredIndex,
  onHover,
}: {
  buckets: Array<{ label: string; totalDistanceMeters: number; sessionCount: number }>;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}) {
  const svgWidth = 600;
  const svgHeight = 200;
  const paddingLeft = 45;
  const paddingRight = 15;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const maxKm = Math.max(
    5,
    ...buckets.map((b) => b.totalDistanceMeters / 1000)
  );

  const barWidth = Math.max(8, Math.min(36, (chartWidth / buckets.length) * 0.65));
  const slotWidth = chartWidth / buckets.length;

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto select-none overflow-visible"
    >
      {/* Horizontale rasterlijnen */}
      {[0, 0.33, 0.66, 1].map((ratio) => {
        const y = paddingTop + chartHeight * (1 - ratio);
        const val = Math.round(maxKm * ratio * 10) / 10;
        return (
          <g key={ratio}>
            <line
              x1={paddingLeft}
              y1={y}
              x2={svgWidth - paddingRight}
              y2={y}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeDasharray="3 3"
            />
            <text
              x={paddingLeft - 8}
              y={y + 3}
              textAnchor="end"
              className="text-[10px] fill-slate-400 font-medium"
            >
              {val} km
            </text>
          </g>
        );
      })}

      {/* Balken */}
      {buckets.map((b, i) => {
        const km = b.totalDistanceMeters / 1000;
        const barHeight = Math.max(2, (km / maxKm) * chartHeight);
        const x = paddingLeft + i * slotWidth + (slotWidth - barWidth) / 2;
        const y = paddingTop + chartHeight - barHeight;
        const isHovered = hoveredIndex === i;

        return (
          <g
            key={i}
            className="cursor-pointer"
            onMouseEnter={() => onHover(i)}
            onTouchStart={() => onHover(i)}
          >
            {/* Onzichtbare hitzone voor touch */}
            <rect
              x={paddingLeft + i * slotWidth}
              y={paddingTop}
              width={slotWidth}
              height={chartHeight + paddingBottom}
              fill="transparent"
            />

            {/* Balk */}
            <rect
              x={x}
              y={y}
              width={barWidth}
              height={barHeight}
              rx={3}
              fill={isHovered ? "#059669" : "#10B981"}
              className="transition-colors"
            />

            {/* As label onderaan */}
            {(buckets.length <= 14 || i % 2 === 0) && (
              <text
                x={x + barWidth / 2}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[10px] fill-slate-400"
              >
                {b.label}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// =========================================================================
// Pure SVG Line Chart voor Tempo & Snelheid
// =========================================================================
function SvgPaceTrendChart({
  data,
  sport,
  hoveredIndex,
  onHover,
}: {
  data: Array<{ calendarDate: string; metricValue: number; formattedMetric: string; speedKmH: number }>;
  sport: CardioActivityType;
  hoveredIndex: number | null;
  onHover: (idx: number | null) => void;
}) {
  const svgWidth = 600;
  const svgHeight = 200;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  const isSpeedMetric = sport === "fietsen" || sport === "crosstrainer";

  const values = data.map((d) => d.metricValue);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const valRange = Math.max(1, maxVal - minVal);

  const getY = (val: number) => {
    if (isSpeedMetric) {
      return paddingTop + chartHeight - ((val - minVal) / valRange) * chartHeight;
    } else {
      return paddingTop + ((val - minVal) / valRange) * chartHeight;
    }
  };

  const isSingle = data.length === 1;
  const points = data.map((d, i) => {
    const x = isSingle ? paddingLeft + chartWidth / 2 : paddingLeft + (i / (data.length - 1)) * chartWidth;
    const y = getY(d.metricValue);
    return { ...d, x, y };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");
  const activePoint = hoveredIndex !== null ? points[hoveredIndex] : points[points.length - 1];

  return (
    <svg
      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
      className="w-full h-auto select-none overflow-visible"
    >
      {/* Horizontale rasterlijnen */}
      {[0, 0.5, 1].map((ratio) => {
        const y = paddingTop + chartHeight * ratio;
        return (
          <line
            key={ratio}
            x1={paddingLeft}
            y1={y}
            x2={svgWidth - paddingRight}
            y2={y}
            stroke="currentColor"
            className="text-slate-200 dark:text-slate-800"
            strokeDasharray="3 3"
          />
        );
      })}

      {/* Lijnpad */}
      {isSingle ? (
        <circle cx={points[0].x} cy={points[0].y} r="5" fill="#10B981" />
      ) : (
        <polyline
          fill="none"
          stroke="#10B981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={polylineStr}
        />
      )}

      {/* Datapunten & touch hitzones */}
      {points.map((p, i) => {
        const isSelected = activePoint === p;
        return (
          <g
            key={i}
            className="cursor-pointer"
            onMouseEnter={() => onHover(i)}
            onTouchStart={() => onHover(i)}
          >
            <circle cx={p.x} cy={p.y} r="18" fill="transparent" />
            {isSelected && (
              <circle cx={p.x} cy={p.y} r="8" fill="#10B981" className="opacity-25 animate-pulse" />
            )}
            <circle
              cx={p.x}
              cy={p.y}
              r={isSelected ? "5" : "3.5"}
              fill={isSelected ? "#10B981" : "#ffffff"}
              stroke="#10B981"
              strokeWidth="2"
            />
            {(points.length <= 8 || i % 2 === 0) && (
              <text
                x={p.x}
                y={svgHeight - 10}
                textAnchor="middle"
                className="text-[9px] fill-slate-400"
              >
                {p.calendarDate.slice(5)}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
