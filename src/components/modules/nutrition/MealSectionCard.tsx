"use client";

import React from "react";
import {
  Coffee,
  Sun,
  Moon,
  Cookie,
  Plus,
  Trash2,
  Edit2,
  Copy,
  BookmarkPlus,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { MealLog, MealItemEntry } from "@/types/database";
import type { MealTypeSummary } from "@/domain/nutrition/diary";

interface MealSectionCardProps {
  summary: MealTypeSummary;
  onAddItem: (mealType: MealLog["mealType"]) => void;
  onEditItem: (logId: string, itemIndex: number, currentItem: MealItemEntry) => void;
  onDeleteItem: (logId: string, itemIndex: number) => void;
  onCopyFromYesterday?: (mealType: MealLog["mealType"]) => void;
  onSaveAsRecipe?: (summary: MealTypeSummary) => void;
}

export function MealSectionCard({
  summary,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onCopyFromYesterday,
  onSaveAsRecipe,
}: MealSectionCardProps) {
  const getMealIcon = (type: MealLog["mealType"]) => {
    switch (type) {
      case "ontbijt":
        return <Coffee className="w-4 h-4 text-amber-500" />;
      case "lunch":
        return <Sun className="w-4 h-4 text-emerald-500" />;
      case "diner":
        return <Moon className="w-4 h-4 text-indigo-500" />;
      case "snacks":
      default:
        return <Cookie className="w-4 h-4 text-pink-500" />;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800">
      <CardHeader className="py-3.5 px-4 sm:px-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
            {getMealIcon(summary.mealType)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                {summary.title}
              </CardTitle>
              {summary.totalCalories > 0 && (
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {summary.totalCalories} kcal
                </span>
              )}
            </div>
            {summary.totalCalories > 0 && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {summary.totalProteinGrams}g E &bull; {summary.totalCarbsGrams}g K &bull; {summary.totalFatGrams}g V &bull; {summary.totalFiberGrams}g Vezel
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0 flex-wrap">
          {/* Knop: Kopieer van gisteren */}
          {onCopyFromYesterday && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onCopyFromYesterday(summary.mealType)}
              leftIcon={<Copy className="w-3.5 h-3.5" />}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              title="Kopieer items van gisteren"
            >
              <span className="hidden md:inline">Van gisteren</span>
            </Button>
          )}

          {/* Knop: Opslaan als recept (alleen als maaltijd items bevat) */}
          {onSaveAsRecipe && summary.itemsCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSaveAsRecipe(summary)}
              leftIcon={<BookmarkPlus className="w-3.5 h-3.5 text-amber-500" />}
              className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
              title="Sla deze maaltijd op als herbruikbaar recept"
            >
              <span className="hidden md:inline">Als Recept</span>
            </Button>
          )}

          {/* Knop: Toevoegen */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAddItem(summary.mealType)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            className="text-xs shrink-0"
          >
            Toevoegen
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 sm:p-5">
        {summary.logs.length > 0 && summary.itemsCount > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {summary.logs.map((log) =>
              log.items.map((item, itemIdx) => (
                <div
                  key={`${log.id}-${itemIdx}`}
                  className="py-3 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-900 dark:text-white text-sm">
                      {item.foodName}
                    </span>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {item.portionGrams}g
                      </span>
                      <span>&bull;</span>
                      <span>{item.calories} kcal</span>
                      <span>&bull;</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {item.proteinGrams}g E
                      </span>
                      <span>&bull;</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">
                        {item.carbsGrams}g K
                      </span>
                      <span>&bull;</span>
                      <span className="text-sky-600 dark:text-sky-400 font-medium">
                        {item.fatGrams}g V
                      </span>
                      {item.fiberGrams > 0 && (
                        <>
                          <span>&bull;</span>
                          <span className="text-purple-600 dark:text-purple-400 font-medium">
                            {item.fiberGrams}g Vezel
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => onEditItem(log.id, itemIdx, item)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Portie bewerken"
                      aria-label="Portie bewerken"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteItem(log.id, itemIdx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                      title="Verwijder item"
                      aria-label="Verwijder item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="text-center py-4 text-xs text-slate-400 dark:text-slate-500">
            Nog geen {summary.title.toLowerCase()} geregistreerd voor deze dag.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
