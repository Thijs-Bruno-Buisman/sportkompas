"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import { CheckCircle2, Clock, Dumbbell, Award } from "lucide-react";

interface FinishWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  durationFormatted: string;
  totalSetsCompleted: number;
  totalSetsPlanned: number;
  onConfirmFinish: (overallRpe?: number, notes?: string) => Promise<void>;
}

export function FinishWorkoutDialog({
  isOpen,
  onClose,
  workoutName,
  durationFormatted,
  totalSetsCompleted,
  totalSetsPlanned,
  onConfirmFinish,
}: FinishWorkoutDialogProps) {
  const [selectedRpe, setSelectedRpe] = useState<number | undefined>(8);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleFinish = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      await onConfirmFinish(selectedRpe, notes);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij afronden van training.");
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Training Voltooien 🎉"
      description={`Gefeliciteerd met je training! Registreer je ervaren inspanning en notities voor "${workoutName}".`}
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        {errorMessage && (
          <Alert variant="error" title="Fout">
            {errorMessage}
          </Alert>
        )}

        {/* Samenvatting statistieken */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
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
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400">Sets Gelogd</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {totalSetsCompleted} / {totalSetsPlanned} voltooid
              </p>
            </div>
          </div>
        </div>

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

          {/* RPE Knoppenrij (1 t/m 10) */}
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
              const isSelected = selectedRpe === score;
              return (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelectedRpe(score)}
                  className={`h-11 rounded-lg text-sm font-bold transition-all ${
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
          className="w-full sm:w-auto min-h-[44px]"
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
