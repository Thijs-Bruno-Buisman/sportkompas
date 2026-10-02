"use client";

import React from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ROUTINE_TEMPLATES,
  instantiateTemplate,
  type RoutineTemplate,
} from "@/domain/strength/routineTemplates";
import type { WorkoutRoutine, RoutineDay } from "@/types/database";
import { Dumbbell, Calendar, ArrowRight, Layers } from "lucide-react";

interface TemplateSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (templateData: {
    routine: WorkoutRoutine;
    days: RoutineDay[];
  }) => void;
}

export function TemplateSelectorDialog({
  isOpen,
  onClose,
  onSelectTemplate,
}: TemplateSelectorDialogProps) {
  const handleSelect = (template: RoutineTemplate) => {
    const instantiated = instantiateTemplate(template.id);
    if (instantiated) {
      onSelectTemplate(instantiated);
      onClose();
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Kies een Voorbeeld Sjabloon"
      description="Kies een bewezen trainingsopzet als startpunt voor je eigen schema. Het sjabloon wordt als concept geopend in de editor, zodat je alles kunt aanpassen alvorens op te slaan."
      maxWidth="lg"
    >
      <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
        {ROUTINE_TEMPLATES.map((tpl) => (
          <div
            key={tpl.id}
            className="p-4 rounded-xl border border-border bg-card hover:border-emerald-500/50 transition-colors shadow-sm"
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-emerald-500" />
                  <h3 className="font-semibold text-foreground text-base">
                    {tpl.name}
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {tpl.description}
                </p>
              </div>
              <Badge variant="outline" className="text-xs shrink-0 self-start">
                <Calendar className="w-3 h-3 mr-1" />
                {tpl.splitDescription}
              </Badge>
            </div>

            {/* Overzicht van de dagen in het sjabloon */}
            <div className="mt-3 pt-3 border-t border-border/60">
              <span className="text-xs font-medium text-muted-foreground block mb-2">
                Inhoud van het schema ({tpl.days.length} trainingsdagen):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {tpl.days.map((day, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-muted/40 border border-border/40 text-xs"
                  >
                    <div className="font-medium text-foreground flex items-center justify-between">
                      <span>{day.name}</span>
                      <span className="text-muted-foreground text-[11px]">
                        {day.plannedExercises.length} oefeningen
                      </span>
                    </div>
                    <p className="text-muted-foreground truncate text-[11px] mt-1">
                      {day.plannedExercises.map((e) => e.exerciseName).join(" • ")}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleSelect(tpl)}
                className="w-full sm:w-auto min-h-[44px]"
              >
                Gebruik als Basis
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose} className="min-h-[44px]">
          Annuleren
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
