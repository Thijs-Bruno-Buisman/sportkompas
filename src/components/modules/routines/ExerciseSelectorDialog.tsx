"use client";

import React, { useState, useEffect, useMemo } from "react";
import { type Exercise } from "@/types/database";
import { useDatabase } from "@/lib/db";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Search, X, Dumbbell, Check } from "lucide-react";
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
  MEASUREMENT_TYPE_LABELS,
} from "../exercises/ExerciseCard";

interface ExerciseSelectorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (exercise: Exercise) => void;
  title?: string;
  description?: string;
}

const MUSCLE_PILLS = [
  { value: "alle", label: "Alle" },
  { value: "borst", label: "Borst" },
  { value: "rug", label: "Rug" },
  { value: "benen", label: "Benen" },
  { value: "schouders", label: "Schouders" },
  { value: "armen", label: "Armen" },
  { value: "core", label: "Core" },
];

export function ExerciseSelectorDialog({
  isOpen,
  onClose,
  onSelect,
  title = "Kies een Oefening",
  description = "Selecteer een oefening uit de bibliotheek om toe te voegen aan je trainingsdag.",
}: ExerciseSelectorDialogProps) {
  const { repositories, isDemoMode, dataVersion } = useDatabase();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState("alle");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;
    async function fetchExercises() {
      setIsLoading(true);
      try {
        await repositories.exercises.ensureDefaultExercises();
        const all = await repositories.exercises.getAll(false); // Alleen niet-gearchiveerde
        if (!isCancelled) {
          setExercises(all);
        }
      } catch (err) {
        console.error("Fout bij ophalen van oefeningen voor selector:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    fetchExercises();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isOpen, isDemoMode, dataVersion]);

  // Reset zoekstatus bij openen
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedMuscle("alle");
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return exercises.filter((ex) => {
      if (selectedMuscle !== "alle") {
        const primary = ex.primaryMuscleGroup === selectedMuscle;
        const secondary = ex.secondaryMuscleGroups?.includes(
          selectedMuscle as Exercise["primaryMuscleGroup"]
        );
        if (!primary && !secondary) return false;
      }

      if (q) {
        const nameMatch = ex.name.toLowerCase().includes(q);
        const aliasMatch = ex.alternativeNames?.some((a) =>
          a.toLowerCase().includes(q)
        );
        const muscleMatch = ex.primaryMuscleGroup.toLowerCase().includes(q);
        if (!nameMatch && !aliasMatch && !muscleMatch) return false;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedMuscle]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
    >
      <div className="space-y-3.5">
        {/* Zoekbalk */}
        <div className="relative">
          <Input
            placeholder="Zoek op naam, Engels synoniem of spiergroep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9 text-xs sm:text-sm"
            autoFocus
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Spiergroep filter pills */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {MUSCLE_PILLS.map((pill) => (
            <button
              key={pill.value}
              type="button"
              onClick={() => setSelectedMuscle(pill.value)}
              className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors border ${
                selectedMuscle === pill.value
                  ? "bg-emerald-500 text-white border-emerald-600 font-semibold"
                  : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Oefeningenlijst met touch targets */}
        <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.length > 0 ? (
            filtered.map((exercise) => {
              const meta =
                MEASUREMENT_TYPE_LABELS[exercise.measurementType] ||
                MEASUREMENT_TYPE_LABELS.gewicht_herhalingen;

              return (
                <button
                  key={exercise.id}
                  type="button"
                  onClick={() => {
                    onSelect(exercise);
                    onClose();
                  }}
                  className="w-full text-left p-3 pt-3 rounded-xl hover:bg-emerald-50/60 dark:hover:bg-emerald-950/30 transition-colors flex items-center justify-between gap-3 group focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[52px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300 truncate">
                        {exercise.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize font-medium">
                        {MUSCLE_GROUP_LABELS[exercise.primaryMuscleGroup] ||
                          exercise.primaryMuscleGroup}
                      </span>
                      <span>&bull;</span>
                      <span>{EQUIPMENT_LABELS[exercise.equipment] || exercise.equipment}</span>
                      <span>&bull;</span>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        {meta.icon}
                        {meta.label}
                      </span>
                    </div>
                  </div>

                  <span className="shrink-0 text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    Kies
                  </span>
                </button>
              );
            })
          ) : (
            <EmptyState
              icon={<Dumbbell className="w-6 h-6" />}
              title="Geen oefeningen gevonden"
              description={`Geen resultaten gevonden voor "${searchQuery}".`}
              actionLabel="Zoekterm wissen"
              onAction={() => {
                setSearchQuery("");
                setSelectedMuscle("alle");
              }}
            />
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Annuleren
          </Button>
        </DialogFooter>
      </div>
    </Dialog>
  );
}
