"use client";

import React from "react";
import { Star, Edit3, Trash2, ShieldCheck, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { FoodItem } from "@/types/database";
import { getCategoryMetadata, calculateNutritionForPortion } from "@/domain/nutrition/calculations";

interface FoodItemCardProps {
  food: FoodItem;
  onToggleFavorite: (id: string) => void;
  onEdit?: (food: FoodItem) => void;
  onDelete?: (id: string) => void;
}

export function FoodItemCard({
  food,
  onToggleFavorite,
  onEdit,
  onDelete,
}: FoodItemCardProps) {
  const categoryMeta = getCategoryMetadata(food.category || "overig");
  const defaultPortionNutrition = calculateNutritionForPortion(food, food.defaultPortionGrams);

  return (
    <Card className="p-4 sm:p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-colors">
      <div className="space-y-3">
        {/* Header: Categorie, Herkomst & Favoriet */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${categoryMeta.badgeBg} ${categoryMeta.badgeText}`}
            >
              {categoryMeta.label}
            </span>
            {food.isCustom ? (
              <Badge variant="outline" className="text-[11px] py-0 text-slate-500 flex items-center gap-1">
                <User className="w-3 h-3" /> Eigen
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] py-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Standaard
              </Badge>
            )}
          </div>

          <button
            type="button"
            onClick={() => onToggleFavorite(food.id)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 dark:hover:text-amber-400 transition-colors"
            title={food.isFavorite ? "Verwijder uit favorieten" : "Markeer als favoriet"}
            aria-label={food.isFavorite ? "Verwijder uit favorieten" : "Markeer als favoriet"}
          >
            <Star
              className={`w-5 h-5 ${
                food.isFavorite
                  ? "fill-amber-400 text-amber-500"
                  : "text-slate-300 dark:text-slate-600 hover:text-slate-400"
              }`}
            />
          </button>
        </div>

        {/* Productnaam en Merk */}
        <div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-snug">
            {food.name}
          </h3>
          {food.brand && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {food.brand}
            </p>
          )}
        </div>

        {/* Macro waarden per 100 gram */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Per 100g
            </span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">
              {food.caloriesPer100g} <span className="text-xs font-normal text-slate-400">kcal</span>
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center">
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                Eiwit
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {food.proteinGramsPer100g}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                Koolh.
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {food.carbsGramsPer100g}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block">
                Vet
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {food.fatGramsPer100g}g
              </span>
            </div>
            <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                Vezel
              </span>
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                {food.fiberGramsPer100g}g
              </span>
            </div>
          </div>
        </div>

        {/* Standaard portie info */}
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
          <span>Standaard portie ({food.defaultPortionGrams}g):</span>
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {defaultPortionNutrition.calories} kcal &bull; {defaultPortionNutrition.proteinGrams}g E
          </span>
        </div>
      </div>

      {/* Actieknoppen voor eigen producten */}
      {food.isCustom && (
        <div className="flex items-center justify-end gap-1 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800/80">
          {onEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onEdit(food)}
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
              onClick={() => onDelete(food.id)}
              className="text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400"
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Wissen
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}

