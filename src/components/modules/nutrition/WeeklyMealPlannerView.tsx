"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  ShoppingBag,
  Plus,
  CheckCircle,
  Copy,
  Trash2,
  Utensils,
  Clock,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import type {
  PlannedMeal,
  FoodItem,
  Recipe,
  MealLog,
} from "@/types/database";
import {
  getLocalDateString,
  addDaysToDateString,
  getWeekDays,
  getWeekStartDate,
  type CalendarDayInfo,
} from "@/domain/dates/calendar";
import {
  groupPlannedMealsByDate,
  groupPlannedMealsByMealType,
  calculatePlannedDailyTotals,
  calculateWeeklyPlanningSummary,
} from "@/domain/nutrition/planning";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";
import { PlanMealModal } from "./PlanMealModal";
import { MealPrepListModal } from "./MealPrepListModal";

interface WeeklyMealPlannerViewProps {
  availableFoods: FoodItem[];
  availableRecipes: Recipe[];
  nutritionTargets: DailyNutritionTargets;
  onGetPlannedMealsForRange: (startDate: string, endDate: string) => Promise<PlannedMeal[]>;
  onPlanMeal: (mealData: Omit<PlannedMeal, "id" | "createdAt" | "provenance">) => Promise<PlannedMeal>;
  onDeletePlannedMeal: (id: string) => Promise<void>;
  onMarkPlannedMealAsConsumed: (id: string) => Promise<{ plannedMeal: PlannedMeal; mealLog: MealLog }>;
  onCopyPlannedMealsToDate: (sourceDate: string, targetDate: string) => Promise<number>;
  onRefreshDiary?: () => void;
}

