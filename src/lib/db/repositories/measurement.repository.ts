import { BaseRepository } from "./base.repository";
import { type BodyMeasurement } from "@/types/database";
import { BodyMeasurementSchema } from "../schema";
import { type Table } from "dexie";

export class MeasurementRepository extends BaseRepository<BodyMeasurement> {
  constructor(table: Table<BodyMeasurement, string>) {
    super(table, BodyMeasurementSchema);
  }

  async getLatestMeasurement(): Promise<BodyMeasurement | null> {
    const list = await this.table.orderBy("calendarDate").reverse().limit(1).toArray();
    return list.length > 0 ? list[0] : null;
  }

  async getMeasurementsByRange(
    startDate: string,
    endDate: string
  ): Promise<BodyMeasurement[]> {
    return await this.table
      .where("calendarDate")
      .between(startDate, endDate, true, true)
      .sortBy("calendarDate");
  }

  async logWeightOnly(
    calendarDate: string,
    weightKg: number,
    notes = ""
  ): Promise<BodyMeasurement> {
    const newMeasurement: BodyMeasurement = {
      id: crypto.randomUUID(),
      calendarDate,
      measuredAt: new Date().toISOString(),
      weightKg,
      bodyFatPercentage: null,
      chestMeters: null,
      waistMeters: null,
      hipsMeters: null,
      armsMeters: null,
      thighsMeters: null,
      notes,
      provenance: { source: "user" },
    };
    return await this.save(newMeasurement);
  }
}
