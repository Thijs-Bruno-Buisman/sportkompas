"use client";

import React, { useState } from "react";
import {
  Footprints,
  Bike,
  Waves,
  Activity,
  Compass,
  Timer,
  Flame,
  Play,
} from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { CardioActivityType } from "@/types/database";

interface StartLiveCardioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (activityType: CardioActivityType) => void;
}

export function StartLiveCardioDialog({
  isOpen,
  onClose,
  onStart,
}: StartLiveCardioDialogProps) {
  const [selectedSport, setSelectedSport] = useState<CardioActivityType>("hardlopen");

  const sports: Array<{
    id: CardioActivityType;
    label: string;
    desc: string;
    icon: React.ReactNode;
  }> = [
    {
      id: "hardlopen",
      label: "Hardlopen",
      desc: "Buitenritme, baantraining of loopband",
      icon: <Footprints className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: "fietsen",
      label: "Fietsen / Wielrennen",
      desc: "Wegrit, spinning of gravelbike",
      icon: <Bike className="w-5 h-5 text-sky-500" />,
    },
    {
      id: "roeien",
      label: "Roeien (Ergometer)",
      desc: "Concept2 roeier of buitenwater",
      icon: <Activity className="w-5 h-5 text-amber-500" />,
    },
    {
      id: "wandelen",
      label: "Wandelen",
      desc: "Stevige wandeling of hiking",
      icon: <Compass className="w-5 h-5 text-teal-500" />,
    },
    {
      id: "zwemmen",
      label: "Zwemmen",
      desc: "Baan of open water",
      icon: <Waves className="w-5 h-5 text-cyan-500" />,
    },
    {
      id: "crosstrainer",
      label: "Crosstrainer",
      desc: "Cardio-apparaat in de sportschool",
      icon: <Timer className="w-5 h-5 text-indigo-500" />,
    },
    {
      id: "overig",
      label: "Overige Duursport",
      desc: "Skeeleren, schaatsen of boksen",
      icon: <Flame className="w-5 h-5 text-slate-500" />,
    },
  ];

  const handleStart = () => {
    onStart(selectedSport);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Live Cardio Tracker Starten"
      description="Kies welke sport je gaat beoefenen om de live stopwatch en split-tracker te starten."
    >
      <div className="space-y-2.5 py-2">
        {sports.map((sport) => {
          const isSelected = selectedSport === sport.id;
          return (
            <button
              key={sport.id}
              type="button"
              onClick={() => setSelectedSport(sport.id)}
              className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-1 ring-emerald-500"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {sport.icon}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {sport.label}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {sport.desc}
                  </p>
                </div>
              </div>

              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                  isSelected
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-300 dark:border-slate-600"
                }`}
              >
                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <DialogFooter className="gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>
          Annuleren
        </Button>
        <Button
          type="button"
          onClick={handleStart}
          leftIcon={<Play className="w-4 h-4 fill-current" />}
        >
          Start Tracker
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
