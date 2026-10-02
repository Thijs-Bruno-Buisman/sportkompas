import { type Table } from "dexie";
import { type ZodType } from "zod";
import {
  StorageError,
  EntityNotFoundError,
  ValidationError,
  QuotaExceededError,
} from "../errors";

export interface Identifiable {
  id: string;
}

export abstract class BaseRepository<T extends Identifiable> {
  constructor(
    protected readonly table: Table<T, string>,
    protected readonly schema?: ZodType<T, any, any>
  ) {}

  protected validate(item: unknown): T {
    if (!this.schema) return item as T;
    const result = this.schema.safeParse(item);
    if (!result.success) {
      throw new ValidationError(
        `Validatiefout bij opslaan in ${this.table.name}: ${result.error.errors
          .map((e) => `${e.path.join(".")}: ${e.message}`)
          .join(", ")}`,
        result.error.errors
      );
    }
    return result.data;
  }

  async getById(id: string): Promise<T | null> {
    try {
      const item = await this.table.get(id);
      return item ?? null;
    } catch (error) {
      throw new StorageError(
        `Fout bij ophalen van ${this.table.name} met ID ${id}`,
        error
      );
    }
  }

  async getAll(): Promise<T[]> {
    try {
      return await this.table.toArray();
    } catch (error) {
      throw new StorageError(
        `Fout bij ophalen van alle items uit ${this.table.name}`,
        error
      );
    }
  }

  async save(item: T): Promise<T> {
    const validated = this.validate(item);
    try {
      await this.table.put(validated);
      return validated;
    } catch (error: any) {
      if (error?.name === "QuotaExceededError") {
        throw new QuotaExceededError();
      }
      throw new StorageError(
        `Fout bij opslaan in ${this.table.name} met ID ${item.id}`,
        error
      );
    }
  }

  async saveBatch(items: T[]): Promise<T[]> {
    const validatedItems = items.map((i) => this.validate(i));
    try {
      await this.table.bulkPut(validatedItems);
      return validatedItems;
    } catch (error: any) {
      if (error?.name === "QuotaExceededError") {
        throw new QuotaExceededError();
      }
      throw new StorageError(
        `Fout bij batch-opslaan in ${this.table.name}`,
        error
      );
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const existing = await this.table.get(id);
      if (!existing) return false;
      await this.table.delete(id);
      return true;
    } catch (error) {
      throw new StorageError(
        `Fout bij verwijderen uit ${this.table.name} met ID ${id}`,
        error
      );
    }
  }

  async count(): Promise<number> {
    try {
      return await this.table.count();
    } catch (error) {
      throw new StorageError(`Fout bij tellen van ${this.table.name}`, error);
    }
  }
}
