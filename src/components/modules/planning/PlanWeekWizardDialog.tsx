"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { WorkoutRoutine, RoutineDay } from "@/types/database";
import type { CalendarDayInfo } from "@/domain/dates/calendar";
import { Sparkles, Calendar, RotateCcw } from "lucide-react";

interface PlanWeekWizardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  weekDays: CalendarDayInfo[];
  activeRoutine: { routine: WorkoutRoutine; days: RoutineDay[] };
  onScheduleWeek: (
    assignments: { routineDayId: string; calendarDate: string }[]
  ) => Promise<void>;
}

export function PlanWeekWizardDialog({
  isOpen,
  onClose,
  weekDays,
  activeRoutine,
  onScheduleWeek,
}: PlanWeekWizardDialogProps) {
  // Map van dateStr -> routineDayId (of "" voor rustdag)
  const [dayPlan, setDayPlan] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiseer mapping wanneer wizard opent
  useEffect(() => {
    if (!isOpen) return;

    const initial: Record<string, string> = {};
    const routineDays = activeRoutine.days;

    // Automatische slimme vooringave op basis van aantal dagen in schema
    if (routineDays.length === 3) {
      // 3 dagen split: Maandag (index 0), Woensdag (index 2), Vrijdag (index 4)
      weekDays.forEach((wd, idx) => {
        if (idx === 0 && routineDays[0]) initial[wd.dateStr] = routineDays[0].id;
        else if (idx === 2 && routineDays[1]) initial[wd.dateStr] = routineDays[1].id;
        else if (idx === 4 && routineDays[2]) initial[wd.dateStr] = routineDays[2].id;
        else initial[wd.dateStr] = "";
      });
    } else if (routineDays.length === 4) {
      // 4 dagen split: Maandag, Dinsdag, Donderdag, Vrijdag
      weekDays.forEach((wd, idx) => {
        if (idx === 0 && routineDays[0]) initial[wd.dateStr] = routineDays[0].id;
        else if (idx === 1 && routineDays[1]) initial[wd.dateStr] = routineDays[1].id;
        else if (idx === 3 && routineDays[2]) initial[wd.dateStr] = routineDays[2].id;
        else if (idx === 4 && routineDays[3]) initial[wd.dateStr] = routineDays[3].id;
        else initial[wd.dateStr] = "";
      });
    } else {
      // Algemene verdeling: eerste N dagen
      weekDays.forEach((wd, idx) => {
        if (idx < routineDays.length) {
          initial[wd.dateStr] = routineDays[idx].id;
        } else {
          initial[wd.dateStr] = "";
        }
      });
    }

    setDayPlan(initial);
  }, [isOpen, weekDays, activeRoutine]);

  const handleDaySelect = (dateStr: string, routineDayId: string) => {
    setDayPlan((prev) => ({
      ...prev,
      [dateStr]: routineDayId,
    }));
  };

  const handleClearAll = () => {
    const cleared: Record<string, string> = {};
    weekDays.forEach((wd) => {
      cleared[wd.dateStr] = "";
    });
    setDayPlan(cleared);
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const assignments: { routineDayId: string; calendarDate: string }[] = [];
      Object.entries(dayPlan).forEach(([calendarDate, routineDayId]) => {
        if (routineDayId) {
          assignments.push({ calendarDate, routineDayId });
        }
      });

      await onScheduleWeek(assignments);
      onClose();
    } catch (err) {
      console.error("Fout bij plannen van week:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const assignedCount = Object.values(dayPlan).filter(Boolean).length;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Plan Deze Week"
      description={`Wijs de trainingsdagen van "${activeRoutine.routine.name}" toe aan de dagen van deze week.`}
      maxWidth="lg"
    >
      <div className="space-y-4 pt-1 max-h-[65vh] overflow-y-auto pr-1">
        {/* Schema Samenvatting */}
        <div className="flex items-center justify-between text-xs text-muted-foreground p-3 rounded-xl bg-muted/40 border border-border">
          <div>
            <span className="font-semibold text-foreground">
              {activeRoutine.routine.name}
            </span>{" "}
            &bull; {activeRoutine.days.length} trainingsdagen
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Wis Alles
          </Button>
        </div>

        {/* Dagen van de week rijen */}
        <div className="space-y-2">
          {weekDays.map((wd) => {
            const currentSelected = dayPlan[wd.dateStr] || "";

            return (
              <div
                key={wd.dateStr}
                className="p-3 rounded-xl border border-border bg-card flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 text-center shrink-0">
                    <span className="text-xs font-bold text-foreground block">
                      {wd.dayNameShort}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {wd.dayNumber}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">
                        {wd.dayNameFull}
                      </span>
                      {wd.isToday && (
                        <Badge variant="success" className="text-[10px] px-1.5 py-0">
                          Vandaag
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dropdown voor trainingsdag of rustdag */}
                <div className="w-full sm:w-64">
                  <select
                    value={currentSelected}
                    onChange={(e) => handleDaySelect(wd.dateStr, e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">🧘 Rustdag (Geen training)</option>
                    {activeRoutine.days.map((day) => (
                      <option key={day.id} value={day.id}>
                        🏋️ {day.name} ({day.plannedExercises.length} oefeningen)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <DialogFooter>
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-muted-foreground">
            {assignedCount} trainingsdagen ingepland
          </span>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
              Annuleren
            </Button>
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isSubmitting}
              className="min-h-[44px]"
            >
              {isSubmitting ? "Opslaan..." : "Week Inplannen"}
            </Button>
          </div>
        </div>
      </DialogFooter>
    </Dialog>
  );
}
