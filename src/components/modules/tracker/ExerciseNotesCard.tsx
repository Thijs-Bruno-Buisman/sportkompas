"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText,
  Bookmark,
  History,
  Check,
  Edit3,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import type { Exercise, WorkoutExerciseSnapshot } from "@/types/database";

export interface ExerciseNotesCardProps {
  exerciseId: string;
  exerciseName: string;
  currentExerciseSnapshot: WorkoutExerciseSnapshot;
  exerciseLibraryItem?: Exercise | null;
  previousExerciseNote?: string | null;
  previousSessionDate?: string | null;
  onSaveSessionNote: (note: string) => Promise<void>;
  onSaveTechniqueNote: (techniqueNote: string) => Promise<void>;
}

export function ExerciseNotesCard({
  exerciseId,
  exerciseName,
  currentExerciseSnapshot,
  exerciseLibraryItem,
  previousExerciseNote,
  previousSessionDate,
  onSaveSessionNote,
  onSaveTechniqueNote,
}: ExerciseNotesCardProps) {
  // Lokale state voor huidige trainingsnotitie (sessie-specifiek)
  const [sessionNote, setSessionNote] = useState<string>(
    currentExerciseSnapshot.notes || ""
  );
  const [isSavingSessionNote, setIsSavingSessionNote] = useState(false);
  const [sessionNoteSavedBadge, setSessionNoteSavedBadge] = useState(false);

  // Lokale state voor blijvende technieknotitie (oefening-specifiek)
  const [techniqueNote, setTechniqueNote] = useState<string>(
    exerciseLibraryItem?.techniqueNotes || ""
  );
  const [isEditingTechnique, setIsEditingTechnique] = useState(false);
  const [isSavingTechnique, setIsSavingTechnique] = useState(false);
  const [techniqueSavedBadge, setTechniqueSavedBadge] = useState(false);

  // Synchroniseer wanneer oefening wisselt
  useEffect(() => {
    setSessionNote(currentExerciseSnapshot.notes || "");
    setSessionNoteSavedBadge(false);
  }, [currentExerciseSnapshot.exerciseId, currentExerciseSnapshot.notes]);

  useEffect(() => {
    setTechniqueNote(exerciseLibraryItem?.techniqueNotes || "");
    setIsEditingTechnique(false);
    setTechniqueSavedBadge(false);
  }, [exerciseLibraryItem?.id, exerciseLibraryItem?.techniqueNotes]);

  // Autosave sessienotitie bij verlaten van invoerveld
  const handleBlurSessionNote = async () => {
    if (sessionNote === (currentExerciseSnapshot.notes || "")) return;
    try {
      setIsSavingSessionNote(true);
      await onSaveSessionNote(sessionNote);
      setSessionNoteSavedBadge(true);
      setTimeout(() => setSessionNoteSavedBadge(false), 2500);
    } catch (err) {
      console.error("Fout bij opslaan sessienotitie:", err);
    } finally {
      setIsSavingSessionNote(false);
    }
  };

  // Opslaan van blijvende technieknotitie
  const handleSaveTechnique = async () => {
    try {
      setIsSavingTechnique(true);
      await onSaveTechniqueNote(techniqueNote);
      setIsEditingTechnique(false);
      setTechniqueSavedBadge(true);
      setTimeout(() => setTechniqueSavedBadge(false), 2500);
    } catch (err) {
      console.error("Fout bij opslaan technieknotitie:", err);
    } finally {
      setIsSavingTechnique(false);
    }
  };

  return (
    <div className="space-y-3 pt-1">
      {/* --------------------------------------------------------------------- */}
      {/* 1. BLIJVENDE TECHNIEKNOTITIE (PERMANENT IN BIBLIOTHEEK) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-sky-500/20 bg-sky-50/30 dark:bg-sky-950/20 p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 dark:text-sky-300">
            <Bookmark className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            <span>Blijvende Technieknotitie</span>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-sky-300 dark:border-sky-800 text-sky-700 dark:text-sky-300">
              Vast voor {exerciseName}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            {techniqueSavedBadge && (
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                <Check className="w-3 h-3" /> Opgeslagen
              </span>
            )}
            {!isEditingTechnique ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingTechnique(true)}
                className="h-7 text-xs px-2 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900/40"
              >
                <Edit3 className="w-3 h-3 mr-1" />
                {techniqueNote ? "Bewerken" : "+ Toevoegen"}
              </Button>
            ) : (
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingTechnique(false)}
                  className="h-7 text-xs px-2"
                >
                  Annuleren
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSaveTechnique}
                  disabled={isSavingTechnique}
                  className="h-7 text-xs px-2.5 bg-sky-600 hover:bg-sky-700 text-white"
                >
                  Opslaan
                </Button>
              </div>
            )}
          </div>
        </div>

        {isEditingTechnique ? (
          <div className="space-y-1.5">
            <textarea
              value={techniqueNote}
              onChange={(e) => setTechniqueNote(e.target.value)}
              placeholder="Bijv. Bankje op stand 3 zetten; pinken op markeringsring; schouderbladen samenknijpen..."
              rows={2}
              className="w-full text-xs rounded-lg border border-sky-300 dark:border-sky-800 bg-background p-2.5 outline-none focus:ring-2 focus:ring-sky-500"
            />
            <p className="text-[10px] text-muted-foreground italic">
              Deze notitie blijft bewaard in de bibliotheek en zie je bij elke toekomstige training van {exerciseName}.
            </p>
          </div>
        ) : techniqueNote ? (
          <p className="text-xs font-medium text-foreground bg-background/60 p-2 rounded-lg border border-sky-200/50 dark:border-sky-900/30">
            {techniqueNote}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Geen vaste technieknotitie ingesteld. Handig voor bankjesstand, gripbreedte of aandachtspunten.
          </p>
        )}
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. VORIGE SESSIENOTITIE (ALLEEN INDIEN AANWEZIG) */}
      {/* --------------------------------------------------------------------- */}
      {previousExerciseNote && (
        <div className="rounded-xl border border-muted bg-muted/30 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <History className="w-3.5 h-3.5 text-emerald-600" />
            <span>Notitie van vorige training {previousSessionDate ? `(${previousSessionDate})` : ""}:</span>
          </div>
          <p className="text-xs italic text-foreground bg-background/80 p-2 rounded-lg border border-border">
            &ldquo;{previousExerciseNote}&rdquo;
          </p>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 3. HUIDIGE SESSIENOTITIE (DEZE TRAINING) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-border bg-card p-3 sm:p-3.5 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
            <FileText className="w-3.5 h-3.5 text-emerald-500" />
            <span>Notitie voor déze training</span>
          </div>
          {sessionNoteSavedBadge && (
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Check className="w-3 h-3" /> Opgeslagen
            </span>
          )}
        </div>

        <textarea
          value={sessionNote}
          onChange={(e) => setSessionNote(e.target.value)}
          onBlur={handleBlurSessionNote}
          placeholder="Bijv. Voelde zwaar aan op set 2; schouder voelde goed; volgende keer 2.5kg verhogen..."
          rows={2}
          className="w-full text-xs rounded-lg border border-border bg-background p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <p className="text-[10px] text-muted-foreground">
          Autosave bij verlaten veld. Deze notitie wordt bewaard bij de sessie en getoond als referentie bij je volgende training.
        </p>
      </div>
    </div>
  );
}
