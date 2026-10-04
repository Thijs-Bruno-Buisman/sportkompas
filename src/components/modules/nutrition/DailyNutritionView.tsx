"use client";

import React, { useState, useMemo } from "react";
import type { FoodItem, Recipe, MealLog, MealItemEntry } from "@/types/database";
import { DailyNutritionHeader } from "./DailyNutritionHeader";
import { DailyWaterWidget } from "./DailyWaterWidget";
import { MealSectionCard } from "./MealSectionCard";
import { AddMealItemDialog } from "./AddMealItemDialog";
import { EditMealItemDialog } from "./EditMealItemDialog";
import {
  calculateDailyTotals,
  groupLogsByMealType,
  MEAL_TYPES,
} from "@/domain/nutrition/diary";

interface DailyNutritionViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  mealLogs: MealLog[];
  waterMl: number;
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  onAddMealItem: (mealType: MealLog["mealType"], item: MealItemEntry) => Promise<void>;
  onEditMealItem: (logId: string, itemIndex: number, updatedItem: MealItemEntry) => Promise<void>;
  onDeleteMealItem: (logId: string, itemIndex: number) => Promise<void>;
  onAddWater: (amountMl: number) => Promise<void>;
  onResetWater: () => Promise<void>;
}

export function DailyNutritionView({
  selectedDate,
  onDateChange,
  mealLogs,
  waterMl,
  availableFoods,
  availableRecipes,
  onAddMealItem,
  onEditMealItem,
  onDeleteMealItem,
  onAddWater,
  onResetWater,
}: DailyNutritionViewProps) {
  // Modal states
  const [activeMealForAdd, setActiveMealForAdd] = useState<MealLog["mealType"] | null>(null);
  const [itemToEdit, setItemToEdit] = useState<{
    logId: string;
    itemIndex: number;
    item: MealItemEntry;
  } | null>(null);

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
          />
        ))}
      </div>

      {/* Item Toevoegen Dialog */}
      {activeMealForAdd && (
        <AddMealItemDialog
          isOpen={Boolean(activeMealForAdd)}
          onClose={() => setActiveMealForAdd(null)}
          mealType={activeMealForAdd}
          availableFoods={availableFoods}
          availableRecipes={availableRecipes}
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
    </div>
  );
}
