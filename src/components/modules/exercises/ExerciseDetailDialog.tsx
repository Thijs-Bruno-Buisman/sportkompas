"use client";

import React, { useState } from "react";
import { type Exercise } from "@/types/database";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import {
  MEASUREMENT_TYPE_LABELS,
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "./ExerciseCard";
import {
  ExternalLink,
  Edit2,
  Archive,
  RotateCcw,
  Sparkles,
  Info,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";

interface ExerciseDetailDialogProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (exercise: Exercise) => void;
  onToggleArchive: (exercise: Exercise) => Promise<void>;
  onViewProgression?: (exercise: Exercise) => void;
}

export function ExerciseDetailDialog({
  exercise,
  isOpen,
  onClose,
  onEdit,
  onToggleArchive,
  onViewProgression,
}: ExerciseDetailDialogProps) {
  const [isArchiving, setIsArchiving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  if (!exercise) return null;

  const measurementMeta =
    MEASUREMENT_TYPE_LABELS[exercise.measurementType] ||
    MEASUREMENT_TYPE_LABELS.gewicht_herhalingen;

  const handleArchiveToggle = async () => {
    setIsArchiving(true);
    setErrorMessage("");
    try {
      await onToggleArchive(exercise);
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij wijzigen van archiefstatus.");
    } finally {
      setIsArchiving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={exercise.name}
      description={
        exercise.alternativeNames && exercise.alternativeNames.length > 0
          ? `Ook bekend als: ${exercise.alternativeNames.join(", ")}`
          : undefined
      }
    >
      <div className="space-y-5">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        {/* Archief notificatie banner */}
        {exercise.isArchived && (
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 flex items-start gap-2.5">
            <Archive className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-800 dark:text-amber-200">
              <span className="font-semibold">Deze oefening is gearchiveerd.</span>
              <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                Gearchiveerde oefeningen worden verborgen in selectielijsten van nieuwe
                trainingen, maar eerdere workouts en schema&apos;s blijven 100% intact.
              </p>
            </div>
          </div>
        )}

        {/* Badges overzicht */}
        <div className="flex flex-wrap gap-2 items-center">
          <Badge variant="outline" className="font-semibold text-xs py-1">
            Spiergroep: {MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] || exercise.primaryMuscleGroup}
          </Badge>

          <Badge variant="default" className="text-xs py-1">
            Materiaal: {EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}
          </Badge>

          <Badge variant="success" className="text-xs py-1 flex items-center gap-1">
            {measurementMeta.icon}
            <span>{measurementMeta.label}</span>
          </Badge>

          {exercise.isCustom ? (
            <Badge variant="warning" className="text-xs py-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Eigen oefening
            </Badge>
          ) : (
            <Badge variant="default" className="text-xs py-1 text-slate-500">
              Standaard bibliotheek
            </Badge>
          )}
        </div>

        {/* Secundaire spiergroepen */}
        {exercise.secondaryMuscleGroups && exercise.secondaryMuscleGroups.length > 0 && (
          <div className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400">Secundaire spieren:</span>
            <div className="flex flex-wrap gap-1">
              {exercise.secondaryMuscleGroups.map((group) => (
                <span
                  key={group}
                  className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium capitalize"
                >
                  {MUSCLE_GROUP_LABELS[group] || group}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Instructies / techniekbeschrijving */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5" />
            Uitvoering &amp; Techniek
          </h4>
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
            {exercise.instructions || "Geen specifieke techniekinstructies ingevoerd."}
          </div>
        </div>

        {/* Meettype toelichting */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Meetmethode &amp; Logging
          </h4>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
              {measurementMeta.icon}
              {measurementMeta.label}
            </div>
            <p>{measurementMeta.description}</p>
          </div>
        </div>

        {/* Instructievideo */}
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Instructievideo
          </h4>
          {exercise.videoUrl ? (
            <a
              href={exercise.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-between w-full p-3 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/30 transition-colors text-xs font-medium"
            >
              <span className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Bekijk geverifieerde techniekvideo (externe link)
              </span>
              <span className="text-[11px] text-slate-400 font-mono truncate max-w-[140px]">
                {exercise.videoUrl.replace(/^https?:\/\//, "")}
              </span>
            </a>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              Geen videolink geconfigureerd. {exercise.isCustom && "Je kunt deze toevoegen via 'Bewerken'."}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Bekijk Progressie knop */}
            {onViewProgression && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onViewProgression(exercise)}
                leftIcon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />}
                className="w-full sm:w-auto text-xs font-semibold text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
              >
                Bekijk Progressie
              </Button>
            )}

            {/* Archiveer / Dearchiveer knop */}
            <Button
              type="button"
              variant={exercise.isArchived ? "secondary" : "outline"}
              size="sm"
              isLoading={isArchiving}
              onClick={handleArchiveToggle}
              leftIcon={
                exercise.isArchived ? (
                  <RotateCcw className="w-3.5 h-3.5" />
                ) : (
                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                )
              }
              className="w-full sm:w-auto text-xs"
            >
              {exercise.isArchived ? "Herstellen / Dearchiveren" : "Archiveer Oefening"}
            </Button>

            {/* Bewerken knop (alleen voor eigen oefeningen) */}
            {exercise.isCustom && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEdit(exercise)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                className="w-full sm:w-auto text-xs"
              >
                Bewerken
              </Button>
            )}
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="w-full sm:w-auto text-xs ml-auto"
          >
            Sluiten
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}

