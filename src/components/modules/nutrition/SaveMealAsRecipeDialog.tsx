"use client";

import React, { useState } from "react";
import { BookmarkPlus, UtensilsCrossed, AlertCircle } from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { MealTypeSummary } from "@/domain/nutrition/diary";

interface SaveMealAsRecipeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  summary: MealTypeSummary;
  onSaveAsRecipe: (mealLogId: string, recipeName: string, portions: number) => Promise<void>;
}

export function SaveMealAsRecipeDialog({
  isOpen,
  onClose,
  summary,
  onSaveAsRecipe,
}: SaveMealAsRecipeDialogProps) {
  const defaultName = `${summary.title} Combinatie`;
  const [recipeName, setRecipeName] = useState(defaultName);
  const [portions, setPortions] = useState("1");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const firstLog = summary.logs[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstLog) {
      setErrorMessage("Geen maaltijd gevonden om op te slaan.");
      return;
    }

    if (!recipeName.trim()) {
      setErrorMessage("Vul een herkenbare receptnaam in.");
      return;
    }

    const portCount = parseInt(portions, 10);
    if (isNaN(portCount) || portCount < 1) {
      setErrorMessage("Aantal porties moet minimaal 1 zijn.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await onSaveAsRecipe(firstLog.id, recipeName.trim(), portCount);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan als recept.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`${summary.title} Opslaan als Recept`}
      description="Sla deze maaltijdcombinatie op in je receptenbibliotheek zodat je hem voortaan in 1 klik kunt loggen."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span>{errorMessage}</span>
          </Alert>
        )}

        <FormField label="Receptnaam" id="recipe-name" required>
          <Input
            id="recipe-name"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="bijv. Havermout powerbowl"
            autoFocus
          />
        </FormField>

        <FormField label="Aantal porties in deze bereiding" id="recipe-portions" required>
          <Input
            id="recipe-portions"
            type="number"
            min="1"
            max="20"
            value={portions}
            onChange={(e) => setPortions(e.target.value)}
          />
        </FormField>

        {/* Ingrediënten overzicht */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Ingrediënten in deze maaltijd ({summary.itemsCount}):
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1 text-xs text-slate-600 dark:text-slate-400">
            {summary.logs.map((log) =>
              log.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-center py-0.5">
                  <span className="truncate pr-2">{item.foodName}</span>
                  <span className="font-semibold shrink-0 text-slate-800 dark:text-slate-200">
                    {item.portionGrams}g ({item.calories} kcal)
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between text-xs font-bold text-slate-900 dark:text-white">
            <span>Totaal:</span>
            <span>
              {summary.totalCalories} kcal &bull; {summary.totalProteinGrams}g E &bull;{" "}
              {summary.totalCarbsGrams}g K &bull; {summary.totalFatGrams}g V
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<BookmarkPlus className="w-4 h-4" />}
          >
            Opslaan in Bibliotheek
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
