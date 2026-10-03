"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { type Exercise, type ExerciseMeasurementType } from "@/types/database";
import { useDatabase } from "@/lib/db";
import { ExerciseCard, MUSCLE_GROUP_LABELS, EQUIPMENT_LABELS, MEASUREMENT_TYPE_LABELS } from "./ExerciseCard";
import { ExerciseDetailDialog } from "./ExerciseDetailDialog";
import { ExerciseFormDialog } from "./ExerciseFormDialog";
import { ExerciseProgressionModal } from "./ExerciseProgressionModal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import {
  Search,
  Plus,
  Filter,
  X,
  Archive,
  Dumbbell,
  Check,
  RotateCcw,
} from "lucide-react";

const FILTER_MUSCLE_GROUPS = [
  { value: "alle", label: "Alle Spiergroepen" },
  { value: "borst", label: "Borst" },
  { value: "rug", label: "Rug" },
  { value: "benen", label: "Benen" },
  { value: "schouders", label: "Schouders" },
  { value: "armen", label: "Armen" },
  { value: "core", label: "Core / Buik" },
  { value: "kuiten", label: "Kuiten" },
];

const FILTER_EQUIPMENT = [
  { value: "alle", label: "Alle Materialen" },
  { value: "barbell", label: "Barbell" },
  { value: "dumbbell", label: "Dumbbell" },
  { value: "kabel", label: "Kabelstation" },
  { value: "machine", label: "Machine" },
  { value: "lichaamsgewicht", label: "Lichaamsgewicht" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "elastiek", label: "Weerstandsband" },
];

const FILTER_MEASUREMENT_TYPES = [
  { value: "alle", label: "Alle Meetmethodes" },
  { value: "gewicht_herhalingen", label: "Gewicht & Reps" },
  { value: "lichaamsgewicht", label: "Lichaamsgewicht" },
  { value: "extra_gewicht", label: "Extra Gewicht" },
  { value: "assisted", label: "Assisted Machine" },
  { value: "tijd", label: "Tijd / Duur" },
];

