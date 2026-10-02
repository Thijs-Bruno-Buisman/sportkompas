import { BaseRepository } from "./base.repository";
import type { FoodItem, MealLog, WaterLog } from "@/types/database";
import { FoodItemSchema, MealLogSchema, WaterLogSchema } from "../schema";
import { type Table } from "dexie";

export class NutritionRepository {
  public readonly foods: BaseRepository<FoodItem>;
  public readonly meals: BaseRepository<MealLog>;
  public readonly water: BaseRepository<WaterLog>;

  constructor(
    foodsTable: Table<FoodItem, string>,
    mealsTable: Table<MealLog, string>,
    waterTable: Table<WaterLog, string>
  ) {
    this.foods = new (class extends BaseRepository<FoodItem> {})(
      foodsTable,
      FoodItemSchema
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

  async searchFoods(query: string): Promise<FoodItem[]> {
    const q = query.toLowerCase().trim();
    return await this.foods["table"]
      .filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.brand ? f.brand.toLowerCase().includes(q) : false)
      )
      .toArray();
  }

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
