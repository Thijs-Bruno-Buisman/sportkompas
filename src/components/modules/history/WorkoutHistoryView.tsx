"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  type WorkoutSession,
  type Exercise,
  type UnitPreference,
} from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Search,
  Filter,
  Calendar,
  Clock,
  Scale,
  Dumbbell,
  Play,
  Trash2,
  Eye,
  TrendingUp,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import {
  filterWorkoutSessions,
  type DateFilterType,
  type CustomDateRange,
} from "@/domain/strength/progression";
import { kgToLbs } from "@/domain/units";
import { calculateSetVolume } from "@/domain/strength/volumeAndPR";
import { CompletedWorkoutDetailModal } from "@/components/modules/tracker/CompletedWorkoutDetailModal";
import { DeleteWorkoutConfirmDialog } from "@/components/modules/tracker/DeleteWorkoutConfirmDialog";
import { ExerciseProgressionModal } from "@/components/modules/exercises/ExerciseProgressionModal";

interface WorkoutHistoryViewProps {
  onStartWorkout?: () => void;
  onResumeWorkout?: (session: WorkoutSession) => void;
}

const DATE_FILTER_OPTIONS = [
  { value: "all", label: "Alle periodes" },
  { value: "7d", label: "Laatste 7 dagen" },
  { value: "30d", label: "Laatste 30 dagen" },
  { value: "90d", label: "Laatste 90 dagen" },
  { value: "1y", label: "Dit jaar (12 mnd)" },
  { value: "custom", label: "Aangepast bereik" },
];

