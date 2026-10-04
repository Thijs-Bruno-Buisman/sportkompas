"use client";

import React, { useState } from "react";
import { Star, Edit3, Trash2, ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Recipe } from "@/types/database";

interface RecipeCardProps {
  recipe: Recipe;
  onToggleFavorite: (id: string) => void;
  onEdit?: (recipe: Recipe) => void;
  onDelete?: (id: string) => void;
}

export function RecipeCard({
  recipe,
  onToggleFavorite,
  onEdit,
  onDelete,
}: RecipeCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [viewMode, setViewMode] = useState<"portion" | "100g">("portion");

  const calories = viewMode === "portion" ? recipe.caloriesPerPortion : recipe.caloriesPer100g;
  const protein = viewMode === "portion" ? recipe.proteinPerPortion : recipe.proteinPer100g;
  const carbs = viewMode === "portion" ? recipe.carbsPerPortion : recipe.carbsPer100g;
  const fat = viewMode === "portion" ? recipe.fatPerPortion : recipe.fatPer100g;
  const fiber = viewMode === "portion" ? recipe.fiberPerPortion : recipe.fiberPer100g;

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
      <div className="space-y-3">
        {/* Header met Porties badge en Favoriet */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <UtensilsCrossed className="w-3 h-3 mr-1" />
              Recept
            </span>
            <Badge variant="outline" className="text-xs">
              {recipe.portions} {recipe.portions === 1 ? "portie" : "porties"} ({recipe.totalGrams}g)
            </Badge>
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(recipe.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            title={recipe.isFavorite ? "Verwijder uit favorieten" : "Markeer als favoriet"}
            aria-label={recipe.isFavorite ? "Verwijder uit favorieten" : "Markeer als favoriet"}
          >
            <Star
              className={`w-5 h-5 ${
                recipe.isFavorite
                  ? "fill-amber-400 text-amber-500"
                  : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
              }`}
            />
          </button>
        </div>

        {/* Naam en omschrijving */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
            {recipe.name}
          </h3>
          {recipe.description && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
              {recipe.description}
            </p>
          )}
        </div>

        {/* Macro waarden met weergaveschakelaar (per portie vs per 100g) */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
              <button
                type="button"
                onClick={() => setViewMode("portion")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  viewMode === "portion"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Per portie
              </button>
              <button
                type="button"
                onClick={() => setViewMode("100g")}
                className={`px-2 py-0.5 rounded font-medium transition-colors ${
                  viewMode === "100g"
                    ? "bg-emerald-500 text-white shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Per 100g
              </button>
            </div>

            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {calories} <span className="text-xs font-normal text-slate-400">kcal</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                Eiwit
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {protein}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                Koolh.
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {carbs}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block">
                Vet
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {fat}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                Vezel
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {fiber}g
              </span>
            </div>
          </div>
        </div>

        {/* Ingrediënten lijst uitklapbaar */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center justify-between text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 py-1"
          >
            <span className="font-medium">
              {recipe.ingredients.length} {recipe.ingredients.length === 1 ? "ingrediënt" : "ingrediënten"}
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {isExpanded && (
            <div className="mt-2 space-y-1.5 bg-slate-50 dark:bg-slate-950/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 text-xs divide-y divide-slate-100 dark:divide-slate-800">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center justify-between pt-1.5 first:pt-0">
                  <span className="text-slate-800 dark:text-slate-200 font-medium">
                    {ing.foodName}
                  </span>
                  <div className="text-right text-slate-500">
                    <span>{ing.amountGrams}g</span>
                    <span className="mx-1.5">&bull;</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {ing.calories} kcal ({ing.proteinGrams}g E)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Actieknoppen */}
      <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(recipe)}
            className="text-xs text-slate-600 dark:text-slate-300"
            leftIcon={<Edit3 className="w-3.5 h-3.5" />}
          >
            Bewerken
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(recipe.id)}
            className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Wissen
          </Button>
        )}
      </div>
    </Card>
  );
}
