"use client";

import React from "react";
import type { MuscleGroup, MuscleGroupVolumeSummary } from "@/domain/strength/muscleVolume";

interface BodyVisualizationSVGProps {
  muscleGroups: Record<MuscleGroup, MuscleGroupVolumeSummary>;
  selectedMuscle: MuscleGroup | null;
  onSelectMuscle: (muscle: MuscleGroup) => void;
  className?: string;
}

export function BodyVisualizationSVG({
  muscleGroups,
  selectedMuscle,
  onSelectMuscle,
  className = "",
}: BodyVisualizationSVGProps) {
  // Bepaal de SVG vulkleur op basis van het volume (primaire sets)
  const getFillColor = (muscle: MuscleGroup) => {
    const data = muscleGroups[muscle];
    const sets = data?.primarySets ?? 0;
    const isSelected = selectedMuscle === muscle;

    if (isSelected) {
      return "fill-emerald-400 stroke-emerald-300 stroke-2";
    }

    if (sets === 0) {
      // Geen sets gelogd deze week: rustige neutrale tint
      return "fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700 hover:fill-slate-300 dark:hover:fill-slate-700";
    }
    if (sets < 10) {
      // 1-9 sets: zacht groen (onderhoud / matig volume)
      return "fill-emerald-400/50 stroke-emerald-500/70 hover:fill-emerald-400/70";
    }
    if (sets <= 20) {
      // 10-20 sets: optimaal volume
      return "fill-emerald-500 stroke-emerald-400 hover:fill-emerald-400";
    }
    // 20+ sets: hoog volume
    return "fill-emerald-600 stroke-emerald-500 hover:fill-emerald-500";
  };

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {/* LEGENDA VOLUMENIVEAUS */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
          <span>0 sets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-400/50 border border-emerald-500/70" />
          <span>1-9 sets</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-500 border border-emerald-400" />
          <span>10-20 sets (optimaal)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-xs bg-emerald-600 border border-emerald-500" />
          <span>20+ sets (hoog)</span>
        </div>
      </div>

      {/* SVG CONTAINER: VOORZIJDE EN ACHTERZIJDE NAAST ELKAAR */}
      <div className="grid grid-cols-2 gap-4 sm:gap-8 max-w-md w-full">
        {/* VOORZIJDE (FRONT VIEW) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground mb-1.5">
            Voorzijde
          </span>
          <svg
            viewBox="0 0 160 300"
            className="w-full h-auto max-h-[320px] transition-colors cursor-pointer drop-shadow-xs"
            role="img"
            aria-label="Lichaamskaart voorzijde"
          >
            {/* Hoofd / Nek (neutraal) */}
            <ellipse
              cx="80"
              cy="25"
              rx="14"
              ry="18"
              className="fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"
            />
            <path
              d="M74 42 L86 42 L88 50 L72 50 Z"
              className="fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"
            />

            {/* Schouders (Deltoids - Voorzijde) */}
            <g
              onClick={() => onSelectMuscle("schouders")}
              className={`transition-all ${getFillColor("schouders")}`}
            >
              <title>Schouders ({muscleGroups.schouders?.primarySets ?? 0} sets)</title>
              {/* Links voor kijker (Rechter schouder) */}
              <path d="M46 54 C40 58 38 68 44 78 C48 74 52 64 54 54 Z" />
              {/* Rechts voor kijker (Linker schouder) */}
              <path d="M114 54 C120 58 122 68 116 78 C112 74 108 64 106 54 Z" />
            </g>

            {/* Borst (Pectorals) */}
            <g
              onClick={() => onSelectMuscle("borst")}
              className={`transition-all ${getFillColor("borst")}`}
            >
              <title>Borst ({muscleGroups.borst?.primarySets ?? 0} sets)</title>
              {/* Linker borsthelft */}
              <path d="M54 54 C66 53 77 56 78 78 C65 80 50 76 48 68 C49 60 51 56 54 54 Z" />
              {/* Rechter borsthelft */}
              <path d="M106 54 C94 53 83 56 82 78 C95 80 110 76 112 68 C111 60 109 56 106 54 Z" />
            </g>

            {/* Armen (Biceps / Onderarmen - Voorzijde) */}
            <g
              onClick={() => onSelectMuscle("armen")}
              className={`transition-all ${getFillColor("armen")}`}
            >
              <title>Armen ({muscleGroups.armen?.primarySets ?? 0} sets)</title>
              {/* Linkerarm (voor kijker) */}
              <path d="M42 80 C36 88 34 104 38 114 C42 110 44 96 46 82 Z" />
              <path d="M37 118 C32 130 28 144 32 154 C36 150 40 138 41 122 Z" />
              {/* Rechterarm (voor kijker) */}
              <path d="M118 80 C124 88 126 104 122 114 C118 110 116 96 114 82 Z" />
              <path d="M123 118 C128 130 132 144 128 154 C124 150 120 138 119 122 Z" />
            </g>

            {/* Core / Buikspieren (Abs & Obliques) */}
            <g
              onClick={() => onSelectMuscle("core")}
              className={`transition-all ${getFillColor("core")}`}
            >
              <title>Core / Buik ({muscleGroups.core?.primarySets ?? 0} sets)</title>
              <path d="M54 84 C64 82 96 82 106 84 C104 105 102 120 104 134 C94 138 66 138 56 134 C58 120 56 105 54 84 Z" />
            </g>

            {/* Benen (Quadriceps - Bovenbenen Voorzijde) */}
            <g
              onClick={() => onSelectMuscle("benen")}
              className={`transition-all ${getFillColor("benen")}`}
            >
              <title>Benen / Quadriceps ({muscleGroups.benen?.primarySets ?? 0} sets)</title>
              {/* Linkerbovenbeen (voor kijker) */}
              <path d="M52 142 C50 165 48 190 52 214 C62 216 72 210 74 190 C76 168 76 152 74 142 Z" />
              {/* Rechterbovenbeen (voor kijker) */}
              <path d="M108 142 C110 165 112 190 108 214 C98 216 88 210 86 190 C84 168 84 152 86 142 Z" />
            </g>

            {/* Kuiten (Voorzijde scheen/kuit) */}
            <g
              onClick={() => onSelectMuscle("kuiten")}
              className={`transition-all ${getFillColor("kuiten")}`}
            >
              <title>Kuiten ({muscleGroups.kuiten?.primarySets ?? 0} sets)</title>
              {/* Linkerkuit */}
              <path d="M52 224 C50 242 54 266 58 280 C64 280 68 266 68 244 C68 232 66 224 64 220 Z" />
              {/* Rechterkuit */}
              <path d="M108 224 C110 242 106 266 102 280 C96 280 92 266 92 244 C92 232 94 224 96 220 Z" />
            </g>
          </svg>
        </div>

        {/* ACHTERZIJDE (BACK VIEW) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-semibold text-muted-foreground mb-1.5">
            Achterzijde
          </span>
          <svg
            viewBox="0 0 160 300"
            className="w-full h-auto max-h-[320px] transition-colors cursor-pointer drop-shadow-xs"
            role="img"
            aria-label="Lichaamskaart achterzijde"
          >
            {/* Hoofd / Achterhoofd */}
            <ellipse
              cx="80"
              cy="25"
              rx="14"
              ry="18"
              className="fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"
            />
            <path
              d="M74 42 L86 42 L88 50 L72 50 Z"
              className="fill-slate-200 dark:fill-slate-800 stroke-slate-300 dark:stroke-slate-700"
            />

            {/* Rug (Bovenrug / Trapezius / Lats / Onderrug) */}
            <g
              onClick={() => onSelectMuscle("rug")}
              className={`transition-all ${getFillColor("rug")}`}
            >
              <title>Rug ({muscleGroups.rug?.primarySets ?? 0} sets)</title>
              {/* Bovenrug & Trapezius */}
              <path d="M68 48 C76 54 84 54 92 48 L104 60 C92 68 68 68 56 60 Z" />
              {/* Lats & Middenrug */}
              <path d="M54 62 C68 68 92 68 106 62 C104 88 96 112 88 126 C84 128 76 128 72 126 C64 112 56 88 54 62 Z" />
              {/* Onderrug */}
              <path d="M68 126 C76 128 84 128 92 126 L94 136 C86 138 74 138 66 136 Z" />
            </g>

            {/* Achterste Schouders (Rear Deltoids) */}
            <g
              onClick={() => onSelectMuscle("schouders")}
              className={`transition-all ${getFillColor("schouders")}`}
            >
              <title>Schouders ({muscleGroups.schouders?.primarySets ?? 0} sets)</title>
              <path d="M46 54 C40 58 38 68 44 78 C48 74 52 64 54 54 Z" />
              <path d="M114 54 C120 58 122 68 116 78 C112 74 108 64 106 54 Z" />
            </g>

            {/* Triceps / Achterkant armen */}
            <g
              onClick={() => onSelectMuscle("armen")}
              className={`transition-all ${getFillColor("armen")}`}
            >
              <title>Armen / Triceps ({muscleGroups.armen?.primarySets ?? 0} sets)</title>
              <path d="M42 80 C36 88 34 104 38 114 C42 110 44 96 46 82 Z" />
              <path d="M37 118 C32 130 28 144 32 154 C36 150 40 138 41 122 Z" />
              <path d="M118 80 C124 88 126 104 122 114 C118 110 116 96 114 82 Z" />
              <path d="M123 118 C128 130 132 144 128 154 C124 150 120 138 119 122 Z" />
            </g>

            {/* Glutes & Hamstrings (Achterkant Benen) */}
            <g
              onClick={() => onSelectMuscle("benen")}
              className={`transition-all ${getFillColor("benen")}`}
            >
              <title>Benen / Hamstrings & Glutes ({muscleGroups.benen?.primarySets ?? 0} sets)</title>
              {/* Glutes */}
              <path d="M56 138 C66 136 78 140 78 158 C68 162 54 158 52 144 Z" />
              <path d="M104 138 C94 136 82 140 82 158 C92 162 106 158 108 144 Z" />
              {/* Hamstrings */}
              <path d="M52 162 C50 185 48 205 52 216 C62 218 72 212 74 192 C76 172 76 164 76 162 Z" />
              <path d="M108 162 C110 185 112 205 108 216 C98 218 88 212 86 192 C84 172 84 164 84 162 Z" />
            </g>

            {/* Kuiten (Gastrocnemius / Achterzijde) */}
            <g
              onClick={() => onSelectMuscle("kuiten")}
              className={`transition-all ${getFillColor("kuiten")}`}
            >
              <title>Kuiten ({muscleGroups.kuiten?.primarySets ?? 0} sets)</title>
              {/* Linkerkuit achter */}
              <path d="M52 224 C48 238 50 256 56 276 C62 276 68 266 70 248 C70 234 66 224 64 220 Z" />
              {/* Rechterkuit achter */}
              <path d="M108 224 C112 238 110 256 104 276 C98 276 92 266 90 248 C90 234 94 224 96 220 Z" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}
