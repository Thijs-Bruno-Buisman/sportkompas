import { describe, it, expect } from "vitest";
import type { MealLog } from "@/types/database";
import {
  calculateDailyTotals,
  groupLogsByMealType,
  createMealLogFromItem,
  recalculateMealLogTotals,
} from "./diary";

describe("Daily Nutrition Diary Domain", () => {
  const dummyLogs: MealLog[] = [
    {
      id: "log-1",
      calendarDate: "2026-10-04",
      mealType: "ontbijt",
      items: [
        {
          foodItemId: "f1",
          foodName: "Havermout",
          portionGrams: 50,
          calories: 188,
          proteinGrams: 6.8,
          carbsGrams: 31.0,
          fatGrams: 3.5,
          fiberGrams: 5.0,
        },
        {
          foodItemId: "f2",
          foodName: "Halfvolle melk",
          portionGrams: 200,
          calories: 94,
          proteinGrams: 7.0,
          carbsGrams: 9.4,
          fatGrams: 3.0,
          fiberGrams: 0.0,
        },
      ],
      totalCalories: 282,
      totalProteinGrams: 13.8,
      totalCarbsGrams: 40.4,
      totalFatGrams: 6.5,
      totalFiberGrams: 5.0,
      loggedAt: "2026-10-04T08:00:00.000Z",
    },
    {
      id: "log-2",
      calendarDate: "2026-10-04",
      mealType: "lunch",
      items: [
        {
          foodItemId: "f3",
          foodName: "Volkorenbrood met kipfilet",
          portionGrams: 150,
          calories: 320,
          proteinGrams: 28.0,
          carbsGrams: 35.0,
          fatGrams: 4.5,
          fiberGrams: 6.0,
        },
      ],
      totalCalories: 320,
      totalProteinGrams: 28.0,
      totalCarbsGrams: 35.0,
      totalFatGrams: 4.5,
      totalFiberGrams: 6.0,
      loggedAt: "2026-10-04T12:30:00.000Z",
    },
  ];

  describe("calculateDailyTotals", () => {
    it("aggregates calories, protein, carbs, fat, and fiber accurately", () => {
      const totals = calculateDailyTotals(dummyLogs);

      expect(totals.calories).toBe(602); // 282 + 320
      expect(totals.proteinGrams).toBe(41.8); // 13.8 + 28.0
      expect(totals.carbsGrams).toBe(75.4); // 40.4 + 35.0
      expect(totals.fatGrams).toBe(11.0); // 6.5 + 4.5
      expect(totals.fiberGrams).toBe(11.0); // 5.0 + 6.0
    });

    it("returns zero totals when there are no meal logs", () => {
      const totals = calculateDailyTotals([]);
      expect(totals.calories).toBe(0);
      expect(totals.proteinGrams).toBe(0);
      expect(totals.carbsGrams).toBe(0);
    });
  });

  describe("groupLogsByMealType", () => {
    it("groups logs by meal moments and calculates sub-totals", () => {
      const grouped = groupLogsByMealType(dummyLogs);

      expect(grouped.ontbijt.itemsCount).toBe(2);
      expect(grouped.ontbijt.totalCalories).toBe(282);
      expect(grouped.ontbijt.totalProteinGrams).toBe(13.8);

      expect(grouped.lunch.itemsCount).toBe(1);
      expect(grouped.lunch.totalCalories).toBe(320);

      expect(grouped.diner.itemsCount).toBe(0);
      expect(grouped.diner.totalCalories).toBe(0);

      expect(grouped.snacks.itemsCount).toBe(0);
      expect(grouped.snacks.totalCalories).toBe(0);
    });
  });

  describe("createMealLogFromItem & recalculateMealLogTotals", () => {
    it("creates a valid single item log and recalculates on modification", () => {
      const log = createMealLogFromItem("2026-10-04", "snacks", {
        foodItemId: "f4",
        foodName: "Banaan",
        portionGrams: 120,
        calories: 107,
        proteinGrams: 1.3,
        carbsGrams: 24.0,
        fatGrams: 0.4,
        fiberGrams: 2.4,
      });

      expect(log.mealType).toBe("snacks");
      expect(log.totalCalories).toBe(107);
      expect(log.items).toHaveLength(1);

      // Add a second item manually and recalculate
      log.items.push({
        foodItemId: "f5",
        foodName: "Walnoten",
        portionGrams: 25,
        calories: 169,
        proteinGrams: 3.6,
        carbsGrams: 1.4,
        fatGrams: 16.3,
        fiberGrams: 1.5,
      });

      const updated = recalculateMealLogTotals(log);
      expect(updated.totalCalories).toBe(276); // 107 + 169
      expect(updated.totalProteinGrams).toBe(4.9); // 1.3 + 3.6
      expect(updated.totalFatGrams).toBe(16.7); // 0.4 + 16.3
      expect(updated.totalFiberGrams).toBe(3.9); // 2.4 + 1.5
    });
  });
});
