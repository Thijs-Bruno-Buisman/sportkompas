import { BaseRepository } from "./base.repository";
import type {
  FoodItem,
  MealLog,
  WaterLog,
  Recipe,
  PlannedMeal,
  FoodCategory,
  MealItemEntry,
} from "@/types/database";
import {
  FoodItemSchema,
  MealLogSchema,
  WaterLogSchema,
  RecipeSchema,
  PlannedMealSchema,
} from "../schema";
import { type Table } from "dexie";
import { DEFAULT_FOOD_ITEMS } from "@/domain/nutrition/defaultFoods";
import { filterFoods, filterRecipes } from "@/domain/nutrition/calculations";
import {
  extractRecentMealItems,
  type RecentMealItemSummary,
  createRecipeFromMealLog,
  duplicateMealItems,
} from "@/domain/nutrition/quickLog";
import {
  convertExternalToFoodItem,
  type ParsedExternalFood,
} from "@/domain/nutrition/openFoodFacts";

export class NutritionRepository {
  public readonly foods: BaseRepository<FoodItem>;
  public readonly recipes: BaseRepository<Recipe>;
  public readonly meals: BaseRepository<MealLog>;
  public readonly water: BaseRepository<WaterLog>;
  public readonly plannedMeals: BaseRepository<PlannedMeal>;

  constructor(
    foodsTable: Table<FoodItem, string>,
    mealsTable: Table<MealLog, string>,
    waterTable: Table<WaterLog, string>,
    recipesTable?: Table<Recipe, string>,
    plannedMealsTable?: Table<PlannedMeal, string>
  ) {
    this.foods = new (class extends BaseRepository<FoodItem> {})(
      foodsTable,
      FoodItemSchema
    );
    this.recipes = new (class extends BaseRepository<Recipe> {})(
      recipesTable || (foodsTable.db.table("recipes") as Table<Recipe, string>),
      RecipeSchema
    );
    this.meals = new (class extends BaseRepository<MealLog> {})(
      mealsTable,
      MealLogSchema
    );
    this.water = new (class extends BaseRepository<WaterLog> {})(
      waterTable,
      WaterLogSchema
    );
    this.plannedMeals = new (class extends BaseRepository<PlannedMeal> {})(
      plannedMealsTable ||
        (foodsTable.db.table("plannedMeals") as Table<PlannedMeal, string>),
      PlannedMealSchema
    );
  }

  /**
   * Zorgt ervoor dat de Nederlandse standaard voedingsmiddelen aanwezig zijn in de database.
   * Indien er nog geen systeem-items bestaan, worden deze geïnitieerd.
   */
  async ensureDefaultFoods(): Promise<void> {
    const existingSystemFoodsCount = await this.foods["table"]
      .filter((f) => !f.isCustom && f.provenance.source === "system")
      .count();

    if (existingSystemFoodsCount === 0) {
      const now = new Date().toISOString();
      const itemsToSeed: FoodItem[] = DEFAULT_FOOD_ITEMS.map((item) => ({
        ...item,
        id: crypto.randomUUID(),
        createdAt: now,
      }));

      await this.foods["table"].bulkAdd(itemsToSeed);
    }
  }

  /**
   * Haalt alle voedingsmiddelen op (standaard + custom).
   */
  async getAllFoods(): Promise<FoodItem[]> {
    return await this.foods.getAll();
  }

  /**
   * Zoekt en filtert voedingsmiddelen via de domeinfilter.
   */
  async searchFoods(
    query?: string,
    category?: FoodCategory | "alle",
    onlyFavorites?: boolean,
    onlyCustom?: boolean
  ): Promise<FoodItem[]> {
    const all = await this.getAllFoods();
    return filterFoods(all, { query, category, onlyFavorites, onlyCustom });
  }

