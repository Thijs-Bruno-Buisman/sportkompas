import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import {
  fetchProductByBarcode,
  searchOpenFoodFacts,
  type ParsedExternalFood,
} from "@/domain/nutrition/openFoodFacts";
import type { FoodItem, MealItemEntry } from "@/types/database";
import { calculateNutritionForPortion } from "@/domain/nutrition/calculations";

describe("Nutrition Barcode & External Search Integration (Prompt 25 / Stap 30)", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "SportKompasTest_Barcode_" + Math.random().toString(36).substring(2);

  beforeEach(async () => {
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("vindt een lokaal product op basis van streepjescode in de Dexie database", async () => {
    const existingFood: FoodItem = {
      id: crypto.randomUUID(),
      name: "Volkorenbrood",
      brand: "Bakkerij",
      category: "granen_brood",
      barcode: "8710400055555",
      caloriesPer100g: 247,
      proteinGramsPer100g: 10,
      carbsGramsPer100g: 43,
      fatGramsPer100g: 2.1,
      fiberGramsPer100g: 6.5,
      defaultPortionGrams: 35,
      isCustom: true,
      provenance: { source: "user" },
      createdAt: new Date().toISOString(),
    };

    await repos.nutrition.foods.save(existingFood);

    // Zoek via repository
    const found = await repos.nutrition.getFoodByBarcode("8710400055555");
    expect(found).toBeDefined();
    expect(found?.name).toBe("Volkorenbrood");
    expect(found?.id).toBe(existingFood.id);

    // Onbekende barcode
    const notFound = await repos.nutrition.getFoodByBarcode("9999999999999");
    expect(notFound).toBeUndefined();
  });

  it("slaat een extern Open Food Facts product persistent op in de lokale database", async () => {
    const externalProduct: ParsedExternalFood = {
      barcode: "8718452123456",
      name: "Biologische Haverdrank",
      brand: "OatLove",
      category: "dranken",
      caloriesPer100g: 45,
      proteinGramsPer100g: 1.0,
      carbsGramsPer100g: 6.5,
      fatGramsPer100g: 1.5,
      fiberGramsPer100g: 0.8,
      defaultPortionGrams: 200,
      source: "openfoodfacts",
    };

    const saved = await repos.nutrition.saveExternalFoodItem(externalProduct);
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe("Biologische Haverdrank");
    expect(saved.barcode).toBe("8718452123456");
    expect(saved.provenance).toEqual({ source: "external" });

    // Controleer dat het product nu ook direct lokaal te vinden is
    const localLookup = await repos.nutrition.getFoodByBarcode("8718452123456");
    expect(localLookup).toBeDefined();
    expect(localLookup?.id).toBe(saved.id);
  });

  it("voorkomt dubbele records bij herhaaldelijk opslaan van hetzelfde streepjescodeproduct", async () => {
    const externalProduct: ParsedExternalFood = {
      barcode: "8711111222223",
      name: "Magere Franse Kwark",
      brand: "ZuivelMeister",
      category: "zuivel",
      caloriesPer100g: 52,
      proteinGramsPer100g: 9.5,
      carbsGramsPer100g: 3.5,
      fatGramsPer100g: 0.2,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 250,
      source: "openfoodfacts",
    };

    const firstSave = await repos.nutrition.saveExternalFoodItem(externalProduct);
    const secondSave = await repos.nutrition.saveExternalFoodItem(externalProduct);

    expect(secondSave.id).toBe(firstSave.id);

    const allFoods = await repos.nutrition.getAllFoods();
    const matches = allFoods.filter((f) => f.barcode === "8711111222223");
    expect(matches.length).toBe(1);
  });

  it("voegt een gescand extern product direct toe aan een maaltijdlogboek", async () => {
    const externalProduct: ParsedExternalFood = {
      barcode: "8712345000001",
      name: "Banaan Snack",
      brand: null,
      category: "groente_fruit",
      caloriesPer100g: 89,
      proteinGramsPer100g: 1.1,
      carbsGramsPer100g: 22.8,
      fatGramsPer100g: 0.3,
      fiberGramsPer100g: 2.6,
      defaultPortionGrams: 120,
      source: "openfoodfacts",
    };

    // Sla op als lokaal product
    const savedFood = await repos.nutrition.saveExternalFoodItem(externalProduct);

    // Bereken nutriënten voor 150g
    const nutrient = calculateNutritionForPortion(savedFood, 150);
    const mealItem: MealItemEntry = {
      foodItemId: savedFood.id,
      foodName: savedFood.name,
      portionGrams: 150,
      calories: nutrient.calories,
      proteinGrams: nutrient.proteinGrams,
      carbsGrams: nutrient.carbsGrams,
      fatGrams: nutrient.fatGrams,
      fiberGrams: nutrient.fiberGrams,
    };

    const log = await repos.nutrition.addItemToMeal("2026-10-04", "ontbijt", mealItem);
    expect(log.items.length).toBe(1);
    expect(log.items[0].foodName).toBe("Banaan Snack");
    expect(log.items[0].portionGrams).toBe(150);
    // 89 * 1.5 = 133.5 -> 134 kcal
    expect(log.totalCalories).toBe(134);
  });
});
