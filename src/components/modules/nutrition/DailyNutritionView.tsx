"use client";

import React, { useState, useMemo } from "react";
import type { FoodItem, Recipe, MealLog, MealItemEntry } from "@/types/database";
import { DailyNutritionHeader } from "./DailyNutritionHeader";
import { DailyWaterWidget } from "./DailyWaterWidget";
import { MealSectionCard } from "./MealSectionCard";
import { AddMealItemDialog } from "./AddMealItemDialog";
import { EditMealItemDialog } from "./EditMealItemDialog";
import { SaveMealAsRecipeDialog } from "./SaveMealAsRecipeDialog";
import {
  calculateDailyTotals,
  groupLogsByMealType,
  MEAL_TYPES,
  type MealTypeSummary,
} from "@/domain/nutrition/diary";
import type { RecentMealItemSummary } from "@/domain/nutrition/quickLog";

interface DailyNutritionViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  mealLogs: MealLog[];
  waterMl: number;
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  recentItems?: RecentMealItemSummary[];
  onAddMealItem: (mealType: MealLog["mealType"], item: MealItemEntry) => Promise<void>;
  onEditMealItem: (logId: string, itemIndex: number, updatedItem: MealItemEntry) => Promise<void>;
  onDeleteMealItem: (logId: string, itemIndex: number) => Promise<void>;
  onAddWater: (amountMl: number) => Promise<void>;
  onResetWater: () => Promise<void>;
  onCopyMealFromYesterday?: (mealType: MealLog["mealType"]) => Promise<void>;
  onCopyAllMealsFromYesterday?: () => Promise<void>;
  onSaveMealAsRecipe?: (mealLogId: string, recipeName: string, portions: number) => Promise<void>;
}

export function DailyNutritionView({
  selectedDate,
  onDateChange,
  mealLogs,
  waterMl,
  availableFoods,
  availableRecipes,
  recentItems = [],
  onAddMealItem,
  onEditMealItem,
  onDeleteMealItem,
  onAddWater,
  onResetWater,
  onCopyMealFromYesterday,
  onCopyAllMealsFromYesterday,
  onSaveMealAsRecipe,
}: DailyNutritionViewProps) {
  // Modal states
  const [activeMealForAdd, setActiveMealForAdd] = useState<MealLog["mealType"] | null>(null);
  const [itemToEdit, setItemToEdit] = useState<{
    logId: string;
    itemIndex: number;
    item: MealItemEntry;
  } | null>(null);
  const [mealToSaveAsRecipe, setMealToSaveAsRecipe] = useState<MealTypeSummary | null>(null);

  // Group logs and calculate daily totals
  const dailyTotals = useMemo(() => {
    return calculateDailyTotals(mealLogs);
  }, [mealLogs]);

  const mealSummaries = useMemo(() => {
    return groupLogsByMealType(mealLogs);
  }, [mealLogs]);

  const handleOpenAddDialog = (mealType: MealLog["mealType"]) => {
    setActiveMealForAdd(mealType);
  };

  const handleOpenEditDialog = (
    logId: string,
    itemIndex: number,
    item: MealItemEntry
  ) => {
    setItemToEdit({ logId, itemIndex, item });
  };

  const handleSaveEditedItem = async (updatedItem: MealItemEntry) => {
    if (!itemToEdit) return;
    await onEditMealItem(itemToEdit.logId, itemToEdit.itemIndex, updatedItem);
    setItemToEdit(null);
  };

  return (
    <div className="space-y-6">
      {/* Datum Navigatie & Macro Cockpit */}
      <DailyNutritionHeader
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        totals={dailyTotals}
        onCopyYesterday={onCopyAllMealsFromYesterday}
      />

      {/* Waterinname Widget */}
      <DailyWaterWidget
        waterMl={waterMl}
        onAddWater={onAddWater}
        onResetWater={onResetWater}
      />

      {/* De 4 Maaltijdmomenten */}
      <div className="space-y-4">
        {MEAL_TYPES.map((meal) => (
          <MealSectionCard
            key={meal.id}
            summary={mealSummaries[meal.id]}
            onAddItem={handleOpenAddDialog}
            onEditItem={handleOpenEditDialog}
            onDeleteItem={onDeleteMealItem}
            onCopyFromYesterday={onCopyMealFromYesterday}
            onSaveAsRecipe={onSaveMealAsRecipe ? (sum) => setMealToSaveAsRecipe(sum) : undefined}
          />
        ))}
      </div>

      {/* Item Toevoegen Dialog met 4 tabs & snelle porties */}
      {activeMealForAdd && (
        <AddMealItemDialog
          isOpen={Boolean(activeMealForAdd)}
          onClose={() => setActiveMealForAdd(null)}
          mealType={activeMealForAdd}
          availableFoods={availableFoods}
          availableRecipes={availableRecipes}
          recentItems={recentItems}
          onAddMealItem={onAddMealItem}
        />
      )}

      {/* Portie Bewerken Dialog */}
      {itemToEdit && (
        <EditMealItemDialog
          isOpen={Boolean(itemToEdit)}
          onClose={() => setItemToEdit(null)}
          item={itemToEdit.item}
          onSave={handleSaveEditedItem}
        />
      )}

      {/* Maaltijd Opslaan als Recept Dialog */}
      {mealToSaveAsRecipe && onSaveMealAsRecipe && (
        <SaveMealAsRecipeDialog
          isOpen={Boolean(mealToSaveAsRecipe)}
          onClose={() => setMealToSaveAsRecipe(null)}
          summary={mealToSaveAsRecipe}
          onSaveAsRecipe={onSaveMealAsRecipe}
        />
      )}
    </div>
  );
}
