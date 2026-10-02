"use client";

import React, { useState, useEffect } from "react";
import {
  type Exercise,
  type ExerciseMeasurementType,
} from "@/types/database";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Alert } from "@/components/ui/Alert";
import {
  MUSCLE_GROUP_LABELS,
  EQUIPMENT_LABELS,
} from "./ExerciseCard";

interface ExerciseFormDialogProps {
  isOpen: boolean;
  exerciseToEdit: Exercise | null;
  onClose: () => void;
  onSave: (exercise: Exercise) => Promise<void>;
}

const MUSCLE_GROUPS = [
  "borst",
  "rug",
  "benen",
  "schouders",
  "armen",
  "core",
  "kuiten",
  "cardio",
  "full_body",
] as const;

const EQUIPMENT_OPTIONS = [
  "geen",
  "lichaamsgewicht",
  "barbell",
  "dumbbell",
  "kettlebell",
  "kabel",
  "machine",
  "elastiek",
  "overig",
] as const;

const MEASUREMENT_TYPES: {
  value: ExerciseMeasurementType;
  label: string;
  sub: string;
}[] = [
  {
    value: "gewicht_herhalingen",
    label: "Gewicht & Herhalingen",
    sub: "Bijv. 80 kg × 8 reps (klassieke krachttraining)",
  },
  {
    value: "lichaamsgewicht",
    label: "Lichaamsgewicht herhalingen",
    sub: "Bijv. 15 push-ups of 10 pull-ups",
  },
  {
    value: "extra_gewicht",
    label: "Extra gewicht (Weighted bodyweight)",
    sub: "Bijv. lichaamsgewicht + 10 kg dipriem",
  },
  {
    value: "assisted",
    label: "Assisted machine tegengewicht",
    sub: "Bijv. -15 kg machine-assistentie",
  },
  {
    value: "tijd",
    label: "Tijd / Duuroefening",
    sub: "Bijv. 60 seconden plank of wall-sit",
  },
];

