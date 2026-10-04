"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Utensils, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useDatabase } from "@/lib/db";
import type { MealLog, WaterLog, FoodItem, Recipe, MealItemEntry } from "@/types/database";
import { getLocalDateString } from "@/domain/dates/calendar";
import { DailyNutritionView } from "@/components/modules/nutrition/DailyNutritionView";
import { FoodDatabaseView } from "@/components/modules/nutrition/FoodDatabaseView";

export default function VoedingPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [activeTab, setActiveTab] = useState<"logboek" | "database">("logboek");
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  const [waterMl, setWaterMl] = useState(0);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Laad voedingsdata voor de geselecteerde kalenderdag
  const loadNutritionForDate = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      await repositories.nutrition.ensureDefaultFoods();

      const [meals, waterLogs, allFoods, allRecipes] = await Promise.all([
        repositories.nutrition.getMealsByDate(date),
        repositories.nutrition.getWaterLogsByDate(date),
        repositories.nutrition.getAllFoods(),
        repositories.nutrition.getAllRecipes(),
      ]);

      const totalWater = waterLogs.reduce((acc: number, w: WaterLog) => acc + w.amountMl, 0);

      setMealLogs(meals);
      setWaterMl(totalWater);
      setFoods(allFoods);
      setRecipes(allRecipes);
    } catch (err) {
      console.error("Fout bij laden van voeding:", err);
    } finally {
      setIsLoading(false);
    }
  }, [repositories]);

  useEffect(() => {
    loadNutritionForDate(selectedDate);
  }, [loadNutritionForDate, selectedDate, isDemoMode, dataVersion]);

  // Handlers voor maaltijditems
  const handleAddMealItem = async (
    mealType: MealLog["mealType"],
    item: MealItemEntry
  ) => {
    await repositories.nutrition.addItemToMeal(selectedDate, mealType, item);
    const updatedMeals = await repositories.nutrition.getMealsByDate(selectedDate);
    setMealLogs(updatedMeals);
  };

  const handleEditMealItem = async (
    logId: string,
    itemIndex: number,
    updatedItem: MealItemEntry
  ) => {
    await repositories.nutrition.updateItemInMeal(logId, itemIndex, updatedItem);
    const updatedMeals = await repositories.nutrition.getMealsByDate(selectedDate);
    setMealLogs(updatedMeals);
  };

  const handleDeleteMealItem = async (logId: string, itemIndex: number) => {
    await repositories.nutrition.deleteItemFromMeal(logId, itemIndex);
    const updatedMeals = await repositories.nutrition.getMealsByDate(selectedDate);
    setMealLogs(updatedMeals);
  };

  // Water handlers
  const handleAddWater = async (amount: number) => {
    await repositories.nutrition.logWater(selectedDate, amount);
    const total = await repositories.nutrition.getTotalWaterMlByDate(selectedDate);
    setWaterMl(total);
  };

  const handleResetWater = async () => {
    await repositories.nutrition.resetWaterByDate(selectedDate);
    setWaterMl(0);
  };

  // Handlers voor Voedingsdatabase & Recepten
  const handleSaveFood = async (food: FoodItem) => {
    await repositories.nutrition.foods.save(food);
    const updated = await repositories.nutrition.getAllFoods();
    setFoods(updated);
  };

  const handleDeleteFood = async (id: string) => {
    await repositories.nutrition.deleteCustomFood(id);
    const updated = await repositories.nutrition.getAllFoods();
    setFoods(updated);
  };

  const handleToggleFavoriteFood = async (id: string) => {
    await repositories.nutrition.toggleFavoriteFood(id);
    const updated = await repositories.nutrition.getAllFoods();
    setFoods(updated);
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    await repositories.nutrition.recipes.save(recipe);
    const updated = await repositories.nutrition.getAllRecipes();
    setRecipes(updated);
  };

  const handleDeleteRecipe = async (id: string) => {
    await repositories.nutrition.deleteRecipe(id);
    const updated = await repositories.nutrition.getAllRecipes();
    setRecipes(updated);
  };

  const handleToggleFavoriteRecipe = async (id: string) => {
    await repositories.nutrition.toggleFavoriteRecipe(id);
    const updated = await repositories.nutrition.getAllRecipes();
    setRecipes(updated);
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-6 h-6 text-emerald-500" />
            Voeding &amp; Macro&apos;s
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Dagelijks voedingsdagboek, macro-analyses, waterinname en receptenbeheer.
          </p>
        </div>
      </div>

      {/* Hoofdtabbladen: Logboek vs Database */}
      <Tabs
        defaultValue="logboek"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "logboek" | "database")}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="logboek" className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-500" />
            Dagboek &amp; Loggen
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            Voedingsdatabase &amp; Recepten
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Dagboek & Loggen */}
        <TabsContent value="logboek" className="space-y-6">
          <DailyNutritionView
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            mealLogs={mealLogs}
            waterMl={waterMl}
            availableFoods={foods}
            availableRecipes={recipes}
            onAddMealItem={handleAddMealItem}
            onEditMealItem={handleEditMealItem}
            onDeleteMealItem={handleDeleteMealItem}
            onAddWater={handleAddWater}
            onResetWater={handleResetWater}
          />
        </TabsContent>

        {/* Tab 2: Voedingsdatabase & Recepten */}
        <TabsContent value="database" className="space-y-6">
          <FoodDatabaseView
            foods={foods}
            recipes={recipes}
            onSaveFood={handleSaveFood}
            onDeleteFood={handleDeleteFood}
            onToggleFavoriteFood={handleToggleFavoriteFood}
            onSaveRecipe={handleSaveRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            onToggleFavoriteRecipe={handleToggleFavoriteRecipe}
            isDemoMode={isDemoMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

