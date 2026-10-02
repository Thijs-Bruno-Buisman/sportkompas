"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Utensils, Plus, Droplets, PieChart, Apple, RotateCcw, Flame } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { useDatabase } from "@/lib/db";
import type { MealLog, WaterLog } from "@/types/database";

export default function VoedingPage() {
  const { repositories, isDemoMode, dataVersion } = useDatabase();

  const [waterMl, setWaterMl] = useState(0);
  const [mealLogs, setMealLogs] = useState<MealLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<MealLog["mealType"]>("ontbijt");
  const [foodName, setFoodName] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  useEffect(() => {
    let isCancelled = false;
    async function loadNutrition() {
      setIsLoading(true);
      try {
        const [meals, waterLogs] = await Promise.all([
          repositories.nutrition.getMealsByDate(todayStr),
          repositories.nutrition.getWaterLogsByDate(todayStr),
        ]);

        const totalWater = waterLogs.reduce((acc: number, w: WaterLog) => acc + w.amountMl, 0);

        if (!isCancelled) {
          setMealLogs(meals);
          setWaterMl(totalWater);
        }
      } catch (err) {
        console.error("Fout bij laden van voeding:", err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadNutrition();
    return () => {
      isCancelled = true;
    };
  }, [repositories, isDemoMode, dataVersion, todayStr]);

  const dailyTotals = useMemo(() => {
    return mealLogs.reduce(
      (acc, log) => ({
        calories: acc.calories + log.totalCalories,
        protein: acc.protein + log.totalProteinGrams,
        carbs: acc.carbs + log.totalCarbsGrams,
        fat: acc.fat + log.totalFatGrams,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }, [mealLogs]);

  const handleAddWater = async (amount: number) => {
    try {
      const newWater: WaterLog = {
        id: crypto.randomUUID(),
        calendarDate: todayStr,
        amountMl: amount,
        loggedAt: new Date().toISOString(),
      };
      await repositories.nutrition.water.save(newWater);
      setWaterMl((prev) => prev + amount);
    } catch (err) {
      console.error("Fout bij opslaan water:", err);
    }
  };

  const handleResetWater = async () => {
    // In echte DB of demo DB wissen van vandaag
    setWaterMl(0);
  };

  const handleSaveFood = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!foodName.trim()) {
      setErrorMessage("Vul een product- of maaltijdnaam in.");
      return;
    }
    const calNum = Number(calories);
    if (!calories || isNaN(calNum) || calNum < 0) {
      setErrorMessage("Vul een geldig aantal calorieën in.");
      return;
    }
    const protNum = protein ? Number(protein.replace(",", ".")) : 0;

    try {
      const newLog: MealLog = {
        id: crypto.randomUUID(),
        calendarDate: todayStr,
        mealType: selectedMeal,
        items: [
          {
            foodItemId: crypto.randomUUID(),
            foodName: foodName.trim(),
            portionGrams: 100,
            calories: calNum,
            proteinGrams: protNum,
            carbsGrams: 0,
            fatGrams: 0,
            fiberGrams: 0,
          },
        ],
        totalCalories: calNum,
        totalProteinGrams: protNum,
        totalCarbsGrams: 0,
        totalFatGrams: 0,
        loggedAt: new Date().toISOString(),
      };

      await repositories.nutrition.meals.save(newLog);
      setMealLogs((prev) => [...prev, newLog]);

      setErrorMessage("");
      setIsDialogOpen(false);
      setFoodName("");
      setCalories("");
      setProtein("");
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan van maaltijd.");
    }
  };

  const mealCategories: { id: MealLog["mealType"]; title: string }[] = [
    { id: "ontbijt", title: "Ontbijt" },
    { id: "lunch", title: "Lunch" },
    { id: "diner", title: "Diner" },
    { id: "snacks", title: "Snacks & Tussendoor" },
  ];

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
            Log maaltijden, bewaak eiwitinnames en registreer hydratatie.
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          leftIcon={<Plus className="w-4 h-4" />}
          className="shadow-sm"
        >
          Product Loggen
        </Button>
      </div>

      {/* Dagtotaal Macro Samenvatting */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Energie</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {dailyTotals.calories} <span className="text-xs font-normal text-slate-400">kcal</span>
          </p>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Eiwit</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {Math.round(dailyTotals.protein)}g
          </p>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Koolhydraten</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {Math.round(dailyTotals.carbs)}g
          </p>
        </Card>
        <Card className="p-3.5">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Vetten</span>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
            {Math.round(dailyTotals.fat)}g
          </p>
        </Card>
      </div>

      {/* Waterinname Kaart */}
      <Card className="border-sky-500/20 bg-linear-to-r from-sky-50/40 to-white dark:from-sky-950/20 dark:to-slate-900">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 dark:text-white text-base">
                  Waterinname Vandaag
                </span>
                <Badge variant="outline" className="text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800">
                  {waterMl} / 2500 ml
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Streef naar minstens 2.5 liter water per dag.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddWater(250)}
            >
              + 250 ml
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAddWater(500)}
            >
              + 500 ml
            </Button>
            {waterMl > 0 && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleResetWater}
                title="Reset water teller"
                aria-label="Reset water teller"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Maaltijdmomenten */}
      <div className="space-y-4">
        {mealCategories.map((meal) => {
          const categoryLogs = mealLogs.filter((m) => m.mealType === meal.id);
          const categoryKcal = categoryLogs.reduce((acc, c) => acc + c.totalCalories, 0);
          const categoryProtein = Math.round(categoryLogs.reduce((acc, c) => acc + c.totalProteinGrams, 0));

          return (
            <Card key={meal.id}>
              <CardHeader className="py-3.5 px-4 sm:px-5 flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Apple className="w-4 h-4 text-emerald-500" />
                  <CardTitle className="text-base font-semibold">
                    {meal.title}
                  </CardTitle>
                  {categoryKcal > 0 && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      ({categoryKcal} kcal &bull; {categoryProtein}g eiwit)
                    </span>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setSelectedMeal(meal.id);
                    setIsDialogOpen(true);
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Toevoegen
                </Button>
              </CardHeader>
              <CardContent className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800/80">
                {categoryLogs.length > 0 ? (
                  <div className="space-y-2">
                    {categoryLogs.map((log) => (
                      <div
                        key={log.id}
                        className="flex items-center justify-between text-xs py-1.5 border-b border-slate-50 dark:border-slate-900 last:border-0"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {log.items.map((i) => i.foodName).join(", ")}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            {log.items.map((i) => `${i.portionGrams}g`).join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {log.totalCalories} kcal
                          </span>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            {Math.round(log.totalProteinGrams)}g eiwit
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-xs text-slate-400 dark:text-slate-500 py-1">
                    Niets gelogd voor {meal.title.toLowerCase()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialog voor product toevoegen */}
      <Dialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setErrorMessage("");
        }}
        title="Voedingsmiddel Invoeren"
        description="Voer de voedingswaarden in per portie of per maaltijd."
      >
        <form onSubmit={handleSaveFood} className="space-y-4">
          {errorMessage && (
            <Alert variant="error" onDismiss={() => setErrorMessage("")}>
              {errorMessage}
            </Alert>
          )}

          <FormField id="meal-select" label="Maaltijdmoment" required>
            <Select
              id="meal-select"
              value={selectedMeal}
              onChange={(e) => setSelectedMeal(e.target.value as MealLog["mealType"])}
            >
              <option value="ontbijt">Ontbijt</option>
              <option value="lunch">Lunch</option>
              <option value="diner">Diner</option>
              <option value="snacks">Snacks &amp; Tussendoor</option>
            </Select>
          </FormField>

          <FormField
            id="food-name"
            label="Productnaam / Maaltijd"
            required
            helperText="Bijv. Havermout met blauwe bessen"
          >
            <Input
              id="food-name"
              placeholder="Bijv. Kipfilet met rijst"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              hasError={Boolean(errorMessage && !foodName)}
              autoFocus
            />
          </FormField>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              id="food-calories"
              label="Energie (kcal)"
              required
            >
              <Input
                id="food-calories"
                type="number"
                min="0"
                inputMode="numeric"
                placeholder="Bijv. 450"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                hasError={Boolean(errorMessage && !calories)}
              />
            </FormField>

            <FormField
              id="food-protein"
              label="Eiwit (gram, optioneel)"
            >
              <Input
                id="food-protein"
                type="text"
                inputMode="decimal"
                placeholder="Bijv. 35"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </FormField>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setIsDialogOpen(false);
                setErrorMessage("");
              }}
            >
              Annuleren
            </Button>
            <Button type="submit">
              Opslaan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
