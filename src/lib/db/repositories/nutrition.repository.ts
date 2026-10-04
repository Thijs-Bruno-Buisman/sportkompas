import { BaseRepository } from "./base.repository";
import type { FoodItem, MealLog, WaterLog, Recipe, FoodCategory } from "@/types/database";
import { FoodItemSchema, MealLogSchema, WaterLogSchema, RecipeSchema } from "../schema";
import { type Table } from "dexie";
import { DEFAULT_FOOD_ITEMS } from "@/domain/nutrition/defaultFoods";
import { filterFoods, filterRecipes } from "@/domain/nutrition/calculations";

export class NutritionRepository {
  public readonly foods: BaseRepository<FoodItem>;
  public readonly recipes: BaseRepository<Recipe>;
  public readonly meals: BaseRepository<MealLog>;
  public readonly water: BaseRepository<WaterLog>;

  constructor(
    foodsTable: Table<FoodItem, string>,
    mealsTable: Table<MealLog, string>,
    waterTable: Table<WaterLog, string>,
    recipesTable?: Table<Recipe, string>
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

  async getWaterLogsByDate(calendarDate: string): Promise<WaterLog[]> {
    return await this.water["table"]
      .where("calendarDate")
      .equals(calendarDate)
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
}
