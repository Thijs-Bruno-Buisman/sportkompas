import { BaseRepository } from "./base.repository";
import { type Profile } from "@/types/database";
import { ProfileSchema } from "../schema";
import { type Table } from "dexie";

export class ProfileRepository extends BaseRepository<Profile> {
  constructor(table: Table<Profile, string>) {
    super(table, ProfileSchema);
  }

  async getCurrentProfile(): Promise<Profile | null> {
    const all = await this.getAll();
    return all.length > 0 ? all[0] : null;
  }

  async upsertProfile(data: Omit<Profile, "id" | "createdAt" | "updatedAt">): Promise<Profile> {
    const existing = await this.getCurrentProfile();
    const now = new Date().toISOString();

    if (existing) {
      const updated: Profile = {
        ...existing,
        ...data,
        updatedAt: now,
      };
      return await this.save(updated);
    } else {
      const newProfile: Profile = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      return await this.save(newProfile);
    }
  }
}
