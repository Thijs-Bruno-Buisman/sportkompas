"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useDatabase } from "@/lib/db";
import type { Exercise } from "@/types/database";
import {
  type ExerciseHistoryPoint,
  convertProgressionPointsToLbs,
} from "@/domain/strength/progression";
import {
  TrendingUp,
  Dumbbell,
  Award,
  Calendar,
  Layers,
  Info,
  Clock,
  Flame,
  Table as TableIcon,
  LineChart as ChartIcon,
  Sparkles,
} from "lucide-react";
import { ProgressiveOverloadCard } from "../tracker/ProgressiveOverloadCard";
import { AiOverloadAdvisorModal } from "../training/AiOverloadAdvisorModal";
import type { ProgressiveOverloadSuggestion } from "@/domain/strength/progressiveOverload";

interface ExerciseProgressionModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

type ProgressionMetric = "gewicht" | "reps" | "volume" | "rpe";

export function ExerciseProgressionModal({
  exercise,
  isOpen,
  onClose,
}: ExerciseProgressionModalProps) {
  const { repositories, dataVersion } = useDatabase();

  const [points, setPoints] = useState<ExerciseHistoryPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<ProgressionMetric>("gewicht");
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [viewMode, setViewMode] = useState<"chart" | "table">("chart");
  const [hoveredPointIndex, setHoveredPointIndex] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<ProgressiveOverloadSuggestion | null>(null);
  const [isAiAdvisorOpen, setIsAiAdvisorOpen] = useState(false);
  const [advisorSuccessMsg, setAdvisorSuccessMsg] = useState<string | null>(null);

  // Laad progressie datapunten en voorstel
  const loadProgression = useCallback(async () => {
    if (!exercise) return;
    setIsLoading(true);
    try {
      // Optioneel: haal het meest recente geregistreerde lichaamsgewicht op uit het profiel
      const profiles = await repositories.profile.getAll();
      const currentProfile = profiles[0];
      const bodyweightKg = currentProfile?.startWeightKg ?? null;

      const [result, sugg] = await Promise.all([
        repositories.workout.getExerciseProgression(exercise.id, {
          userBodyweightKg: bodyweightKg,
        }),
        repositories.workout.getProgressionSuggestion(
          exercise.id,
          undefined,
          undefined,
          exercise
        ),
      ]);
      setPoints(result.points);
      setSuggestion(sugg);
    } catch (err) {
      console.error("Fout bij laden van oefenprogressie:", err);
    } finally {
      setIsLoading(false);
    }
  }, [exercise, repositories]);

  useEffect(() => {
    if (isOpen && exercise) {
      loadProgression();
      setHoveredPointIndex(null);
    }
  }, [isOpen, exercise, loadProgression, dataVersion]);

  // Converteer punten naar lb indien gewenst (zuiver presentatie)
  const displayPoints = useMemo(() => {
    if (unit === "imperial") {
      return convertProgressionPointsToLbs(points);
    }
    return points;
  }, [points, unit]);

  const weightUnitLabel = unit === "metric" ? "kg" : "lbs";

  // Bepaal all-time statistieken
  const allTimeStats = useMemo(() => {
    if (displayPoints.length === 0) return null;

    let maxWeight: number | null = null;
    let maxReps = 0;
    let totalVolume = 0;
    let totalSets = 0;

    for (const p of displayPoints) {
      totalSets += p.completedSetsCount;
      totalVolume += p.worksetVolumeKg;
      if (p.maxReps > maxReps) maxReps = p.maxReps;
      if (p.maxWeightKg !== null) {
        if (exercise?.measurementType === "assisted") {
          // Bij assisted is het laagste tegengewicht de beste prestatie
          if (maxWeight === null || p.maxWeightKg < maxWeight) {
            maxWeight = p.maxWeightKg;
          }
        } else {
          if (maxWeight === null || p.maxWeightKg > maxWeight) {
            maxWeight = p.maxWeightKg;
          }
        }
      }
    }

    const latest = displayPoints[displayPoints.length - 1];

    return {
      maxWeight,
      maxReps,
      totalVolume: Math.round(totalVolume * 10) / 10,
      totalSets,
      latest,
    };
  }, [displayPoints, exercise?.measurementType]);

  // Bepaal waarden voor de actieve grafiekstatistiek
  const chartData = useMemo(() => {
    return displayPoints.map((p) => {
      let val: number | null = null;
      let label = "";

      switch (selectedMetric) {
        case "gewicht":
          val = p.maxWeightKg;
          label = val !== null ? `${val} ${weightUnitLabel}` : "Geen gewicht";
          break;
        case "reps":
          val = p.maxReps;
          label = `${val} reps`;
          break;
        case "volume":
          val = p.worksetVolumeKg;
          label = `${val} ${weightUnitLabel}`;
          break;
        case "rpe":
          val = p.averageRpe;
          label = val !== null ? `RPE ${val}` : "Geen RPE";
          break;
      }

      return {
        date: p.calendarDate,
        title: p.sessionTitle,
        value: val,
        displayLabel: label,
        point: p,
      };
    });
  }, [displayPoints, selectedMetric, weightUnitLabel]);

  if (!exercise) return null;

  // Volume definitie toelichting
  const volumeExplanation =
    displayPoints[0]?.volumeDefinition ||
    (exercise.measurementType === "assisted"
      ? "Assisted oefening: tegengewicht machinehulp. Minder hulp betekent een betere prestatie."
      : exercise.measurementType === "lichaamsgewicht"
      ? "Lichaamsgewichtoefening: voortgang wordt primair gemeten in herhalingen."
      : "Volume = gewicht × herhalingen per voltooide werkset.");

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Progressie: ${exercise.name}`}
      description={`Historische prestaties en progressieve overload over tijd.`}
      maxWidth="lg"
    >
      <div className="space-y-4 py-2 max-h-[75vh] overflow-y-auto pr-1">
        {/* HEADER: BADGES & EENHEDEN TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="default" className="text-xs">
              {exercise.primaryMuscleGroup}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {exercise.equipment}
            </Badge>
            <Badge
              variant={
                exercise.measurementType === "assisted"
                  ? "warning"
                  : exercise.measurementType === "lichaamsgewicht"
                  ? "default"
                  : "success"
              }
              className="text-xs"
            >
              {exercise.measurementType === "assisted"
                ? "Assisted Machine"
                : exercise.measurementType === "lichaamsgewicht"
                ? "Lichaamsgewicht"
                : "Gewicht & Reps"}
            </Badge>
          </div>

          {/* Eenheden switch (kg / lbs) */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setUnit("metric")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                unit === "metric"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit("imperial")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                unit === "imperial"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              lbs
            </button>
          </div>
        </div>

        {/* DEFINITIE CALLOUT */}
        <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-900 dark:text-white">
              Meetdefinitie:
            </span>{" "}
            {volumeExplanation}
          </div>
        </div>

        {/* STATS SAMENVATTING */}
        {allTimeStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {exercise.measurementType === "assisted"
                  ? "Beste Machinehulp"
                  : "All-time PR Gewicht"}
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {allTimeStats.maxWeight !== null
                  ? `${allTimeStats.maxWeight} ${weightUnitLabel}`
                  : "N.v.t."}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Max Herhalingen
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {allTimeStats.maxReps} reps
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Totaal Volume
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {allTimeStats.totalVolume > 0
                  ? `${allTimeStats.totalVolume.toLocaleString("nl-NL")} ${weightUnitLabel}`
                  : "0 " + weightUnitLabel}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Voltooide Sets
              </p>
              <p className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {allTimeStats.totalSets} sets
              </p>
            </div>
          </div>
        )}

        {/* PROGRESSIEVE OVERLOAD SUGGESTIE (DUBBELE PROGRESSIE - PROMPT 15 & STAP 42) */}
        <div className="pt-1 space-y-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              Overload &amp; Dubbele Progressie
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAiAdvisorOpen(true)}
              leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
              className="h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              title="Vraag AI assistent om progressieve overload analyse"
            >
              AI Overload Assistent
            </Button>
          </div>

          {advisorSuccessMsg && (
            <Alert variant="success" className="text-xs">
              {advisorSuccessMsg}
            </Alert>
          )}

          {suggestion && (
            <ProgressiveOverloadCard suggestion={suggestion} />
          )}
        </div>

        {/* METRIC KEUZE & GRAFIEK/TABEL TOGGLE */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          {/* Metrics Tabs */}
          <div className="flex flex-wrap gap-1">
            {[
              { id: "gewicht", label: "Gewicht" },
              { id: "reps", label: "Reps" },
              { id: "volume", label: "Werksetvolume" },
              { id: "rpe", label: "Inspanning (RPE)" },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedMetric(m.id as ProgressionMetric)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedMetric === m.id
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Weergave toggle: Grafiek vs Tabel */}
          <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-100 dark:bg-slate-900 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("chart")}
              className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
                viewMode === "chart"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Grafiekweergave"
            >
              <ChartIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Grafiek</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-md flex items-center gap-1 font-medium transition-all ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
              title="Tabelweergave"
            >
              <TableIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Tabel</span>
            </button>
          </div>
        </div>

        {/* GRAFIEK OF TABEL WEERGAVE */}
        {isLoading ? (
          <div className="h-64 flex items-center justify-center text-xs text-slate-500">
            Progressiegegevens laden...
          </div>
        ) : displayPoints.length === 0 ? (
          <div className="h-56 flex flex-col items-center justify-center p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/20">
            <Dumbbell className="w-8 h-8 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Nog geen historische data
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
              Er zijn nog geen afgeronde trainingen gelogd met {exercise.name}. Na
              je eerste training verschijnen hier direct je progressiegrafieken.
            </p>
          </div>
        ) : viewMode === "chart" ? (
          /* SVG GRAFIEK COMPONENT (100% Hydration-safe, React 19 compatibel) */
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                {selectedMetric === "gewicht"
                  ? `Max Gewicht (${weightUnitLabel}) over tijd`
                  : selectedMetric === "reps"
                  ? "Max Herhalingen per sessie"
                  : selectedMetric === "volume"
                  ? `Werksetvolume (${weightUnitLabel}) over tijd`
                  : "Ervaren Inspanning (RPE 1-10)"}
              </span>
              <span>{displayPoints.length} datapunten</span>
            </div>

            {/* SVG CANVAS CONTAINER */}
            <div className="w-full overflow-x-auto">
              <SvgProgressionChart
                data={chartData}
                metric={selectedMetric}
                unitLabel={weightUnitLabel}
                hoveredIndex={hoveredPointIndex}
                onHoverIndex={setHoveredPointIndex}
              />
            </div>
          </div>
        ) : (
          /* TOEGANKELIJKE TABEL MET EXACTE WAARDEN */
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400">
                  <th className="py-2.5 px-3 font-semibold">Datum</th>
                  <th className="py-2.5 px-3 font-semibold">Sessie</th>
                  <th className="py-2.5 px-3 font-semibold">Sets</th>
                  <th className="py-2.5 px-3 font-semibold">
                    {exercise.measurementType === "assisted"
                      ? "Tegengewicht"
                      : `Max Gewicht (${weightUnitLabel})`}
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Max Reps</th>
                  <th className="py-2.5 px-3 font-semibold">
                    Volume ({weightUnitLabel})
                  </th>
                  <th className="py-2.5 px-3 font-semibold">Gem. RPE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {displayPoints.map((p) => (
                  <tr
                    key={p.sessionId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-white whitespace-nowrap">
                      {p.calendarDate}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                      {p.sessionTitle}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {p.completedSetsCount}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {p.maxWeightKg !== null
                        ? `${p.isAssisted ? "-" : ""}${p.maxWeightKg} ${weightUnitLabel}`
                        : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                      {p.maxReps}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">
                      {p.worksetVolumeKg > 0
                        ? `${p.worksetVolumeKg.toLocaleString("nl-NL")} ${weightUnitLabel}`
                        : "0 " + weightUnitLabel}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                      {p.averageRpe ? `RPE ${p.averageRpe}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DialogFooter className="mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Sluiten
        </Button>
      </DialogFooter>

      <AiOverloadAdvisorModal
        isOpen={isAiAdvisorOpen}
        onClose={() => setIsAiAdvisorOpen(false)}
        exercise={exercise}
        currentTargetWeightKg={suggestion?.suggestedWeightKg ?? null}
        targetRepsMin={suggestion?.suggestedRepsMin ?? 8}
        targetRepsMax={suggestion?.suggestedRepsMax ?? 12}
        targetSets={suggestion?.suggestedSets ?? 3}
        onAccept={(proposal) => {
          setAdvisorSuccessMsg(
            `AI Voorstel geaccepteerd: ${proposal.suggestedWeightKg} kg × ${proposal.targetReps} reps voor je volgende sessie.`
          );
          setTimeout(() => setAdvisorSuccessMsg(null), 5000);
        }}
      />
    </Dialog>
  );
}

