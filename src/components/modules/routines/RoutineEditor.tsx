"use client";

import React, { useState, useEffect } from "react";
import type {
  WorkoutRoutine,
  RoutineDay,
  PlannedExerciseInDay,
  Exercise,
  ExerciseMeasurementType,
} from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ExerciseSelectorDialog } from "./ExerciseSelectorDialog";
import {
  validateRoutineData,
  type RoutineValidationError,
} from "@/domain/strength/routineValidation";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Dumbbell,
  Timer,
  AlertCircle,
  Clock,
  Layers,
  Check,
} from "lucide-react";
import { MEASUREMENT_TYPE_LABELS } from "../exercises/ExerciseCard";

interface RoutineEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    routine: WorkoutRoutine;
    days: RoutineDay[];
  } | null;
  onSaved?: (savedRoutine: WorkoutRoutine) => void;
}

export function RoutineEditor({
  isOpen,
  onClose,
  initialData,
  onSaved,
}: RoutineEditorProps) {
  const { repositories, refreshData } = useDatabase();

  const [routineName, setRoutineName] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState<
    {
      id: string;
      routineId: string;
      dayIndex: number;
      name: string;
      plannedExercises: PlannedExerciseInDay[];
      createdAt: string;
    }[]
  >([]);
  const [activeDayIndex, setActiveDayIndex] = useState(0);

  // Selector dialog state
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [replacingTarget, setReplacingTarget] = useState<{
    dayIdx: number;
    exIdx: number;
  } | null>(null);

  const [errors, setErrors] = useState<RoutineValidationError[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Initialize or reset form when modal opens or initialData changes
  useEffect(() => {
    if (!isOpen) {
      setErrors([]);
      setSaveSuccess(false);
      return;
    }

    if (initialData) {
      setRoutineName(initialData.routine.name);
      setDescription(initialData.routine.description || "");
      setDays(
        initialData.days.map((d, idx) => ({
          ...d,
          dayIndex: idx + 1,
          plannedExercises: d.plannedExercises.map((pe) => ({ ...pe })),
        }))
      );
    } else {
      // Nieuw leeg schema met 1 standaard dag
      const newRoutineId = crypto.randomUUID();
      const now = new Date().toISOString();
      setRoutineName("");
      setDescription("");
      setDays([
        {
          id: crypto.randomUUID(),
          routineId: newRoutineId,
          dayIndex: 1,
          name: "Dag 1 - Training",
          plannedExercises: [],
          createdAt: now,
        },
      ]);
    }
    setActiveDayIndex(0);
    setErrors([]);
    setSaveSuccess(false);
  }, [isOpen, initialData]);

  // Actieve dag
  const currentDay = days[activeDayIndex] || days[0];

  // ---------------------------------------------------------------------------
  // DAGEN BEHEER
  // ---------------------------------------------------------------------------
  const handleAddDay = () => {
    const nextIdx = days.length + 1;
    const newDay = {
      id: crypto.randomUUID(),
      routineId: initialData?.routine.id || crypto.randomUUID(),
      dayIndex: nextIdx,
      name: `Dag ${nextIdx}`,
      plannedExercises: [],
      createdAt: new Date().toISOString(),
    };
    setDays((prev) => [...prev, newDay]);
    setActiveDayIndex(days.length);
  };

  const handleRemoveDay = (dayIdxToRemove: number) => {
    if (days.length <= 1) return; // Minimaal 1 dag vereist
    const updated = days.filter((_, idx) => idx !== dayIdxToRemove);
    // Herindexeer
    const reindexed = updated.map((d, i) => ({ ...d, dayIndex: i + 1 }));
    setDays(reindexed);
    setActiveDayIndex((prev) => Math.max(0, Math.min(prev, reindexed.length - 1)));
  };

  const handleDayNameChange = (dayIdx: number, newName: string) => {
    setDays((prev) =>
      prev.map((d, i) => (i === dayIdx ? { ...d, name: newName } : d))
    );
  };

  // ---------------------------------------------------------------------------
  // OEFENINGEN BEHEER (TOEVOEGEN, VERVANGEN, VERWIJDEREN, HERORDENEN)
  // ---------------------------------------------------------------------------
  const handleOpenAddExercise = () => {
    setReplacingTarget(null);
    setIsSelectorOpen(true);
  };

  const handleOpenReplaceExercise = (dayIdx: number, exIdx: number) => {
    setReplacingTarget({ dayIdx, exIdx });
    setIsSelectorOpen(true);
  };

  const handleExerciseSelected = (exercise: Exercise) => {
    if (replacingTarget !== null) {
      // Vervang bestaande oefening met behoud van geconfigureerde sets/reps/rust
      setDays((prev) =>
        prev.map((day, dIdx) => {
          if (dIdx !== replacingTarget.dayIdx) return day;
          const updatedExercises = [...day.plannedExercises];
          const existing = updatedExercises[replacingTarget.exIdx];

          const isDurationBased = exercise.measurementType === "tijd";
          updatedExercises[replacingTarget.exIdx] = {
            ...existing,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            measurementType: exercise.measurementType,
            targetDurationSeconds: isDurationBased
              ? existing.targetDurationSeconds || 45
              : undefined,
            targetRepsMin: !isDurationBased
              ? existing.targetRepsMin || 8
              : undefined,
            targetRepsMax: !isDurationBased
              ? existing.targetRepsMax || 10
              : undefined,
          };

          return { ...day, plannedExercises: updatedExercises };
        })
      );
      setReplacingTarget(null);
    } else {
      // Voeg nieuwe oefening toe aan actieve dag
      const isDurationBased = exercise.measurementType === "tijd";
      const newPlanned: PlannedExerciseInDay = {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        measurementType: exercise.measurementType,
        targetSets: 3,
        targetRepsMin: isDurationBased ? undefined : 8,
        targetRepsMax: isDurationBased ? undefined : 10,
        targetDurationSeconds: isDurationBased ? 45 : undefined,
        targetWeightKg: null,
        effortScale: "geen",
        restSeconds: 90,
      };

      setDays((prev) =>
        prev.map((day, dIdx) => {
          if (dIdx !== activeDayIndex) return day;
          return {
            ...day,
            plannedExercises: [...day.plannedExercises, newPlanned],
          };
        })
      );
    }
  };

  const handleRemoveExercise = (dayIdx: number, exIdx: number) => {
    setDays((prev) =>
      prev.map((day, dIdx) => {
        if (dIdx !== dayIdx) return day;
        return {
          ...day,
          plannedExercises: day.plannedExercises.filter((_, i) => i !== exIdx),
        };
      })
    );
  };

  const handleMoveExercise = (
    dayIdx: number,
    exIdx: number,
    direction: "up" | "down"
  ) => {
    setDays((prev) =>
      prev.map((day, dIdx) => {
        if (dIdx !== dayIdx) return day;
        const list = [...day.plannedExercises];
        const targetIdx = direction === "up" ? exIdx - 1 : exIdx + 1;
        if (targetIdx < 0 || targetIdx >= list.length) return day;
        // Wissel om
        const temp = list[exIdx];
        list[exIdx] = list[targetIdx];
        list[targetIdx] = temp;
        return { ...day, plannedExercises: list };
      })
    );
  };

  const handleUpdateExerciseField = <K extends keyof PlannedExerciseInDay>(
    dayIdx: number,
    exIdx: number,
    field: K,
    value: PlannedExerciseInDay[K]
  ) => {
    setDays((prev) =>
      prev.map((day, dIdx) => {
        if (dIdx !== dayIdx) return day;
        const list = [...day.plannedExercises];
        list[exIdx] = {
          ...list[exIdx],
          [field]: value,
        };
        return { ...day, plannedExercises: list };
      })
    );
  };

  // ---------------------------------------------------------------------------
  // OPSLAAN & VALIDATIE
  // ---------------------------------------------------------------------------
  const handleSave = async () => {
    // 1. Valideer met pure domeinlogica
    const validationErrors = validateRoutineData(routineName, days);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors([]);
    setIsSaving(true);

    try {
      const now = new Date().toISOString();
      const routineId = initialData?.routine.id || crypto.randomUUID();

      const routineToSave: WorkoutRoutine = {
        id: routineId,
        name: routineName.trim(),
        description: description.trim(),
        version: initialData?.routine.version || 1,
        isActive: initialData?.routine.isActive ?? false,
        isArchived: false,
        provenance: initialData?.routine.provenance || {
          source: "user",
          isDemo: false,
        },
        createdAt: initialData?.routine.createdAt || now,
        updatedAt: now,
      };

      const daysToSave: RoutineDay[] = days.map((d, idx) => ({
        id: d.id || crypto.randomUUID(),
        routineId,
        dayIndex: idx + 1,
        name: d.name.trim(),
        plannedExercises: d.plannedExercises,
        createdAt: d.createdAt || now,
      }));

      const result = await repositories.workout.saveRoutineWithDays(
        routineToSave,
        daysToSave
      );

      await refreshData();
      setSaveSuccess(true);

      setTimeout(() => {
        if (onSaved) onSaved(result.routine);
        onClose();
      }, 600);
    } catch (err: any) {
      console.error("Fout bij opslaan van schema:", err);
      setErrors([
        {
          message:
            err.message ||
            "Er is een onverwachte fout opgetreden bij het opslaan.",
        },
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <Dialog
        isOpen={isOpen}
        onClose={onClose}
        title={initialData ? "Schema Bewerken" : "Nieuw Schema Maken"}
        description="Stel je trainingsdagen en geplande oefeningen samen. Alle instellingen worden lokaal opgeslagen."
        maxWidth="xl"
      >
        <div className="space-y-6 max-h-[75vh] overflow-y-auto pr-1">
          {/* Foutmeldingen banner */}
          {errors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm space-y-1">
              <div className="flex items-center gap-2 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Controleer de volgende punten:</span>
              </div>
              <ul className="list-disc pl-6 text-xs space-y-0.5">
                {errors.map((e, idx) => (
                  <li key={idx}>{e.message}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Basisgegevens */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Naam van het schema *
              </label>
              <Input
                type="text"
                placeholder="bijv. Push / Pull / Legs of 4-Dagen Split"
                value={routineName}
                onChange={(e) => setRoutineName(e.target.value)}
                className="w-full text-base"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1">
                Toelichting of doel (optioneel)
              </label>
              <Input
                type="text"
                placeholder="bijv. Focus op kracht & hypertrofie"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-sm"
              />
            </div>
          </div>

          {/* Dagen Navigator Tabs */}
          <div className="pt-2 border-t border-border/60">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Trainingsdagen ({days.length})
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddDay}
                className="min-h-[40px] text-xs font-medium"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Dag Toevoegen
              </Button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
              {days.map((day, idx) => (
                <button
                  key={day.id || idx}
                  type="button"
                  onClick={() => setActiveDayIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all border min-h-[44px] flex items-center gap-2 ${
                    idx === activeDayIndex
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                      : "bg-muted/40 text-muted-foreground border-border hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  <span>{day.name || `Dag ${idx + 1}`}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      idx === activeDayIndex
                        ? "bg-emerald-600 text-white"
                        : "bg-border text-muted-foreground"
                    }`}
                  >
                    {day.plannedExercises.length}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Actieve Dag Inhoud */}
          {currentDay && (
            <div className="p-4 rounded-xl border border-border/80 bg-card/60 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                <div className="flex-1 max-w-sm">
                  <label className="text-[11px] font-medium text-muted-foreground block mb-1">
                    Naam van Dag {activeDayIndex + 1}
                  </label>
                  <Input
                    type="text"
                    value={currentDay.name}
                    onChange={(e) =>
                      handleDayNameChange(activeDayIndex, e.target.value)
                    }
                    className="h-10 text-sm font-semibold"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {days.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveDay(activeDayIndex)}
                      className="text-destructive hover:bg-destructive/10 text-xs min-h-[40px]"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Verwijder Dag
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOpenAddExercise}
                    className="min-h-[40px] text-xs"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Oefening Toevoegen
                  </Button>
                </div>
              </div>

              {/* Oefeningenlijst van de actieve dag */}
              {currentDay.plannedExercises.length === 0 ? (
                <div className="p-8 text-center rounded-lg border border-dashed border-border text-muted-foreground bg-muted/20">
                  <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-40 text-muted-foreground" />
                  <p className="text-sm font-medium text-foreground">
                    Nog geen oefeningen toegevoegd aan {currentDay.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                    Kies een oefening uit de bibliotheek met het gewenste meettype
                    (reps of tijd) om je trainingsdag samen te stellen.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleOpenAddExercise}
                    className="mt-4 min-h-[44px]"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Oefening Kiezen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentDay.plannedExercises.map((pe, exIdx) => {
                    const isTimeBased = pe.measurementType === "tijd";

                    return (
                      <div
                        key={pe.exerciseId + "-" + exIdx}
                        className="p-3.5 rounded-xl border border-border bg-card shadow-sm space-y-3"
                      >
                        {/* Titelbalk van de oefening met herordenen & acties */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground shrink-0">
                              {exIdx + 1}
                            </span>
                            <span className="font-semibold text-foreground text-sm">
                              {pe.exerciseName}
                            </span>
                            <Badge variant="outline" className="text-[10px]">
                              {MEASUREMENT_TYPE_LABELS[
                                pe.measurementType || "gewicht_herhalingen"
                              ]?.label}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-1">
                            {/* Herordenen ZONDER drag-and-drop: Omhoog en Omlaag knoppen */}
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={exIdx === 0}
                              onClick={() =>
                                handleMoveExercise(activeDayIndex, exIdx, "up")
                              }
                              title="Verplaats naar boven"
                              className="h-9 w-9 p-0"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={
                                exIdx === currentDay.plannedExercises.length - 1
                              }
                              onClick={() =>
                                handleMoveExercise(activeDayIndex, exIdx, "down")
                              }
                              title="Verplaats naar beneden"
                              className="h-9 w-9 p-0"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </Button>

                            {/* Vervangen knop: selecteert nieuwe oefening en behoudt instellingen */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleOpenReplaceExercise(activeDayIndex, exIdx)
                              }
                              title="Vervang deze oefening door een andere"
                              className="h-9 px-2 text-xs"
                            >
                              <RefreshCw className="w-3.5 h-3.5 mr-1" />
                              Vervangen
                            </Button>

                            {/* Verwijderen knop */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveExercise(activeDayIndex, exIdx)
                              }
                              title="Verwijder oefening uit deze dag"
                              className="h-9 w-9 p-0 text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Invoervelden per oefening */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5 pt-2 border-t border-border/40 text-xs">
                          {/* Sets */}
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              Aantal Sets
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={20}
                              value={pe.targetSets}
                              onChange={(e) =>
                                handleUpdateExerciseField(
                                  activeDayIndex,
                                  exIdx,
                                  "targetSets",
                                  parseInt(e.target.value) || 1
                                )
                              }
                              className="h-10 text-center font-medium"
                            />
                          </div>

                          {/* Reps bereik of Tijdsduur */}
                          {isTimeBased ? (
                            <div className="col-span-2">
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Duur (seconden)
                              </label>
                              <div className="relative">
                                <Input
                                  type="number"
                                  min={1}
                                  placeholder="bijv. 45"
                                  value={pe.targetDurationSeconds ?? ""}
                                  onChange={(e) =>
                                    handleUpdateExerciseField(
                                      activeDayIndex,
                                      exIdx,
                                      "targetDurationSeconds",
                                      parseInt(e.target.value) || undefined
                                    )
                                  }
                                  className="h-10 text-center font-medium pr-8"
                                />
                                <span className="absolute right-2.5 top-2.5 text-[11px] text-muted-foreground">
                                  sec
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="col-span-2">
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Repbereik (Min - Max)
                              </label>
                              <div className="flex items-center gap-1.5">
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  placeholder="Min"
                                  value={pe.targetRepsMin ?? ""}
                                  onChange={(e) =>
                                    handleUpdateExerciseField(
                                      activeDayIndex,
                                      exIdx,
                                      "targetRepsMin",
                                      parseInt(e.target.value) || undefined
                                    )
                                  }
                                  className="h-10 text-center font-medium"
                                />
                                <span className="text-muted-foreground">-</span>
                                <Input
                                  type="number"
                                  min={1}
                                  max={100}
                                  placeholder="Max"
                                  value={pe.targetRepsMax ?? ""}
                                  onChange={(e) =>
                                    handleUpdateExerciseField(
                                      activeDayIndex,
                                      exIdx,
                                      "targetRepsMax",
                                      parseInt(e.target.value) || undefined
                                    )
                                  }
                                  className="h-10 text-center font-medium"
                                />
                              </div>
                            </div>
                          )}

                          {/* Doelgewicht (optioneel) */}
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              Doelgewicht (kg)
                            </label>
                            <Input
                              type="number"
                              min={0}
                              step={0.5}
                              placeholder="Optioneel"
                              value={pe.targetWeightKg ?? ""}
                              onChange={(e) => {
                                const val =
                                  e.target.value === ""
                                    ? null
                                    : parseFloat(e.target.value);
                                handleUpdateExerciseField(
                                  activeDayIndex,
                                  exIdx,
                                  "targetWeightKg",
                                  val
                                );
                              }}
                              className="h-10 text-center font-medium"
                            />
                          </div>

                          {/* Rusttijd (sec) */}
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              Rusttijd
                            </label>
                            <select
                              value={pe.restSeconds || 90}
                              onChange={(e) =>
                                handleUpdateExerciseField(
                                  activeDayIndex,
                                  exIdx,
                                  "restSeconds",
                                  parseInt(e.target.value) || 90
                                )
                              }
                              className="w-full h-10 px-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value={30}>30 sec</option>
                              <option value={60}>60 sec</option>
                              <option value={90}>90 sec</option>
                              <option value={120}>2 min (120s)</option>
                              <option value={150}>2.5 min (150s)</option>
                              <option value={180}>3 min (180s)</option>
                              <option value={240}>4 min (240s)</option>
                              <option value={300}>5 min (300s)</option>
                            </select>
                          </div>
                        </div>

                        {/* Inspanningsschaal (RPE of RIR) - Optioneel en gebruiker kiest */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border/30 text-xs">
                          <div>
                            <label className="text-[11px] text-muted-foreground block mb-1">
                              Inspanningsschaal (Optioneel)
                            </label>
                            <select
                              value={pe.effortScale || "geen"}
                              onChange={(e) => {
                                const scale = e.target.value as "geen" | "rpe" | "rir";
                                handleUpdateExerciseField(
                                  activeDayIndex,
                                  exIdx,
                                  "effortScale",
                                  scale
                                );
                              }}
                              className="w-full h-10 px-2.5 rounded-lg border border-border bg-background text-xs text-foreground focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="geen">Geen / Vrij gevoel</option>
                              <option value="rpe">RPE (Inspanning 1 - 10)</option>
                              <option value="rir">RIR (Herhalingen in reserve 0 - 10)</option>
                            </select>
                          </div>

                          {pe.effortScale === "rpe" && (
                            <div>
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Doel RPE (1 - 10)
                              </label>
                              <Input
                                type="number"
                                min={1}
                                max={10}
                                step={0.5}
                                placeholder="bijv. 8 of 8.5"
                                value={pe.targetRpe ?? ""}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : parseFloat(e.target.value);
                                  handleUpdateExerciseField(
                                    activeDayIndex,
                                    exIdx,
                                    "targetRpe",
                                    val
                                  );
                                }}
                                className="h-10 text-center font-medium"
                              />
                            </div>
                          )}

                          {pe.effortScale === "rir" && (
                            <div>
                              <label className="text-[11px] text-muted-foreground block mb-1">
                                Doel RIR (0 - 10 reps in reserve)
                              </label>
                              <Input
                                type="number"
                                min={0}
                                max={10}
                                step={1}
                                placeholder="bijv. 1 of 2 reps in reserve"
                                value={pe.targetRir ?? ""}
                                onChange={(e) => {
                                  const val =
                                    e.target.value === ""
                                      ? null
                                      : parseInt(e.target.value);
                                  handleUpdateExerciseField(
                                    activeDayIndex,
                                    exIdx,
                                    "targetRir",
                                    val
                                  );
                                }}
                                className="h-10 text-center font-medium"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full gap-2">
            <Button
              variant="ghost"
              onClick={onClose}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px]"
            >
              Annuleren
            </Button>

            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSaving || saveSuccess}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 mr-1.5 text-white" />
                  Opgeslagen!
                </>
              ) : isSaving ? (
                "Opslaan..."
              ) : (
                "Schema Opslaan"
              )}
            </Button>
          </div>
        </DialogFooter>
      </Dialog>

      {/* Oefening Selectie Dialog */}
      <ExerciseSelectorDialog
        isOpen={isSelectorOpen}
        onClose={() => {
          setIsSelectorOpen(false);
          setReplacingTarget(null);
        }}
        onSelect={handleExerciseSelected}
        title={
          replacingTarget
            ? "Kies Vervangende Oefening"
            : `Voeg Oefening toe aan ${currentDay?.name || "deze dag"}`
        }
        description={
          replacingTarget
            ? "Selecteer een andere oefening. Je huidige instellingen voor sets, reps en rust blijven behouden."
            : "Selecteer een oefening uit de bibliotheek om op te nemen in deze trainingsdag."
        }
      />
    </>
  );
}
