import { BaseRepository } from "./base.repository";
import { type RecoveryLog } from "@/types/database";
import { RecoveryLogSchema } from "../schema";
import { type Table } from "dexie";

export class RecoveryRepository extends BaseRepository<RecoveryLog> {
  constructor(table: Table<RecoveryLog, string>) {
    super(table, RecoveryLogSchema);
  }

  async getRecoveryByDate(calendarDate: string): Promise<RecoveryLog | null> {
    const list = await this.table
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();
    return list.length > 0 ? list[0] : null;
  }
}
