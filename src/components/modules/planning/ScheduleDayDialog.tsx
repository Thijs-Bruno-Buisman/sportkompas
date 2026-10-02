"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { WorkoutRoutine, RoutineDay } from "@/types/database";
import { formatFriendlyDate, parseLocalDate } from "@/domain/dates/calendar";
import { useDatabase } from "@/lib/db";
import { Dumbbell, Calendar, Check, Layers } from "lucide-react";

interface ScheduleDayDialogProps {
  isOpen: boolean;
  onClose: () => void;
  calendarDate: string;
  activeRoutine: { routine: WorkoutRoutine; days: RoutineDay[] } | null;
  onSchedule: (routineId: string, routineDayId: string, calendarDate: string) => Promise<void>;
  onRemoveExisting?: () => Promise<void>;
  isExistingScheduled?: boolean;
}

export function ScheduleDayDialog({
  isOpen,
  onClose,
  calendarDate,
  activeRoutine,
  onSchedule,
  onRemoveExisting,
  isExistingScheduled = false,
}: ScheduleDayDialogProps) {
  const { repositories } = useDatabase();
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [selectedDayId, setSelectedDayId] = useState<string>("");
  const [currentDays, setCurrentDays] = useState<RoutineDay[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Laad alle routines indien nodig
  useEffect(() => {
    if (!isOpen) return;

    async function loadRoutines() {
      try {
        const list = await repositories.workout.getRoutines(false);
        setRoutines(list);

        const initialRoutineId = activeRoutine?.routine.id || (list.length > 0 ? list[0].id : "");
        setSelectedRoutineId(initialRoutineId);

        if (activeRoutine && activeRoutine.routine.id === initialRoutineId) {
          setCurrentDays(activeRoutine.days);
          setSelectedDayId(activeRoutine.days.length > 0 ? activeRoutine.days[0].id : "");
        } else if (initialRoutineId) {
          const full = await repositories.workout.getRoutineWithDays(initialRoutineId);
          if (full) {
            setCurrentDays(full.days);
            setSelectedDayId(full.days.length > 0 ? full.days[0].id : "");
          }
        }
      } catch (err) {
        console.error("Fout bij laden van schema's in dialoog:", err);
      }
    }

    loadRoutines();
  }, [isOpen, activeRoutine, repositories]);

  // Wissel van routine
  const handleRoutineChange = async (routineId: string) => {
    setSelectedRoutineId(routineId);
    try {
      const full = await repositories.workout.getRoutineWithDays(routineId);
      if (full) {
        setCurrentDays(full.days);
        setSelectedDayId(full.days.length > 0 ? full.days[0].id : "");
      }
    } catch (err) {
      console.error("Fout bij ophalen van schemadagen:", err);
    }
  };

  const handleSave = async () => {
    if (!selectedRoutineId || !selectedDayId) return;
    setIsSubmitting(true);
    try {
      await onSchedule(selectedRoutineId, selectedDayId, calendarDate);
      onClose();
    } catch (err) {
      console.error("Fout bij inplannen:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMakeRestDay = async () => {
    if (!onRemoveExisting) return;
    setIsSubmitting(true);
    try {
      await onRemoveExisting();
      onClose();
    } catch (err) {
      console.error("Fout bij instellen rustdag:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  let formattedDateHeader = calendarDate;
  try {
    const d = parseLocalDate(calendarDate);
    formattedDateHeader = d.toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    formattedDateHeader =
      formattedDateHeader.charAt(0).toUpperCase() + formattedDateHeader.slice(1);
  } catch {}

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Training Inplannen"
      description={`Kies een trainingsdag voor ${formattedDateHeader}.`}
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1 max-h-[60vh] overflow-y-auto pr-1">
        {/* Schema kiezer */}
        {routines.length > 1 && (
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-1.5">
              Kies Schema
            </label>
            <select
              value={selectedRoutineId}
              onChange={(e) => handleRoutineChange(e.target.value)}
              className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm font-medium text-foreground focus:ring-2 focus:ring-emerald-500"
            >
              {routines.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} {r.isActive ? "(Actief Programma)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Schemadagen selectie */}
        <div>
          <label className="text-xs font-semibold text-foreground uppercase tracking-wider block mb-2">
            Selecteer Trainingsdag
          </label>

          {currentDays.length === 0 ? (
            <div className="p-4 rounded-xl border border-border text-center text-sm text-muted-foreground">
              Geen trainingsdagen gevonden in dit schema.
            </div>
          ) : (
            <div className="space-y-2">
              {currentDays.map((day) => {
                const isSelected = selectedDayId === day.id;

                return (
                  <button
                    key={day.id}
                    type="button"
                    onClick={() => setSelectedDayId(day.id)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-start justify-between gap-3 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500/10 shadow-xs"
                        : "border-border bg-card hover:border-border/80"
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <Dumbbell className={`w-4 h-4 ${isSelected ? "text-emerald-500" : "text-muted-foreground"}`} />
                        <span className="font-semibold text-sm text-foreground">
                          {day.name}
                        </span>
                        <Badge variant="outline" className="text-[10px]">
                          {day.plannedExercises.length} oefeningen
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 truncate max-w-sm">
                        {day.plannedExercises.map((e) => e.exerciseName).join(" • ")}
                      </p>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-border text-transparent"
                      }`}
                    >
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <DialogFooter>
        <div className="flex flex-col-reverse sm:flex-row items-center justify-between w-full gap-2">
          {isExistingScheduled && onRemoveExisting ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMakeRestDay}
              disabled={isSubmitting}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Maak Rustdag (Verwijder training)
            </Button>
          ) : (
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Annuleren
            </Button>
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isExistingScheduled && onRemoveExisting && (
              <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
                Annuleren
              </Button>
            )}
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting || !selectedDayId}
              className="w-full sm:w-auto min-h-[44px]"
            >
              {isSubmitting ? "Opslaan..." : "Inplannen"}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
