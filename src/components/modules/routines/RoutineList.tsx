"use client";

import React, { useState, useEffect, useCallback } from "react";
import type { WorkoutRoutine, RoutineDay } from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { RoutineEditor } from "./RoutineEditor";
import { TemplateSelectorDialog } from "./TemplateSelectorDialog";
import {
  CalendarRange,
  Plus,
  Layers,
  Copy,
  Edit2,
  Archive,
  RotateCcw,
  CheckCircle2,
  Calendar,
  Sparkles,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

interface RoutineWithDays {
  routine: WorkoutRoutine;
  days: RoutineDay[];
}

export function RoutineList() {
  const { repositories, isDemoMode, dataVersion, refreshData } = useDatabase();

  const [routinesWithDays, setRoutinesWithDays] = useState<RoutineWithDays[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineWithDays | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);

  const fetchRoutines = useCallback(async () => {
    setIsLoading(true);
    try {
      const routines = await repositories.workout.getRoutines(showArchived);
      const fullList: RoutineWithDays[] = [];

      for (const r of routines) {
        const full = await repositories.workout.getRoutineWithDays(r.id);
        if (full) {
          fullList.push(full);
        }
      }

      setRoutinesWithDays(fullList);
    } catch (err) {
      console.error("Fout bij laden van schema's:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories, showArchived]);

  useEffect(() => {
    fetchRoutines();
  }, [fetchRoutines, dataVersion, isDemoMode]);

  const showNotification = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 3500);
  };

  // ---------------------------------------------------------------------------
  // ACTIES
  // ---------------------------------------------------------------------------
  const handleOpenNewRoutine = () => {
    setEditingRoutine(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditRoutine = (item: RoutineWithDays) => {
    setEditingRoutine(item);
    setIsEditorOpen(true);
  };

  const handleTemplateSelected = (templateData: {
    routine: WorkoutRoutine;
    days: RoutineDay[];
  }) => {
    // Open in editor als concept (niet automatisch opgeslagen)
    setEditingRoutine(templateData);
    setIsEditorOpen(true);
  };

  const handleDuplicate = async (routineId: string) => {
    try {
      const duplicated = await repositories.workout.duplicateRoutine(routineId);
      await refreshData();
      showNotification(`Schema "${duplicated.routine.name}" succesvol gedupliceerd.`);
    } catch (err: any) {
      showNotification(err.message || "Fout bij dupliceren.", "error");
    }
  };

  const handleSetActive = async (routineId: string) => {
    try {
      await repositories.workout.setActiveRoutine(routineId);
      await refreshData();
      showNotification("Schema gemarkeerd als je actieve trainingsprogramma.");
    } catch (err: any) {
      showNotification(err.message || "Fout bij instellen als actief.", "error");
    }
  };

  const handleArchive = async (routineId: string) => {
    try {
      await repositories.workout.archiveRoutine(routineId);
      await refreshData();
      showNotification("Schema veilig gearchiveerd.");
    } catch (err: any) {
      showNotification(err.message || "Fout bij archiveren.", "error");
    }
  };

  const handleUnarchive = async (routineId: string) => {
    try {
      await repositories.workout.unarchiveRoutine(routineId);
      await refreshData();
      showNotification("Schema hersteld uit het archief.");
    } catch (err: any) {
      showNotification(err.message || "Fout bij herstellen.", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Notificatie banner */}
      {feedbackMessage && (
        <div
          className={`p-3 rounded-xl border text-sm flex items-center justify-between transition-all ${
            feedbackMessage.type === "success"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300"
              : "bg-destructive/10 border-destructive/30 text-destructive"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 ml-2"
          >
            Sluiten
          </button>
        </div>
      )}

      {/* Header met actieknoppen */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <CalendarRange className="w-5 h-5 text-emerald-500" />
            Mijn Schema&apos;s
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bouw, beheer en activeer je persoonlijke trainingsprogramma&apos;s.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsTemplateDialogOpen(true)}
            className="min-h-[44px] text-xs font-medium"
          >
            <Sparkles className="w-4 h-4 mr-1.5 text-emerald-500" />
            Kies Sjabloon
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenNewRoutine}
            className="min-h-[44px] text-xs font-medium"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nieuw Schema
          </Button>
        </div>
      </div>

      {/* Filterbalk (Gearchiveerd tonen) */}
      <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
        <span>
          {routinesWithDays.length}{" "}
          {routinesWithDays.length === 1 ? "schema" : "schema's"}{" "}
          {showArchived ? "(inclusief archief)" : ""}
        </span>
        <label className="flex items-center gap-2 cursor-pointer hover:text-foreground">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
            className="rounded border-border text-emerald-500 focus:ring-emerald-500"
          />
          <span>Toon gearchiveerde schema&apos;s</span>
        </label>
      </div>

      {/* Inhoud: Lijst of Lege Toestand */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Schema&apos;s laden...
        </div>
      ) : routinesWithDays.length === 0 ? (
        <EmptyState
          icon={<CalendarRange className="w-8 h-8 text-emerald-500" />}
          title={
            showArchived
              ? "Geen gearchiveerde schema\u2019s gevonden"
              : "Nog geen trainingsschema\u2019s aangemaakt"
          }
          description={
            showArchived
              ? "Er zijn momenteel geen gearchiveerde schema\u2019s aanwezig."
              : "Stel je eigen trainingsdagen samen of start direct met een van onze bewezen basissjablonen (Full Body, Upper/Lower of Push/Pull/Legs)."
          }
          actionLabel="Kies een Sjabloon"
          onAction={() => setIsTemplateDialogOpen(true)}
          secondaryAction={
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenNewRoutine}
              className="min-h-[44px]"
            >
              Of maak een leeg schema
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {routinesWithDays.map(({ routine, days }) => {
            const isArchived = routine.isArchived;
            const isActive = routine.isActive;
            const totalExercises = days.reduce(
              (acc, d) => acc + (d.plannedExercises?.length || 0),
              0
            );

            return (
              <div
                key={routine.id}
                className={`p-5 rounded-2xl border transition-all ${
                  isActive
                    ? "border-emerald-500/80 bg-card shadow-md ring-1 ring-emerald-500/20"
                    : isArchived
                    ? "border-border/60 bg-muted/20 opacity-80"
                    : "border-border bg-card shadow-sm hover:border-border/80"
                }`}
              >
                {/* Bovenste rij: Titel, badges & versienummer */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-foreground text-lg">
                        {routine.name}
                      </h3>
                      <Badge variant="outline" className="text-xs">
                        v{routine.version}
                      </Badge>
                      {isActive && (
                        <Badge variant="success" className="text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Actief Programma
                        </Badge>
                      )}
                      {isArchived && (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Gearchiveerd
                        </Badge>
                      )}
                    </div>
                    {routine.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {routine.description}
                      </p>
                    )}
                  </div>

                  {/* Actieknoppen op de kaart */}
                  <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
                    {!isActive && !isArchived && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetActive(routine.id)}
                        className="min-h-[40px] text-xs hover:border-emerald-500 hover:text-emerald-500"
                        title="Stel in als je actieve weekschema"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        Activeren
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEditRoutine({ routine, days })}
                      className="min-h-[40px] text-xs"
                      title="Schema bewerken"
                    >
                      <Edit2 className="w-3.5 h-3.5 mr-1" />
                      Bewerken
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(routine.id)}
                      className="min-h-[40px] text-xs"
                      title="Dupliceer dit schema"
                    >
                      <Copy className="w-3.5 h-3.5 mr-1" />
                      Kopiëren
                    </Button>

                    {isArchived ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnarchive(routine.id)}
                        className="min-h-[40px] text-xs text-emerald-500 hover:bg-emerald-500/10"
                        title="Dearchiveer dit schema"
                      >
                        <RotateCcw className="w-3.5 h-3.5 mr-1" />
                        Herstellen
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleArchive(routine.id)}
                        className="min-h-[40px] text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Verplaats naar archief"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>

                {/* Overzicht van de trainingsdagen */}
                <div className="mt-4 pt-4 border-t border-border/60">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                    <span className="font-medium">
                      {days.length} {days.length === 1 ? "Trainingsdag" : "Trainingsdagen"} • {totalExercises} oefeningen totaal
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {days.map((day) => (
                      <div
                        key={day.id}
                        className="p-2.5 rounded-xl bg-muted/40 border border-border/40 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between font-semibold text-foreground">
                          <span className="truncate">{day.name}</span>
                          <span className="text-[11px] text-muted-foreground shrink-0 font-normal">
                            {day.plannedExercises?.length || 0} oef.
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {day.plannedExercises?.map((e) => e.exerciseName).join(" • ") ||
                            "Geen oefeningen"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Routine Editor Dialog */}
      <RoutineEditor
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingRoutine(null);
        }}
        initialData={editingRoutine}
        onSaved={fetchRoutines}
      />

      {/* Template Selector Dialog */}
      <TemplateSelectorDialog
        isOpen={isTemplateDialogOpen}
        onClose={() => setIsTemplateDialogOpen(false)}
        onSelectTemplate={handleTemplateSelected}
      />
    </div>
  );
}
