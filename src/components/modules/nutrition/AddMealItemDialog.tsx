"use client";

import React, { useState, useMemo } from "react";
import { Search, Apple, UtensilsCrossed, Plus, Sparkles } from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Alert } from "@/components/ui/Alert";
import type { FoodItem, Recipe, MealLog, MealItemEntry } from "@/types/database";
import { calculateNutritionForPortion } from "@/domain/nutrition/calculations";

interface AddMealItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealLog["mealType"];
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  onAddMealItem: (mealType: MealLog["mealType"], item: MealItemEntry) => Promise<void>;
}

export function AddMealItemDialog({
  isOpen,
  onClose,
  mealType,
  availableFoods,
  availableRecipes,
  onAddMealItem,
}: AddMealItemDialogProps) {
  const [activeTab, setActiveTab] = useState<"library" | "quick">("library");
  const [searchQuery, setSearchQuery] = useState("");

  // Library selection
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [portionGrams, setPortionGrams] = useState<string>("100");
  const [recipePortions, setRecipePortions] = useState<string>("1");

  // Quick entry
  const [quickName, setQuickName] = useState("");
  const [quickCalories, setQuickCalories] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");
  const [quickFiber, setQuickFiber] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered lists
  const filteredFoods = useMemo(() => {
    if (!searchQuery.trim()) return availableFoods;
    const q = searchQuery.toLowerCase().trim();
    return availableFoods.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        (f.brand ? f.brand.toLowerCase().includes(q) : false)
    );
  }, [availableFoods, searchQuery]);

  const filteredRecipes = useMemo(() => {
    if (!searchQuery.trim()) return availableRecipes;
    const q = searchQuery.toLowerCase().trim();
    return availableRecipes.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.description ? r.description.toLowerCase().includes(q) : false)
    );
  }, [availableRecipes, searchQuery]);

  // Selected item reference
  const selectedFood = useMemo(() => {
    return availableFoods.find((f) => f.id === selectedFoodId);
  }, [availableFoods, selectedFoodId]);

  const selectedRecipe = useMemo(() => {
    return availableRecipes.find((r) => r.id === selectedRecipeId);
  }, [availableRecipes, selectedRecipeId]);

  // Live calculation for food portion
  const foodCalculation = useMemo(() => {
    if (!selectedFood) return null;
    const grams = parseFloat(portionGrams.replace(",", ".")) || 0;
    return calculateNutritionForPortion(selectedFood, grams);
  }, [selectedFood, portionGrams]);

  // Live calculation for recipe portion
  const recipeCalculation = useMemo(() => {
    if (!selectedRecipe) return null;
    const count = parseFloat(recipePortions.replace(",", ".")) || 1;
    return {
      grams: Math.round((selectedRecipe.totalGrams / selectedRecipe.portions) * count),
      calories: Math.round(selectedRecipe.caloriesPerPortion * count),
      proteinGrams: Math.round(selectedRecipe.proteinPerPortion * count * 10) / 10,
      carbsGrams: Math.round(selectedRecipe.carbsPerPortion * count * 10) / 10,
      fatGrams: Math.round(selectedRecipe.fatPerPortion * count * 10) / 10,
      fiberGrams: Math.round(selectedRecipe.fiberPerPortion * count * 10) / 10,
    };
  }, [selectedRecipe, recipePortions]);

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFoodId(food.id);
    setSelectedRecipeId("");
    setPortionGrams(food.defaultPortionGrams.toString());
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setSelectedFoodId("");
    setRecipePortions("1");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (activeTab === "library") {
        if (selectedFood) {
          const grams = parseFloat(portionGrams.replace(",", "."));
          if (isNaN(grams) || grams <= 0) {
            throw new Error("Vul een geldig aantal grammen in.");
          }
          const calc = calculateNutritionForPortion(selectedFood, grams);
          const item: MealItemEntry = {
            foodItemId: selectedFood.id,
            foodName: selectedFood.name,
            portionGrams: Math.round(grams * 10) / 10,
            calories: calc.calories,
            proteinGrams: calc.proteinGrams,
            carbsGrams: calc.carbsGrams,
            fatGrams: calc.fatGrams,
            fiberGrams: calc.fiberGrams,
          };
          await onAddMealItem(mealType, item);
        } else if (selectedRecipe) {
          const count = parseFloat(recipePortions.replace(",", "."));
          if (isNaN(count) || count <= 0) {
            throw new Error("Vul een geldig aantal porties in.");
          }
          const calc = recipeCalculation!;
          const item: MealItemEntry = {
            foodItemId: selectedRecipe.id,
            foodName: `${selectedRecipe.name} (${count === 1 ? "1 portie" : `${count} porties`})`,
            portionGrams: calc.grams,
            calories: calc.calories,
            proteinGrams: calc.proteinGrams,
            carbsGrams: calc.carbsGrams,
            fatGrams: calc.fatGrams,
            fiberGrams: calc.fiberGrams,
          };
          await onAddMealItem(mealType, item);
        } else {
          throw new Error("Selecteer een product of recept uit de lijst.");
        }
      } else {
        // Snelle invoer
        if (!quickName.trim()) {
          throw new Error("Vul een naam in voor dit product.");
        }
        const cal = Number(quickCalories);
        if (isNaN(cal) || cal < 0) {
          throw new Error("Vul een geldig aantal calorieën in.");
        }
        const p = parseFloat(quickProtein.replace(",", ".")) || 0;
        const c = parseFloat(quickCarbs.replace(",", ".")) || 0;
        const f = parseFloat(quickFat.replace(",", ".")) || 0;
        const fib = parseFloat(quickFiber.replace(",", ".")) || 0;

        const item: MealItemEntry = {
          foodItemId: crypto.randomUUID(),
          foodName: quickName.trim(),
          portionGrams: 100,
          calories: Math.round(cal),
          proteinGrams: Math.round(p * 10) / 10,
          carbsGrams: Math.round(c * 10) / 10,
          fatGrams: Math.round(f * 10) / 10,
          fiberGrams: Math.round(fib * 10) / 10,
        };
        await onAddMealItem(mealType, item);
      }

      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij toevoegen van product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMealTitle = (type: MealLog["mealType"]) => {
    switch (type) {
      case "ontbijt":
        return "Ontbijt";
      case "lunch":
        return "Lunch";
      case "diner":
        return "Diner";
      case "snacks":
        return "Snacks & Tussendoor";
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Item toevoegen aan ${getMealTitle(mealType)}`}
      description="Kies een voedingsmiddel of recept uit je database of voer direct handmatig in."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <Tabs
          defaultValue="library"
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as "library" | "quick")}
          className="w-full"
        >
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="library" className="text-xs">
              Uit Bibliotheek &amp; Recepten
            </TabsTrigger>
            <TabsTrigger value="quick" className="text-xs">
              Snelle Vrije Invoer
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: Bibliotheek */}
          <TabsContent value="library" className="space-y-4 pt-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Zoek in voedingsmiddelen en recepten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
                autoFocus
              />
            </div>

            {/* Selectielijst */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
              {filteredFoods.length === 0 && filteredRecipes.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-4">
                  Geen overeenkomende producten of recepten gevonden.
                </p>
              ) : (
                <>
                  {/* Recepten sectie indien aanwezig */}
                  {filteredRecipes.length > 0 && (
                    <div className="pb-1">
                      <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider block mb-1">
                        Recepten
                      </span>
                      {filteredRecipes.map((r) => {
                        const isSelected = selectedRecipeId === r.id;
                        return (
                          <div
                            key={r.id}
                            onClick={() => handleSelectRecipe(r)}
                            className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-emerald-500/10 border border-emerald-500 text-emerald-950 dark:text-emerald-200"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="font-semibold">{r.name}</span>
                            </div>
                            <span className="font-bold text-slate-700 dark:text-slate-300">
                              {r.caloriesPerPortion} kcal/portie
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Voedingsmiddelen */}
                  {filteredFoods.length > 0 && (
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 px-2 uppercase tracking-wider block mb-1">
                        Voedingsmiddelen
                      </span>
                      {filteredFoods.map((f) => {
                        const isSelected = selectedFoodId === f.id;
                        return (
                          <div
                            key={f.id}
                            onClick={() => handleSelectFood(f)}
                            className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-colors ${
                              isSelected
                                ? "bg-emerald-500/10 border border-emerald-500 text-emerald-950 dark:text-emerald-200"
                                : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Apple className="w-3.5 h-3.5 text-emerald-500" />
                              <div>
                                <span className="font-semibold block">{f.name}</span>
                                {f.brand && (
                                  <span className="text-[10px] text-slate-400 block">{f.brand}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-700 dark:text-slate-300 block">
                                {f.caloriesPer100g} kcal
                              </span>
                              <span className="text-[10px] text-slate-400">per 100g</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Portie en Live Berekening */}
            {selectedFood && foodCalculation && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {selectedFood.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Standaard: {selectedFood.defaultPortionGrams}g
                    </span>
                  </div>

                  <div className="w-28">
                    <FormField id="food-grams" label="Gram">
                      <Input
                        id="food-grams"
                        type="number"
                        min="1"
                        max="5000"
                        value={portionGrams}
                        onChange={(e) => setPortionGrams(e.target.value)}
                        className="text-xs h-8 text-right"
                      />
                    </FormField>
                  </div>
                </div>

                {/* Berekende waarden preview */}
                <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Energie</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {foodCalculation.calories} kcal
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-emerald-500 block text-[10px]">Eiwit</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {foodCalculation.proteinGrams}g
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-amber-500 block text-[10px]">Koolh.</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {foodCalculation.carbsGrams}g
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-sky-500 block text-[10px]">Vet</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {foodCalculation.fatGrams}g
                    </span>
                  </div>
                </div>
              </div>
            )}

            {selectedRecipe && recipeCalculation && (
              <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {selectedRecipe.name}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Totaal recept: {selectedRecipe.totalGrams}g
                    </span>
                  </div>

                  <div className="w-28">
                    <FormField id="recipe-count" label="Porties">
                      <Input
                        id="recipe-count"
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="10"
                        value={recipePortions}
                        onChange={(e) => setRecipePortions(e.target.value)}
                        className="text-xs h-8 text-right"
                      />
                    </FormField>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5 text-center text-[11px]">
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-slate-400 block text-[10px]">Energie</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {recipeCalculation.calories} kcal
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-emerald-500 block text-[10px]">Eiwit</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {recipeCalculation.proteinGrams}g
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-amber-500 block text-[10px]">Koolh.</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {recipeCalculation.carbsGrams}g
                    </span>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-emerald-500/20">
                    <span className="text-sky-500 block text-[10px]">Vet</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {recipeCalculation.fatGrams}g
                    </span>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: Snelle Vrije Invoer */}
          <TabsContent value="quick" className="space-y-3 pt-2">
            <FormField id="quick-name" label="Product- of maaltijdnaam" required>
              <Input
                id="quick-name"
                placeholder="Bijv. Broodje carpaccio of Smoothie"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField id="quick-cal" label="Energie (kcal)" required>
                <Input
                  id="quick-cal"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={quickCalories}
                  onChange={(e) => setQuickCalories(e.target.value)}
                />
              </FormField>

              <FormField id="quick-protein" label="Eiwit (g)">
                <Input
                  id="quick-protein"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={quickProtein}
                  onChange={(e) => setQuickProtein(e.target.value)}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField id="quick-carbs" label="Koolhydraten (g)">
                <Input
                  id="quick-carbs"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={quickCarbs}
                  onChange={(e) => setQuickCarbs(e.target.value)}
                />
              </FormField>

              <FormField id="quick-fat" label="Vet (g)">
                <Input
                  id="quick-fat"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={quickFat}
                  onChange={(e) => setQuickFat(e.target.value)}
                />
              </FormField>

              <FormField id="quick-fiber" label="Vezels (g)">
                <Input
                  id="quick-fiber"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.0"
                  value={quickFiber}
                  onChange={(e) => setQuickFiber(e.target.value)}
                />
              </FormField>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button
            type="submit"
            isLoading={isSubmitting}
            disabled={activeTab === "library" && !selectedFood && !selectedRecipe}
          >
            Toevoegen aan {getMealTitle(mealType)}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
