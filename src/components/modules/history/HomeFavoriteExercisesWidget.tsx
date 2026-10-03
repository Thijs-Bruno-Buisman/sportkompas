"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TrendingUp,
  Star,
  Settings,
  Plus,
  Check,
  Dumbbell,
  Scale,
  Sparkles,
  ChevronRight,
  Info,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { useDatabase } from "@/lib/db";
import type { Exercise } from "@/types/database";
import type { ExerciseHistoryPoint } from "@/domain/strength/progression";
import { ExerciseProgressionModal } from "@/components/modules/exercises/ExerciseProgressionModal";

export function HomeFavoriteExercisesWidget() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Data voor geselecteerde favoriet
  const [progressionPoints, setProgressionPoints] = useState<ExerciseHistoryPoint[]>([]);
  const [metric, setMetric] = useState<"estimated1RM" | "maxWeight" | "totalVolume">("estimated1RM");
  const [isLoading, setIsLoading] = useState(true);

  // Beheer dialoog voor favorieten
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [tempFavoriteIds, setTempFavoriteIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Volledige detail modal
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // 1. Laad oefeningen en opgeslagen favorieten
  useEffect(() => {
    let isCancelled = false;

    async function loadFavorites() {
      setIsLoading(true);
      try {
        const [exercises, savedFavs] = await Promise.all([
          repositories.exercises.getAll(),
          repositories.settings.getFavoriteExerciseIds(),
        ]);

        if (isCancelled) return;
        setAllExercises(exercises);

        let activeFavs = savedFavs;
        // Als de gebruiker nog geen favorieten heeft ingesteld, kies standaard populaire compound oefeningen
        if (activeFavs.length === 0 && exercises.length > 0) {
          const defaultCompounds = exercises
            .filter((e) =>
              ["bankdrukken", "squat", "deadlift", "overhead press"].some((term) =>
                e.name.toLowerCase().includes(term)
              )
            )
            .map((e) => e.id)
            .slice(0, 3);

          if (defaultCompounds.length > 0) {
            activeFavs = defaultCompounds;
            // Sla deze initieel op
            repositories.settings.setFavoriteExerciseIds(defaultCompounds).catch(console.error);
          } else {
            activeFavs = [exercises[0].id];
          }
        }

        setFavoriteIds(activeFavs);
        setTempFavoriteIds(activeFavs);

        if (activeFavs.length > 0) {
          setSelectedExerciseId((prev) => (prev && activeFavs.includes(prev) ? prev : activeFavs[0]));
        }
      } catch (err) {
        console.error("Fout bij laden favorieten:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadFavorites();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion]);

  // 2. Laad progressie data voor geselecteerde oefening
  useEffect(() => {
    let isCancelled = false;

    async function loadProgression() {
      if (!selectedExerciseId) {
        setProgressionPoints([]);
        return;
      }

      try {
        const { points } = await repositories.workout.getExerciseProgression(selectedExerciseId);
        if (!isCancelled) {
          setProgressionPoints(points);
        }
      } catch (err) {
        console.error("Fout bij ophalen progressie:", err);
      }
    }

    loadProgression();
    return () => {
      isCancelled = true;
    };
  }, [selectedExerciseId, repositories, isDemoMode, dataVersion]);

  // Actieve oefening object
  const currentExercise = useMemo(() => {
    return allExercises.find((e) => e.id === selectedExerciseId) || null;
  }, [allExercises, selectedExerciseId]);

  // Favoriete oefeningen lijst
  const favoriteExercises = useMemo(() => {
    return favoriteIds
      .map((id) => allExercises.find((e) => e.id === id))
      .filter((e): e is Exercise => Boolean(e));
  }, [allExercises, favoriteIds]);

  // Filter oefeningen in favorieten beheer modal
  const filteredExercisesForDialog = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return allExercises;
    return allExercises.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.primaryMuscleGroup.toLowerCase().includes(q) ||
        (e.alternativeNames && e.alternativeNames.some((alt) => alt.toLowerCase().includes(q)))
    );
  }, [allExercises, searchQuery]);

  // Opslaan van gewijzigde favorieten
  const handleSaveFavorites = async () => {
    try {
      await repositories.settings.setFavoriteExerciseIds(tempFavoriteIds);
      setFavoriteIds(tempFavoriteIds);
      if (!tempFavoriteIds.includes(selectedExerciseId || "")) {
        setSelectedExerciseId(tempFavoriteIds[0] || null);
      }
      setIsManageDialogOpen(false);
    } catch (err) {
      console.error("Fout bij opslaan favorieten:", err);
    }
  };

  const toggleTempFavorite = (id: string) => {
    setTempFavoriteIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bereken grafiek data
  const chartData = useMemo(() => {
    return progressionPoints.map((pt) => {
      let val: number | null = null;
      if (metric === "estimated1RM") {
        val = pt.estimated1RM;
      } else if (metric === "maxWeight") {
        val = pt.maxWeightKg;
      } else if (metric === "totalVolume") {
        val = pt.worksetVolumeKg;
      }
      return {
        date: pt.calendarDate,
        value: val,
      };
    });
  }, [progressionPoints, metric]);

  const validNumericValues = chartData
    .map((d) => d.value)
    .filter((v): v is number => typeof v === "number" && !isNaN(v) && v > 0);

  const highestValue = validNumericValues.length > 0 ? Math.max(...validNumericValues) : null;
  const latestValue = validNumericValues.length > 0 ? validNumericValues[validNumericValues.length - 1] : null;
  const firstValue = validNumericValues.length > 0 ? validNumericValues[0] : null;

  const progressionPercent =
    firstValue && latestValue && firstValue > 0
      ? Math.round(((latestValue - firstValue) / firstValue) * 100)
      : null;

  return (
    <Card className="border-border">
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base font-bold text-foreground">
                Voortgang Favoriete Oefeningen
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Direct inzicht in je krachtontwikkeling en geschatte 1RM
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setTempFavoriteIds(favoriteIds);
                setSearchQuery("");
                setIsManageDialogOpen(true);
              }}
              leftIcon={<Settings className="w-3.5 h-3.5" />}
              className="text-xs h-8"
            >
              Favorieten ({favoriteIds.length})
            </Button>
          </div>
        </div>

        {/* Favorieten Tab Selector */}
        {favoriteExercises.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 scrollbar-thin">
            {favoriteExercises.map((ex) => {
              const isSelected = ex.id === selectedExerciseId;
              return (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setSelectedExerciseId(ex.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-muted/70 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Star className={`w-3 h-3 ${isSelected ? "fill-white" : "fill-transparent"}`} />
                  <span>{ex.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-muted-foreground animate-pulse">
            Favorieten laden...
          </div>
        ) : !currentExercise ? (
          <div className="py-6 text-center text-xs text-muted-foreground">
            Geen favoriete oefeningen geselecteerd. Klik op &quot;Favorieten&quot; om oefeningen toe te voegen.
          </div>
        ) : (
          <>
            {/* Oefening Header & Belangrijkste Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">
                    {currentExercise.name}
                  </h3>
                  <Badge variant="default" className="text-[10px] capitalize">
                    {currentExercise.primaryMuscleGroup}
                  </Badge>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{progressionPoints.length} geregistreerde sessies</span>
                  {progressionPercent !== null && (
                    <span
                      className={`font-semibold ${
                        progressionPercent >= 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-500"
                      }`}
                    >
                      {progressionPercent >= 0 ? `+${progressionPercent}%` : `${progressionPercent}%`} sinds start
                    </span>
                  )}
                </div>
              </div>

              {/* Metriek Switcher Knoppen */}
              <div className="flex items-center gap-1 p-1 bg-muted rounded-lg text-xs self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => setMetric("estimated1RM")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    metric === "estimated1RM"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Geschatte 1RM
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("maxWeight")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    metric === "maxWeight"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Max Gewicht
                </button>
                <button
                  type="button"
                  onClick={() => setMetric("totalVolume")}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    metric === "totalVolume"
                      ? "bg-card text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Volume
                </button>
              </div>
            </div>

            {/* Metriek Details & 1RM Waarschuwing */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground px-1">
              <div className="flex items-center gap-2">
                <span>
                  Hoogste {metric === "estimated1RM" ? "1RM" : metric === "maxWeight" ? "Gewicht" : "Volume"}:{" "}
                  <strong className="text-foreground">
                    {highestValue !== null
                      ? `${highestValue.toLocaleString("nl-NL")} ${metric === "totalVolume" ? "kg volume" : "kg"}`
                      : "-"}
                  </strong>
                </span>
                {metric === "estimated1RM" && (
                  <Badge variant="default" className="text-[10px] font-normal">
                    Geschat (Epley)
                  </Badge>
                )}
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailModalOpen(true)}
                className="text-xs h-7 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 p-0 flex items-center gap-1"
              >
                <span>Uitgebreide grafiek</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>

            {/* Compacte SVG Grafiek Weergave */}
            {validNumericValues.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                Nog geen afgeronde trainingsdata voor {currentExercise.name}.
              </div>
            ) : (
              <div className="p-3 bg-card border border-border/60 rounded-xl overflow-hidden">
                <MiniSvgChart
                  data={chartData}
                  unit={metric === "totalVolume" ? "kg vol" : "kg"}
                  isEstimated={metric === "estimated1RM"}
                />
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Favorieten Beheren Dialog */}
      <Dialog
        isOpen={isManageDialogOpen}
        onClose={() => setIsManageDialogOpen(false)}
        title="Favoriete Oefeningen Kiezen"
        description="Selecteer de oefeningen die je als favoriet wilt vastpinnen op je Home cockpit dashboard."
        maxWidth="md"
      >
        <div className="space-y-3 py-2">
          <input
            type="text"
            placeholder="Zoek oefening of spiergroep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-lg border border-border bg-background focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />

          <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1 divide-y divide-border/40">
            {filteredExercisesForDialog.map((ex) => {
              const isChecked = tempFavoriteIds.includes(ex.id);
              return (
                <div
                  key={ex.id}
                  onClick={() => toggleTempFavorite(ex.id)}
                  className={`flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors ${
                    isChecked
                      ? "bg-emerald-500/10 text-emerald-950 dark:text-emerald-200"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <div className="flex flex-col">
                    <span className="font-semibold">{ex.name}</span>
                    <span className="text-[10px] text-muted-foreground capitalize">
                      {ex.primaryMuscleGroup} &bull; {ex.category}
                    </span>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                      isChecked
                        ? "bg-emerald-500 border-emerald-500 text-white"
                        : "border-border bg-card"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsManageDialogOpen(false)}
          >
            Annuleren
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveFavorites}
          >
            Opslaan ({tempFavoriteIds.length})
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Volledige Voortgangsmodal */}
      {currentExercise && (
        <ExerciseProgressionModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          exercise={currentExercise}
        />
      )}
    </Card>
  );
}

// -----------------------------------------------------------------------------
// COMPACTE SVG MINI GRAFIEK VOOR HOME DASHBOARD
// -----------------------------------------------------------------------------
interface MiniSvgChartProps {
  data: { date: string; value: number | null }[];
  unit: string;
  isEstimated?: boolean;
}

function MiniSvgChart({ data, unit, isEstimated }: MiniSvgChartProps) {
  const validData = data.filter((d) => d.value !== null && !isNaN(d.value!));
  if (validData.length === 0) return null;

  const numericVals = validData.map((d) => d.value as number);
  const minVal = Math.min(...numericVals);
  const maxVal = Math.max(...numericVals);

  const svgWidth = 500;
  const svgHeight = 140;
  const padL = 40;
  const padR = 25;
  const padT = 20;
  const padB = 25;

  const chartW = svgWidth - padL - padR;
  const chartH = svgHeight - padT - padB;

  const yRange = maxVal === minVal ? (maxVal === 0 ? 10 : maxVal * 0.3) : maxVal - minVal;
  const yMin = Math.max(0, minVal - yRange * 0.15);
  const yMax = maxVal + yRange * 0.15;

  const getY = (v: number) => {
    const norm = (v - yMin) / (yMax - yMin || 1);
    return padT + chartH - norm * chartH;
  };

  const isSingle = validData.length === 1;
  const points = validData.map((d, i) => {
    const x = isSingle ? padL + chartW / 2 : padL + (i / (validData.length - 1)) * chartW;
    const y = getY(d.value as number);
    return { ...d, x, y };
  });

  const polylineStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto select-none overflow-visible"
      >
        {/* Rasterlijnen */}
        {[0, 0.5, 1].map((ratio) => {
          const y = padT + chartH * ratio;
          const val = Math.round((yMax - ratio * (yMax - yMin)) * 10) / 10;
          return (
            <g key={ratio}>
              <line
                x1={padL}
                y1={y}
                x2={svgWidth - padR}
                y2={y}
                stroke="currentColor"
                className="text-border/50"
                strokeDasharray="2 2"
              />
              <text
                x={padL - 6}
                y={y + 3}
                textAnchor="end"
                className="text-[9px] fill-muted-foreground font-mono"
              >
                {val}
              </text>
            </g>
          );
        })}

        {/* Lijnpad */}
        {!isSingle && (
          <polyline
            points={polylineStr}
            fill="none"
            stroke="currentColor"
            className="text-emerald-500"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Datapunten */}
        {points.map((p, idx) => {
          const isLast = idx === points.length - 1;
          return (
            <g key={idx}>
              <circle
                cx={p.x}
                cy={p.y}
                r={isLast ? 4.5 : 3}
                className={
                  isLast
                    ? "fill-emerald-500 stroke-background stroke-2"
                    : "fill-emerald-600/70"
                }
              />
              {/* Toon waarde op het laatste punt */}
              {isLast && (
                <text
                  x={p.x}
                  y={p.y - 8}
                  textAnchor="middle"
                  className="text-[10px] font-bold fill-foreground"
                >
                  {p.value} {unit}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
