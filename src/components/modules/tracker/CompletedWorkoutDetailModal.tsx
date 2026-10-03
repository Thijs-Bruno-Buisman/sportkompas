"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { type WorkoutSession, type WorkoutSet, type Exercise } from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import {
  Calendar,
  Clock,
  Dumbbell,
  Scale,
  Edit2,
  Trash2,
  Check,
  X,
  TrendingUp,
  AlertCircle,
  Save,
} from "lucide-react";
import { calculateSetVolume } from "@/domain/strength/volumeAndPR";

export interface CompletedWorkoutDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: WorkoutSession | null;
  onSessionUpdated?: () => void;
  onDeleteRequested?: (session: WorkoutSession) => void;
  onViewExerciseProgression?: (exerciseId: string, exerciseName: string) => void;
}

export function CompletedWorkoutDetailModal({
  isOpen,
  onClose,
  session,
  onSessionUpdated,
  onDeleteRequested,
  onViewExerciseProgression,
}: CompletedWorkoutDetailModalProps) {
  const { repositories } = useDatabase();

  const [sets, setSets] = useState<WorkoutSet[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit form states
  const [editCalendarDate, setEditCalendarDate] = useState("");
  const [editDurationMinutes, setEditDurationMinutes] = useState<number | "">("");
  const [editOverallRpe, setEditOverallRpe] = useState<number | "">("");
  const [editNotes, setEditNotes] = useState("");
  const [editableSets, setEditableSets] = useState<WorkoutSet[]>([]);

  // Laad sets en oefeningen voor deze sessie
  const loadData = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    setErrorMsg("");
    try {
      const [loadedSets, loadedExercises] = await Promise.all([
        repositories.workout.getSetsForSession(session.id),
        repositories.exercises.getAll(),
      ]);

      setSets(loadedSets);
      setExercises(loadedExercises);
      setEditableSets(JSON.parse(JSON.stringify(loadedSets)));

      setEditCalendarDate(session.calendarDate || "");
      setEditDurationMinutes(session.durationMinutes ?? "");
      setEditOverallRpe(session.overallRpe ?? "");
      setEditNotes(session.notes || "");
    } catch (err) {
      console.error("Fout bij laden van trainingsdetails:", err);
      setErrorMsg("Kan trainingsgegevens niet ophalen.");
    } finally {
      setIsLoading(false);
    }
  }, [session, repositories]);

  useEffect(() => {
    if (isOpen && session) {
      setIsEditing(false);
      loadData();
    }
  }, [isOpen, session, loadData]);

  // Bereken live volume
  const liveVolumeKg = useMemo(() => {
    const activeSets = isEditing ? editableSets : sets;
    return activeSets
      .filter((s) => s.completed)
      .reduce((acc, s) => {
        return acc + calculateSetVolume(s);
      }, 0);
  }, [isEditing, editableSets, sets]);

  // Groepeer sets per oefening
  const groupedSets = useMemo(() => {
    const activeSets = isEditing ? editableSets : sets;
    const map = new Map<string, { exerciseName: string; sets: WorkoutSet[] }>();

    for (const s of activeSets) {
      const ex = exercises.find((e) => e.id === s.exerciseId);
      const exName =
        ex?.name ||
        session?.snapshot.exercises.find((se) => se.exerciseId === s.exerciseId)
          ?.exerciseName ||
        "Oefening";

      if (!map.has(s.exerciseId)) {
        map.set(s.exerciseId, { exerciseName: exName, sets: [] });
      }
      map.get(s.exerciseId)!.sets.push(s);
    }

    return Array.from(map.entries()).map(([exerciseId, data]) => ({
      exerciseId,
      exerciseName: data.exerciseName,
      sets: data.sets.sort((a, b) => a.setNumber - b.setNumber),
    }));
  }, [isEditing, editableSets, sets, exercises, session]);

  if (!session) return null;

  const workoutTitle =
    session.snapshot.routineDayName ||
    session.snapshot.routineName ||
    "Workout Sessie";

  const handleSetChange = (
    setId: string,
    field: "weightKg" | "reps" | "actualRpe" | "completed",
    val: any
  ) => {
    setEditableSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, [field]: val } : s))
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    setErrorMsg("");
    try {
      // 1. Update sessie velden
      await repositories.workout.updateCompletedSession(session.id, {
        calendarDate: editCalendarDate.trim() || session.calendarDate,
        durationMinutes:
          editDurationMinutes === "" ? undefined : Number(editDurationMinutes),
        overallRpe: editOverallRpe === "" ? undefined : Number(editOverallRpe),
        notes: editNotes.trim() || undefined,
      });

      // 2. Update gewijzigde sets
      for (const editSet of editableSets) {
        const orig = sets.find((s) => s.id === editSet.id);
        if (
          !orig ||
          orig.weightKg !== editSet.weightKg ||
          orig.reps !== editSet.reps ||
          orig.actualRpe !== editSet.actualRpe ||
          orig.completed !== editSet.completed
        ) {
          await repositories.workout.updateWorkoutSet(editSet.id, {
            weightKg: Number(editSet.weightKg) || 0,
            reps: Number(editSet.reps) || 0,
            actualRpe:
              editSet.actualRpe !== null && editSet.actualRpe !== undefined
                ? Number(editSet.actualRpe)
                : null,
            completed: Boolean(editSet.completed),
          });
        }
      }

      setIsEditing(false);
      await loadData();
      onSessionUpdated?.();
    } catch (err: any) {
      console.error("Fout bij opslaan wijzigingen:", err);
      setErrorMsg(err.message || "Fout bij opslaan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={workoutTitle}
      description={
        isEditing
          ? "Pas de datum, duur, RPE, notities of geregistreerde sets aan."
          : `Voltooid op ${session.calendarDate} • Status: ${session.status}`
      }
      maxWidth="xl"
    >
      <div className="space-y-5 py-2">
        {errorMsg && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-700 dark:text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Statistieken Samenvatting Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" />
              Datum
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {isEditing ? (
                <Input
                  type="date"
                  value={editCalendarDate}
                  onChange={(e) => setEditCalendarDate(e.target.value)}
                  className="text-xs h-7 py-0 px-1 text-center"
                />
              ) : (
                session.calendarDate
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Duur
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {isEditing ? (
                <Input
                  type="number"
                  min="0"
                  max="1440"
                  value={editDurationMinutes}
                  onChange={(e) =>
                    setEditDurationMinutes(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="Min"
                  className="text-xs h-7 py-0 px-1 text-center"
                />
              ) : session.durationMinutes ? (
                `${session.durationMinutes} min`
              ) : (
                "-"
              )}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              <Scale className="w-3 h-3 text-slate-400" />
              Volume
            </div>
            <div className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
              {liveVolumeKg.toLocaleString("nl-NL")} kg
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-center">
            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-center gap-1">
              RPE Sessie
            </div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {isEditing ? (
                <Input
                  type="number"
                  step="0.5"
                  min="1"
                  max="10"
                  value={editOverallRpe}
                  onChange={(e) =>
                    setEditOverallRpe(
                      e.target.value === "" ? "" : Number(e.target.value)
                    )
                  }
                  placeholder="1-10"
                  className="text-xs h-7 py-0 px-1 text-center"
                />
              ) : session.overallRpe ? (
                `RPE ${session.overallRpe}`
              ) : (
                "-"
              )}
            </div>
          </div>
        </div>

        {/* Notities */}
        {(session.notes || isEditing) && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Notities sessie:
            </span>
            {isEditing ? (
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Bijv. lekkere pomp, schouder voelde goed..."
                className="text-xs mt-1"
              />
            ) : (
              <p className="text-xs text-slate-600 dark:text-slate-300 italic">
                {session.notes}
              </p>
            )}
          </div>
        )}

        {/* Oefeningen & Sets Lijst */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Geregistreerde Oefeningen ({groupedSets.length})
          </h4>

          {isLoading ? (
            <div className="py-6 text-center text-xs text-slate-400">
              Sets laden...
            </div>
          ) : groupedSets.length === 0 ? (
            <div className="py-4 text-center text-xs text-slate-500">
              Geen sets geregistreerd in deze sessie.
            </div>
          ) : (
            groupedSets.map(({ exerciseId, exerciseName, sets: exSets }) => (
              <div
                key={exerciseId}
                className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-white dark:bg-slate-900"
              >
                {/* Oefening Header */}
                <div className="p-3 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {exerciseName}
                    </span>
                  </div>

                  {onViewExerciseProgression && (
                    <button
                      type="button"
                      onClick={() =>
                        onViewExerciseProgression(exerciseId, exerciseName)
                      }
                      className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      Progressie
                    </button>
                  )}
                </div>

                {/* Sets Tabel */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/60 dark:bg-slate-800/40 text-slate-500 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2 px-3 font-semibold w-12 text-center">Set</th>
                        <th className="py-2 px-3 font-semibold">Gewicht</th>
                        <th className="py-2 px-3 font-semibold">Reps</th>
                        <th className="py-2 px-3 font-semibold">RPE</th>
                        <th className="py-2 px-3 font-semibold text-center w-16">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {exSets.map((s) => (
                        <tr
                          key={s.id}
                          className={
                            s.completed
                              ? "hover:bg-slate-50 dark:hover:bg-slate-800/30"
                              : "opacity-60 bg-slate-50/50 dark:bg-slate-900/50"
                          }
                        >
                          <td className="py-2 px-3 font-medium text-center text-slate-500">
                            {s.setNumber}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.5"
                                min="0"
                                value={s.weightKg}
                                onChange={(e) =>
                                  handleSetChange(
                                    s.id,
                                    "weightKg",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-20 text-xs h-7 py-0 px-1"
                              />
                            ) : (
                              <span className="font-semibold text-slate-800 dark:text-slate-200">
                                {s.weightKg} kg
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Input
                                type="number"
                                min="0"
                                value={s.reps}
                                onChange={(e) =>
                                  handleSetChange(
                                    s.id,
                                    "reps",
                                    Number(e.target.value)
                                  )
                                }
                                className="w-16 text-xs h-7 py-0 px-1"
                              />
                            ) : (
                              <span>{s.reps} herhalingen</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-slate-500">
                            {isEditing ? (
                              <Input
                                type="number"
                                step="0.5"
                                min="1"
                                max="10"
                                value={s.actualRpe ?? ""}
                                onChange={(e) =>
                                  handleSetChange(
                                    s.id,
                                    "actualRpe",
                                    e.target.value === ""
                                      ? null
                                      : Number(e.target.value)
                                  )
                                }
                                placeholder="-"
                                className="w-16 text-xs h-7 py-0 px-1"
                              />
                            ) : (
                              <span>
                                {s.actualRpe ? `@${s.actualRpe}` : "-"}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="checkbox"
                                checked={s.completed}
                                onChange={(e) =>
                                  handleSetChange(
                                    s.id,
                                    "completed",
                                    e.target.checked
                                  )
                                }
                                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                              />
                            ) : s.completed ? (
                              <Badge variant="success" className="text-[10px] px-1.5 py-0.5">
                                Voltooid
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                                Overgeslagen
                              </Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <DialogFooter className="flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto mr-auto">
          {onDeleteRequested && (
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={() => onDeleteRequested(session)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Verwijderen
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {isEditing ? (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditing(false);
                  setEditableSets(JSON.parse(JSON.stringify(sets)));
                }}
                disabled={isSaving}
                className="text-xs"
              >
                Annuleren
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="w-3.5 h-3.5" />}
                className="text-xs font-semibold"
              >
                Wijzigingen Opslaan
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                className="text-xs"
              >
                Bewerken
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={onClose}
                className="text-xs"
              >
                Sluiten
              </Button>
            </>
          )}
        </div>
      </DialogFooter>
    </Dialog>
  );
}
