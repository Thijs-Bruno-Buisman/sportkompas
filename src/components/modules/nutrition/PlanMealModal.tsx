"use client";

import React, { useState, useMemo } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { FoodItem, Recipe, PlannedMeal, MealItemEntry } from "@/types/database";
import { calculateNutritionForPortion } from "@/domain/nutrition/calculations";
import { BookOpen, Apple, Calendar, Plus, Trash2 } from "lucide-react";

interface PlanMealModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendarDate: string;
  mealType: "ontbijt" | "lunch" | "diner" | "snacks";
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  onPlanMeal: (mealData: Omit<PlannedMeal, "id" | "createdAt" | "provenance">) => Promise<void>;
}

export function PlanMealModal({
  isOpen,
  onClose,
  calendarDate,
  mealType: initialMealType,
  availableFoods,
  availableRecipes,
  onPlanMeal,
}: PlanMealModalProps) {
  const [selectedMealType, setSelectedMealType] = useState<"ontbijt" | "lunch" | "diner" | "snacks">(initialMealType);
  const [sourceType, setSourceType] = useState<"recipe" | "foods">("recipe");
  const [mealName, setMealName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recipe selection state
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [recipePortions, setRecipePortions] = useState<number>(1);

  // Food items selection state
  const [plannedItems, setPlannedItems] = useState<MealItemEntry[]>([]);
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [portionGrams, setPortionGrams] = useState<string>("100");

  // Sync initial meal type when modal opens
  React.useEffect(() => {
    setSelectedMealType(initialMealType);
    setMealName("");
    setNotes("");
    setPlannedItems([]);
    setSelectedRecipeId("");
    setRecipePortions(1);
  }, [initialMealType, isOpen]);

  // Handle recipe selection
  const handleSelectRecipe = (recipeId: string) => {
    setSelectedRecipeId(recipeId);
    const rec = availableRecipes.find((r) => r.id === recipeId);
    if (rec) {
      setMealName(rec.name);
      // Items berekenen per portie
      const portionFactor = (recipePortions || 1) / (rec.portions || 1);
      const items: MealItemEntry[] = rec.ingredients.map((ing) => ({
        foodItemId: ing.foodItemId,
        foodName: ing.foodName,
        portionGrams: Math.round(ing.amountGrams * portionFactor),
        calories: Math.round(ing.calories * portionFactor),
        proteinGrams: Math.round(ing.proteinGrams * portionFactor * 10) / 10,
        carbsGrams: Math.round(ing.carbsGrams * portionFactor * 10) / 10,
        fatGrams: Math.round(ing.fatGrams * portionFactor * 10) / 10,
        fiberGrams: ing.fiberGrams ? Math.round(ing.fiberGrams * portionFactor * 10) / 10 : 0,
      }));
      setPlannedItems(items);
    }
  };

  const handlePortionMultiplierChange = (newPortions: number) => {
    const validPortions = Math.max(0.5, newPortions);
    setRecipePortions(validPortions);
    const rec = availableRecipes.find((r) => r.id === selectedRecipeId);
    if (rec) {
      const portionFactor = validPortions / (rec.portions || 1);
      const items: MealItemEntry[] = rec.ingredients.map((ing) => ({
        foodItemId: ing.foodItemId,
        foodName: ing.foodName,
        portionGrams: Math.round(ing.amountGrams * portionFactor),
        calories: Math.round(ing.calories * portionFactor),
        proteinGrams: Math.round(ing.proteinGrams * portionFactor * 10) / 10,
        carbsGrams: Math.round(ing.carbsGrams * portionFactor * 10) / 10,
        fatGrams: Math.round(ing.fatGrams * portionFactor * 10) / 10,
        fiberGrams: ing.fiberGrams ? Math.round(ing.fiberGrams * portionFactor * 10) / 10 : 0,
      }));
      setPlannedItems(items);
    }
  };

  // Add individual food item
  const handleAddFoodItem = () => {
    const food = availableFoods.find((f) => f.id === selectedFoodId);
    const grams = parseFloat(portionGrams);
    if (!food || isNaN(grams) || grams <= 0) return;

    const nutrient = calculateNutritionForPortion(food, grams);
    const newItem: MealItemEntry = {
      foodItemId: food.id,
      foodName: food.name,
      portionGrams: grams,
      calories: nutrient.calories,
      proteinGrams: nutrient.proteinGrams,
      carbsGrams: nutrient.carbsGrams,
      fatGrams: nutrient.fatGrams,
      fiberGrams: nutrient.fiberGrams,
    };

    setPlannedItems((prev) => [...prev, newItem]);
    if (!mealName) {
      setMealName(food.name);
    }
    setSelectedFoodId("");
    setPortionGrams("100");
  };

  const handleRemoveItem = (index: number) => {
    setPlannedItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate totals
  const totals = useMemo(() => {
    let cal = 0;
    let pro = 0;
    let carb = 0;
    let fat = 0;
    let fib = 0;
    for (const item of plannedItems) {
      cal += item.calories;
      pro += item.proteinGrams;
      carb += item.carbsGrams;
      fat += item.fatGrams;
      fib += item.fiberGrams || 0;
    }
    return {
      calories: Math.round(cal),
      proteinGrams: Math.round(pro * 10) / 10,
      carbsGrams: Math.round(carb * 10) / 10,
      fatGrams: Math.round(fat * 10) / 10,
      fiberGrams: Math.round(fib * 10) / 10,
    };
  }, [plannedItems]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plannedItems.length === 0) return;

    setIsSubmitting(true);
    try {
      await onPlanMeal({
        calendarDate,
        mealType: selectedMealType,
        name: mealName.trim() || "Geplande maaltijd",
        recipeId: sourceType === "recipe" && selectedRecipeId ? selectedRecipeId : null,
        items: plannedItems,
        totalCalories: totals.calories,
        totalProteinGrams: totals.proteinGrams,
        totalCarbsGrams: totals.carbsGrams,
        totalFatGrams: totals.fatGrams,
        totalFiberGrams: totals.fiberGrams,
        status: "gepland",
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err) {
      console.error("Fout bij inplannen maaltijd:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Maaltijd Inplannen"
      description={`Plan een maaltijd in voor ${calendarDate}`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Maaltijdmoment selectie */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Maaltijdmoment
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["ontbijt", "lunch", "diner", "snacks"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedMealType(type)}
                className={`py-2 px-1 text-xs font-semibold rounded-lg capitalize border transition-colors ${
                  selectedMealType === type
                    ? "bg-emerald-500 text-white border-emerald-600 shadow-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Bronkeuze: Recept of Losse ingrediënten */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={() => setSourceType("recipe")}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              sourceType === "recipe"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Uit Recepten ({availableRecipes.length})
          </button>
          <button
            type="button"
            onClick={() => setSourceType("foods")}
            className={`flex-1 py-2 text-sm font-medium flex items-center justify-center gap-2 border-b-2 transition-colors ${
              sourceType === "foods"
                ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 font-semibold"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            <Apple className="w-4 h-4" />
            Losse Producten
          </button>
        </div>

        {/* Recepten selectie sectie */}
        {sourceType === "recipe" && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Kies een recept
              </label>
              {availableRecipes.length === 0 ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-700 dark:text-amber-300">
                  Je hebt nog geen recepten aangemaakt. Ga naar &apos;Voedingsdatabase &amp; Recepten&apos; om er een aan te maken, of kies hierboven voor &apos;Losse Producten&apos;.
                </div>
              ) : (
                <select
                  value={selectedRecipeId}
                  onChange={(e) => handleSelectRecipe(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  <option value="">-- Selecteer een recept --</option>
                  {availableRecipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.totalCalories} kcal, {r.totalProteinGrams}g eiwit)
                    </option>
                  ))}
                </select>
              )}
            </div>

            {selectedRecipeId && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Aantal porties
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={recipePortions}
                    onChange={(e) => handlePortionMultiplierChange(parseFloat(e.target.value) || 1)}
                    className="w-24 text-center font-bold"
                  />
                  <span className="text-sm text-slate-500 dark:text-slate-400">
                    portie(s)
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Losse producten sectie */}
        {sourceType === "foods" && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Product
                </label>
                <select
                  value={selectedFoodId}
                  onChange={(e) => setSelectedFoodId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                >
                  <option value="">-- Kies een product --</option>
                  {availableFoods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.caloriesPer100g} kcal / 100g)
                    </option>
                  ))}
                </select>
              </div>
              <div className="w-28">
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Gram
                </label>
                <Input
                  type="number"
                  min="1"
                  value={portionGrams}
                  onChange={(e) => setPortionGrams(e.target.value)}
                  className="h-11"
                />
              </div>
              <div className="sm:self-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddFoodItem}
                  disabled={!selectedFoodId}
                  className="w-full sm:w-auto h-11 flex items-center justify-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Voeg toe
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Lijst van toegevoegde items in de maaltijd */}
        {plannedItems.length > 0 && (
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900 dark:text-white">
              Geselecteerde Ingrediënten ({plannedItems.length})
            </label>
            <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 bg-slate-50 dark:bg-slate-900/60 rounded-lg border border-slate-200 dark:border-slate-800">
              {plannedItems.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs py-1 px-2 rounded bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700"
                >
                  <div className="truncate mr-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.foodName}
                    </span>
                    <span className="text-slate-400 ml-1.5">
                      ({item.portionGrams}g)
                    </span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-slate-600 dark:text-slate-400 font-mono">
                      {item.calories} kcal
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="text-red-500 hover:text-red-600 p-1"
                      title="Verwijderen"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Totale voedingswaarde */}
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-lg flex items-center justify-between text-xs font-medium text-emerald-900 dark:text-emerald-300">
              <div>
                <span className="font-bold text-sm">{totals.calories}</span> kcal
              </div>
              <div className="flex gap-2 font-mono">
                <span>E: {totals.proteinGrams}g</span>
                <span>•</span>
                <span>K: {totals.carbsGrams}g</span>
                <span>•</span>
                <span>V: {totals.fatGrams}g</span>
              </div>
            </div>
          </div>
        )}

        {/* Naam en Notities */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Naam van de maaltijd
            </label>
            <Input
              type="text"
              placeholder="Bijv. Havermout met blauwe bessen"
              value={mealName}
              onChange={(e) => setMealName(e.target.value)}
              className="h-11"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Meal prep notitie (optioneel)
            </label>
            <Input
              type="text"
              placeholder="Bijv. Zondag al bakken en in bakjes bewaren"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-11"
            />
          </div>
        </div>

        {/* Actieknoppen */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="h-11 min-w-[80px]"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={plannedItems.length === 0 || isSubmitting}
            className="h-11 min-w-[140px] flex items-center gap-1.5"
          >
            <Calendar className="w-4 h-4" />
            {isSubmitting ? "Opslaan..." : "Inplannen"}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
