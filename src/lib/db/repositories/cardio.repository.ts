import { BaseRepository } from "./base.repository";
import type { CardioSession, CardioActivityType } from "@/types/database";
import { CardioSessionSchema } from "../schema";
import { type Table } from "dexie";

export interface CardioSummaryStats {
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalCalories: number;
  totalSessions: number;
  byActivity: Record<
    CardioActivityType,
    {
      count: number;
      distanceMeters: number;
      durationSeconds: number;
      calories: number;
    }
  >;
}

export class CardioRepository extends BaseRepository<CardioSession> {
  constructor(table: Table<CardioSession, string>) {
    super(table, CardioSessionSchema);
  }

  /**
   * Haalt alle sessies op, standaard gesorteerd met de meest recente bovenaan.
   */
  async getAllSessionsSorted(): Promise<CardioSession[]> {
    const sessions = await this.getAll();
    return sessions.sort((a, b) => {
      const dateA = `${a.calendarDate}T${a.startTime}`;
      const dateB = `${b.calendarDate}T${b.startTime}`;
      return dateB.localeCompare(dateA);
    });
  }

  async getSessionsByDate(calendarDate: string): Promise<CardioSession[]> {
    return await this.table
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();
  }

  async getSessionsByDateRange(
    startDate: string,
    endDate: string
  ): Promise<CardioSession[]> {
    return await this.table
      .where("calendarDate")
      .between(startDate, endDate, true, true)
      .toArray();
  }

  async getSessionsByActivity(
    activityType: CardioActivityType
  ): Promise<CardioSession[]> {
    return await this.table
      .where("activityType")
      .equals(activityType)
      .toArray();
  }

  /**
   * Filter sessies op activiteitstype en/of datumbereik.
   */
  async getFilteredSessions(options?: {
    activityType?: CardioActivityType | "alle";
    startDate?: string;
    endDate?: string;
  }): Promise<CardioSession[]> {
    let collection = this.table.toCollection();

    if (options?.activityType && options.activityType !== "alle") {
      collection = this.table.where("activityType").equals(options.activityType);
    }

    let results = await collection.toArray();

    if (options?.startDate || options?.endDate) {
      results = results.filter((s) => {
        if (options.startDate && s.calendarDate < options.startDate) return false;
        if (options.endDate && s.calendarDate > options.endDate) return false;
        return true;
      });
    }

    return results.sort((a, b) => {
      const dateA = `${a.calendarDate}T${a.startTime}`;
      const dateB = `${b.calendarDate}T${b.startTime}`;
      return dateB.localeCompare(dateA);
    });
  }

  /**
   * Berekent samenvattende statistieken en verdeling over alle geregistreerde cardio-activiteiten.
   */
  async getSummaryStats(): Promise<CardioSummaryStats> {
    const sessions = await this.getAll();

    const initialByActivity: Record<
      CardioActivityType,
      { count: number; distanceMeters: number; durationSeconds: number; calories: number }
    > = {
      hardlopen: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
      fietsen: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
      roeien: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
      wandelen: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
      zwemmen: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
      crosstrainer: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
      overig: { count: 0, distanceMeters: 0, durationSeconds: 0, calories: 0 },
    };

    let totalDistanceMeters = 0;
    let totalDurationSeconds = 0;
    let totalCalories = 0;

    for (const s of sessions) {
      // Alleen niet-geannuleerde sessies meetellen
      if (s.status === "geannuleerd") continue;

      totalDistanceMeters += s.distanceMeters;
      totalDurationSeconds += s.durationSeconds;
      totalCalories += s.estimatedCaloriesBurned ?? 0;

      const act = s.activityType in initialByActivity ? s.activityType : "overig";
      initialByActivity[act].count += 1;
      initialByActivity[act].distanceMeters += s.distanceMeters;
      initialByActivity[act].durationSeconds += s.durationSeconds;
      initialByActivity[act].calories += s.estimatedCaloriesBurned ?? 0;
    }

    return {
      totalDistanceMeters,
      totalDurationSeconds,
      totalCalories,
      totalSessions: sessions.filter((s) => s.status !== "geannuleerd").length,
      byActivity: initialByActivity,
    };
  }
}
