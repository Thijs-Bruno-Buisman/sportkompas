"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Play, Pause, Dumbbell } from "lucide-react";
import type { WorkoutSession } from "@/types/database";
import { ExitWorkoutDialog } from "./ExitWorkoutDialog";
import { useDatabase } from "@/lib/db";

interface ActiveWorkoutBannerProps {
  session: WorkoutSession;
  onResume: () => void;
  onRefresh?: () => void;
}

export function ActiveWorkoutBanner({
  session,
  onResume,
  onRefresh,
}: ActiveWorkoutBannerProps) {
  const { repositories, refreshData } = useDatabase();
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);

  const sessionName =
    session.snapshot.routineDayName ||
    session.snapshot.routineName ||
    "Actieve Training";

  const startTimeFormatted = new Date(session.startTime).toLocaleTimeString(
    "nl-NL",
    { hour: "2-digit", minute: "2-digit" }
  );

  const handleKeepDraft = () => {
    setIsExitDialogOpen(false);
  };

  const handleCancelSession = async () => {
    await repositories.workout.cancelOrDiscardActiveSession(
      session.id,
      "mark_cancelled"
    );
    refreshData();
    onRefresh?.();
  };

  const handleDiscardSession = async () => {
    await repositories.workout.cancelOrDiscardActiveSession(
      session.id,
      "discard_delete"
    );
    refreshData();
    onRefresh?.();
  };

  return (
    <>
      <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/40 bg-linear-to-r from-emerald-50/70 to-card dark:from-emerald-950/40 dark:to-card shadow-sm ring-1 ring-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Dumbbell className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Training in uitvoering
              </span>
            </div>
            <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              {sessionName}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Gestart om {startTimeFormatted} &bull;{" "}
              {session.snapshot.exercises.length} oefeningen in programma
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsExitDialogOpen(true)}
            leftIcon={<Pause className="w-4 h-4" />}
            className="flex-1 sm:flex-none min-h-[44px]"
          >
            Pauzeren / Sluiten
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onResume}
            leftIcon={<Play className="w-4 h-4" />}
            className="flex-1 sm:flex-none min-h-[48px] px-5 font-semibold shadow-md shadow-emerald-500/20"
          >
            Hervatten
          </Button>
        </div>
      </div>

      <ExitWorkoutDialog
        isOpen={isExitDialogOpen}
        onClose={() => setIsExitDialogOpen(false)}
        workoutName={sessionName}
        onKeepDraft={handleKeepDraft}
        onCancelSession={handleCancelSession}
        onDiscardSession={handleDiscardSession}
      />
    </>
  );
}

