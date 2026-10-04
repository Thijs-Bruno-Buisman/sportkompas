"use client";

import React, { useState, useMemo } from "react";
import { Sliders, Sparkles, Check, Info } from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { Profile } from "@/types/database";
import {
  calculateBmr,
  calculateTdee,
  calculateStrategyCalories,
  calculateMacroTargets,
  type DailyNutritionTargets,
  type NutritionStrategy,
  type MacroSplit,
} from "@/domain/nutrition/goals";

interface NutritionGoalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTargets: DailyNutritionTargets;
  profile?: Profile | null;
  onSaveTargets: (newTargets: DailyNutritionTargets) => Promise<void>;
}

export function NutritionGoalsModal({
  isOpen,
  onClose,
  currentTargets,
  profile,
  onSaveTargets,
}: NutritionGoalsModalProps) {
  const [strategy, setStrategy] = useState<NutritionStrategy>(
    currentTargets.strategy || "onderhoud"
  );
  const [macroSplit, setMacroSplit] = useState<MacroSplit>(
    currentTargets.macroSplit || "gebalanceerd"
  );

  // Custom waarden
  const [customCalories, setCustomCalories] = useState<string>(
    currentTargets.calories.toString()
  );
  const [customProtein, setCustomProtein] = useState<string>(
    currentTargets.proteinGrams.toString()
  );
  const [customCarbs, setCustomCarbs] = useState<string>(
    currentTargets.carbsGrams.toString()
  );
  const [customFat, setCustomFat] = useState<string>(
    currentTargets.fatGrams.toString()
  );
  const [customFiber, setCustomFiber] = useState<string>(
    currentTargets.fiberGrams.toString()
  );
  const [customWater, setCustomWater] = useState<string>(
    currentTargets.waterMl.toString()
  );

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Berekende BMR & TDEE basis op basis van profiel
  const profileStats = useMemo(() => {
    if (!profile || !profile.startWeightKg || !profile.heightMeters) return null;
    const birthYear = profile.birthDate ? new Date(profile.birthDate).getFullYear() : 1995;
    const age = new Date().getFullYear() - birthYear;
    const heightCm = profile.heightMeters * 100;
    const bmr = calculateBmr(
      profile.gender,
      profile.startWeightKg,
      heightCm,
      age,
      profile.formulaPreference
    );
    const tdee = calculateTdee(bmr, profile.activityLevel);
    return { bmr, tdee, weightKg: profile.startWeightKg };
  }, [profile]);

  // Realtime berekende targets
  const calculatedTargets = useMemo((): DailyNutritionTargets => {
    const baseTdee = profileStats ? profileStats.tdee : 2200;
    const weightKg = profileStats ? profileStats.weightKg : 75;

    let cal = 0;
    if (strategy === "aangepast") {
      cal = parseInt(customCalories, 10) || 2000;
    } else {
      cal = calculateStrategyCalories(baseTdee, strategy);
    }

    if (macroSplit === "aangepast") {
      return {
        calories: cal,
        proteinGrams: parseInt(customProtein, 10) || 140,
        carbsGrams: parseInt(customCarbs, 10) || 250,
        fatGrams: parseInt(customFat, 10) || 70,
        fiberGrams: parseInt(customFiber, 10) || 30,
        waterMl: parseInt(customWater, 10) || 2500,
        strategy,
        macroSplit,
      };
    }

    const calculated = calculateMacroTargets(cal, macroSplit, weightKg);
    return {
      ...calculated,
      strategy,
      macroSplit,
    };
  }, [
    strategy,
    macroSplit,
    profileStats,
    customCalories,
    customProtein,
    customCarbs,
    customFat,
    customFiber,
    customWater,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSaveTargets(calculatedTargets);
      onClose();
    } catch (err) {
      console.error("Fout bij opslaan van doelen:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Voedingsdoelen & Caloriebalans"
      description="Stel je dagelijkse calorie- en macronutriëntendoelen in op basis van je trainingsdoel en metabolisme."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profiel Context Banner indien aanwezig */}
        {profileStats && (
          <div className="bg-emerald-50/60 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-500/20 text-xs flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Metabolisme Schatting:
              </span>
              <span className="text-slate-600 dark:text-slate-400">
                BMR: <strong>{profileStats.bmr}</strong> kcal &bull; Onderhoud (TDEE):{" "}
                <strong>{profileStats.tdee}</strong> kcal/dag
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-white/80 dark:bg-slate-900 px-2 py-1 rounded-md border border-emerald-500/20">
              Profiel gekoppeld
            </span>
          </div>
        )}

        {/* Strategie Selectie */}
        <FormField label="Doel & Strategie" id="goal-strategy">
          <Select
            id="goal-strategy"
            value={strategy}
            onChange={(e) => setStrategy(e.target.value as NutritionStrategy)}
          >
            <option value="afvallen_rustig">Afvallen (Rustig: -300 kcal)</option>
            <option value="afvallen_standaard">Afvallen (Standaard: -500 kcal)</option>
            <option value="afvallen_agressief">Afvallen (Agressief: -750 kcal)</option>
            <option value="onderhoud">Gewicht Behouden (Onderhoud / TDEE)</option>
            <option value="aankomen_lean">Spiermassa Opbouwen (Lean bulk: +250 kcal)</option>
            <option value="aankomen_bulken">Bulken (Spieropbouw: +500 kcal)</option>
            <option value="aangepast">Aangepast (Zelf calorieën instellen)</option>
          </Select>
        </FormField>

        {strategy === "aangepast" && (
          <FormField label="Aangepaste Doelcalorieën (kcal)" id="custom-cal">
            <Input
              id="custom-cal"
              type="number"
              min="800"
              max="10000"
              value={customCalories}
              onChange={(e) => setCustomCalories(e.target.value)}
              className="text-xs font-bold"
            />
          </FormField>
        )}

        {/* Macro Verdeling Selectie */}
        <FormField label="Macronutriënten Verdeling" id="macro-split">
          <Select
            id="macro-split"
            value={macroSplit}
            onChange={(e) => setMacroSplit(e.target.value as MacroSplit)}
          >
            <option value="gebalanceerd">Gebalanceerd (30% Eiwit / 40% Koolhydraten / 30% Vet)</option>
            <option value="eiwitrijk">Eiwitrijk (35% Eiwit / 40% Koolhydraten / 25% Vet)</option>
            <option value="koolhydraatarm">Koolhydraatarm (35% Eiwit / 20% Koolhydraten / 45% Vet)</option>
            <option value="krachtsport_per_kg">Krachtsport (2.0g eiwit / kg, 1.0g vet / kg)</option>
            <option value="aangepast">Aangepast (Zelf grammen instellen)</option>
          </Select>
        </FormField>

        {/* Handmatige macro-invoer indien gekozen */}
        {macroSplit === "aangepast" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <FormField label="Eiwit (g)" id="custom-p">
              <Input
                id="custom-p"
                type="number"
                min="0"
                value={customProtein}
                onChange={(e) => setCustomProtein(e.target.value)}
                className="text-xs font-bold"
              />
            </FormField>
            <FormField label="Koolhydraten (g)" id="custom-c">
              <Input
                id="custom-c"
                type="number"
                min="0"
                value={customCarbs}
                onChange={(e) => setCustomCarbs(e.target.value)}
                className="text-xs font-bold"
              />
            </FormField>
            <FormField label="Vetten (g)" id="custom-f">
              <Input
                id="custom-f"
                type="number"
                min="0"
                value={customFat}
                onChange={(e) => setCustomFat(e.target.value)}
                className="text-xs font-bold"
              />
            </FormField>
            <FormField label="Vezels (g)" id="custom-fib">
              <Input
                id="custom-fib"
                type="number"
                min="0"
                value={customFiber}
                onChange={(e) => setCustomFiber(e.target.value)}
                className="text-xs font-bold"
              />
            </FormField>
          </div>
        )}

        {/* Live Doelpreview */}
        <div className="bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Berekend Dagelijks Doel:
            </span>
            <span className="text-sm font-extrabold text-amber-600 dark:text-amber-400">
              {calculatedTargets.calories} kcal
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1.5 text-center pt-2 border-t border-slate-200 dark:border-slate-800">
            <div className="bg-white/80 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Eiwit</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                {calculatedTargets.proteinGrams}g
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Koolh</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {calculatedTargets.carbsGrams}g
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Vet</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400">
                {calculatedTargets.fatGrams}g
              </span>
            </div>
            <div className="bg-white/80 dark:bg-slate-900 p-1.5 rounded-lg border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400 block">Vezels</span>
              <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                {calculatedTargets.fiberGrams}g
              </span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            leftIcon={<Check className="w-4 h-4" />}
          >
            Doelen Opslaan
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
