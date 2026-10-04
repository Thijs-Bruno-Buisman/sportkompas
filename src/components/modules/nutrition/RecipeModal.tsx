"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, Search, UtensilsCrossed } from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { Recipe, RecipeIngredient, FoodItem } from "@/types/database";
import { RecipeSchema } from "@/lib/db/schema";
import {
  calculateNutritionForPortion,
  calculateRecipeTotals,
  calculateMacroDistribution,
} from "@/domain/nutrition/calculations";

interface RecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (recipe: Recipe) => Promise<void>;
  availableFoods: FoodItem[];
  recipeToEdit?: Recipe | null;
  isDemoMode?: boolean;
}

export function RecipeModal({
  isOpen,
  onClose,
  onSave,
  availableFoods,
  recipeToEdit,
  isDemoMode = false,
}: RecipeModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [portions, setPortions] = useState("1");
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Ingrediënt toevoegen sectie
  const [selectedFoodId, setSelectedFoodId] = useState("");
  const [ingredientGrams, setIngredientGrams] = useState("100");
  const [foodSearchQuery, setFoodSearchQuery] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (recipeToEdit) {
      setName(recipeToEdit.name);
      setDescription(recipeToEdit.description || "");
      setPortions(recipeToEdit.portions.toString());
      setIngredients(recipeToEdit.ingredients);
    } else {
      setName("");
      setDescription("");
      setPortions("1");
      setIngredients([]);
    }
    setSelectedFoodId(availableFoods[0]?.id || "");
    setIngredientGrams(availableFoods[0]?.defaultPortionGrams?.toString() || "100");
    setFoodSearchQuery("");
    setErrorMessage("");
  }, [recipeToEdit, isOpen, availableFoods]);

  // Gefilterde beschikbare voedingsmiddelen voor dropdown
  const filteredAvailableFoods = useMemo(() => {
    if (!foodSearchQuery.trim()) return availableFoods;
    const q = foodSearchQuery.toLowerCase().trim();
    return availableFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand ? f.brand.toLowerCase().includes(q) : false)
    );
  }, [availableFoods, foodSearchQuery]);

  // Huidig geselecteerd voedingsmiddel
  const activeSelectedFood = useMemo(() => {
    return availableFoods.find((f) => f.id === selectedFoodId) || filteredAvailableFoods[0];
  }, [availableFoods, filteredAvailableFoods, selectedFoodId]);

  // Als de gebruiker een nieuw product kiest, zet standaard portie klaar
  const handleSelectFood = (foodId: string) => {
    setSelectedFoodId(foodId);
    const found = availableFoods.find((f) => f.id === foodId);
    if (found) {
      setIngredientGrams(found.defaultPortionGrams.toString());
    }
  };

  // Ingrediënt toevoegen aan recept
  const handleAddIngredient = () => {
    if (!activeSelectedFood) {
      setErrorMessage("Kies een voedingsmiddel om toe te voegen.");
      return;
    }

    const grams = parseFloat(ingredientGrams.replace(",", "."));
    if (isNaN(grams) || grams <= 0) {
      setErrorMessage("Vul een geldig aantal grammen in (minimaal 1g).");
      return;
    }

    const portionNutr = calculateNutritionForPortion(activeSelectedFood, grams);

    const newIngredient: RecipeIngredient = {
      foodItemId: activeSelectedFood.id,
      foodName: activeSelectedFood.name,
      amountGrams: Math.round(grams * 10) / 10,
      calories: portionNutr.calories,
      proteinGrams: portionNutr.proteinGrams,
      carbsGrams: portionNutr.carbsGrams,
      fatGrams: portionNutr.fatGrams,
      fiberGrams: portionNutr.fiberGrams,
    };

    setIngredients((prev) => [...prev, newIngredient]);
    setErrorMessage("");
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  // Realtime berekende totalen van het recept
  const portionsNum = Math.max(1, parseInt(portions, 10) || 1);
  const totals = useMemo(() => {
    return calculateRecipeTotals(ingredients, portionsNum);
  }, [ingredients, portionsNum]);

  const macroDist = useMemo(() => {
    return calculateMacroDistribution(
      totals.totalProteinGrams,
      totals.totalCarbsGrams,
      totals.totalFatGrams
    );
  }, [totals]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vul een naam voor het recept in.");
      return;
    }

    if (ingredients.length === 0) {
      setErrorMessage("Voeg minimaal één ingrediënt toe aan het recept.");
      return;
    }

    const candidateRecipe: Recipe = {
      id: recipeToEdit ? recipeToEdit.id : crypto.randomUUID(),
      name: name.trim(),
      description: description.trim() ? description.trim() : undefined,
      portions: portionsNum,
      ingredients,
      totalGrams: totals.totalGrams,
      totalCalories: totals.totalCalories,
      totalProteinGrams: totals.totalProteinGrams,
      totalCarbsGrams: totals.totalCarbsGrams,
      totalFatGrams: totals.totalFatGrams,
      totalFiberGrams: totals.totalFiberGrams,
      caloriesPer100g: totals.caloriesPer100g,
      proteinPer100g: totals.proteinPer100g,
      carbsPer100g: totals.carbsPer100g,
      fatPer100g: totals.fatPer100g,
      fiberPer100g: totals.fiberPer100g,
      caloriesPerPortion: totals.caloriesPerPortion,
      proteinPerPortion: totals.proteinPerPortion,
      carbsPerPortion: totals.carbsPerPortion,
      fatPerPortion: totals.fatPerPortion,
      fiberPerPortion: totals.fiberPerPortion,
      isCustom: true,
      isFavorite: recipeToEdit ? Boolean(recipeToEdit.isFavorite) : false,
      provenance: recipeToEdit?.provenance || {
        source: isDemoMode ? "demo" : "user",
        isDemo: isDemoMode,
      },
      createdAt: recipeToEdit ? recipeToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = RecipeSchema.safeParse(candidateRecipe);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Ongeldige invoer.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(candidateRecipe);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan van recept.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={recipeToEdit ? "Recept Bewerken" : "Nieuw Recept Maken"}
      description="Stel een maaltijd of recept samen uit je voedingsmiddelen."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <FormField id="recipe-name" label="Receptnaam" required>
              <Input
                id="recipe-name"
                placeholder="Bijv. Eiwitrijke Pannenkoeken of Overnight Oats"
                value={name}
                onChange={(e) => setName(e.target.value)}
                hasError={Boolean(errorMessage && !name)}
                autoFocus
              />
            </FormField>
          </div>

          <FormField id="recipe-portions" label="Aantal porties" required>
            <Input
              id="recipe-portions"
              type="number"
              min="1"
              max="20"
              value={portions}
              onChange={(e) => setPortions(e.target.value)}
            />
          </FormField>
        </div>

        <FormField id="recipe-description" label="Omschrijving of bereidingsnotitie (optioneel)">
          <Input
            id="recipe-description"
            placeholder="Bijv. Maal de havermout fijn, meng met eiwitpoeder en bak op laag vuur"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </FormField>

        {/* Ingrediënt Toevoegen Sectie */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <span className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
            Ingrediënt Toevoegen
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            <div className="sm:col-span-6 space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Voedingsmiddel selecteren
              </label>
              <div className="space-y-1.5">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400 pointer-events-none" />
                  <Input
                    placeholder="Zoek in voedingsmiddelen..."
                    value={foodSearchQuery}
                    onChange={(e) => setFoodSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
                <select
                  value={activeSelectedFood?.id || ""}
                  onChange={(e) => handleSelectFood(e.target.value)}
                  className="w-full text-xs h-9 px-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  {filteredAvailableFoods.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.caloriesPer100g} kcal/100g)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="sm:col-span-3 space-y-1">
              <label className="text-xs font-medium text-slate-500">
                Hoeveelheid (gram)
              </label>
              <Input
                type="number"
                min="1"
                max="5000"
                value={ingredientGrams}
                onChange={(e) => setIngredientGrams(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="sm:col-span-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddIngredient}
                leftIcon={<Plus className="w-4 h-4" />}
                className="w-full h-9 text-xs border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
              >
                Toevoegen
              </Button>
            </div>
          </div>

          {/* Lijst van toegevoegde ingrediënten */}
          {ingredients.length > 0 ? (
            <div className="space-y-1.5 pt-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Toegevoegd aan recept ({ingredients.length}):
              </span>
              <div className="space-y-1 max-h-48 overflow-y-auto pr-1 divide-y divide-slate-200/60 dark:divide-slate-800">
                {ingredients.map((ing, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {ing.foodName}
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {ing.amountGrams}g &bull; {ing.calories} kcal &bull; {ing.proteinGrams}g E &bull; {ing.carbsGrams}g K &bull; {ing.fatGrams}g V
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveIngredient(i)}
                      className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Verwijder ingrediënt"
                      aria-label="Verwijder ingrediënt"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 text-center py-2">
              Nog geen ingrediënten toegevoegd. Kies hierboven een product en klik op toevoegen.
            </p>
          )}
        </div>

        {/* Realtime Recept Samenvatting */}
        {ingredients.length > 0 && (
          <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-900 dark:text-white">
                Recept Totaal ({totals.totalGrams}g bereid)
              </span>
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                {totals.caloriesPerPortion} kcal per portie
              </span>
            </div>

            <div className="grid grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                  Eiwit / portie
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {totals.proteinPerPortion}g
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold block">
                  Koolh. / portie
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {totals.carbsPerPortion}g
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-sky-600 dark:text-sky-400 font-bold block">
                  Vet / portie
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {totals.fatPerPortion}g
                </span>
              </div>
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border border-emerald-500/10">
                <span className="text-[10px] text-purple-600 dark:text-purple-400 font-bold block">
                  Vezels / portie
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {totals.fiberPerPortion}g
                </span>
              </div>
            </div>

            {/* Macro Balk */}
            {macroDist.totalCalories > 0 && (
              <div className="w-full h-2 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                <div
                  style={{ width: `${macroDist.proteinPercentage}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${macroDist.carbsPercentage}%` }}
                  className="bg-amber-500 h-full"
                />
                <div
                  style={{ width: `${macroDist.fatPercentage}%` }}
                  className="bg-sky-500 h-full"
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button type="submit" isLoading={isSubmitting} disabled={ingredients.length === 0}>
            {recipeToEdit ? "Recept Bijwerken" : "Recept Opslaan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
