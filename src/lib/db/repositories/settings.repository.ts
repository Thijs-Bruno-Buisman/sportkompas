import { BaseRepository } from "./base.repository";
import { type AppSettings } from "@/types/database";
import { AppSettingsSchema } from "../schema";
import { type Table } from "dexie";

const SETTINGS_ID = "app_settings" as const;

export class SettingsRepository extends BaseRepository<AppSettings> {
  constructor(table: Table<AppSettings, string>) {
    super(table, AppSettingsSchema);
  }

  async getSettings(): Promise<AppSettings> {
    const existing = await this.getById(SETTINGS_ID);
    if (existing) return existing;

    const defaultSettings: AppSettings = {
      id: SETTINGS_ID,
      theme: "dark",
      unitPreference: "metric",
      restTimerSeconds: 90,
      soundEnabled: true,
      hapticFeedbackEnabled: true,
      demoModeActive: false,
      activeProgramRoutineId: null,
      lastBackupAt: null,
      updatedAt: new Date().toISOString(),
    };

    return await this.save(defaultSettings);
  }

  async updateSettings(updates: Partial<Omit<AppSettings, "id">>): Promise<AppSettings> {
    const current = await this.getSettings();
    const updated: AppSettings = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    return await this.save(updated);
  }

  async getFavoriteExerciseIds(): Promise<string[]> {
    const settings = await this.getSettings();
    return settings.favoriteExerciseIds ?? [];
  }

  async setFavoriteExerciseIds(ids: string[]): Promise<AppSettings> {
    return await this.updateSettings({ favoriteExerciseIds: ids });
  }

  async toggleFavoriteExerciseId(exerciseId: string): Promise<string[]> {
    const current = await this.getFavoriteExerciseIds();
    const exists = current.includes(exerciseId);
    const updated = exists
      ? current.filter((id) => id !== exerciseId)
      : [...current, exerciseId];
    await this.setFavoriteExerciseIds(updated);
    return updated;
  }

  async getWeeklyWorkoutGoal(): Promise<number> {
    const settings = await this.getSettings();
    return settings.weeklyWorkoutGoal ?? 3;
  }

  async setWeeklyWorkoutGoal(goal: number): Promise<AppSettings> {
    const validGoal = Math.max(1, Math.min(7, Math.round(goal)));
    return await this.updateSettings({ weeklyWorkoutGoal: validGoal });
  }
}
