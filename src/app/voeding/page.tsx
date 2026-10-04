"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Utensils, BookOpen, CalendarDays } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useDatabase } from "@/lib/db";
import type { MealLog, WaterLog, FoodItem, Recipe, MealItemEntry, Profile, PlannedMeal } from "@/types/database";
import { getLocalDateString, addDaysToDateString } from "@/domain/dates/calendar";
import { DailyNutritionView } from "@/components/modules/nutrition/DailyNutritionView";
import { FoodDatabaseView } from "@/components/modules/nutrition/FoodDatabaseView";
import { WeeklyMealPlannerView } from "@/components/modules/nutrition/WeeklyMealPlannerView";
import type { RecentMealItemSummary } from "@/domain/nutrition/quickLog";
import { type DailyNutritionTargets, DEFAULT_NUTRITION_TARGETS } from "@/domain/nutrition/goals";

export default function VoedingPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [activeTab, setActiveTab] = useState<"logboek" | "weekplanning" | "database">("logboek");
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  const [waterMl, setWaterMl] = useState(0);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentItems, setRecentItems] = useState<RecentMealItemSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nutritionTargets, setNutritionTargets] = useState<DailyNutritionTargets>(DEFAULT_NUTRITION_TARGETS);
  const [isLoading, setIsLoading] = useState(true);

  // Laad voedingsdata voor de geselecteerde kalenderdag
  const loadNutritionForDate = useCallback(async (date: string) => {
    setIsLoading(true);
    try {
      await repositories.nutrition.ensureDefaultFoods();

      const [meals, waterLogs, allFoods, allRecipes, recents, userProfile] = await Promise.all([
        repositories.nutrition.getMealsByDate(date),
        repositories.nutrition.getWaterLogsByDate(date),
        repositories.nutrition.getAllFoods(),
        repositories.nutrition.getAllRecipes(),
        repositories.nutrition.getRecentMealItems(20),
        repositories.profile.getCurrentProfile(),
      ]);

      const totalWater = waterLogs.reduce((acc: number, w: WaterLog) => acc + w.amountMl, 0);
      const targets = await repositories.settings.getNutritionTargets(userProfile);

      setMealLogs(meals);
      setWaterMl(totalWater);
      setFoods(allFoods);
      setRecipes(allRecipes);
      setRecentItems(recents);
      setProfile(userProfile);
      setNutritionTargets(targets);
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
    const [updatedMeals, recents] = await Promise.all([
      repositories.nutrition.getMealsByDate(selectedDate),
      repositories.nutrition.getRecentMealItems(20),
    ]);
    setMealLogs(updatedMeals);
    setRecentItems(recents);
  };

  const handleEditMealItem = async (
    logId: string,
    itemIndex: number,
    updatedItem: MealItemEntry
  ) => {
    await repositories.nutrition.updateItemInMeal(logId, itemIndex, updatedItem);
    const [updatedMeals, recents] = await Promise.all([
      repositories.nutrition.getMealsByDate(selectedDate),
      repositories.nutrition.getRecentMealItems(20),
    ]);
    setMealLogs(updatedMeals);
    setRecentItems(recents);
  };

  const handleDeleteMealItem = async (logId: string, itemIndex: number) => {
    await repositories.nutrition.deleteItemFromMeal(logId, itemIndex);
    const [updatedMeals, recents] = await Promise.all([
      repositories.nutrition.getMealsByDate(selectedDate),
      repositories.nutrition.getRecentMealItems(20),
    ]);
    setMealLogs(updatedMeals);
    setRecentItems(recents);
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

  // Snelle kopieeracties
  const handleCopyMealFromYesterday = async (mealType: MealLog["mealType"]) => {
    const yesterday = addDaysToDateString(selectedDate, -1);
    await repositories.nutrition.copyMealFromDate(yesterday, selectedDate, mealType);
    const [updatedMeals, recents] = await Promise.all([
      repositories.nutrition.getMealsByDate(selectedDate),
      repositories.nutrition.getRecentMealItems(20),
    ]);
    setMealLogs(updatedMeals);
    setRecentItems(recents);
  };

  const handleCopyAllMealsFromYesterday = async () => {
    const yesterday = addDaysToDateString(selectedDate, -1);
    await repositories.nutrition.copyAllMealsFromDate(yesterday, selectedDate);
    const [updatedMeals, recents] = await Promise.all([
      repositories.nutrition.getMealsByDate(selectedDate),
      repositories.nutrition.getRecentMealItems(20),
    ]);
    setMealLogs(updatedMeals);
    setRecentItems(recents);
  };

  const handleSaveMealAsRecipe = async (
    mealLogId: string,
    recipeName: string,
    portions: number
  ) => {
    await repositories.nutrition.saveMealAsRecipe(mealLogId, recipeName, portions);
    const updatedRecipes = await repositories.nutrition.getAllRecipes();
    setRecipes(updatedRecipes);
  };

  // Handler voor Voedingsdoelen
  const handleSaveNutritionTargets = async (newTargets: DailyNutritionTargets) => {
    await repositories.settings.updateNutritionTargets(newTargets);
    setNutritionTargets(newTargets);
  };

  // Handlers voor Weekplanning & Maaltijdplanner (Prompt 24 / Stap 29)
  const handleGetPlannedMealsForRange = async (start: string, end: string) => {
    return await repositories.nutrition.getPlannedMealsForRange(start, end);
  };

  const handlePlanMeal = async (
    mealData: Omit<PlannedMeal, "id" | "createdAt" | "provenance">
  ) => {
    return await repositories.nutrition.planMeal(mealData);
  };

  const handleDeletePlannedMeal = async (id: string) => {
    await repositories.nutrition.deletePlannedMeal(id);
  };

  const handleMarkPlannedMealAsConsumed = async (id: string) => {
    const result = await repositories.nutrition.markPlannedMealAsConsumed(id);
    await loadNutritionForDate(selectedDate);
    return result;
  };

  const handleCopyPlannedMealsToDate = async (source: string, target: string) => {
    return await repositories.nutrition.copyPlannedMealsToDate(source, target);
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
            Dagelijks voedingsdagboek, doelbalans, weekplanning en meal prep.
          </p>
        </div>
      </div>

      {/* Hoofdtabbladen: Logboek vs Weekplanning vs Database */}
      <Tabs
        defaultValue="logboek"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "logboek" | "weekplanning" | "database")}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3 max-w-xl">
          <TabsTrigger value="logboek" className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Dagboek</span>
          </TabsTrigger>
          <TabsTrigger value="weekplanning" className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
            <span>Weekplanning</span>
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-emerald-500" />
            <span>Database</span>
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
            recentItems={recentItems}
            nutritionTargets={nutritionTargets}
            profile={profile}
            onAddMealItem={handleAddMealItem}
            onEditMealItem={handleEditMealItem}
            onDeleteMealItem={handleDeleteMealItem}
            onAddWater={handleAddWater}
            onResetWater={handleResetWater}
            onCopyMealFromYesterday={handleCopyMealFromYesterday}
            onCopyAllMealsFromYesterday={handleCopyAllMealsFromYesterday}
            onSaveMealAsRecipe={handleSaveMealAsRecipe}
            onSaveNutritionTargets={handleSaveNutritionTargets}
          />
        </TabsContent>

        {/* Tab 2: Weekplanning & Meal Prep */}
        <TabsContent value="weekplanning" className="space-y-6">
          <WeeklyMealPlannerView
            availableFoods={foods}
            availableRecipes={recipes}
            nutritionTargets={nutritionTargets}
            onGetPlannedMealsForRange={handleGetPlannedMealsForRange}
            onPlanMeal={handlePlanMeal}
            onDeletePlannedMeal={handleDeletePlannedMeal}
            onMarkPlannedMealAsConsumed={handleMarkPlannedMealAsConsumed}
            onCopyPlannedMealsToDate={handleCopyPlannedMealsToDate}
            onRefreshDiary={() => loadNutritionForDate(selectedDate)}
          />
        </TabsContent>

        {/* Tab 3: Voedingsdatabase & Recepten */}
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
