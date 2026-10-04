import { BaseRepository } from "./base.repository";
import { type AppSettings, type Profile } from "@/types/database";
import { AppSettingsSchema } from "../schema";
import { type Table } from "dexie";
import {
  calculateBmr,
  calculateTdee,
  calculateStrategyCalories,
  calculateMacroTargets,
  DEFAULT_NUTRITION_TARGETS,
  type DailyNutritionTargets,
  type NutritionStrategy,
  type MacroSplit,
} from "@/domain/nutrition/goals";

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

  /**
   * Haalt actuele voedingsdoelen op uit AppSettings of berekent ze dynamisch via profiel BMR/TDEE.
   */
  async getNutritionTargets(profile?: Profile | null): Promise<DailyNutritionTargets> {
    const settings = await this.getSettings();
    if (
      settings.nutritionTargetCalories &&
      settings.nutritionTargetProteinGrams &&
      settings.nutritionTargetCarbsGrams &&
      settings.nutritionTargetFatGrams
    ) {
      return {
        calories: settings.nutritionTargetCalories,
        proteinGrams: settings.nutritionTargetProteinGrams,
        carbsGrams: settings.nutritionTargetCarbsGrams,
        fatGrams: settings.nutritionTargetFatGrams,
        fiberGrams: settings.nutritionTargetFiberGrams ?? 30,
        waterMl: settings.nutritionTargetWaterMl ?? 2500,
        strategy: (settings.nutritionGoalStrategy as NutritionStrategy) ?? "onderhoud",
        macroSplit: (settings.nutritionMacroSplit as MacroSplit) ?? "gebalanceerd",
      };
    }

    if (profile && profile.startWeightKg && profile.heightMeters) {
      const birthYear = profile.birthDate ? new Date(profile.birthDate).getFullYear() : 1995;
      const age = new Date().getFullYear() - birthYear;
      const heightCm = profile.heightMeters * 100;
      const bmr = calculateBmr(
        profile.gender,
        profile.startWeightKg,
        heightCm,
        age,
        profile.formulaPreference
      );
      const tdee = calculateTdee(bmr, profile.activityLevel);

      let strategy: NutritionStrategy = "onderhoud";
      if (profile.primaryGoal === "afvallen") strategy = "afvallen_standaard";
      else if (profile.primaryGoal === "spieropbouw" || profile.primaryGoal === "kracht") strategy = "aankomen_lean";

      const targetCalories = calculateStrategyCalories(tdee, strategy);
      const split: MacroSplit =
        profile.primaryGoal === "kracht" || profile.primaryGoal === "spieropbouw"
          ? "krachtsport_per_kg"
          : "gebalanceerd";

      return calculateMacroTargets(targetCalories, split, profile.startWeightKg);
    }

    return DEFAULT_NUTRITION_TARGETS;
  }

  /**
   * Slaat aangepaste voedingsdoelen op in AppSettings.
   */
  async updateNutritionTargets(targets: DailyNutritionTargets): Promise<AppSettings> {
    return await this.updateSettings({
      nutritionGoalStrategy: targets.strategy,
      nutritionTargetCalories: targets.calories,
      nutritionTargetProteinGrams: targets.proteinGrams,
      nutritionTargetCarbsGrams: targets.carbsGrams,
      nutritionTargetFatGrams: targets.fatGrams,
      nutritionTargetFiberGrams: targets.fiberGrams,
      nutritionTargetWaterMl: targets.waterMl,
      nutritionMacroSplit: targets.macroSplit,
    });
  }

  /**
   * Werkt de Strava koppelingsstatus en atleetgegevens bij.
   */
  async updateStravaConnection(
    connected: boolean,
    athleteId?: number | null,
    athleteName?: string | null
  ): Promise<AppSettings> {
    return await this.updateSettings({
      stravaConnected: connected,
      stravaAthleteId: athleteId ?? null,
      stravaAthleteName: athleteName ?? null,
      ...(connected ? {} : { stravaLastSyncAt: null }),
    });
  }

  /**
   * Werkt het tijdstip van de laatste geslaagde Strava-synchronisatie bij.
   */
  async updateStravaLastSync(lastSyncIso: string): Promise<AppSettings> {
    return await this.updateSettings({
      stravaLastSyncAt: lastSyncIso,
    });
  }
}
