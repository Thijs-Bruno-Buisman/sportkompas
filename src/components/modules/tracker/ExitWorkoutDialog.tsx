"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Pause, XCircle, Trash2, ArrowLeft } from "lucide-react";

interface ExitWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  onKeepDraft: () => void;
  onCancelSession: () => Promise<void>;
  onDiscardSession: () => Promise<void>;
}

export function ExitWorkoutDialog({
  isOpen,
  onClose,
  workoutName,
  onKeepDraft,
  onCancelSession,
  onDiscardSession,
}: ExitWorkoutDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleCancel = async () => {
    setIsProcessing(true);
    setErrorMessage("");
    try {
      await onCancelSession();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij annuleren van de sessie.");
      setIsProcessing(false);
    }
  };

  const handleDiscard = async () => {
    setIsProcessing(true);
    setErrorMessage("");
    try {
      await onDiscardSession();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij verwijderen van de sessie.");
      setIsProcessing(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Training onderbreken of afsluiten"
      description={`Je bent momenteel bezig met "${workoutName}". Wat wil je met deze sessie doen?`}
      maxWidth="md"
    >
      <div className="space-y-4 py-2">
        {errorMessage && (
          <Alert variant="error" title="Fout">
            {errorMessage}
          </Alert>
        )}

        {/* Keuze 1: Draft behouden (Aanbevolen) */}
        <div
          onClick={onKeepDraft}
          className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-950/20 hover:border-emerald-500 cursor-pointer transition-colors space-y-1.5 focus-within:ring-2 focus-within:ring-emerald-500"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Pause className="w-5 h-5" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              Draft behouden (Pauzeren)
            </span>
            <span className="text-xs bg-emerald-100 dark:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full ml-auto">
              Aanbevolen
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 pl-9">
            De training blijft actief opgeslagen in de achtergrond. Je kunt de app
            vrij gebruiken, van tabblad wisselen of de browser verversen, en later
            direct verdergaan waar je gebleven was.
          </p>
        </div>

        {/* Keuze 2: Sessie annuleren */}
        <div
          onClick={handleCancel}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer transition-colors space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <XCircle className="w-5 h-5" />
            </span>
            <span className="font-semibold text-slate-900 dark:text-white">
              Training annuleren
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 pl-9">
            Stopt deze sessie en slaat hem op als &apos;geannuleerd&apos; in je
            trainingshistorie. Reeds gelogde sets blijven bewaard.
          </p>
        </div>

        {/* Keuze 3: Volledig weggooien */}
        <div
          onClick={handleDiscard}
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-600 cursor-pointer transition-colors space-y-1.5"
        >
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
            </span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              Volledig weggooien (Wissen)
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400 pl-9">
            Wist deze sessie en alle tussentijdse sets permanent uit de database.
            Als dit een geplande training was, wordt deze weer hersteld naar
            &apos;Gepland&apos;.
          </p>
        </div>
      </div>

      <DialogFooter className="mt-4">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isProcessing}
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          className="w-full sm:w-auto"
        >
          Terug naar training
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
