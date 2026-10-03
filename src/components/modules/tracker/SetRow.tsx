"use client";

import React, { useState, useEffect, useRef } from "react";
import { Check, Trash2, HelpCircle, Trophy } from "lucide-react";
import type { WorkoutSet, ExerciseMeasurementType } from "@/types/database";
import {
  parseDecimalInput,
  parseRepsInput,
  parseDurationInput,
  parseRpeInput,
} from "@/domain/strength/setParser";

export interface SetRowProps {
  set: WorkoutSet;
  index: number;
  measurementType?: ExerciseMeasurementType;
  isPR?: boolean;
  prLabel?: string;
  onUpdateSetValue: (setId: string, updates: Partial<WorkoutSet>) => void;
  onToggleComplete: (set: WorkoutSet) => void;
  onDeleteSet: (setId: string) => void;
}

export function SetRow({
  set,
  index,
  measurementType = "gewicht_herhalingen",
  isPR = false,
  prLabel,
  onUpdateSetValue,
  onToggleComplete,
  onDeleteSet,
}: SetRowProps) {
  const isCompleted = set.completed;
  const isTimeBased = measurementType === "tijd";
  const isAssisted = set.isAssisted || measurementType === "assisted";
  const isBodyweight = measurementType === "lichaamsgewicht";

  // Lokale tekst-states om soepele mobiele invoer met komma Ã©n punt toe te staan
  const [weightStr, setWeightStr] = useState<string>(
    set.weightKg === 0 ? "" : String(set.weightKg)
  );
  const [repsStr, setRepsStr] = useState<string>(
    set.reps === 0 ? "" : String(set.reps)
  );
  const [durationStr, setDurationStr] = useState<string>(
    set.durationSeconds ? String(set.durationSeconds) : ""
  );
  const [rpeStr, setRpeStr] = useState<string>(
    set.actualRpe !== null && set.actualRpe !== undefined
      ? String(set.actualRpe)
      : ""
  );

  // Synchroniseer wanneer props van buitenaf veranderen (bv. reload of reset)
  useEffect(() => {
    setWeightStr(set.weightKg === 0 ? "" : String(set.weightKg));
  }, [set.weightKg]);

  useEffect(() => {
    setRepsStr(set.reps === 0 ? "" : String(set.reps));
  }, [set.reps]);

  useEffect(() => {
    setDurationStr(set.durationSeconds ? String(set.durationSeconds) : "");
  }, [set.durationSeconds]);

  useEffect(() => {
    setRpeStr(
      set.actualRpe !== null && set.actualRpe !== undefined
        ? String(set.actualRpe)
        : ""
    );
  }, [set.actualRpe]);

  // Autosave handlers op blur of enter
  const commitWeight = () => {
    const parsed = parseDecimalInput(weightStr);
    const finalWeight = parsed !== null ? parsed : 0;
    if (finalWeight !== set.weightKg) {
      onUpdateSetValue(set.id, { weightKg: finalWeight });
    }
  };

  const commitReps = () => {
    const parsed = parseRepsInput(repsStr);
    const finalReps = parsed !== null ? parsed : 0;
    if (finalReps !== set.reps) {
      onUpdateSetValue(set.id, { reps: finalReps });
    }
  };

  const commitDuration = () => {
    const parsed = parseDurationInput(durationStr);
    if (parsed !== (set.durationSeconds ?? null)) {
      onUpdateSetValue(set.id, { durationSeconds: parsed });
    }
  };

  const commitRpe = () => {
    const parsed = parseRpeInput(rpeStr);
    if (parsed !== (set.actualRpe ?? null)) {
      onUpdateSetValue(set.id, { actualRpe: parsed });
    }
  };

  // Visuele badge kleur per setType
  const getSetTypeBadge = (type: WorkoutSet["setType"]) => {
    switch (type) {
      case "warmup":
        return "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-700";
      case "drop":
        return "bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-300 dark:border-indigo-700";
      case "failure":
        return "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 border-rose-300 dark:border-rose-700";
      case "normal":
      default:
        return "bg-slate-100 dark:bg-slate-800 text-foreground border-border";
    }
  };

  return (
    <div
      className={`grid grid-cols-1 sm:grid-cols-12 gap-2 p-2.5 sm:px-3 sm:py-2.5 rounded-xl border transition-all items-center ${
        isCompleted
          ? "bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-500/40"
          : "bg-card border-border hover:border-slate-300 dark:hover:border-slate-700"
      }`}
    >
      {/* 1. Set Nummer & Type Selector */}
      <div className="flex sm:col-span-3 items-center justify-between sm:justify-start gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
              isCompleted
                ? "bg-emerald-500 text-white shadow-sm"
                : "bg-muted text-foreground"
            }`}
          >
            {set.setNumber}
          </span>

          {isCompleted && isPR && (
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 shrink-0"
              title={prLabel || "Nieuw record behaald met deze set!"}
            >
              <Trophy className="w-2.5 h-2.5 text-amber-500" />
              <span>PR</span>
            </span>
          )}

          <select
            value={set.setType}
            onChange={(e) =>
              onUpdateSetValue(set.id, {
                setType: e.target.value as WorkoutSet["setType"],
              })
            }
            className={`h-11 sm:h-10 text-xs rounded-xl border px-2.5 font-bold outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${getSetTypeBadge(
              set.setType
            )}`}
            title="Set type (opwarmen, werkset, dropset of tot falen)"
          >
            <option value="normal">Werkset</option>
            <option value="warmup">Opwarmen</option>
            <option value="drop">Dropset</option>
            <option value="failure">Tot falen</option>
          </select>
        </div>

        {/* Mobiele delete knop */}
        <button
          type="button"
          onClick={() => onDeleteSet(set.id)}
          className="sm:hidden p-2.5 text-muted-foreground hover:text-red-500 rounded-lg touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
          title="Set verwijderen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Gewicht Invoer (min 48px touch target) */}
      <div className="col-span-3 flex flex-col">
        <div className="flex items-center gap-1.5">
          <span className="sm:hidden text-xs font-semibold text-muted-foreground w-20 shrink-0">
            {isAssisted
              ? "Tegengewicht:"
              : isBodyweight
              ? "Extra kg:"
              : "Gewicht:"}
          </span>
          <div className="relative w-full">
            <input
              type="text"
              inputMode="decimal"
              pattern="[0-9]*[.,]?[0-9]*"
              value={weightStr}
              placeholder={isAssisted ? "hulp kg" : isBodyweight ? "0" : "0"}
              onChange={(e) => setWeightStr(e.target.value)}
              onBlur={commitWeight}
              onKeyDown={(e) => e.key === "Enter" && commitWeight()}
              className={`h-12 w-full rounded-xl border bg-background px-3 text-center text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px] touch-manipulation ${
                isAssisted
                  ? "border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                  : "border-border text-foreground"
              }`}
            />
            {isAssisted && (
              <span className="absolute left-2 top-3 text-xs font-bold text-amber-600 dark:text-amber-400 pointer-events-none">
                -
              </span>
            )}
          </div>
          <span className="text-xs font-bold text-muted-foreground shrink-0 w-6">
            kg
          </span>
        </div>
        {isAssisted && (
          <span className="sm:hidden text-[10px] text-amber-600 dark:text-amber-400 italic mt-0.5 ml-20">
            Minder kg hulp = betere prestatie!
          </span>
        )}
      </div>

      {/* 3. Reps of Tijd Invoer (min 48px touch target) */}
      <div className="col-span-3 flex items-center gap-1.5">
        <span className="sm:hidden text-xs font-semibold text-muted-foreground w-20 shrink-0">
          {isTimeBased ? "Duur (sec):" : "Herhalingen:"}
        </span>
        {isTimeBased ? (
          <input
            type="text"
            inputMode="numeric"
            value={durationStr}
            placeholder="60"
            onChange={(e) => setDurationStr(e.target.value)}
            onBlur={commitDuration}
            onKeyDown={(e) => e.key === "Enter" && commitDuration()}
            className="h-12 w-full rounded-xl border border-border bg-background px-3 text-center text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px] touch-manipulation"
          />
        ) : (
          <input
            type="text"
            inputMode="numeric"
            value={repsStr}
            placeholder="0"
            onChange={(e) => setRepsStr(e.target.value)}
            onBlur={commitReps}
            onKeyDown={(e) => e.key === "Enter" && commitReps()}
            className="h-12 w-full rounded-xl border border-border bg-background px-3 text-center text-base font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px] touch-manipulation"
          />
        )}
        <span className="text-xs font-bold text-muted-foreground shrink-0 w-6">
          {isTimeBased ? "sec" : "reps"}
        </span>
      </div>

      {/* 4. RPE (Optioneel) */}
      <div className="col-span-1 hidden sm:block">
        <input
          type="text"
          inputMode="decimal"
          value={rpeStr}
          placeholder="RPE"
          onChange={(e) => setRpeStr(e.target.value)}
          onBlur={commitRpe}
          onKeyDown={(e) => e.key === "Enter" && commitRpe()}
          className="h-12 w-full rounded-xl border border-border bg-background px-1 text-center text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none min-h-[48px] touch-manipulation"
          title="Optionele RPE (1-10)"
        />
      </div>

      {/* 5. Voltooid Checkmark Knop (Grote 48px touch target!) */}
      <div className="col-span-2 flex items-center justify-end gap-1.5 pt-1 sm:pt-0">
        <button
          type="button"
          onClick={() => {
            // Commit waarden vÃ³Ã³r afronden
            commitWeight();
            if (isTimeBased) commitDuration();
            else commitReps();
            commitRpe();
            onToggleComplete(set);
          }}
          className={`min-h-[48px] min-w-[48px] w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all touch-manipulation ${
            isCompleted
              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/25 ring-2 ring-emerald-500"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-border active:scale-95"
          }`}
          title={isCompleted ? "Set afvinken ongedaan maken" : "Set voltooien"}
        >
          <Check
            className={`w-5 h-5 ${
              isCompleted ? "stroke-[3]" : "text-muted-foreground"
            }`}
          />
          <span className="sm:hidden text-xs">
            {isCompleted ? "Voltooid" : "Afvinken"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => onDeleteSet(set.id)}
          className="hidden sm:inline-flex p-2.5 text-muted-foreground hover:text-red-500 rounded-lg transition-colors touch-manipulation min-h-[44px] min-w-[44px] items-center justify-center"
          title="Set verwijderen"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}


