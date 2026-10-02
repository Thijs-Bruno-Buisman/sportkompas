"use client";

import React, { useState } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Dumbbell, Play } from "lucide-react";

interface StartFreeWorkoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: (name: string, notes?: string) => Promise<void>;
}

export function StartFreeWorkoutDialog({
  isOpen,
  onClose,
  onStart,
}: StartFreeWorkoutDialogProps) {
  const [workoutName, setWorkoutName] = useState("Vrije Krachttraining");
  const [notes, setNotes] = useState("");
  const [isStarting, setIsStarting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsStarting(true);
    try {
      await onStart(workoutName.trim() || "Vrije Krachttraining", notes.trim());
      onClose();
    } catch (err) {
      console.error("Fout bij starten vrije training:", err);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Vrije Training Starten"
      description="Start een losse krachttraining zonder vooraf vastgelegd schema. Je kunt ter plekke oefeningen toevoegen en sets registreren."
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <FormField label="Naam van de training">
          <Input
            value={workoutName}
            onChange={(e) => setWorkoutName(e.target.value)}
            placeholder="bijv. Vrije Krachttraining, Armen & Core..."
            required
            className="h-11"
          />
        </FormField>

        <FormField label="Notitie (optioneel)">
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Doel van vandaag, focus of opmerkingen..."
            rows={2}
          />
        </FormField>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isStarting}
            className="min-h-[44px]"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isStarting}
            leftIcon={<Play className="w-4 h-4" />}
            className="min-h-[48px] px-6 font-semibold"
          >
            {isStarting ? "Starten..." : "Start Training"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
