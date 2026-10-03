"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useDatabase } from "@/lib/db";
import {
  type MuscleGroup,
  type WeeklyMuscleVolumeReport,
  type MuscleGroupVolumeSummary,
  MUSCLE_GROUPS_LIST,
  MUSCLE_GROUP_LABELS,
} from "@/domain/strength/muscleVolume";
import { BodyVisualizationSVG } from "./BodyVisualizationSVG";
import {
  getLocalDateString,
  getWeekStartDate,
  addDaysToDateString,
  parseLocalDate,
  formatFriendlyDate,
} from "@/domain/dates/calendar";
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Info,
  Dumbbell,
  Weight,
  Sparkles,
  BarChart3,
  User,
  ShieldCheck,
} from "lucide-react";

export interface MuscleVolumeOverviewProps {
  className?: string;
  defaultWeekStart?: string; // YYYY-MM-DD
}

export function MuscleVolumeOverview({
  className = "",
  defaultWeekStart,
}: MuscleVolumeOverviewProps) {
  const { repositories, dataVersion } = useDatabase();

  const [currentWeekStart, setCurrentWeekStart] = useState<string>(() => {
    if (defaultWeekStart) return defaultWeekStart;
    return getWeekStartDate(new Date(), "maandag");
  });

  const [volumeReport, setVolumeReport] =
    useState<WeeklyMuscleVolumeReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"body" | "list">("body");
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup | null>("borst");

  // Laad weekvolume rapport
  const loadVolumeData = useCallback(async () => {
    setIsLoading(true);
    try {
      const report = await repositories.workout.getWeeklyMuscleVolume(
        currentWeekStart,
        "maandag"
      );
      setVolumeReport(report);
    } catch (err) {
      console.error("Fout bij laden van weekvolume:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, currentWeekStart]);

  useEffect(() => {
    loadVolumeData();
  }, [loadVolumeData, dataVersion]);

  // Navigatie tussen weken
  const handlePrevWeek = () => {
    setCurrentWeekStart((prev) => addDaysToDateString(prev, -7));
  };

  const handleNextWeek = () => {
    setCurrentWeekStart((prev) => addDaysToDateString(prev, 7));
  };

  const handleCurrentWeek = () => {
    setCurrentWeekStart(getWeekStartDate(new Date(), "maandag"));
  };

  // Format week header label (bv. "29 sep – 5 okt 2026")
  const weekLabel = useMemo(() => {
    if (!volumeReport) return "";
    const startObj = parseLocalDate(volumeReport.weekStartDate);
    const endObj = parseLocalDate(volumeReport.weekEndDate);
    const startStr = `${startObj.getDate()} ${startObj.toLocaleDateString("nl-NL", { month: "short" })}`;
    const endStr = `${endObj.getDate()} ${endObj.toLocaleDateString("nl-NL", { month: "short", year: "numeric" })}`;
    return `${startStr} – ${endStr}`;
  }, [volumeReport]);

  const isThisWeek = useMemo(() => {
    return currentWeekStart === getWeekStartDate(new Date(), "maandag");
  }, [currentWeekStart]);

  const selectedMuscleSummary: MuscleGroupVolumeSummary | null = useMemo(() => {
    if (!volumeReport || !selectedMuscle) return null;
    return volumeReport.muscleGroups[selectedMuscle] || null;
  }, [volumeReport, selectedMuscle]);

  // Top spiergroep met meeste volume
  const topMuscleGroup = useMemo(() => {
    if (!volumeReport || volumeReport.sortedByVolume.length === 0) return null;
    const top = volumeReport.sortedByVolume[0];
    return top.primarySets > 0 ? top : null;
  }, [volumeReport]);

  return (
    <Card className={`border-border ${className}`}>
      <CardHeader className="pb-3 border-b border-border">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Layers className="w-4 h-4" />
              </span>
              <CardTitle className="text-lg sm:text-xl">
                Spiergroepen &amp; Werksets
              </CardTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              Wekelijks werksetvolume per spiergroep met directe en indirecte telling.
            </p>
          </div>

          {/* WEERGAVE KEUZE & HUIDIGE WEEK KNOP */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-lg border border-border p-0.5 bg-muted text-xs font-medium">
              <button
                type="button"
                onClick={() => setViewMode("body")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  viewMode === "body"
                    ? "bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Lichaamskaart
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md transition-all ${
                  viewMode === "list"
                    ? "bg-card text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Lijstweergave
              </button>
            </div>

            {!isThisWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleCurrentWeek}
                className="h-8 text-xs font-semibold"
              >
                Deze week
              </Button>
            )}
          </div>
        </div>

        {/* WEEK NAVIGATOR BALK */}
        <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevWeek}
            className="h-8 px-2 text-xs font-medium"
            title="Vorige week"
          >
            <ChevronLeft className="w-4 h-4 mr-0.5" />
            Vorige week
          </Button>

          <div className="text-center">
            <span className="text-xs sm:text-sm font-bold text-foreground">
              {weekLabel}
            </span>
            {isThisWeek && (
              <Badge variant="success" className="ml-2 text-[10px] py-0 px-1.5">
                Huidige week
              </Badge>
            )}
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="h-8 px-2 text-xs font-medium"
            title="Volgende week"
          >
            Volgende week
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* STATS SAMENVATTINGSBALK */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Dumbbell className="w-3 h-3 text-emerald-500" />
              Totaal Werksets
            </span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {volumeReport?.totalCompletedWorksets ?? 0}{" "}
              <span className="text-xs font-normal text-muted-foreground">sets</span>
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Weight className="w-3 h-3 text-emerald-500" />
              Totaal Tonnage
            </span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              {volumeReport ? `${Math.round(volumeReport.totalTonnageKg)} kg` : "0 kg"}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border col-span-2 sm:col-span-1">
            <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Meest Getraind
            </span>
            <p className="text-lg font-bold text-foreground mt-0.5 truncate">
              {topMuscleGroup
                ? `${topMuscleGroup.label} (${topMuscleGroup.primarySets} sets)`
                : "Geen"}
            </p>
          </div>
        </div>

        {/* TELMETHODE INFORMATIE CALLOUT (AGENTS.MD TRANSPARANTIE) */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-border text-xs text-muted-foreground flex items-start gap-2.5">
          <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-foreground">Telmethode:</span>{" "}
            Primaire spiergroepen tellen als 1,0 set. Secundaire hulpspiergroepen tellen apart mee als 0,5 set (fractioneel) zodat belasting realistisch verdeeld blijft zonder dubbeltelling. Opwarmsets en incomplete sets tellen standaard niet mee.
          </div>
        </div>

        {/* HOOFDCONTENT: LICHAAMSKAART OF LIJST */}
        {isLoading ? (
          <div className="py-12 text-center text-sm text-muted-foreground animate-pulse">
            Spiergroepen volume berekenen...
          </div>
        ) : !volumeReport || volumeReport.totalCompletedWorksets === 0 ? (
          <div className="py-10 text-center space-y-2 border border-dashed rounded-xl p-6">
            <p className="text-sm font-semibold text-foreground">
              Geen voltooide werksets gelogd in deze week
            </p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Voltooi een training in deze kalenderweek om de actieve spiergroepen, sets en verdeling visueel op te lichten.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {viewMode === "body" ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                {/* SVG Visualisatie (linkerkolom) */}
                <div className="md:col-span-7 bg-slate-50/50 dark:bg-slate-900/30 p-4 rounded-2xl border border-border">
                  <BodyVisualizationSVG
                    muscleGroups={volumeReport.muscleGroups}
                    selectedMuscle={selectedMuscle}
                    onSelectMuscle={setSelectedMuscle}
                  />
                  <p className="text-[11px] text-center text-muted-foreground mt-2 italic">
                    Tik op een spiergroep om details en bijdragende oefeningen te bekijken.
                  </p>
                </div>

                {/* Geselecteerde Spiergroep Detail (rechterkolom) */}
                <div className="md:col-span-5 space-y-3">
                  {selectedMuscleSummary ? (
                    <Card className="p-4 border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/15">
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <h4 className="font-bold text-base text-foreground">
                            {selectedMuscleSummary.label}
                          </h4>
                        </div>
                        <Badge
                          variant={
                            selectedMuscleSummary.status === "optimaal"
                              ? "success"
                              : selectedMuscleSummary.status === "hoog"
                              ? "warning"
                              : "default"
                          }
                          className="text-[10px] capitalize font-semibold"
                        >
                          {selectedMuscleSummary.status === "geen"
                            ? "Rust"
                            : `${selectedMuscleSummary.status} volume`}
                        </Badge>
                      </div>

                      {/* Sets overzicht */}
                      <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                        <div className="p-2.5 rounded-lg bg-card border border-border">
                          <span className="text-muted-foreground text-[10px] block">
                            Directe Sets (1.0x)
                          </span>
                          <span className="text-base font-bold text-foreground">
                            {selectedMuscleSummary.primarySets}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg bg-card border border-border">
                          <span className="text-muted-foreground text-[10px] block">
                            Indirecte Sets (0.5x)
                          </span>
                          <span className="text-base font-bold text-foreground">
                            {selectedMuscleSummary.secondarySets}{" "}
                            <span className="text-[11px] font-normal text-muted-foreground">
                              (+{Math.round(selectedMuscleSummary.secondarySets * 0.5 * 10) / 10})
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground mb-3 flex items-center justify-between">
                        <span>Getild Tonnage:</span>
                        <span className="font-bold text-foreground">
                          {selectedMuscleSummary.totalTonnageKg} kg
                        </span>
                      </div>

                      {/* Lijst met bijdragende oefeningen */}
                      <div className="space-y-1.5 pt-2 border-t border-border">
                        <span className="text-[11px] font-bold text-foreground block">
                          Bijdragende Oefeningen:
                        </span>
                        {selectedMuscleSummary.contributingExercises.length === 0 ? (
                          <p className="text-xs text-muted-foreground italic">
                            Geen oefeningen geregistreerd voor deze spiergroep deze week.
                          </p>
                        ) : (
                          <div className="space-y-1 max-h-[160px] overflow-y-auto pr-1">
                            {selectedMuscleSummary.contributingExercises.map((ex) => (
                              <div
                                key={`${ex.exerciseId}_${ex.isPrimary}`}
                                className="flex items-center justify-between text-xs p-1.5 rounded-md bg-card border border-border"
                              >
                                <span className="font-medium text-foreground truncate max-w-[150px]">
                                  {ex.exerciseName}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Badge
                                    variant={ex.isPrimary ? "success" : "outline"}
                                    className="text-[10px] px-1 py-0"
                                  >
                                    {ex.isPrimary ? "Primair" : "Secundair"}
                                  </Badge>
                                  <span className="font-bold text-foreground text-xs">
                                    {ex.setsCount}x
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </Card>
                  ) : (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      Kies een spiergroep om details te bekijken.
                    </div>
                  )}

                  {/* Snelkiezer knoppen voor spiergroepen */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {MUSCLE_GROUPS_LIST.map((mg) => {
                      const sets = volumeReport.muscleGroups[mg]?.primarySets ?? 0;
                      const isSelected = selectedMuscle === mg;
                      return (
                        <button
                          key={mg}
                          type="button"
                          onClick={() => setSelectedMuscle(mg)}
                          className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                            isSelected
                              ? "bg-emerald-500 text-white border-emerald-500 font-semibold"
                              : "bg-card text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {MUSCLE_GROUP_LABELS[mg]} ({sets})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* LIJSTWEERGAVE MET PROGRESSIEBALKEN */
              <div className="space-y-3">
                {MUSCLE_GROUPS_LIST.map((mg) => {
                  const summary = volumeReport.muscleGroups[mg];
                  const directSets = summary.primarySets;
                  const indirectSets = summary.secondarySets;
                  // Indicatief richtvolume (max 20 sets voor visualisatie)
                  const percent = Math.min(100, Math.round((directSets / 20) * 100));

                  return (
                    <div
                      key={mg}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-border space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-foreground">
                            {summary.label}
                          </span>
                          <Badge
                            variant={
                              summary.status === "optimaal"
                                ? "success"
                                : summary.status === "hoog"
                                ? "warning"
                                : "default"
                            }
                            className="text-[10px]"
                          >
                            {directSets} directe sets
                          </Badge>
                          {indirectSets > 0 && (
                            <Badge variant="outline" className="text-[10px]">
                              +{indirectSets} indirect ({Math.round(indirectSets * 0.5 * 10) / 10})
                            </Badge>
                          )}
                        </div>

                        <span className="text-xs font-semibold text-muted-foreground">
                          {summary.totalTonnageKg > 0 ? `${summary.totalTonnageKg} kg` : "-"}
                        </span>
                      </div>

                      {/* Voortgangsbalk */}
                      <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            directSets >= 10 ? "bg-emerald-500" : "bg-emerald-400"
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      {/* Bijdragende oefeningen samenvatting */}
                      {summary.contributingExercises.length > 0 && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          Oefeningen:{" "}
                          {summary.contributingExercises
                            .map((e) => `${e.exerciseName} (${e.setsCount}x)`)
                            .join(", ")}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* VERPLICHTE DISCLAIMER (AGENTS.MD REGEL 7 & PROMPT 16) */}
        <div className="pt-2 border-t border-border/50 text-[11px] text-muted-foreground leading-relaxed flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>
            {volumeReport?.disclaimer ||
              "Dit volume-overzicht toont jouw gelogde werksets per spiergroep. Het is een hulpmiddel voor trainingsplanning en voorkomt op zichzelf geen overtraining of blessures."}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
