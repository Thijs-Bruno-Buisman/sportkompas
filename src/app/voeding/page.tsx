"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Utensils, BookOpen, CalendarDays, BarChart3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { useDatabase } from "@/lib/db";
import type { MealLog, WaterLog, FoodItem, Recipe, MealItemEntry, Profile, PlannedMeal, CardioSession } from "@/types/database";
import { getLocalDateString, addDaysToDateString } from "@/domain/dates/calendar";
import { DailyNutritionView } from "@/components/modules/nutrition/DailyNutritionView";
import { FoodDatabaseView } from "@/components/modules/nutrition/FoodDatabaseView";
import { WeeklyMealPlannerView } from "@/components/modules/nutrition/WeeklyMealPlannerView";
import { NutritionHistoryCharts } from "@/components/modules/nutrition/NutritionHistoryCharts";
import type { RecentMealItemSummary } from "@/domain/nutrition/quickLog";
import { type DailyNutritionTargets, DEFAULT_NUTRITION_TARGETS } from "@/domain/nutrition/goals";

export default function VoedingPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [activeTab, setActiveTab] = useState<"logboek" | "weekplanning" | "trends" | "database">("logboek");
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateString());

  const [waterMl, setWaterMl] = useState(0);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [recentItems, setRecentItems] = useState<RecentMealItemSummary[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nutritionTargets, setNutritionTargets] = useState<DailyNutritionTargets>(DEFAULT_NUTRITION_TARGETS);
  const [isLoading, setIsLoading] = useState(true);

  // Historische data voor Trends & Balans
  const [historyMeals, setHistoryMeals] = useState<MealLog[]>([]);
  const [historyWater, setHistoryWater] = useState<WaterLog[]>([]);
  const [historyCardio, setHistoryCardio] = useState<CardioSession[]>([]);

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

  // Laad geschiedenisdata voor trends en wekelijkse balans
  const loadHistoryData = useCallback(async () => {
    try {
      const startDate = addDaysToDateString(selectedDate, -90);
      const endDate = addDaysToDateString(selectedDate, 31);

      const [meals, water, cardio] = await Promise.all([
        repositories.nutrition.getMealsForDateRange(startDate, endDate),
        repositories.nutrition.getWaterLogsForDateRange(startDate, endDate),
        repositories.cardio.getSessionsByDateRange(startDate, endDate),
      ]);

      setHistoryMeals(meals);
      setHistoryWater(water);
      setHistoryCardio(cardio);
    } catch (err) {
      console.error("Fout bij laden van trendsgeschiedenis:", err);
    }
  }, [repositories, selectedDate]);

  useEffect(() => {
    loadNutritionForDate(selectedDate);
  }, [loadNutritionForDate, selectedDate, isDemoMode, dataVersion]);

  useEffect(() => {
    if (activeTab === "trends") {
      loadHistoryData();
    }
  }, [activeTab, loadHistoryData, dataVersion]);

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

  const handleSaveExternalFood = async (external: any) => {
    const saved = await repositories.nutrition.saveExternalFoodItem(external);
    const updated = await repositories.nutrition.getAllFoods();
    setFoods(updated);
    return saved;
  };

  const handleLookupLocalBarcode = async (barcode: string) => {
    return await repositories.nutrition.getFoodByBarcode(barcode);
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
            Dagelijks voedingsdagboek, weekplanning, trends &amp; macro-balans en database.
          </p>
        </div>
      </div>

      {/* Hoofdtabbladen: Logboek vs Weekplanning vs Trends & Balans vs Database */}
      <Tabs
        defaultValue="logboek"
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as "logboek" | "weekplanning" | "trends" | "database")}
        className="w-full space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl">
          <TabsTrigger value="logboek" className="flex items-center gap-1.5">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Dagboek</span>
          </TabsTrigger>
          <TabsTrigger value="weekplanning" className="flex items-center gap-1.5">
            <CalendarDays className="w-4 h-4 text-emerald-500" />
            <span>Weekplanning</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1.5">
            <BarChart3 className="w-4 h-4 text-emerald-500" />
            <span>Trends &amp; Balans</span>
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
            onSaveExternalFood={handleSaveExternalFood}
            onLookupLocalBarcode={handleLookupLocalBarcode}
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

        {/* Tab 3: Trends, Voedingsgrafieken & Wekelijkse Balans */}
        <TabsContent value="trends" className="space-y-6">
          <NutritionHistoryCharts
            mealLogs={historyMeals}
            waterLogs={historyWater}
            cardioSessions={historyCardio}
            targets={nutritionTargets}
            referenceDate={selectedDate}
            onNavigateToDiary={(date) => {
              setSelectedDate(date);
              setActiveTab("logboek");
            }}
          />
        </TabsContent>

        {/* Tab 4: Voedingsdatabase & Recepten */}
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
            onSaveExternalFood={handleSaveExternalFood}
            onLookupLocalBarcode={handleLookupLocalBarcode}
            isDemoMode={isDemoMode}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