  /**
   * Schakelt de favorietstatus van een voedingsmiddel om.
   */
  async toggleFavoriteFood(id: string): Promise<FoodItem | null> {
    const item = await this.foods.getById(id);
    if (!item) return null;

    const updated: FoodItem = {
      ...item,
      isFavorite: !item.isFavorite,
      updatedAt: new Date().toISOString(),
    };

    return await this.foods.save(updated);
  }

  /**
   * Verwijdert een voedingsmiddel, mits het een custom (door de gebruiker aangemaakt) item is.
   * Systeembedragen kunnen niet worden gewist ter bescherming van data-integriteit.
   */
  async deleteCustomFood(id: string): Promise<boolean> {
    const item = await this.foods.getById(id);
    if (!item || !item.isCustom) return false;

    await this.foods.delete(id);
    return true;
  }

  /**
   * Haalt alle recepten op.
   */
  async getAllRecipes(): Promise<Recipe[]> {
    return await this.recipes.getAll();
  }

  /**
   * Zoekt en filtert recepten.
   */
  async searchRecipes(query?: string, onlyFavorites?: boolean): Promise<Recipe[]> {
    const all = await this.getAllRecipes();
    return filterRecipes(all, { query, onlyFavorites });
  }

  /**
   * Schakelt de favorietstatus van een recept om.
   */
  async toggleFavoriteRecipe(id: string): Promise<Recipe | null> {
    const recipe = await this.recipes.getById(id);
    if (!recipe) return null;

    const updated: Recipe = {
      ...recipe,
      isFavorite: !recipe.isFavorite,
      updatedAt: new Date().toISOString(),
    };

    return await this.recipes.save(updated);
  }

  /**
   * Verwijdert een recept.
   */
  async deleteRecipe(id: string): Promise<void> {
    await this.recipes.delete(id);
  }

  // --- Maaltijden & Water ---
  async getMealsByDate(calendarDate: string): Promise<MealLog[]> {
    return await this.meals["table"]
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();
  }