// =============================================================================
// INTERACTIEVE SVG GRAFIEK MET LEESBARE EENPUNTSWEERGAVE EN TOOLTIPS
// =============================================================================
interface ChartItem {
  date: string;
  title: string;
  value: number | null;
  displayLabel: string;
  point: ExerciseHistoryPoint;
}

interface SvgProgressionChartProps {
  data: ChartItem[];
  metric: ProgressionMetric;
  unitLabel: string;
  hoveredIndex: number | null;
  onHoverIndex: (idx: number | null) => void;
}

function SvgProgressionChart({
  data,
  metric,
  unitLabel,
  hoveredIndex,
  onHoverIndex,
}: SvgProgressionChartProps) {
  // Filter alleen punten met een getalswaarde
  const validData = useMemo(() => {
    return data.map((d, index) => ({ ...d, originalIndex: index }));
  }, [data]);

  const numericValues = validData
    .map((d) => d.value)
    .filter((v): v is number => typeof v === "number" && !isNaN(v));

  // Als er geen numerieke datapunten zijn
  if (numericValues.length === 0) {
    return (
      <div className="h-52 flex items-center justify-center text-xs text-slate-500 italic">
        Geen meetwaarden beschikbaar voor de metriek &apos;{metric}&apos;.
      </div>
    );
  }

  const minVal = Math.min(...numericValues);
  const maxVal = Math.max(...numericValues);

  // SVG instellingen
  const svgWidth = 600;
  const svgHeight = 220;
  const paddingLeft = 45;
  const paddingRight = 35;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Schaalberekening
  const yRange = maxVal === minVal ? (maxVal === 0 ? 10 : maxVal * 0.4) : maxVal - minVal;
  const yMin = Math.max(0, minVal - yRange * 0.15);
  const yMax = maxVal + yRange * 0.15;

  const getY = (val: number) => {
    const norm = (val - yMin) / (yMax - yMin || 1);
    return paddingTop + chartHeight - norm * chartHeight;
  };

  // EENPUNTSGRAFIEK LEESBARE AFHANDELING
  const isSinglePoint = validData.length === 1;

  const pointsWithCoords = validData.map((d, i) => {
    const x = isSinglePoint
      ? paddingLeft + chartWidth / 2
      : paddingLeft + (i / (validData.length - 1)) * chartWidth;
    const y = d.value !== null ? getY(d.value) : paddingTop + chartHeight;
    return { ...d, x, y };
  });

  // Polyline puntenpad voor meer dan 1 punt
  const polylinePoints = pointsWithCoords
    .filter((p) => p.value !== null)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");

  const activePoint =
    hoveredIndex !== null ? pointsWithCoords[hoveredIndex] : pointsWithCoords[pointsWithCoords.length - 1];

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto select-none overflow-visible"
      >
        {/* Horizontale rasterlijnen */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + chartHeight * ratio;
          const valAtY = Math.round((yMax - ratio * (yMax - yMin)) * 10) / 10;
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
                {valAtY}
              </text>
            </g>
          );
        })}

        {/* Eénpuntsgrafiek hulplijn of Verbindingslijn bij meerdere punten */}
        {isSinglePoint ? (
          <line
            x1={paddingLeft}
            y1={pointsWithCoords[0].y}
            x2={svgWidth - paddingRight}
            y2={pointsWithCoords[0].y}
            stroke="#10B981"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-60"
          />
        ) : (
          <polyline
            fill="none"
            stroke="#10B981"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={polylinePoints}
          />
        )}

        {/* Datapunten & Klik/Hover zones */}
        {pointsWithCoords.map((p, idx) => {
          if (p.value === null) return null;
          const isSelected = activePoint?.originalIndex === p.originalIndex;

          return (
            <g
              key={idx}
              className="cursor-pointer"
              onMouseEnter={() => onHoverIndex(p.originalIndex)}
              onTouchStart={() => onHoverIndex(p.originalIndex)}
            >
              {/* Onzichtbare grotere hitzone voor touch interactie (>= 48px target) */}
              <circle cx={p.x} cy={p.y} r="20" fill="transparent" />

              {/* Buitenste highlight ring bij hover */}
              {isSelected && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="7"
                  fill="#10B981"
                  className="opacity-25 animate-pulse"
                />
              )}

              {/* Data punt stip */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected ? "5" : "3.5"}
                fill={isSelected ? "#10B981" : "#ffffff"}
                stroke="#10B981"
                strokeWidth={isSelected ? "2.5" : "2"}
                className="transition-all dark:fill-slate-900"
              />

              {/* Datum label op de X-as */}
              <text
                x={p.x}
                y={svgHeight - paddingBottom + 18}
                textAnchor="middle"
                className={`text-[9px] ${
                  isSelected
                    ? "fill-emerald-600 dark:fill-emerald-400 font-bold"
                    : "fill-slate-400 font-normal"
                }`}
              >
                {p.date.slice(5)}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ACTIEVE DATAPUNT TOOLTIP BANNER */}
      {activePoint && (
        <div className="mt-2 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-slate-900 dark:text-white">
              {activePoint.date}
            </span>
            <span className="text-slate-500 dark:text-slate-400">
              &bull; {activePoint.title}
            </span>
          </div>

          <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
            <span>{activePoint.displayLabel}</span>
            {activePoint.point.averageRpe && (
              <Badge variant="outline" className="text-[10px] py-0">
                RPE {activePoint.point.averageRpe}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
