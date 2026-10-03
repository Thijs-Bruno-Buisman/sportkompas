"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import {
  CheckCircle2,
  Clock,
  Dumbbell,
  AlertCircle,
  TrendingUp,
  Layers,
  Trophy,
} from "lucide-react";
import type { WorkoutSet } from "@/types/database";
import { calculateSetVolume } from "@/domain/strength/volumeAndPR";
import type { AchievedPR } from "@/domain/strength/personalRecords";

export interface ExerciseFinishSummary {
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

interface FinishWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  durationFormatted: string;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  totalVolumeKg?: number;
  exerciseSummaries?: ExerciseFinishSummary[];
  achievedPRs?: AchievedPR[];
  onConfirmFinish: (
    overallRpe?: number,
    notes?: string,
    incompleteSetsAction?: "discard" | "mark_completed"
  ) => Promise<void>;
}

export function FinishWorkoutDialog({
  isOpen,
  onClose,
  workoutName,
  durationFormatted,
  totalSetsCompleted,
  totalSetsPlanned,
  totalVolumeKg = 0,
  exerciseSummaries = [],
  achievedPRs = [],
  onConfirmFinish,
}: FinishWorkoutDialogProps) {
  const [selectedRpe, setSelectedRpe] = useState<number | undefined>(8);
  const [notes, setNotes] = useState("");
  const [incompleteSetsAction, setIncompleteSetsAction] = useState<
    "discard" | "mark_completed"
  >("discard");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const incompleteSetsCount = Math.max(0, totalSetsPlanned - totalSetsCompleted);

  const handleFinish = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onConfirmFinish(selectedRpe, notes, incompleteSetsAction);
      onClose();
    } catch (err: any) {
      setErrorMessage(
        err.message || "Fout bij opslaan en afronden van de trainingssessie."
      );
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={isSubmitting ? () => {} : onClose}
      title="Training Voltooien 🎉"
      description={`Gefeliciteerd met je training! Registreer je ervaren inspanning en notities voor "${workoutName}".`}
      maxWidth="lg"
    >
      <div className="space-y-4 py-2 max-h-[75vh] overflow-y-auto pr-1">
        {errorMessage && (
          <Alert variant="error" title="Fout bij opslaan">
            {errorMessage}
          </Alert>
        )}

        {/* Samenvatting statistieken: Duur, Sets en Volume */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Trainingsduur</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {durationFormatted}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sets Voltooid</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {totalSetsCompleted} / {totalSetsPlanned} sets
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Totaal Volume</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {totalVolumeKg.toLocaleString("nl-NL")} kg
              </p>
            </div>
          </div>
        </div>

        {/* Behaalde Persoonlijke Records (PR's) in deze training */}
        {achievedPRs && achievedPRs.length > 0 && (
          <div className="p-3.5 bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
                <Trophy className="w-4 h-4 text-amber-500 shrink-0" />
                <span>
                  {achievedPRs.length} Persoonlijk{achievedPRs.length === 1 ? " Record" : "e Records"} Behaald!
                </span>
              </div>
              <Badge variant="warning" className="text-[10px] px-1.5 py-0 font-semibold">
                Gefeliciteerd! 🏆
              </Badge>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {achievedPRs.map((pr) => (
                <div
                  key={pr.id}
                  className="p-2 rounded-lg bg-card border border-amber-500/20 text-xs flex flex-col gap-0.5 shadow-xs"
                >
                  <div className="flex items-center justify-between font-semibold text-foreground">
                    <span className="truncate">{pr.exerciseName}</span>
                    <span className="text-[10px] text-muted-foreground">{pr.categoryLabel}</span>
                  </div>
                  <div className="font-extrabold text-amber-600 dark:text-amber-400 text-sm">
                    {pr.formattedValue}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Keuze voor niet-voltooide sets indien van toepassing */}
        {incompleteSetsCount > 0 && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Niet-voltooide sets ({incompleteSetsCount})</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Er zijn {incompleteSetsCount} geplande sets niet afgevinkt. Wat wil je met deze sets doen?
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIncompleteSetsAction("discard")}
                disabled={isSubmitting}
                className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                  incompleteSetsAction === "discard"
                    ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="font-bold block text-sm mb-1 text-slate-900 dark:text-white">
                  Weglaten (Aanbevolen)
                </span>
                Niet-uitgevoerde sets worden gewist. Alleen daadwerkelijk voltooide sets tellen mee.
              </button>
              <button
                type="button"
                onClick={() => setIncompleteSetsAction("mark_completed")}
                disabled={isSubmitting}
                className={`p-3 rounded-lg text-left text-xs font-medium border transition-all ${
                  incompleteSetsAction === "mark_completed"
                    ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-500"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <span className="font-bold block text-sm mb-1 text-slate-900 dark:text-white">
                  Markeren als voltooid
                </span>
                Markeer alle {incompleteSetsCount} sets als afgerond met de ingevulde waarden.
              </button>
            </div>
          </div>
        )}

        {/* Uitgevoerde oefeningen en sets overzicht */}
        {exerciseSummaries.length > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-500" />
              Uitgevoerde Oefeningen &amp; Sets
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {exerciseSummaries.map((summary) => {
                const completedSets = summary.sets.filter((s) => s.completed);
                const exVolume = summary.sets.reduce(
                  (sum, s) => sum + calculateSetVolume(s),
                  0
                );

                return (
                  <div
                    key={summary.exerciseId}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                  >
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-slate-900 dark:text-white text-sm">
                        {summary.exerciseName}
                      </span>
                      <div className="flex items-center gap-2">
                        {exVolume > 0 && (
                          <span className="text-slate-500 dark:text-slate-400">
                            {exVolume} kg
                          </span>
                        )}
                        <Badge
                          variant={
                            completedSets.length === summary.sets.length
                              ? "success"
                              : "outline"
                          }
                          className="text-[11px]"
                        >
                          {completedSets.length} / {summary.sets.length} sets
                        </Badge>
                      </div>
                    </div>

                    {/* Sets opsomming */}
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {summary.sets.map((s, idx) => (
                        <span
                          key={s.id || idx}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            s.completed
                              ? "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200"
                              : "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 line-through"
                          }`}
                        >
                          {s.isAssisted ? "-" : ""}
                          {s.weightKg}kg × {s.reps}
                          {s.actualRpe ? ` @${s.actualRpe}` : ""}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ervaren inspanning (RPE 1-10) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-900 dark:text-white">
              Ervaren inspanning (RPE)
            </label>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              {selectedRpe
                ? selectedRpe >= 9
                  ? "Zeer zwaar (bijna maximaal)"
                  : selectedRpe >= 7.5
                  ? "Zwaar (doelbereik)"
                  : selectedRpe >= 5
                  ? "Gemiddeld / Matig"
                  : "Licht herstel"
                : "Niet ingevuld"}
            </span>
          </div>

          {/* RPE Knoppenrij (1 t/m 10) met >= 48px touch targets */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const isSelected = selectedRpe === score;
              return (
                <button
                  key={score}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => setSelectedRpe(score)}
                  className={`h-12 rounded-lg text-sm font-bold transition-all ${
                    isSelected
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500 ring-offset-2 ring-offset-card"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {score}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notities */}
        <FormField label="Notities over de sessie (optioneel)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
            placeholder="Hoe voelde de training? Nieuwe PRs, energielevel, pijnpunten of aandachtspunten voor de volgende keer..."
            rows={3}
            className="text-sm"
          />
        </FormField>
      </div>

      <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isSubmitting}
          className="w-full sm:w-auto min-h-[48px]"
        >
          Verder trainen
        </Button>
        <Button
          variant="primary"
          onClick={handleFinish}
          disabled={isSubmitting}
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
          className="w-full sm:w-auto min-h-[48px] px-6 font-semibold"
        >
          {isSubmitting ? "Opslaan..." : "Training Opslaan & Afronden"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
