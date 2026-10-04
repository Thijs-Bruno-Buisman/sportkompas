"use client";

import React, { useState, useMemo } from "react";
import type { FoodItem, Recipe, MealLog, MealItemEntry, Profile } from "@/types/database";
import { DailyNutritionHeader } from "./DailyNutritionHeader";
import { DailyWaterWidget } from "./DailyWaterWidget";
import { MealSectionCard } from "./MealSectionCard";
import { AddMealItemDialog } from "./AddMealItemDialog";
import { EditMealItemDialog } from "./EditMealItemDialog";
import { SaveMealAsRecipeDialog } from "./SaveMealAsRecipeDialog";
import { NutritionBudgetCard } from "./NutritionBudgetCard";
import { NutritionGoalsModal } from "./NutritionGoalsModal";
import { AiNutritionAdvisorModal } from "./AiNutritionAdvisorModal";
import {
  calculateDailyTotals,
  groupLogsByMealType,
  MEAL_TYPES,
  type MealTypeSummary,
} from "@/domain/nutrition/diary";
import type { RecentMealItemSummary } from "@/domain/nutrition/quickLog";
import {
  type DailyNutritionTargets,
  DEFAULT_NUTRITION_TARGETS,
  calculateNutritionProgress,
} from "@/domain/nutrition/goals";

interface DailyNutritionViewProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
  mealLogs: MealLog[];
  waterMl: number;
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  recentItems?: RecentMealItemSummary[];
  nutritionTargets?: DailyNutritionTargets;
  profile?: Profile | null;
  onAddMealItem: (mealType: MealLog["mealType"], item: MealItemEntry) => Promise<void>;
  onEditMealItem: (logId: string, itemIndex: number, updatedItem: MealItemEntry) => Promise<void>;
  onDeleteMealItem: (logId: string, itemIndex: number) => Promise<void>;
  onAddWater: (amountMl: number) => Promise<void>;
  onResetWater: () => Promise<void>;
  onCopyMealFromYesterday?: (mealType: MealLog["mealType"]) => Promise<void>;
  onCopyAllMealsFromYesterday?: () => Promise<void>;
  onSaveMealAsRecipe?: (mealLogId: string, recipeName: string, portions: number) => Promise<void>;
  onSaveNutritionTargets?: (targets: DailyNutritionTargets) => Promise<void>;
  onSaveExternalFood?: (external: any) => Promise<FoodItem>;
  onLookupLocalBarcode?: (barcode: string) => Promise<FoodItem | undefined>;
}

export function DailyNutritionView({
  selectedDate,
  onDateChange,
  mealLogs,
  waterMl,
  availableFoods,
  availableRecipes,
  recentItems = [],
  nutritionTargets = DEFAULT_NUTRITION_TARGETS,
  profile,
  onAddMealItem,
  onEditMealItem,
  onDeleteMealItem,
  onAddWater,
  onResetWater,
  onCopyMealFromYesterday,
  onCopyAllMealsFromYesterday,
  onSaveMealAsRecipe,
  onSaveNutritionTargets,
  onSaveExternalFood,
  onLookupLocalBarcode,
}: DailyNutritionViewProps) {
  // Modal states
  const [activeMealForAdd, setActiveMealForAdd] = useState<MealLog["mealType"] | null>(null);
  const [itemToEdit, setItemToEdit] = useState<{
    logId: string;
    itemIndex: number;
    item: MealItemEntry;
  } | null>(null);
  const [mealToSaveAsRecipe, setMealToSaveAsRecipe] = useState<MealTypeSummary | null>(null);
  const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);
  const [isAiNutritionOpen, setIsAiNutritionOpen] = useState(false);

  // Group logs and calculate daily totals
  const dailyTotals = useMemo(() => {
    return calculateDailyTotals(mealLogs);
  }, [mealLogs]);

  const mealSummaries = useMemo(() => {
    return groupLogsByMealType(mealLogs);
  }, [mealLogs]);

  // Calculate nutrition progress against targets
  const progress = useMemo(() => {
    return calculateNutritionProgress(nutritionTargets, dailyTotals, waterMl);
  }, [nutritionTargets, dailyTotals, waterMl]);

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

      {/* Doel- & Balans Cockpit */}
      <NutritionBudgetCard
        targets={nutritionTargets}
        progress={progress}
        onOpenGoalsModal={() => setIsGoalsModalOpen(true)}
        onOpenAiAdvisor={() => setIsAiNutritionOpen(true)}
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
          onSaveExternalFood={onSaveExternalFood}
          onLookupLocalBarcode={onLookupLocalBarcode}
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

      {/* Voedingsdoelen Modal */}
      {isGoalsModalOpen && onSaveNutritionTargets && (
        <NutritionGoalsModal
          isOpen={isGoalsModalOpen}
          onClose={() => setIsGoalsModalOpen(false)}
          currentTargets={nutritionTargets}
          profile={profile}
          onSaveTargets={onSaveNutritionTargets}
        />
      )}

      {/* AI Voedingsadviezen Modal (Stap 43) */}
      {isAiNutritionOpen && (
        <AiNutritionAdvisorModal
          isOpen={isAiNutritionOpen}
          onClose={() => setIsAiNutritionOpen(false)}
          currentTargets={nutritionTargets}
          profile={profile}
          consumedToday={dailyTotals}
          initialIsTrainingDay={true}
          onAccept={async (newTargets) => {
            if (onSaveNutritionTargets) {
              await onSaveNutritionTargets(newTargets);
            }
          }}
        />
      )}
    </div>
  );
}