export function WeeklyMealPlannerView({
  availableFoods,
  availableRecipes,
  nutritionTargets,
  onGetPlannedMealsForRange,
  onPlanMeal,
  onDeletePlannedMeal,
  onMarkPlannedMealAsConsumed,
  onCopyPlannedMealsToDate,
  onRefreshDiary,
}: WeeklyMealPlannerViewProps) {
  const today = useMemo(() => getLocalDateString(), []);
  const [anchorDate, setAnchorDate] = useState<string>(today);
  const [selectedDate, setSelectedDate] = useState<string>(today);
  const [weekPlannedMeals, setWeekPlannedMeals] = useState<PlannedMeal[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [planModalSlot, setPlanModalSlot] = useState<"ontbijt" | "lunch" | "diner" | "snacks">("lunch");
  const [isPrepListModalOpen, setIsPrepListModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetDate, setCopyTargetDate] = useState<string>("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Week days (Mon-Sun)
  const weekDays = useMemo(() => {
    return getWeekDays(anchorDate, "maandag", today);
  }, [anchorDate, today]);

  const startDate = weekDays[0]?.dateStr || anchorDate;
  const endDate = weekDays[6]?.dateStr || anchorDate;

  // Load planned meals for current week
  const loadWeekMeals = useCallback(async () => {
    setIsLoading(true);
    try {
      const meals = await onGetPlannedMealsForRange(startDate, endDate);
      setWeekPlannedMeals(meals);
    } catch (err) {
      console.error("Fout bij laden van weekplanning:", err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, onGetPlannedMealsForRange]);

  useEffect(() => {
    loadWeekMeals();
  }, [loadWeekMeals]);

  // Grouped meals
  const mealsByDate = useMemo(() => {
    return groupPlannedMealsByDate(weekPlannedMeals);
  }, [weekPlannedMeals]);

  const selectedDayMeals = useMemo(() => {
    return mealsByDate[selectedDate] || [];
  }, [mealsByDate, selectedDate]);

  const selectedDayBySlot = useMemo(() => {
    return groupPlannedMealsByMealType(selectedDayMeals);
  }, [selectedDayMeals]);

  const selectedDayTotals = useMemo(() => {
    return calculatePlannedDailyTotals(selectedDayMeals);
  }, [selectedDayMeals]);

  const weeklySummary = useMemo(() => {
    return calculateWeeklyPlanningSummary(weekPlannedMeals);
  }, [weekPlannedMeals]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const newAnchor = addDaysToDateString(anchorDate, -7);
    setAnchorDate(newAnchor);
    setSelectedDate(addDaysToDateString(selectedDate, -7));
  };

  const handleNextWeek = () => {
    const newAnchor = addDaysToDateString(anchorDate, 7);
    setAnchorDate(newAnchor);
    setSelectedDate(addDaysToDateString(selectedDate, 7));
  };

  const handleGoToToday = () => {
    setAnchorDate(today);
    setSelectedDate(today);
  };

  // Open planning modal
  const handleOpenPlanModal = (slot: "ontbijt" | "lunch" | "diner" | "snacks") => {
    setPlanModalSlot(slot);
    setIsPlanModalOpen(true);
  };

  const handleSavePlannedMeal = async (
    mealData: Omit<PlannedMeal, "id" | "createdAt" | "provenance">
  ) => {
    await onPlanMeal(mealData);
    await loadWeekMeals();
    setActionFeedback("Maaltijd succesvol ingepland!");
    setTimeout(() => setActionFeedback(null), 3000);
  };

  const handleDeleteMeal = async (id: string) => {
    if (confirm("Weet je zeker dat je deze geplande maaltijd wilt verwijderen?")) {
      await onDeletePlannedMeal(id);
      await loadWeekMeals();
    }
  };

  const handleConsumeMeal = async (id: string) => {
    try {
      await onMarkPlannedMealAsConsumed(id);
      await loadWeekMeals();
      if (onRefreshDiary) onRefreshDiary();
      setActionFeedback("Maaltijd gemarkeerd als genuttigd en gelogd in je dagboek!");
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      console.error("Fout bij markeren als genuttigd:", err);
    }
  };

  const handleExecuteCopy = async () => {
    if (!copyTargetDate || copyTargetDate === selectedDate) return;
    try {
      const count = await onCopyPlannedMealsToDate(selectedDate, copyTargetDate);
      setIsCopyModalOpen(false);
      await loadWeekMeals();
      setActionFeedback(`${count} maaltijden gekopieerd naar ${copyTargetDate}!`);
      setTimeout(() => setActionFeedback(null), 3500);
    } catch (err) {
      console.error("Fout bij kopiëren van planning:", err);
    }
  };

  const mealSlots: Array<{
    slot: "ontbijt" | "lunch" | "diner" | "snacks";
    label: string;
    description: string;
  }> = [
    { slot: "ontbijt", label: "Ontbijt", description: "Begin van de dag" },
    { slot: "lunch", label: "Lunch", description: "Middageten" },
    { slot: "diner", label: "Diner", description: "Avondmaaltijd" },
    { slot: "snacks", label: "Snacks", description: "Tussendoortjes" },
  ];

  const weekRangeLabel = `${startDate.slice(8, 10)}-${startDate.slice(5, 7)} t/m ${endDate.slice(8, 10)}-${endDate.slice(5, 7)}`;

  return (
    <div className="space-y-6">
      {/* Toast / Notificatie */}
      {actionFeedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-sm rounded-xl flex items-center gap-2 animate-in fade-in duration-200">
          <Sparkles className="w-4 h-4 text-emerald-500 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Week Header & Navigatie */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handlePrevWeek}
            className="h-9 w-9 p-0"
            title="Vorige week"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="text-center sm:text-left">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-emerald-500 inline" />
              Week {weekRangeLabel}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {weeklySummary.totalPlannedMeals} maaltijden ingepland ({weeklySummary.completedMeals} genuttigd)
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleNextWeek}
            className="h-9 w-9 p-0"
            title="Volgende week"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGoToToday}
            className="h-9 text-xs"
          >
            Vandaag
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsPrepListModalOpen(true)}
            className="h-9 text-xs flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Boodschappen &amp; Prep</span>
          </Button>
        </div>
      </div>

      {/* 7 Dagen balk (Mobile-first carrousel/strip) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {weekDays.map((day: CalendarDayInfo) => {
          const isSelected = day.dateStr === selectedDate;
          const dayMealsCount = (mealsByDate[day.dateStr] || []).length;
          const dayHasConsumed = (mealsByDate[day.dateStr] || []).some(
            (m) => m.status === "genuttigd"
          );

          return (
            <button
              key={day.dateStr}
              type="button"
              onClick={() => setSelectedDate(day.dateStr)}
              className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all text-center ${
                isSelected
                  ? "bg-emerald-500 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/20"
                  : day.isToday
                  ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500/40 text-slate-900 dark:text-white"
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              <span
                className={`text-[11px] font-semibold uppercase tracking-wider ${
                  isSelected ? "text-emerald-100" : "text-slate-400"
                }`}
              >
                {day.dayNameShort.slice(0, 2)}
              </span>
              <span className="text-base font-bold my-0.5">{day.dayNumber}</span>
              {/* Indicator van geplande maaltijden */}
              <div className="flex items-center gap-0.5 h-2">
                {dayMealsCount > 0 ? (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isSelected
                        ? "bg-white"
                        : dayHasConsumed
                        ? "bg-emerald-500"
                        : "bg-amber-500"
                    }`}
                  />
                ) : (
                  <span className="w-1.5 h-1.5" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Geselecteerde Dag Details Header & Dagtotalen */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {new Date(selectedDate + "T12:00:00").toLocaleDateString("nl-NL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            {selectedDate === today && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Vandaag
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gepland: <strong className="text-slate-900 dark:text-white">{selectedDayTotals.calories} kcal</strong> (doel: {nutritionTargets.calories} kcal) • E: {selectedDayTotals.proteinGrams}g (doel: {nutritionTargets.proteinGrams}g)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {selectedDayMeals.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setCopyTargetDate(addDaysToDateString(selectedDate, 1));
                setIsCopyModalOpen(true);
              }}
              className="h-9 text-xs flex items-center gap-1.5"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Kopieer dag</span>
            </Button>
          )}
        </div>
      </div>

      {/* Maaltijdmomenten voor geselecteerde dag */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealSlots.map(({ slot, label, description }) => {
          const meals = selectedDayBySlot[slot] || [];
          const slotCalories = meals.reduce((sum, m) => sum + m.totalCalories, 0);

          return (
            <Card
              key={slot}
              className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between"
            >
              <CardHeader className="p-4 pb-2 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-slate-900 dark:text-white">
                    {label}
                  </CardTitle>
                  <p className="text-[11px] text-slate-400">{description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {slotCalories > 0 && (
                    <span className="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded">
                      {slotCalories} kcal
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenPlanModal(slot)}
                    className="h-8 w-8 p-0 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    title={`Plan ${label.toLowerCase()} in`}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="p-4 flex-1 space-y-3">
                {meals.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    Nog geen maaltijd ingepland voor {label.toLowerCase()}.
                    <button
                      type="button"
                      onClick={() => handleOpenPlanModal(slot)}
                      className="block mx-auto mt-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline min-h-[32px] py-1"
                    >
                      + Nu inplannen
                    </button>
                  </div>
                ) : (
                  meals.map((meal) => (
                    <div
                      key={meal.id}
                      className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="text-sm font-semibold text-slate-900 dark:text-white">
                            {meal.name}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2 mt-0.5">
                            <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                              {meal.totalCalories} kcal
                            </span>
                            <span>•</span>
                            <span>E: {meal.totalProteinGrams}g</span>
                            <span>•</span>
                            <span>K: {meal.totalCarbsGrams}g</span>
                            <span>•</span>
                            <span>V: {meal.totalFatGrams}g</span>
                          </div>
                        </div>

                        {/* Status badge */}
                        <div className="shrink-0">
                          {meal.status === "genuttigd" ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              Genuttigd
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              Ingepland
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Notities indien aanwezig */}
                      {meal.notes && (
                        <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 p-1.5 rounded">
                          💡 Prep: {meal.notes}
                        </div>
                      )}

                      {/* Ingrediëntenlijstje compact */}
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 border-t border-slate-200/60 dark:border-slate-700/60 pt-1.5">
                        {meal.items.map((it) => it.foodName).join(", ")}
                      </div>

                      {/* Actieknoppen */}
                      <div className="flex items-center justify-between pt-1">
                        {meal.status === "gepland" ? (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleConsumeMeal(meal.id)}
                            className="h-8 text-xs font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 flex items-center gap-1.5"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Markeer als genuttigd</span>
                          </Button>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Gelogd in dagboek
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteMeal(meal.id)}
                          className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          title="Verwijder geplande maaltijd"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Plan Meal Modal */}
      <PlanMealModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        calendarDate={selectedDate}
        mealType={planModalSlot}
        availableFoods={availableFoods}
        availableRecipes={availableRecipes}
        onPlanMeal={handleSavePlannedMeal}
      />

      {/* Meal Prep List Modal */}
      <MealPrepListModal
        isOpen={isPrepListModalOpen}
        onClose={() => setIsPrepListModalOpen(false)}
        plannedMeals={weekPlannedMeals}
        weekRangeLabel={weekRangeLabel}
      />

      {/* Copy Day Modal */}
      <Dialog
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Maaltijden Kopiëren"
        description={`Kopieer alle maaltijden van ${selectedDate} naar een andere dag in de week`}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Kies een doeldag
            </label>
            <div className="grid grid-cols-1 gap-2">
              {weekDays
                .filter((d) => d.dateStr !== selectedDate)
                .map((day) => (
                  <button
                    key={day.dateStr}
                    type="button"
                    onClick={() => setCopyTargetDate(day.dateStr)}
                    className={`flex items-center justify-between p-3 rounded-lg border text-sm text-left transition-colors ${
                      copyTargetDate === day.dateStr
                        ? "bg-emerald-500 text-white border-emerald-600 font-bold"
                        : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-emerald-500/50"
                    }`}
                  >
                    <span>
                      {day.dayNameFull} ({day.dayNumber}-{day.monthNumber})
                    </span>
                    <span className="text-xs opacity-75">
                      {(mealsByDate[day.dateStr] || []).length} maaltijden reeds
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-700">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setIsCopyModalOpen(false)}
              className="h-11"
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={!copyTargetDate}
              onClick={handleExecuteCopy}
              className="h-11 flex items-center gap-1.5"
            >
              <Copy className="w-4 h-4" />
              <span>Kopiëren</span>
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