  async getMealsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<MealLog[]> {
    return await this.meals["table"]
      .where("calendarDate")
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getWaterLogsByDate(calendarDate: string): Promise<WaterLog[]> {
    return await this.water["table"]
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();
  }

  async getWaterLogsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<WaterLog[]> {
    return await this.water["table"]
      .where("calendarDate")
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getTotalWaterMlByDate(calendarDate: string): Promise<number> {
    const logs = await this.getWaterLogsByDate(calendarDate);
    return logs.reduce((sum, item) => sum + item.amountMl, 0);
  }

  async logWater(calendarDate: string, amountMl: number): Promise<WaterLog> {
    const newLog: WaterLog = {
      id: crypto.randomUUID(),
      calendarDate,
      amountMl,
      loggedAt: new Date().toISOString(),
    };
    return await this.water.save(newLog);
  }

  async resetWaterByDate(calendarDate: string): Promise<void> {
    const logs = await this.getWaterLogsByDate(calendarDate);
    for (const log of logs) {
      await this.water.delete(log.id);
    }
  }

  /**
   * Voegt een item toe aan een maaltijdmoment op een kalenderdag.
   * Voegt samen met een bestaand maaltijdrecord van hetzelfde type indien aanwezig,
   * of maakt een nieuw record aan.
   */
  async addItemToMeal(
    calendarDate: string,
    mealType: MealLog["mealType"],
    item: MealItemEntry
  ): Promise<MealLog> {
    const existingLogs = await this.meals["table"]
      .where("calendarDate")
      .equals(calendarDate)
      .filter((m) => m.mealType === mealType)
      .toArray();

    if (existingLogs.length > 0) {
      const targetLog = existingLogs[0];
      targetLog.items.push(item);
      targetLog.totalCalories += item.calories;
      targetLog.totalProteinGrams = Math.round((targetLog.totalProteinGrams + item.proteinGrams) * 10) / 10;
      targetLog.totalCarbsGrams = Math.round((targetLog.totalCarbsGrams + item.carbsGrams) * 10) / 10;
      targetLog.totalFatGrams = Math.round((targetLog.totalFatGrams + item.fatGrams) * 10) / 10;
      targetLog.totalFiberGrams = Math.round(((targetLog.totalFiberGrams || 0) + item.fiberGrams) * 10) / 10;

      return await this.meals.save(targetLog);
    } else {
      const newLog: MealLog = {
        id: crypto.randomUUID(),
        calendarDate,
        mealType,
        items: [item],
        totalCalories: item.calories,
        totalProteinGrams: item.proteinGrams,
        totalCarbsGrams: item.carbsGrams,
        totalFatGrams: item.fatGrams,
        totalFiberGrams: item.fiberGrams,
        loggedAt: new Date().toISOString(),
      };
      return await this.meals.save(newLog);
    }
  }

  /**
   * Werkt een specifiek item bij binnen een MealLog record.
   */
  async updateItemInMeal(
    mealLogId: string,
    itemIndex: number,
    updatedItem: MealItemEntry
  ): Promise<MealLog | null> {
    const log = await this.meals.getById(mealLogId);
    if (!log || itemIndex < 0 || itemIndex >= log.items.length) return null;

    log.items[itemIndex] = updatedItem;

    // Herbereken totalen
    let cal = 0;
    let p = 0;
    let c = 0;
    let f = 0;
    let fib = 0;

    for (const item of log.items) {
      cal += item.calories;
      p += item.proteinGrams;
      c += item.carbsGrams;
      f += item.fatGrams;
      fib += item.fiberGrams || 0;
    }

    log.totalCalories = Math.round(cal);
    log.totalProteinGrams = Math.round(p * 10) / 10;
    log.totalCarbsGrams = Math.round(c * 10) / 10;
    log.totalFatGrams = Math.round(f * 10) / 10;
    log.totalFiberGrams = Math.round(fib * 10) / 10;

    return await this.meals.save(log);
  }

  /**
   * Verwijdert een item uit een MealLog. Als het maaltijdrecord leeg is geworden, wordt het gewist.
   */
  async deleteItemFromMeal(mealLogId: string, itemIndex: number): Promise<void> {
    const log = await this.meals.getById(mealLogId);
    if (!log || itemIndex < 0 || itemIndex >= log.items.length) return;

    log.items.splice(itemIndex, 1);

    if (log.items.length === 0) {
      await this.meals.delete(mealLogId);
    } else {
      let cal = 0;
      let p = 0;
      let c = 0;
      let f = 0;
      let fib = 0;

      for (const item of log.items) {
        cal += item.calories;
        p += item.proteinGrams;
        c += item.carbsGrams;
        f += item.fatGrams;
        fib += item.fiberGrams || 0;
      }

      log.totalCalories = Math.round(cal);
      log.totalProteinGrams = Math.round(p * 10) / 10;
      log.totalCarbsGrams = Math.round(c * 10) / 10;
      log.totalFatGrams = Math.round(f * 10) / 10;
      log.totalFiberGrams = Math.round(fib * 10) / 10;

      await this.meals.save(log);
    }
  }

  /**
   * Haalt unieke recent gebruikte items op uit eerdere maaltijdlogs.
   */
  async getRecentMealItems(limit: number = 20): Promise<RecentMealItemSummary[]> {
    const allLogs = await this.meals["table"].toArray();
    return extractRecentMealItems(allLogs, limit);
  }

  /**
   * Kopieert alle items van een maaltijdmoment van een brondatum naar een doeldatum.
   */
  async copyMealFromDate(
    sourceDate: string,
    targetDate: string,
    mealType: MealLog["mealType"]
  ): Promise<MealLog | null> {
    const sourceLogs = await this.meals["table"]
      .where("calendarDate")
      .equals(sourceDate)
      .filter((m: MealLog) => m.mealType === mealType)
      .toArray();

    if (sourceLogs.length === 0) return null;

    let updatedTargetLog: MealLog | null = null;
    for (const sLog of sourceLogs) {
      const clonedItems = duplicateMealItems(sLog.items);
      for (const item of clonedItems) {
        updatedTargetLog = await this.addItemToMeal(targetDate, mealType, item);
      }
    }

    return updatedTargetLog;
  }

  /**
   * Kopieert alle maaltijden van een brondatum naar een doeldatum.
   * Retourneert het totale aantal gekopieerde items.
   */
  async copyAllMealsFromDate(
    sourceDate: string,
    targetDate: string
  ): Promise<number> {
    const sourceLogs = await this.meals["table"]
      .where("calendarDate")
      .equals(sourceDate)
      .toArray();

    let count = 0;
    for (const log of sourceLogs) {
      const clonedItems = duplicateMealItems(log.items);
      for (const item of clonedItems) {
        await this.addItemToMeal(targetDate, log.mealType, item);
        count++;
      }
    }

    return count;
  }

  /**
   * Converteert een geregistreerde maaltijdlog naar een herbruikbaar Recept in de database.
   */
  async saveMealAsRecipe(
    mealLogId: string,
    recipeName: string,
    portions: number = 1
  ): Promise<Recipe> {
    const log = await this.meals.getById(mealLogId);
    if (!log || log.items.length === 0) {
      throw new Error("Maaltijdlog niet gevonden of bevat geen items om op te slaan als recept");
    }

    const recipeData = createRecipeFromMealLog(log, recipeName, portions);
    const newRecipe: Recipe = {
      ...recipeData,
      id: crypto.randomUUID(),
    };

    return await this.recipes.save(newRecipe);
  }

  // =========================================================================
  // Weekplanning & Maaltijdplanner (Prompt 24 / Stap 29)
  // =========================================================================

  /**
   * Haalt alle geplande maaltijden op voor een specifieke datum.
   */
  async getPlannedMealsByDate(calendarDate: string): Promise<PlannedMeal[]> {
    return await this.plannedMeals["table"]
      .where("calendarDate")
      .equals(calendarDate)
      .sortBy("createdAt");
  }

  /**
   * Haalt alle geplande maaltijden op voor een datumbereik (bijv. een week van maandag t/m zondag).
   */
  async getPlannedMealsForRange(
    startDate: string,
    endDate: string
  ): Promise<PlannedMeal[]> {
    return await this.plannedMeals["table"]
      .where("calendarDate")
      .between(startDate, endDate, true, true)
      .toArray();
  }

  /**
   * Plant een nieuwe maaltijd in op een specifieke dag en maaltijdmoment.
   */
  async planMeal(
    mealData: Omit<PlannedMeal, "id" | "createdAt" | "provenance"> & {
      provenance?: PlannedMeal["provenance"];
    }
  ): Promise<PlannedMeal> {
    const newMeal: PlannedMeal = {
      ...mealData,
      id: crypto.randomUUID(),
      provenance: mealData.provenance || { source: "user" },
      createdAt: new Date().toISOString(),
    };
    return await this.plannedMeals.save(newMeal);
  }

  /**
   * Wijzigt een bestaande geplande maaltijd.
   */
  async updatePlannedMeal(
    id: string,
    updates: Partial<Omit<PlannedMeal, "id" | "createdAt">>
  ): Promise<PlannedMeal> {
    const existing = await this.plannedMeals.getById(id);
    if (!existing) {
      throw new Error(`Geplande maaltijd met id ${id} niet gevonden`);
    }

    const updated: PlannedMeal = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    return await this.plannedMeals.save(updated);
  }

  /**
   * Verwijdert een geplande maaltijd.
   */
  async deletePlannedMeal(id: string): Promise<void> {
    await this.plannedMeals.delete(id);
  }

  /**
   * Markeert een geplande maaltijd als 'genuttigd' en logt de items automatisch
   * in het voedingsdagboek (MealLog) voor die datum en maaltijdmoment.
   */
  async markPlannedMealAsConsumed(
    plannedMealId: string
  ): Promise<{ plannedMeal: PlannedMeal; mealLog: MealLog }> {
    const planned = await this.plannedMeals.getById(plannedMealId);
    if (!planned) {
      throw new Error(`Geplande maaltijd met id ${plannedMealId} niet gevonden`);
    }

    // Voeg items toe aan het voedingsdagboek voor die datum
    let lastMealLog: MealLog | null = null;
    for (const item of planned.items) {
      lastMealLog = await this.addItemToMeal(
        planned.calendarDate,
        planned.mealType,
        item
      );
    }

    if (!lastMealLog) {
      const emptyLog: MealLog = {
        id: crypto.randomUUID(),
        calendarDate: planned.calendarDate,
        mealType: planned.mealType,
        items: [],
        totalCalories: planned.totalCalories,
        totalProteinGrams: planned.totalProteinGrams,
        totalCarbsGrams: planned.totalCarbsGrams,
        totalFatGrams: planned.totalFatGrams,
        totalFiberGrams: planned.totalFiberGrams || 0,
        loggedAt: new Date().toISOString(),
      };
      lastMealLog = await this.meals.save(emptyLog);
    }

    const updatedPlanned: PlannedMeal = {
      ...planned,
      status: "genuttigd",
      consumedMealLogId: lastMealLog.id,
      updatedAt: new Date().toISOString(),
    };

    const savedPlanned = await this.plannedMeals.save(updatedPlanned);

    return {
      plannedMeal: savedPlanned,
      mealLog: lastMealLog,
    };
  }

  /**
   * Kopieert alle geplande maaltijden van een brondatum naar een doeldatum.
   */
  async copyPlannedMealsToDate(
    sourceDate: string,
    targetDate: string
  ): Promise<number> {
    const sourceMeals = await this.getPlannedMealsByDate(sourceDate);
    let count = 0;

    const now = new Date().toISOString();
    for (const meal of sourceMeals) {
      const clonedItems = duplicateMealItems(meal.items);
      const clonedMeal: PlannedMeal = {
        id: crypto.randomUUID(),
        calendarDate: targetDate,
        mealType: meal.mealType,
        name: meal.name,
        recipeId: meal.recipeId,
        items: clonedItems,
        totalCalories: meal.totalCalories,
        totalProteinGrams: meal.totalProteinGrams,
        totalCarbsGrams: meal.totalCarbsGrams,
        totalFatGrams: meal.totalFatGrams,
        totalFiberGrams: meal.totalFiberGrams,
        status: "gepland",
        notes: meal.notes,
        provenance: { source: "user" },
        createdAt: now,
      };

      await this.plannedMeals.save(clonedMeal);
      count++;
    }

    return count;
  }

  // =========================================================================
  // Streepjescodes & Externe Zoekfunctie (Prompt 25 / Stap 30)
  // =========================================================================

  /**
   * Zoekt een lokaal voedingsmiddel op basis van een streepjescode.
   */
  async getFoodByBarcode(barcode: string): Promise<FoodItem | undefined> {
    const clean = barcode.trim();
    if (!clean) return undefined;
    return await this.foods["table"]
      .where("barcode")
      .equals(clean)
      .first();
  }

  /**
   * Slaat een extern (Open Food Facts) product op in de lokale database.
   * Indien het product al bestaat met dezelfde barcode, wordt het bestaande product geretourneerd.
   */
  async saveExternalFoodItem(external: ParsedExternalFood): Promise<FoodItem> {
    if (external.barcode) {
      const existing = await this.getFoodByBarcode(external.barcode);
      if (existing) {
        return existing;
      }
    }

    const itemData = convertExternalToFoodItem(external);
    const newFoodItem: FoodItem = {
      ...itemData,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };

    return await this.foods.save(newFoodItem);
  }
}
