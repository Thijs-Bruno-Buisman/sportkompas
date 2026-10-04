"use client";

import React, { useState, useEffect } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Scale, Check } from "lucide-react";

interface QuickWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveWeight: (weightKg: number, notes?: string) => Promise<void>;
  calendarDate: string;
  initialWeight?: number | null;
}

export function QuickWeightModal({
  isOpen,
  onClose,
  onSaveWeight,
  calendarDate,
  initialWeight,
}: QuickWeightModalProps) {
  const [weightStr, setWeightStr] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWeightStr(initialWeight ? initialWeight.toString() : "");
      setNotes("");
      setError(null);
    }
  }, [isOpen, initialWeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWeight = weightStr.replace(",", ".");
    const weightNum = parseFloat(cleanWeight);

    if (isNaN(weightNum) || weightNum < 20 || weightNum > 350) {
      setError("Voer een realistisch gewicht in tussen 20 en 350 kg.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSaveWeight(weightNum, notes.trim());
      onClose();
    } catch (err) {
      console.error("Fout bij opslaan gewicht:", err);
      setError("Kon gewicht niet opslaan. Probeer opnieuw.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Lichaamsgewicht Invoeren"
      description={`Meting vastleggen voor ${calendarDate}`}
      maxWidth="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-200 dark:border-rose-800">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Gewicht (kg)
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              placeholder="bv. 78.5"
              value={weightStr}
              onChange={(e) => {
                setWeightStr(e.target.value);
                setError(null);
              }}
              className="text-lg font-bold pl-10 h-12"
              autoFocus
            />
            <Scale className="w-5 h-5 text-slate-400 absolute left-3 top-3.5" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Notitie (optioneel)
          </label>
          <Input
            type="text"
            placeholder="bv. Na het ontwaken, nuchter"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button type="submit" variant="primary" disabled={isSubmitting || !weightStr}>
            {isSubmitting ? (
              "Opslaan..."
            ) : (
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                Opslaan
              </span>
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