export function WorkoutHistoryView({
  onStartWorkout,
  onResumeWorkout,
}: WorkoutHistoryViewProps) {
  const { repositories, refreshData, isDemoMode, dataVersion } = useDatabase();

  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [allSetsBySession, setAllSetsBySession] = useState<
    Map<string, number>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [customRange, setCustomRange] = useState<CustomDateRange>({
    startDate: "",
    endDate: "",
  });
  const [unit, setUnit] = useState<UnitPreference>("metric");

  // Dialog states
  const [selectedDetailSession, setSelectedDetailSession] =
    useState<WorkoutSession | null>(null);
  const [sessionToDelete, setSessionToDelete] =
    useState<WorkoutSession | null>(null);
  const [progressionExercise, setProgressionExercise] =
    useState<Exercise | null>(null);
  const [isProgressionOpen, setIsProgressionOpen] = useState(false);

  // Laad geschiedenisdata
  const loadHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedSessions, fetchedExercises, profiles] = await Promise.all([
        repositories.workout.sessions.getAll(),
        repositories.exercises.getAll(),
        repositories.profile.getAll(),
      ]);

      if (profiles[0]?.unitPreference) {
        setUnit(profiles[0].unitPreference);
      }

      // Sorteer nieuwste eerst
      const sorted = fetchedSessions.sort(
        (a, b) =>
          new Date(b.calendarDate || b.startTime).getTime() -
          new Date(a.calendarDate || a.startTime).getTime()
      );

      // Bereken volume per sessie vooraf voor snelle filtering en presentatie
      const volumeMap = new Map<string, number>();
      for (const s of sorted) {
        const sets = await repositories.workout.getSetsForSession(s.id);
        const sessionVol = sets
          .filter((set) => set.completed)
          .reduce((sum, set) => sum + calculateSetVolume(set), 0);
        volumeMap.set(s.id, sessionVol);
      }

      setSessions(sorted);
      setExercises(fetchedExercises);
      setAllSetsBySession(volumeMap);
    } catch (err) {
      console.error("Fout bij ophalen trainingsgeschiedenis:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory, isDemoMode, dataVersion]);

  // Gefilterde sessies
  const filteredSessions = useMemo(() => {
    return filterWorkoutSessions(sessions, dateFilter, {
      customRange: dateFilter === "custom" ? customRange : undefined,
      searchQuery,
    });
  }, [sessions, dateFilter, customRange, searchQuery]);

  // Statistieken van de gefilterde set
  const stats = useMemo(() => {
    const count = filteredSessions.length;
    let totalMinutes = 0;
    let totalVolumeKg = 0;

    for (const s of filteredSessions) {
      if (s.durationMinutes) {
        totalMinutes += s.durationMinutes;
      }
      const vol = allSetsBySession.get(s.id) || 0;
      totalVolumeKg += vol;
    }

    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const durationLabel =
      hours > 0 ? `${hours}u ${mins > 0 ? `${mins}m` : ""}` : `${mins} min`;

    const volumeValue =
      unit === "imperial" ? kgToLbs(totalVolumeKg) : totalVolumeKg;
    const volumeUnit = unit === "imperial" ? "lbs" : "kg";

    return {
      count,
      totalVolume: Math.round(volumeValue).toLocaleString("nl-NL"),
      volumeUnit,
      durationLabel: totalMinutes > 0 ? durationLabel : "-",
    };
  }, [filteredSessions, allSetsBySession, unit]);

  const hasActiveFilters =
    dateFilter !== "all" ||
    Boolean(searchQuery) ||
    Boolean(customRange.startDate) ||
    Boolean(customRange.endDate);

  const handleResetFilters = () => {
    setDateFilter("all");
    setSearchQuery("");
    setCustomRange({ startDate: "", endDate: "" });
  };

  const handleOpenProgressionByName = (exerciseId: string) => {
    const found = exercises.find((e) => e.id === exerciseId);
    if (found) {
      setProgressionExercise(found);
      setIsProgressionOpen(true);
    }
  };

  const handleConfirmDeleteSession = async () => {
    if (!sessionToDelete) return;
    try {
      await repositories.workout.deleteCompletedSession(sessionToDelete.id);
      setSessionToDelete(null);
      setSelectedDetailSession(null);
      refreshData();
      await loadHistory();
    } catch (err) {
      console.error("Fout bij verwijderen training:", err);
    }
  };

  return (
    <div className="space-y-5">
      {/* Zoekbalk & Filter Header */}
      <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Tekstuele zoekopdracht */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek op sessienaam, oefening of notitie..."
              className="pl-9 h-10 text-sm"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                Wis
              </button>
            )}
          </div>

          {/* Datumfilter dropdown */}
          <div className="w-full sm:w-48">
            <Select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilterType)}
              className="h-10 text-sm"
            >
              {DATE_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Eenheid omschakelen (kg / lbs) */}
          <div className="flex items-center rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setUnit("metric")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                unit === "metric"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              kg
            </button>
            <button
              type="button"
              onClick={() => setUnit("imperial")}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                unit === "imperial"
                  ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
              }`}
            >
              lbs
            </button>
          </div>
        </div>

        {/* Aangepast datumbereik invoervelden */}
        {dateFilter === "custom" && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 font-medium">Van:</span>
            <Input
              type="date"
              value={customRange.startDate}
              onChange={(e) =>
                setCustomRange((prev) => ({
                  ...prev,
                  startDate: e.target.value,
                }))
              }
              className="w-36 h-8 text-xs py-1"
            />
            <span className="text-slate-500 font-medium">Tot:</span>
            <Input
              type="date"
              value={customRange.endDate}
              onChange={(e) =>
                setCustomRange((prev) => ({
                  ...prev,
                  endDate: e.target.value,
                }))
              }
              className="w-36 h-8 text-xs py-1"
            />
            {(customRange.startDate || customRange.endDate) && (
              <button
                type="button"
                onClick={() => setCustomRange({ startDate: "", endDate: "" })}
                className="text-xs text-rose-500 hover:underline font-medium"
              >
                Datum wissen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Filter Samenvatting Ribbon */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
            Sessies
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {stats.count}
          </div>
          <div className="text-[11px] text-slate-400">
            {hasActiveFilters ? "Gefilterd resultaat" : "Totaal gelogd"}
          </div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-emerald-500" />
            Volume
          </div>
          <div className="mt-1 text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats.totalVolume}{" "}
            <span className="text-xs font-normal text-slate-500">
              {stats.volumeUnit}
            </span>
          </div>
          <div className="text-[11px] text-slate-400">Totaal verplaatst</div>
        </div>

        <div className="p-3.5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            Tijdsduur
          </div>
          <div className="mt-1 text-xl font-bold text-slate-900 dark:text-white">
            {stats.durationLabel}
          </div>
          <div className="text-[11px] text-slate-400">Totale trainingstijd</div>
        </div>
      </div>

      {/* Sessielijst */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-slate-400">
          Trainingsgeschiedenis laden...
        </div>
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-3">
          {filteredSessions.map((sessionItem) => {
            const rawVolume = allSetsBySession.get(sessionItem.id) || 0;
            const displayVolume =
              unit === "imperial"
                ? `${Math.round(kgToLbs(rawVolume)).toLocaleString("nl-NL")} lbs`
                : `${Math.round(rawVolume).toLocaleString("nl-NL")} kg`;

            const workoutTitle =
              sessionItem.snapshot.routineDayName ||
              sessionItem.snapshot.routineName ||
              "Vrije Training";

            return (
              <Card
                key={sessionItem.id}
                className="p-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-base text-slate-900 dark:text-white">
                        {workoutTitle}
                      </h3>
                      <Badge
                        variant={
                          sessionItem.status === "actief"
                            ? "default"
                            : sessionItem.status === "afgerond"
                            ? "success"
                            : "outline"
                        }
                        className="text-xs"
                      >
                        {sessionItem.status === "actief"
                          ? "Actief"
                          : sessionItem.status === "afgerond"
                          ? "Voltooid"
                          : sessionItem.status}
                      </Badge>
                      <Badge variant="outline" className="text-[11px]">
                        {sessionItem.provenance?.source === "demo"
                          ? "Demodata"
                          : "Echt"}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {sessionItem.calendarDate}
                      </span>
                      {sessionItem.durationMinutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {sessionItem.durationMinutes} min
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                        <Scale className="w-3.5 h-3.5 text-emerald-500" />
                        {displayVolume}
                      </span>
                      {sessionItem.overallRpe && (
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          RPE: {sessionItem.overallRpe}
                        </span>
                      )}
                    </div>

                    {/* Oefeningen tags met directe link naar progressiegrafiek */}
                    {sessionItem.snapshot.exercises.length > 0 && (
                      <div className="pt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-slate-400 mr-0.5">
                          Oefeningen:
                        </span>
                        {sessionItem.snapshot.exercises.map((se) => (
                          <button
                            key={se.exerciseId}
                            type="button"
                            onClick={() =>
                              handleOpenProgressionByName(se.exerciseId)
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                            title="Bekijk progressiegrafiek voor deze oefening"
                          >
                            <TrendingUp className="w-3 h-3 text-emerald-500" />
                            {se.exerciseName}
                          </button>
                        ))}
                      </div>
                    )}

                    {sessionItem.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic line-clamp-1">
                        &quot;{sessionItem.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Actieknoppen */}
                  <div className="flex items-center gap-2 self-start md:self-center shrink-0">
                    {sessionItem.status === "actief" ? (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onResumeWorkout?.(sessionItem)}
                        leftIcon={<Play className="w-3.5 h-3.5 fill-current" />}
                        className="font-semibold"
                      >
                        Hervatten
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedDetailSession(sessionItem)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="text-xs font-semibold"
                        >
                          Bekijken &amp; Bewerken
                        </Button>
                        <button
                          type="button"
                          onClick={() => setSessionToDelete(sessionItem)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-colors flex items-center justify-center"
                          title="Training verwijderen"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState
          icon={<Filter className="w-6 h-6 text-slate-400" />}
          title={
            sessions.length === 0
              ? "Nog geen workouts gelogd"
              : "Geen trainingen gevonden"
          }
          description={
            sessions.length === 0
              ? "Je hebt nog geen voltooide of actieve trainingssessies gelogd. Start direct een vrije training of plan een schema."
              : "Er zijn geen sessies die voldoen aan je huidige filters of zoekopdracht."
          }
          actionLabel={
            hasActiveFilters
              ? "Wis Alle Filters"
              : onStartWorkout
              ? "Vrije Training Starten"
              : undefined
          }
          onAction={hasActiveFilters ? handleResetFilters : onStartWorkout}
          secondaryAction={
            hasActiveFilters && onStartWorkout ? (
              <Button variant="outline" onClick={onStartWorkout}>
                Training Starten
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Detail en Bewerken Modal voor voltooide workouts */}
      <CompletedWorkoutDetailModal
        isOpen={Boolean(selectedDetailSession)}
        onClose={() => setSelectedDetailSession(null)}
        session={selectedDetailSession}
        onSessionUpdated={() => {
          loadHistory();
          refreshData();
        }}
        onDeleteRequested={(s) => {
          setSelectedDetailSession(null);
          setSessionToDelete(s);
        }}
        onViewExerciseProgression={(exerciseId) => {
          handleOpenProgressionByName(exerciseId);
        }}
      />

      {/* Verwijderbevestiging dialoog */}
      <DeleteWorkoutConfirmDialog
        isOpen={Boolean(sessionToDelete)}
        onClose={() => setSessionToDelete(null)}
        onConfirmDelete={handleConfirmDeleteSession}
        workoutTitle={
          sessionToDelete?.snapshot.routineDayName ||
          sessionToDelete?.snapshot.routineName ||
          "Workout Sessie"
        }
        calendarDate={sessionToDelete?.calendarDate || ""}
      />

      {/* Oefenprogressie Modal */}
      <ExerciseProgressionModal
        isOpen={isProgressionOpen}
        onClose={() => {
          setIsProgressionOpen(false);
          setProgressionExercise(null);
        }}
        exercise={progressionExercise}
      />
    </div>
  );
}
