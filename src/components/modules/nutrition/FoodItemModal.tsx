"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import type { FoodItem, FoodCategory } from "@/types/database";
import { FoodItemSchema } from "@/lib/db/schema";
import { calculateMacroDistribution, getCategoryMetadata } from "@/domain/nutrition/calculations";

interface FoodItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (food: FoodItem) => Promise<void>;
  foodToEdit?: FoodItem | null;
  isDemoMode?: boolean;
}

export function FoodItemModal({
  isOpen,
  onClose,
  onSave,
  foodToEdit,
  isDemoMode = false,
}: FoodItemModalProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<FoodCategory>("overig");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [defaultPortion, setDefaultPortion] = useState("100");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (foodToEdit) {
      setName(foodToEdit.name);
      setBrand(foodToEdit.brand || "");
      setCategory(foodToEdit.category || "overig");
      setCalories(foodToEdit.caloriesPer100g.toString());
      setProtein(foodToEdit.proteinGramsPer100g.toString());
      setCarbs(foodToEdit.carbsGramsPer100g.toString());
      setFat(foodToEdit.fatGramsPer100g.toString());
      setFiber(foodToEdit.fiberGramsPer100g.toString());
      setDefaultPortion(foodToEdit.defaultPortionGrams.toString());
    } else {
      setName("");
      setBrand("");
      setCategory("overig");
      setCalories("");
      setProtein("");
      setCarbs("");
      setFat("");
      setFiber("");
      setDefaultPortion("100");
    }
    setErrorMessage("");
  }, [foodToEdit, isOpen]);

  const pNum = parseFloat(protein.replace(",", ".")) || 0;
  const cNum = parseFloat(carbs.replace(",", ".")) || 0;
  const fNum = parseFloat(fat.replace(",", ".")) || 0;
  const calNum = parseInt(calories, 10) || 0;

  const macroDist = calculateMacroDistribution(pNum, cNum, fNum);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage("Vul een productnaam in.");
      return;
    }

    const cal = Number(calories);
    if (isNaN(cal) || cal < 0) {
      setErrorMessage("Vul een geldig aantal calorieën per 100 gram in.");
      return;
    }

    const portion = Number(defaultPortion);
    if (isNaN(portion) || portion <= 0) {
      setErrorMessage("Vul een geldige standaard portie in (minimaal 1 gram).");
      return;
    }

    const fibNum = parseFloat(fiber.replace(",", ".")) || 0;

    const candidateFood: FoodItem = {
      id: foodToEdit ? foodToEdit.id : crypto.randomUUID(),
      name: name.trim(),
      brand: brand.trim() ? brand.trim() : null,
      category,
      caloriesPer100g: cal,
      proteinGramsPer100g: Math.round(pNum * 10) / 10,
      carbsGramsPer100g: Math.round(cNum * 10) / 10,
      fatGramsPer100g: Math.round(fNum * 10) / 10,
      fiberGramsPer100g: Math.round(fibNum * 10) / 10,
      defaultPortionGrams: Math.round(portion),
      isCustom: true,
      isFavorite: foodToEdit ? Boolean(foodToEdit.isFavorite) : false,
      provenance: foodToEdit?.provenance || {
        source: isDemoMode ? "demo" : "user",
        isDemo: isDemoMode,
      },
      createdAt: foodToEdit ? foodToEdit.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Validatie met Zod
    const validation = FoodItemSchema.safeParse(candidateFood);
    if (!validation.success) {
      setErrorMessage(validation.error.issues[0]?.message || "Ongeldige invoer.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave(candidateFood);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan van voedingsmiddel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories: FoodCategory[] = [
    "vlees_vis_ei",
    "zuivel",
    "granen_brood",
    "groente_fruit",
    "peulvruchten",
    "noten_zaden",
    "oliën_sauzen",
    "dranken",
    "supplementen",
    "snacks_zoet",
    "overig",
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={foodToEdit ? "Voedingsmiddel Bewerken" : "Nieuw Voedingsmiddel Toevoegen"}
      description="Voer de voedingswaarden in per 100 gram volgens het etiket."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="food-name" label="Productnaam" required>
            <Input
              id="food-name"
              placeholder="Bijv. Magere Franse Kwark"
              value={name}
              onChange={(e) => setName(e.target.value)}
              hasError={Boolean(errorMessage && !name)}
              autoFocus
            />
          </FormField>

          <FormField id="food-brand" label="Merk / Fabrikant (optioneel)">
            <Input
              id="food-brand"
              placeholder="Bijv. Campina of Albert Heijn"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField id="food-category" label="Categorie" required>
            <Select
              id="food-category"
              value={category}
              onChange={(e) => setCategory(e.target.value as FoodCategory)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryMetadata(cat).label}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField
            id="food-default-portion"
            label="Standaard portie (gram)"
            required
            helperText="Bijv. 1 boterham = 35g, 1 schaal = 250g"
          >
            <Input
              id="food-default-portion"
              type="number"
              min="1"
              max="5000"
              value={defaultPortion}
              onChange={(e) => setDefaultPortion(e.target.value)}
            />
          </FormField>
        </div>

        {/* Macronutriënten per 100g */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900 dark:text-white">
              Voedingswaarden per 100 gram
            </span>
            <span className="text-xs text-slate-500">Volgens verpakking</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <FormField id="food-calories" label="Energie (kcal)" required>
              <Input
                id="food-calories"
                type="number"
                min="0"
                max="1000"
                placeholder="0"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </FormField>

            <FormField id="food-protein" label="Eiwit (g)">
              <Input
                id="food-protein"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={protein}
                onChange={(e) => setProtein(e.target.value)}
              />
            </FormField>

            <FormField id="food-carbs" label="Koolh. (g)">
              <Input
                id="food-carbs"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value)}
              />
            </FormField>

            <FormField id="food-fat" label="Vet (g)">
              <Input
                id="food-fat"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={fat}
                onChange={(e) => setFat(e.target.value)}
              />
            </FormField>

            <FormField id="food-fiber" label="Vezels (g)">
              <Input
                id="food-fiber"
                type="text"
                inputMode="decimal"
                placeholder="0.0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value)}
              />
            </FormField>
          </div>

          {/* Macro Ratio Verdeling Preview */}
          {macroDist.totalCalories > 0 && (
            <div className="pt-2 space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Energieverhouding (Atwater):</span>
                <span>{macroDist.totalCalories} kcal berekend ({calNum} kcal opgegeven)</span>
              </div>
              <div className="w-full h-2.5 rounded-full overflow-hidden flex bg-slate-200 dark:bg-slate-800">
                <div
                  style={{ width: `${macroDist.proteinPercentage}%` }}
                  className="bg-emerald-500 h-full"
                  title={`Eiwit: ${macroDist.proteinPercentage}%`}
                />
                <div
                  style={{ width: `${macroDist.carbsPercentage}%` }}
                  className="bg-amber-500 h-full"
                  title={`Koolhydraten: ${macroDist.carbsPercentage}%`}
                />
                <div
                  style={{ width: `${macroDist.fatPercentage}%` }}
                  className="bg-sky-500 h-full"
                  title={`Vet: ${macroDist.fatPercentage}%`}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium pt-0.5">
                <span className="text-emerald-600 dark:text-emerald-400">
                  {macroDist.proteinPercentage}% Eiwit
                </span>
                <span className="text-amber-600 dark:text-amber-400">
                  {macroDist.carbsPercentage}% Koolh.
                </span>
                <span className="text-sky-600 dark:text-sky-400">
                  {macroDist.fatPercentage}% Vet
                </span>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {foodToEdit ? "Wijzigingen Opslaan" : "Product Toevoegen"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
