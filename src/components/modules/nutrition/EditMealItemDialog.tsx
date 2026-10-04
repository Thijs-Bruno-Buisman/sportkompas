"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { MealItemEntry } from "@/types/database";

interface EditMealItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: MealItemEntry | null;
  onSave: (updatedItem: MealItemEntry) => Promise<void>;
}

export function EditMealItemDialog({
  isOpen,
  onClose,
  item,
  onSave,
}: EditMealItemDialogProps) {
  const [portionGrams, setPortionGrams] = useState<string>("100");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (item) {
      setPortionGrams(item.portionGrams.toString());
      setErrorMessage("");
    }
  }, [item, isOpen]);

  if (!item) return null;

  const currentGrams = parseFloat(portionGrams.replace(",", ".")) || 0;
  const ratio = item.portionGrams > 0 ? currentGrams / item.portionGrams : 1;

  const calcCalories = Math.round(item.calories * ratio);
  const calcProtein = Math.round(item.proteinGrams * ratio * 10) / 10;
  const calcCarbs = Math.round(item.carbsGrams * ratio * 10) / 10;
  const calcFat = Math.round(item.fatGrams * ratio * 10) / 10;
  const calcFiber = Math.round(item.fiberGrams * ratio * 10) / 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentGrams <= 0) {
      setErrorMessage("Vul een geldig aantal grammen in (minimaal 1g).");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated: MealItemEntry = {
        ...item,
        portionGrams: Math.round(currentGrams * 10) / 10,
        calories: calcCalories,
        proteinGrams: calcProtein,
        carbsGrams: calcCarbs,
        fatGrams: calcFat,
        fiberGrams: calcFiber,
      };

      await onSave(updated);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij bijwerken van portie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Portie Aanpassen"
      description={`Pas de portiegrootte aan voor "${item.foodName}".`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <FormField id="edit-portion-grams" label="Hoeveelheid (gram)" required>
          <Input
            id="edit-portion-grams"
            type="number"
            min="1"
            max="5000"
            value={portionGrams}
            onChange={(e) => setPortionGrams(e.target.value)}
            autoFocus
          />
        </FormField>

        {/* Live herberekende waarden preview */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-semibold text-slate-500">
            Herberekende voedingswaarden:
          </span>

          <div className="grid grid-cols-4 gap-2 text-center text-xs">
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px]">Energie</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {calcCalories} kcal
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-emerald-500 block text-[10px]">Eiwit</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {calcProtein}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-amber-500 block text-[10px]">Koolh.</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {calcCarbs}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-sky-500 block text-[10px]">Vet</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {calcFat}g
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Portie Opslaan
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
