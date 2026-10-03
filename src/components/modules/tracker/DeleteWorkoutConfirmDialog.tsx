"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Trash2, Calendar } from "lucide-react";

export interface DeleteWorkoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void> | void;
  workoutTitle: string;
  calendarDate: string;
}

export function DeleteWorkoutConfirmDialog({
  isOpen,
  onClose,
  onConfirmDelete,
  workoutTitle,
  calendarDate,
}: DeleteWorkoutConfirmDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onConfirmDelete();
      onClose();
    } catch (err) {
      console.error("Fout bij verwijderen training:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Training Verwijderen"
      description="Weet je zeker dat je deze voltooide trainingssessie wilt verwijderen?"
    >
      <div className="space-y-4 py-2">
        <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Deze actie kan niet ongedaan worden gemaakt.</p>
            <p className="text-xs text-rose-700 dark:text-rose-300">
              Alle geregistreerde sets, behaalde PR&apos;s en trainingsvolumes van deze specifieke sessie worden definitief verwijderd uit je geschiedenis. Eventuele gekoppelde planningen worden ontkoppeld en blijven behouden.
            </p>
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 space-y-1.5">
          <div className="text-xs text-slate-500 dark:text-slate-400">Te verwijderen sessie:</div>
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Trash2 className="w-4 h-4 text-rose-500" />
            {workoutTitle}
          </div>
          {calendarDate && (
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Datum: {calendarDate}
            </div>
          )}
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isDeleting}
        >
          Annuleren
        </Button>
        <Button
          type="button"
          variant="danger"
          onClick={handleDelete}
          isLoading={isDeleting}
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Definitief Verwijderen
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

