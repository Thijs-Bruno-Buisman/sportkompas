import { BaseRepository } from "./base.repository";
import { type CardioSession } from "@/types/database";
import { CardioSessionSchema } from "../schema";
import { type Table } from "dexie";

export class CardioRepository extends BaseRepository<CardioSession> {
  constructor(table: Table<CardioSession, string>) {
    super(table, CardioSessionSchema);
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
    activityType: CardioSession["activityType"]
  ): Promise<CardioSession[]> {
    return await this.table
      .where("activityType")
      .equals(activityType)
      .toArray();
  }
}