export function ExerciseFormDialog({
  isOpen,
  exerciseToEdit,
  onClose,
  onSave,
}: ExerciseFormDialogProps) {
  const isEditing = Boolean(exerciseToEdit);

  const [name, setName] = useState("");
  const [alternativeNamesStr, setAlternativeNamesStr] = useState("");
  const [primaryMuscleGroup, setPrimaryMuscleGroup] =
    useState<Exercise["primaryMuscleGroup"]>("borst");
  const [secondaryMuscleGroups, setSecondaryMuscleGroups] = useState<
    Exercise["primaryMuscleGroup"][]
  >([]);
  const [equipment, setEquipment] =
    useState<Exercise["equipment"]>("barbell");
  const [measurementType, setMeasurementType] =
    useState<ExerciseMeasurementType>("gewicht_herhalingen");
  const [instructions, setInstructions] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Synchroniseer formulier bij openen of wisselen van oefening
  useEffect(() => {
    if (exerciseToEdit) {
      setName(exerciseToEdit.name);
      setAlternativeNamesStr(
        exerciseToEdit.alternativeNames ? exerciseToEdit.alternativeNames.join(", ") : ""
      );
      setPrimaryMuscleGroup(exerciseToEdit.primaryMuscleGroup);
      setSecondaryMuscleGroups(exerciseToEdit.secondaryMuscleGroups || []);
      setEquipment(exerciseToEdit.equipment);
      setMeasurementType(exerciseToEdit.measurementType || "gewicht_herhalingen");
      setInstructions(exerciseToEdit.instructions || "");
      setVideoUrl(exerciseToEdit.videoUrl || "");
    } else {
      // Lege default waarden
      setName("");
      setAlternativeNamesStr("");
      setPrimaryMuscleGroup("borst");
      setSecondaryMuscleGroups([]);
      setEquipment("barbell");
      setMeasurementType("gewicht_herhalingen");
      setInstructions("");
      setVideoUrl("");
    }
    setErrorMessage("");
  }, [exerciseToEdit, isOpen]);

  const toggleSecondaryMuscle = (mg: Exercise["primaryMuscleGroup"]) => {
    if (secondaryMuscleGroups.includes(mg)) {
      setSecondaryMuscleGroups((prev) => prev.filter((m) => m !== mg));
    } else {
      setSecondaryMuscleGroups((prev) => [...prev, mg]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vul een herkenbare naam in voor de oefening.");
      return;
    }

    if (videoUrl.trim()) {
      try {
        const parsed = new URL(videoUrl.trim());
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
          setErrorMessage("Voer een geldige video-URL in die begint met http:// of https://.");
          return;
        }
      } catch {
        setErrorMessage("De ingevoerde video-URL is ongeldig.");
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const parsedAliases = alternativeNamesStr
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const exerciseData: Exercise = {
        id: exerciseToEdit ? exerciseToEdit.id : crypto.randomUUID(),
        name: name.trim(),
        alternativeNames: parsedAliases,
        category:
          measurementType === "tijd" || equipment === "lichaamsgewicht"
            ? "lichaamsgewicht"
            : "kracht",
        primaryMuscleGroup,
        secondaryMuscleGroups: secondaryMuscleGroups.filter(
          (mg) => mg !== primaryMuscleGroup
        ),
        equipment,
        measurementType,
        isCustom: true,
        isArchived: exerciseToEdit ? exerciseToEdit.isArchived : false,
        instructions: instructions.trim(),
        videoUrl: videoUrl.trim() ? videoUrl.trim() : null,
        provenance: exerciseToEdit
          ? exerciseToEdit.provenance
          : { source: "user", isDemo: false },
        createdAt: exerciseToEdit
          ? exerciseToEdit.createdAt
          : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await onSave(exerciseData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan van de oefening.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Oefening Bewerken" : "Nieuwe Oefening Toevoegen"}
      description={
        isEditing
          ? "Pas de eigenschappen, instructies of meetmethode van deze oefening aan."
          : "Voeg een eigen trainingsbeweging toe aan je persoonlijke bibliotheek."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        {/* Naam */}
        <FormField
          id="exercise-name"
          label="Nederlandse Naam van de Oefening"
          required
          helperText="Bijv. Schuine Halterdruk, Kabel Curls of Bekkenheffen"
        >
          <Input
            id="exercise-name"
            placeholder="Bijv. Incline Dumbbell Press"
            value={name}
            onChange={(e) => setName(e.target.value)}
            hasError={Boolean(errorMessage && !name.trim())}
            autoFocus
          />
        </FormField>

        {/* Alternatieve namen / Synoniemen */}
        <FormField
          id="exercise-aliases"
          label="Alternatieve Namen & Synoniemen (Optioneel)"
          helperText="Komma-gescheiden lijst met Engelse of populaire namen voor snelle zoekresultaten"
        >
          <Input
            id="exercise-aliases"
            placeholder="Bijv. Incline DB Bench, Schuine Druk"
            value={alternativeNamesStr}
            onChange={(e) => setAlternativeNamesStr(e.target.value)}
          />
        </FormField>

        {/* Primaire Spiergroep & Apparatuur in 2 kolommen */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField id="primary-muscle" label="Primaire Spiergroep" required>
            <Select
              id="primary-muscle"
              value={primaryMuscleGroup}
              onChange={(e) =>
                setPrimaryMuscleGroup(
                  e.target.value as Exercise["primaryMuscleGroup"]
                )
              }
            >
              {MUSCLE_GROUPS.map((mg) => (
                <option key={mg} value={mg}>
                  {MUSCLE_GROUP_LABELS[mg] || mg}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField id="equipment" label="Materiaal / Apparatuur" required>
            <Select
              id="equipment"
              value={equipment}
              onChange={(e) =>
                setEquipment(e.target.value as Exercise["equipment"])
              }
            >
              {EQUIPMENT_OPTIONS.map((eq) => (
                <option key={eq} value={eq}>
                  {EQUIPMENT_LABELS[eq] || eq}
                </option>
              ))}
            </Select>
          </FormField>
        </div>

        {/* Meettype / Logging methode */}
        <FormField
          id="measurement-type"
          label="Meettype & Logging Methode"
          required
          helperText="Bepaalt welke invoervelden verschijnen tijdens het trainen (gewicht, extra last of seconden)"
        >
          <Select
            id="measurement-type"
            value={measurementType}
            onChange={(e) =>
              setMeasurementType(e.target.value as ExerciseMeasurementType)
            }
          >
            {MEASUREMENT_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label} — {type.sub}
              </option>
            ))}
          </Select>
        </FormField>

        {/* Secundaire Spiergroepen (tikbare badges) */}
        <div>
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Secundaire Spiergroepen (Optioneel)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {MUSCLE_GROUPS.filter((mg) => mg !== primaryMuscleGroup).map((mg) => {
              const isSelected = secondaryMuscleGroups.includes(mg);
              return (
                <button
                  key={mg}
                  type="button"
                  onClick={() => toggleSecondaryMuscle(mg)}
                  className={`px-2.5 py-1 text-xs rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-emerald-500 text-white border-emerald-600 font-semibold"
                      : "bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  }`}
                >
                  {MUSCLE_GROUP_LABELS[mg] || mg}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instructies / techniek */}
        <FormField
          id="instructions"
          label="Korte Techniekinstructies"
          helperText="Belangrijke vormaanwijzingen (bijv. ellebogenhoek, ademhaling of veilige bewegingsbaan)"
        >
          <Textarea
            id="instructions"
            placeholder="Beschrijf in 1 of 2 zinnen hoe je deze oefening veilig en doeltreffend uitvoert..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={3}
          />
        </FormField>

        {/* Video URL */}
        <FormField
          id="video-url"
          label="Instructievideo URL (Optioneel)"
          helperText="Plak een geverifieerde externe web- of videolink (bijv. YouTube, Vimeo of instructiepagina)"
        >
          <Input
            id="video-url"
            type="url"
            placeholder="https://..."
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
          />
        </FormField>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {isEditing ? "Wijzigingen Opslaan" : "Oefening Toevoegen"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}

