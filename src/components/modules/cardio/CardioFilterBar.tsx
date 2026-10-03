"use client";

import React from "react";
import {
  Footprints,
  Bike,
  Waves,
  Activity,
  Compass,
  Timer,
  Flame,
  LayoutGrid,
} from "lucide-react";
import type { CardioActivityType } from "@/types/database";

interface CardioFilterBarProps {
  selectedActivity: CardioActivityType | "alle";
  onSelectActivity: (activity: CardioActivityType | "alle") => void;
  counts: Record<string, number>;
  totalCount: number;
}

export function CardioFilterBar({
  selectedActivity,
  onSelectActivity,
  counts,
  totalCount,
}: CardioFilterBarProps) {
  const filterOptions: Array<{
    id: CardioActivityType | "alle";
    label: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "alle",
      label: "Alle",
      icon: <LayoutGrid className="w-3.5 h-3.5" />,
    },
    {
      id: "hardlopen",
      label: "Hardlopen",
      icon: <Footprints className="w-3.5 h-3.5" />,
    },
    {
      id: "fietsen",
      label: "Fietsen",
      icon: <Bike className="w-3.5 h-3.5" />,
    },
    {
      id: "wandelen",
      label: "Wandelen",
      icon: <Compass className="w-3.5 h-3.5" />,
    },
    {
      id: "roeien",
      label: "Roeien",
      icon: <Activity className="w-3.5 h-3.5" />,
    },
    {
      id: "zwemmen",
      label: "Zwemmen",
      icon: <Waves className="w-3.5 h-3.5" />,
    },
    {
      id: "crosstrainer",
      label: "Crosstrainer",
      icon: <Timer className="w-3.5 h-3.5" />,
    },
    {
      id: "overig",
      label: "Overig",
      icon: <Flame className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-700">
      {filterOptions.map((opt) => {
        const isSelected = selectedActivity === opt.id;
        const count = opt.id === "alle" ? totalCount : counts[opt.id] ?? 0;

        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onSelectActivity(opt.id)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              isSelected
                ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/20"
                : "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700/50"
            }`}
          >
            {opt.icon}
            <span>{opt.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                isSelected
                  ? "bg-white/20 text-white"
                  : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