export function ExerciseLibrary() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string>("alle");
  const [selectedEquipment, setSelectedEquipment] = useState<string>("alle");
  const [selectedMeasurement, setSelectedMeasurement] = useState<string>("alle");
  const [includeArchived, setIncludeArchived] = useState(false);

  // Dialog states
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);
  const [isProgressionOpen, setIsProgressionOpen] = useState(false);
  const [progressionExercise, setProgressionExercise] = useState<Exercise | null>(null);

  // Laad alle oefeningen uit de actieve IndexedDB repository
  const loadExercises = useCallback(async () => {
    setIsLoading(true);
    try {
      // Zorg dat standaard oefeningen aanwezig zijn als bibliotheek leeg is
      await repositories.exercises.ensureDefaultExercises();

      // Haal alle oefeningen inclusief gearchiveerde items op
      const all = await repositories.exercises.getAll(true);
      setExercises(all);
    } catch (err) {
      console.error("Fout bij laden van oefeningen:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories]);

  useEffect(() => {
    loadExercises();
  }, [loadExercises, isDemoMode, dataVersion]);

  // Gefilterde oefeningen berekening
  const filteredExercises = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return exercises.filter((ex) => {
      // 1. Archief filter
      if (!includeArchived && ex.isArchived) {
        return false;
      }

      // 2. Spiergroep filter (primair of secundair)
      if (selectedMuscle !== "alle") {
        const primaryMatch = ex.primaryMuscleGroup === selectedMuscle;
        const secondaryMatch = ex.secondaryMuscleGroups?.includes(
          selectedMuscle as Exercise["primaryMuscleGroup"]
        );
        if (!primaryMatch && !secondaryMatch) {
          return false;
        }
      }

      // 3. Materiaal filter
      if (selectedEquipment !== "alle" && ex.equipment !== selectedEquipment) {
        return false;
      }

      // 4. Meetmethode filter
      if (
        selectedMeasurement !== "alle" &&
        ex.measurementType !== selectedMeasurement
      ) {
        return false;
      }

      // 5. Zoekopdracht (naam, synoniemen, spiergroep, materiaal)
      if (q) {
        const nameMatch = ex.name.toLowerCase().includes(q);
        const aliasMatch = ex.alternativeNames?.some((alias) =>
          alias.toLowerCase().includes(q)
        );
        const muscleMatch = ex.primaryMuscleGroup.toLowerCase().includes(q);
        const equipMatch = ex.equipment.toLowerCase().includes(q);

        if (!nameMatch && !aliasMatch && !muscleMatch && !equipMatch) {
          return false;
        }
      }

      return true;
    });
  }, [
    exercises,
    searchQuery,
    selectedMuscle,
    selectedEquipment,
    selectedMeasurement,
    includeArchived,
  ]);

  const hasActiveFilters =
    Boolean(searchQuery) ||
    selectedMuscle !== "alle" ||
    selectedEquipment !== "alle" ||
    selectedMeasurement !== "alle" ||
    includeArchived;

  const resetFilters = () => {
    setSearchQuery("");
    setSelectedMuscle("alle");
    setSelectedEquipment("alle");
    setSelectedMeasurement("alle");
    setIncludeArchived(false);
  };

  // Open detail dialog
  const handleCardClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDetailOpen(true);
  };

  // Bewaar / update oefening
  const handleSaveExercise = async (saved: Exercise) => {
    await repositories.exercises.save(saved);
    await loadExercises();

    // Werk eventueel actieve geselecteerde oefening bij
    if (selectedExercise && selectedExercise.id === saved.id) {
      setSelectedExercise(saved);
    }
  };

  // Archiveer / Herstel oefening
  const handleToggleArchive = async (exercise: Exercise) => {
    let updated: Exercise;
    if (exercise.isArchived) {
      updated = await repositories.exercises.unarchiveExercise(exercise.id);
    } else {
      updated = await repositories.exercises.archiveExercise(exercise.id);
    }

    await loadExercises();
    setSelectedExercise(updated);
  };

  // Start bewerken van oefening
  const handleStartEdit = (exercise: Exercise) => {
    setIsDetailOpen(false);
    setExerciseToEdit(exercise);
    setIsFormOpen(true);
  };

  // Start toevoegen van nieuwe oefening
  const handleStartCreate = () => {
    setExerciseToEdit(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Zoekbalk & Primaire Actie */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1">
          <Input
            placeholder="Zoek op Nederlandse naam, Engelse term of spiergroep..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-full"
              aria-label="Zoekopdracht wissen"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <Button
          onClick={handleStartCreate}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shrink-0"
        >
          Nieuwe Oefening
        </Button>
      </div>

      {/* Filterbediening: Spiergroep, Materiaal, Meetmethode en Archief */}
      <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Spiergroep selectie */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Spiergroep
            </label>
            <Select
              value={selectedMuscle}
              onChange={(e) => setSelectedMuscle(e.target.value)}
              className="text-xs h-9"
            >
              {FILTER_MUSCLE_GROUPS.map((mg) => (
                <option key={mg.value} value={mg.value}>
                  {mg.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Materiaal selectie */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Apparatuur / Materiaal
            </label>
            <Select
              value={selectedEquipment}
              onChange={(e) => setSelectedEquipment(e.target.value)}
              className="text-xs h-9"
            >
              {FILTER_EQUIPMENT.map((eq) => (
                <option key={eq.value} value={eq.value}>
                  {eq.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Meetmethode selectie */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
              Meetmethode
            </label>
            <Select
              value={selectedMeasurement}
              onChange={(e) => setSelectedMeasurement(e.target.value)}
              className="text-xs h-9"
            >
              {FILTER_MEASUREMENT_TYPES.map((mt) => (
                <option key={mt.value} value={mt.value}>
                  {mt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Archiefschakelaar & Reset filters */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-800/60 text-xs">
          <label className="inline-flex items-center gap-2 cursor-pointer select-none text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
            />
            <span className="flex items-center gap-1.5 font-medium">
              <Archive className="w-3.5 h-3.5 text-slate-400" />
              Toon gearchiveerde oefeningen
            </span>
          </label>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {filteredExercises.length} {filteredExercises.length === 1 ? "oefening" : "oefeningen"} gevonden
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
              >
                <RotateCcw className="w-3 h-3" />
                Filters wissen
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Resultaten Grid */}
      {filteredExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => handleCardClick(exercise)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Dumbbell className="w-6 h-6" />}
          title={
            exercises.length === 0
              ? "Geen oefeningen in bibliotheek"
              : "Geen overeenkomende oefeningen"
          }
          description={
            hasActiveFilters
              ? "Er zijn geen oefeningen gevonden die voldoen aan je huidige zoekopdracht of filterselectie."
              : "Er zijn nog geen oefeningen aanwezig in deze database."
          }
          actionLabel={hasActiveFilters ? "Wis Alle Filters" : "Oefening Toevoegen"}
          onAction={hasActiveFilters ? resetFilters : handleStartCreate}
          secondaryAction={
            hasActiveFilters ? (
              <Button variant="outline" onClick={handleStartCreate}>
                Nieuwe Oefening Maken
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Detail Dialog */}
      <ExerciseDetailDialog
        isOpen={isDetailOpen}
        exercise={selectedExercise}
        onClose={() => setIsDetailOpen(false)}
        onEdit={handleStartEdit}
        onToggleArchive={handleToggleArchive}
        onViewProgression={(ex) => {
          setIsDetailOpen(false);
          setProgressionExercise(ex);
          setIsProgressionOpen(true);
        }}
      />

      {/* Form Dialog (Nieuw / Bewerken) */}
      <ExerciseFormDialog
        isOpen={isFormOpen}
        exerciseToEdit={exerciseToEdit}
        onClose={() => {
          setIsFormOpen(false);
          setExerciseToEdit(null);
        }}
        onSave={handleSaveExercise}
      />

      {/* Progressie Modal */}
      <ExerciseProgressionModal
        isOpen={isProgressionOpen}
        onClose={() => {
          setIsProgressionOpen(false);
          setProgressionExercise(null);
        }}
        exercise={progressionExercise}
      />
    </div>
  );
}

