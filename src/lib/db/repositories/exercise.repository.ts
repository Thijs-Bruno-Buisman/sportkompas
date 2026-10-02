import { BaseRepository } from "./base.repository";
import { type Exercise } from "@/types/database";
import { ExerciseSchema } from "../schema";
import { type Table } from "dexie";

export class ExerciseRepository extends BaseRepository<Exercise> {
  constructor(table: Table<Exercise, string>) {
    super(table, ExerciseSchema);
  }

  async getByMuscleGroup(
    muscleGroup: Exercise["primaryMuscleGroup"]
  ): Promise<Exercise[]> {
    return await this.table
      .where("primaryMuscleGroup")
      .equals(muscleGroup)
      .toArray();
  }

  async getByCategory(category: Exercise["category"]): Promise<Exercise[]> {
    return await this.table.where("category").equals(category).toArray();
  }

  async searchByName(query: string): Promise<Exercise[]> {
    const q = query.toLowerCase().trim();
    return await this.table
      .filter((ex) => ex.name.toLowerCase().includes(q))
      .toArray();
  }
}
