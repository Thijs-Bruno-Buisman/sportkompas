"use client";

import React from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Play, XCircle } from "lucide-react";
import type { WorkoutSession } from "@/types/database";

interface StartWorkoutConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: WorkoutSession | null;
  onResume: () => void;
  onDiscardAndStartNew: () => void;
}

export function StartWorkoutConflictDialog({
  isOpen,
  onClose,
  activeSession,
  onResume,
  onDiscardAndStartNew,
}: StartWorkoutConflictDialogProps) {
  if (!activeSession) return null;

  const sessionName =
    activeSession.snapshot.routineDayName ||
    activeSession.snapshot.routineName ||
    "Actieve Training";

  const startTimeFormatted = new Date(activeSession.startTime).toLocaleTimeString(
    "nl-NL",
    { hour: "2-digit", minute: "2-digit" }
  );

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Er is al een training actief"
      description="SportKompas ondersteunt één actieve krachttraining tegelijk om je voortgang en rusttijden zuiver te registreren."
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-bold text-base text-slate-900 dark:text-white">
              {sessionName}
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Gestart om <span className="font-semibold text-foreground">{startTimeFormatted}</span> op{" "}
            <span className="font-semibold text-foreground">{activeSession.calendarDate}</span>.
            Deze training staat momenteel gepauzeerd in de achtergrond.
          </p>
        </div>
      </div>

      <DialogFooter className="mt-4 flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={onDiscardAndStartNew}
          leftIcon={<XCircle className="w-4 h-4 text-red-500" />}
          className="w-full sm:w-auto min-h-[44px]"
        >
          Huidige wissen &amp; nieuwe starten
        </Button>
        <Button
          variant="primary"
          onClick={onResume}
          leftIcon={<Play className="w-4 h-4" />}
          className="w-full sm:w-auto min-h-[48px] px-6 font-semibold"
        >
          Huidige training hervatten
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
