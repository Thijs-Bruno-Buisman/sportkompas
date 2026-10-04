"use client";

import React, { useState, useMemo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import type { PlannedMeal } from "@/types/database";
import {
  aggregateWeeklyMealPrepIngredients,
  type MealPrepIngredientSummary,
} from "@/domain/nutrition/planning";
import { Check, Copy, ShoppingBag, Utensils } from "lucide-react";

interface MealPrepListModalProps {
  isOpen: boolean;
  onClose: () => void;
  plannedMeals: PlannedMeal[];
  weekRangeLabel: string;
}

export function MealPrepListModal({
  isOpen,
  onClose,
  plannedMeals,
  weekRangeLabel,
}: MealPrepListModalProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  const prepIngredients = useMemo(() => {
    return aggregateWeeklyMealPrepIngredients(plannedMeals);
  }, [plannedMeals]);

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCopyList = async () => {
    if (prepIngredients.length === 0) return;

    const lines = [
      `🛒 SportKompas Boodschappen- & Meal Prep Lijst (${weekRangeLabel})`,
      "----------------------------------------",
      ...prepIngredients.map(
        (item) =>
          `• ${item.foodName}: ${item.totalGrams}g (${item.mealCount}x maaltijd, ~${item.estimatedCalories} kcal)`
      ),
      "----------------------------------------",
      `Totaal ${prepIngredients.length} unieke ingrediënten voor ${plannedMeals.length} maaltijden.`,
    ];

    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Fout bij kopiëren:", err);
    }
  };

  const totalGramsAll = useMemo(() => {
    return prepIngredients.reduce((sum, item) => sum + item.totalGrams, 0);
  }, [prepIngredients]);

  const checkedCount = useMemo(() => {
    return Object.values(checkedItems).filter(Boolean).length;
  }, [checkedItems]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Boodschappen & Meal Prep"
      description={`Geaggregeerde ingrediënten voor ${weekRangeLabel}`}
    >
      <div className="space-y-4">
        {/* Samenvatting header */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-100 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-500" />
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {prepIngredients.length} Ingrediënten
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {checkedCount} van {prepIngredients.length} afgevinkt ({Math.round(totalGramsAll)}g totaal)
              </div>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={handleCopyList}
            disabled={prepIngredients.length === 0}
            className="h-10 text-xs flex items-center gap-1.5"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-500" />
                <span>Gekopieerd!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Kopieer Lijst</span>
              </>
            )}
          </Button>
        </div>

        {/* Ingrediëntenlijst */}
        {prepIngredients.length === 0 ? (
          <div className="py-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
            <Utensils className="w-8 h-8 mx-auto text-slate-400 opacity-60" />
            <p className="text-sm">Geen geplande maaltijden gevonden voor deze week.</p>
            <p className="text-xs">
              Plan maaltijden in via de weekplanner om hier automatisch een boodschappen- en prep-lijst van te maken.
            </p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
            {prepIngredients.map((item) => {
              const isChecked = !!checkedItems[item.foodItemId || item.foodName];
              return (
                <div
                  key={item.foodItemId || item.foodName}
                  onClick={() => toggleCheck(item.foodItemId || item.foodName)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer select-none transition-colors ${
                    isChecked
                      ? "bg-slate-50/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 line-through"
                      : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${
                        isChecked
                          ? "bg-emerald-500 border-emerald-600 text-white"
                          : "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.foodName}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        In {item.mealCount} {item.mealCount === 1 ? "maaltijd" : "maaltijden"} ingepland
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {item.totalGrams} g
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      ~{item.estimatedCalories} kcal | {item.estimatedProtein}g E
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sluitknop */}
        <div className="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="h-11 min-w-[100px]"
          >
            Sluiten
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
