"use client";

import React from "react";
import { type Exercise, type ExerciseMeasurementType } from "@/types/database";
import { Badge } from "@/components/ui/Badge";
import { Dumbbell, Clock, Weight, Sparkles, Archive, ChevronRight } from "lucide-react";

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export const MEASUREMENT_TYPE_LABELS: Record<
  ExerciseMeasurementType,
  { label: string; icon: React.ReactNode; description: string }
> = {
  gewicht_herhalingen: {
    label: "Gewicht & Reps",
    icon: <Weight className="w-3.5 h-3.5 text-emerald-500" />,
    description: "Klassiek loggen met gewicht (kg) en herhalingen per set.",
  },
  lichaamsgewicht: {
    label: "Lichaamsgewicht",
    icon: <Dumbbell className="w-3.5 h-3.5 text-blue-500" />,
    description: "Alleen herhalingen loggen met het eigen lichaamsgewicht.",
  },
  extra_gewicht: {
    label: "+ Extra Gewicht",
    icon: <Weight className="w-3.5 h-3.5 text-purple-500" />,
    description: "Lichaamsgewicht plus toegevoegd extra gewicht (bijv. dipgordel).",
  },
  assisted: {
    label: "Assisted Machine",
    icon: <Dumbbell className="w-3.5 h-3.5 text-amber-500" />,
    description: "Ondersteund met machine-tegengewicht (hoe meer gewicht, hoe lichter).",
  },
  tijd: {
    label: "Tijd / Duur",
    icon: <Clock className="w-3.5 h-3.5 text-cyan-500" />,
    description: "Loggen op basis van tijd in seconden (bijv. planks of wall-sits).",
  },
};

export const MUSCLE_GROUP_LABELS: Record<string, string> = {
  borst: "Borst",
  rug: "Rug",
  benen: "Benen",
  schouders: "Schouders",
  armen: "Armen",
  core: "Core / Buik",
  kuiten: "Kuiten",
  cardio: "Cardio",
  full_body: "Full Body",
};

export const EQUIPMENT_LABELS: Record<string, string> = {
  geen: "Geen materiaal",
  lichaamsgewicht: "Lichaamsgewicht",
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  kettlebell: "Kettlebell",
  kabel: "Kabelstation",
  machine: "Machine",
  elastiek: "Weerstandsband",
  overig: "Overig materiaal",
};

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const measurementMeta =
    MEASUREMENT_TYPE_LABELS[exercise.measurementType] ||
    MEASUREMENT_TYPE_LABELS.gewicht_herhalingen;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 flex flex-col justify-between gap-3 min-h-[110px] ${
        exercise.isArchived
          ? "bg-slate-50/60 dark:bg-slate-900/30 border-slate-200/70 dark:border-slate-800/70 opacity-75 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700"
          : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <h3 className="font-bold text-base text-slate-900 dark:text-white truncate">
              {exercise.name}
            </h3>
            {exercise.isCustom && (
              <Badge variant="success" className="text-[11px] py-0 px-2">
                <Sparkles className="w-3 h-3 mr-1 inline" />
                Eigen
              </Badge>
            )}
            {exercise.isArchived && (
              <Badge variant="warning" className="text-[11px] py-0 px-2">
                <Archive className="w-3 h-3 mr-1 inline" />
                Gearchiveerd
              </Badge>
            )}
          </div>

          {/* Alternatieve namen / Engelse zoektermen */}
          {exercise.alternativeNames && exercise.alternativeNames.length > 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate mb-1">
              {exercise.alternativeNames.join(" &bull; ")}
            </p>
          )}

          {/* Korte techniekomschrijving */}
          {exercise.instructions && (
            <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
              {exercise.instructions}
            </p>
          )}
        </div>

        <div className="shrink-0 pt-0.5 text-slate-400 group-hover:text-emerald-500 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>

      {/* Badges onderaan: Spiergroep, Materiaal, Meettype */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 w-full">
        <Badge variant="outline" className="text-xs font-semibold">
          {MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] || exercise.primaryMuscleGroup}
        </Badge>

        <Badge variant="default" className="text-xs">
          {EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}
        </Badge>

        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 ml-auto">
          {measurementMeta.icon}
          {measurementMeta.label}
        </span>
      </div>
    </button>
  );
}

