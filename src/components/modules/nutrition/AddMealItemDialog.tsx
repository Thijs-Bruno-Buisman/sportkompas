"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Apple,
  UtensilsCrossed,
  Sparkles,
  Clock,
  Star,
  Check,
} from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { FoodItem, Recipe, MealLog, MealItemEntry } from "@/types/database";
import { calculateNutritionForPortion } from "@/domain/nutrition/calculations";
import {
  type RecentMealItemSummary,
  getQuickPortionOptions,
} from "@/domain/nutrition/quickLog";

interface AddMealItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mealType: MealLog["mealType"];
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  recentItems?: RecentMealItemSummary[];
  onAddMealItem: (mealType: MealLog["mealType"], item: MealItemEntry) => Promise<void>;
}

type TabType = "recent" | "favorites" | "library" | "quick";

export function AddMealItemDialog({
  isOpen,
  onClose,
  mealType,
  availableFoods,
  availableRecipes,
  recentItems = [],
  onAddMealItem,
}: AddMealItemDialogProps) {
  // Bepaal initiële tab: Recent indien aanwezig, anders Library
  const initialTab: TabType = recentItems.length > 0 ? "recent" : "library";
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [searchQuery, setSearchQuery] = useState("");

  // Selectie status
  const [selectedFoodId, setSelectedFoodId] = useState<string>("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>("");
  const [portionGrams, setPortionGrams] = useState<string>("100");
  const [recipePortions, setRecipePortions] = useState<string>("1");

  // Snelle handmatige invoer
  const [quickName, setQuickName] = useState("");
  const [quickCalories, setQuickCalories] = useState("");
  const [quickProtein, setQuickProtein] = useState("");
  const [quickCarbs, setQuickCarbs] = useState("");
  const [quickFat, setQuickFat] = useState("");
  const [quickFiber, setQuickFiber] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Favorieten
  const favoriteFoods = useMemo(() => {
    return availableFoods.filter((f) => f.isFavorite);
  }, [availableFoods]);

  const favoriteRecipes = useMemo(() => {
    return availableRecipes.filter((r) => r.isFavorite);
  }, [availableRecipes]);

  // Gefilterde lijsten voor Library zoeken
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

  // Geselecteerde referenties
  const selectedFood = useMemo(() => {
    return availableFoods.find((f) => f.id === selectedFoodId);
  }, [availableFoods, selectedFoodId]);

  const selectedRecipe = useMemo(() => {
    return availableRecipes.find((r) => r.id === selectedRecipeId);
  }, [availableRecipes, selectedRecipeId]);

  // Snelle portiepreset opties voor geselecteerd voedingsmiddel
  const foodPortionOptions = useMemo(() => {
    if (!selectedFood) return [];
    return getQuickPortionOptions(selectedFood.defaultPortionGrams);
  }, [selectedFood]);

  // Live berekening voor voedingsmiddel
  const foodCalculation = useMemo(() => {
    if (!selectedFood) return null;
    const grams = parseFloat(portionGrams.replace(",", ".")) || 0;
    return calculateNutritionForPortion(selectedFood, grams);
  }, [selectedFood, portionGrams]);

  // Live berekening voor recept
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

  const handleSelectFood = (food: FoodItem, defaultGrams?: number) => {
    setSelectedFoodId(food.id);
    setSelectedRecipeId("");
    setPortionGrams((defaultGrams || food.defaultPortionGrams).toString());
  };

  const handleSelectRecipe = (recipe: Recipe) => {
    setSelectedRecipeId(recipe.id);
    setSelectedFoodId("");
    setRecipePortions("1");
  };

  const handleSelectRecent = (recent: RecentMealItemSummary) => {
    // Kijk of het een bestaand voedingsmiddel is
    const matchedFood = availableFoods.find((f) => f.id === recent.foodItemId || f.name.toLowerCase() === recent.foodName.toLowerCase());
    if (matchedFood) {
      handleSelectFood(matchedFood, recent.lastPortionGrams);
      return;
    }

    // Kijk of het een recept is
    const matchedRecipe = availableRecipes.find((r) => r.id === recent.foodItemId || r.name.toLowerCase() === recent.foodName.toLowerCase());
    if (matchedRecipe) {
      handleSelectRecipe(matchedRecipe);
      return;
    }

    // Anders vullen we snelle handmatige invoer vooraf in
    setActiveTab("quick");
    setQuickName(recent.foodName);
    setQuickCalories(recent.lastCalories.toString());
    setQuickProtein(recent.lastProteinGrams.toString());
    setQuickCarbs(recent.lastCarbsGrams.toString());
    setQuickFat(recent.lastFatGrams.toString());
    setQuickFiber(recent.lastFiberGrams.toString());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (activeTab === "quick") {
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
      } else {
        // Recent, Favorites of Library
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
          throw new Error("Selecteer een product of recept om toe te voegen.");
        }
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
      title={`Product Toevoegen aan ${getMealTitle(mealType)}`}
      description="Kies uit je recente items, favorieten, de complete bibliotheek of voer snel handmatig in."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error">
            <span>{errorMessage}</span>
          </Alert>
        )}

        {/* 4 Tabs: Recent, Favorieten, Database, Handmatig */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab("recent")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-colors ${
              activeTab === "recent"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="truncate">Recent</span>
            {recentItems.length > 0 && (
              <span className="hidden sm:inline-block text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
                {recentItems.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("favorites")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-colors ${
              activeTab === "favorites"
                ? "bg-white dark:bg-slate-900 text-amber-500 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Star className="w-3.5 h-3.5" />
            <span className="truncate">Favorieten</span>
            {(favoriteFoods.length > 0 || favoriteRecipes.length > 0) && (
              <span className="hidden sm:inline-block text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded-full">
                {favoriteFoods.length + favoriteRecipes.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("library")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-colors ${
              activeTab === "library"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span className="truncate">Database</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("quick")}
            className={`flex items-center justify-center gap-1.5 py-2 px-1 rounded-lg transition-colors ${
              activeTab === "quick"
                ? "bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="truncate">Handmatig</span>
          </button>
        </div>

        {/* Tab 1: Recent */}
        {activeTab === "recent" && (
          <div className="space-y-3">
            {recentItems.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Nog geen recent gelogde items.</p>
                <p className="mt-1">Kies hierboven &apos;Database&apos; of &apos;Favorieten&apos; om producten toe te voegen.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
                {recentItems.map((recent, idx) => {
                  const isFoodSelected = selectedFood && (selectedFood.id === recent.foodItemId || selectedFood.name.toLowerCase() === recent.foodName.toLowerCase());
                  const isRecipeSelected = selectedRecipe && (selectedRecipe.id === recent.foodItemId || selectedRecipe.name.toLowerCase() === recent.foodName.toLowerCase());
                  const isSelected = Boolean(isFoodSelected || isRecipeSelected);

                  return (
                    <div
                      key={idx}
                      onClick={() => handleSelectRecent(recent)}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs flex items-center justify-between transition-colors ${
                        isSelected
                          ? "bg-emerald-500/10 border border-emerald-500 text-emerald-950 dark:text-emerald-200"
                          : "hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <div>
                          <span className="font-semibold block">{recent.foodName}</span>
                          <span className="text-[10px] text-slate-400">
                            Laatst: {recent.lastPortionGrams}g &bull; {recent.timesLogged}x gelogd
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block">
                          {recent.lastCalories} kcal
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {recent.lastProteinGrams}g E
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Favorieten */}
        {activeTab === "favorites" && (
          <div className="space-y-3">
            {favoriteFoods.length === 0 && favoriteRecipes.length === 0 ? (
              <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs">
                <Star className="w-8 h-8 mx-auto mb-2 opacity-40 text-amber-500" />
                <p>Nog geen favoriete producten of recepten gemarkeerd.</p>
                <p className="mt-1">Klik op de ster bij een product in de database om het direct hier te tonen.</p>
              </div>
            ) : (
              <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
                {favoriteRecipes.length > 0 && (
                  <div className="pb-1">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 px-2 uppercase tracking-wider block mb-1">
                      Favoriete Recepten
                    </span>
                    {favoriteRecipes.map((r) => {
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
                            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-500" />
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

                {favoriteFoods.length > 0 && (
                  <div>
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 px-2 uppercase tracking-wider block mb-1">
                      Favoriete Producten
                    </span>
                    {favoriteFoods.map((f) => {
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
                            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                            <div>
                              <span className="font-semibold block">{f.name}</span>
                              {f.brand && <span className="text-[10px] text-slate-400">{f.brand}</span>}
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
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Database & Recepten Zoeken */}
        {activeTab === "library" && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Zoek in voedingsmiddelen en recepten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 text-xs"
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-800 rounded-xl p-2 bg-slate-50/50 dark:bg-slate-950/40">
              {filteredFoods.length === 0 && filteredRecipes.length === 0 ? (
                <p className="text-xs text-center text-slate-400 py-4">
                  Geen overeenkomende producten of recepten gevonden.
                </p>
              ) : (
                <>
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
                                {f.brand && <span className="text-[10px] text-slate-400">{f.brand}</span>}
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
          </div>
        )}

        {/* Geselecteerd product: Snelle portieknoppen & Live Preview */}
        {activeTab !== "quick" && selectedFood && foodCalculation && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {selectedFood.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  Standaard portie: {selectedFood.defaultPortionGrams}g
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
                    className="text-center font-bold text-xs"
                  />
                </FormField>
              </div>
            </div>

            {/* Snelle portiekeuzeknoppen */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Snelle portiekeuze:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {foodPortionOptions.map((opt) => (
                  <button
                    key={opt.grams}
                    type="button"
                    onClick={() => setPortionGrams(opt.grams.toString())}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      portionGrams === opt.grams.toString()
                        ? "bg-emerald-500 text-white border-emerald-600 font-bold"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Live voedingswaarden balk */}
            <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-5 gap-1 text-center">
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Kcal</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {foodCalculation.calories}
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Eiwit</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {foodCalculation.proteinGrams}g
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Koolh</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {foodCalculation.carbsGrams}g
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Vet</span>
                <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                  {foodCalculation.fatGrams}g
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Vezels</span>
                <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                  {foodCalculation.fiberGrams}g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Geselecteerd Recept: Snelle portiekeuze & Live Preview */}
        {activeTab !== "quick" && selectedRecipe && recipeCalculation && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-500/20 space-y-2.5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  {selectedRecipe.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  Totaal {selectedRecipe.totalGrams}g ({recipeCalculation.grams}g per selectie)
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
                    className="text-center font-bold text-xs"
                  />
                </FormField>
              </div>
            </div>

            {/* Snelle porties voor recept */}
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">
                Snelle portiekeuze:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[0.5, 1, 1.5, 2].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setRecipePortions(p.toString())}
                    className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
                      recipePortions === p.toString()
                        ? "bg-emerald-500 text-white border-emerald-600 font-bold"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
                    }`}
                  >
                    {p} portie{p > 1 ? "s" : ""}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-emerald-500/20 grid grid-cols-5 gap-1 text-center">
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Kcal</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {recipeCalculation.calories}
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Eiwit</span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                  {recipeCalculation.proteinGrams}g
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Koolh</span>
                <span className="text-xs font-extrabold text-amber-600 dark:text-amber-400">
                  {recipeCalculation.carbsGrams}g
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Vet</span>
                <span className="text-xs font-extrabold text-sky-600 dark:text-sky-400">
                  {recipeCalculation.fatGrams}g
                </span>
              </div>
              <div className="bg-white/70 dark:bg-slate-900/60 p-1.5 rounded-lg">
                <span className="text-[10px] text-slate-400 block">Vezels</span>
                <span className="text-xs font-extrabold text-purple-600 dark:text-purple-400">
                  {recipeCalculation.fiberGrams}g
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Snelle Handmatige Invoer */}
        {activeTab === "quick" && (
          <div className="space-y-3 bg-slate-50/50 dark:bg-slate-950/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <FormField label="Naam / Omschrijving" id="quick-name" required>
              <Input
                id="quick-name"
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                placeholder="bijv. Eiwitshake banaan of Broodje kip"
                className="text-xs"
                autoFocus
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Calorieën (kcal)" id="quick-cal" required>
                <Input
                  id="quick-cal"
                  type="number"
                  min="0"
                  max="10000"
                  value={quickCalories}
                  onChange={(e) => setQuickCalories(e.target.value)}
                  placeholder="0"
                  className="text-xs font-bold"
                />
              </FormField>

              <FormField label="Eiwitten (g)" id="quick-protein">
                <Input
                  id="quick-protein"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickProtein}
                  onChange={(e) => setQuickProtein(e.target.value)}
                  placeholder="0.0"
                  className="text-xs"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <FormField label="Koolhydraten (g)" id="quick-carbs">
                <Input
                  id="quick-carbs"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickCarbs}
                  onChange={(e) => setQuickCarbs(e.target.value)}
                  placeholder="0.0"
                  className="text-xs"
                />
              </FormField>

              <FormField label="Vetten (g)" id="quick-fat">
                <Input
                  id="quick-fat"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickFat}
                  onChange={(e) => setQuickFat(e.target.value)}
                  placeholder="0.0"
                  className="text-xs"
                />
              </FormField>

              <FormField label="Vezels (g)" id="quick-fiber">
                <Input
                  id="quick-fiber"
                  type="number"
                  step="0.1"
                  min="0"
                  value={quickFiber}
                  onChange={(e) => setQuickFiber(e.target.value)}
                  placeholder="0.0"
                  className="text-xs"
                />
              </FormField>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" />}
            disabled={
              (activeTab !== "quick" && !selectedFood && !selectedRecipe) ||
              (activeTab === "quick" && (!quickName.trim() || !quickCalories))
            }
          >
            Toevoegen aan {getMealTitle(mealType)}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
