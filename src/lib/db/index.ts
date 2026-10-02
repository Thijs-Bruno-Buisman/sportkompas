import { db, SportKompasDatabase, getDatabase } from "./dexie";
import { ProfileRepository } from "./repositories/profile.repository";
import { ExerciseRepository } from "./repositories/exercise.repository";
import { WorkoutRepository } from "./repositories/workout.repository";
import { CardioRepository } from "./repositories/cardio.repository";
import { NutritionRepository } from "./repositories/nutrition.repository";
import { MeasurementRepository } from "./repositories/measurement.repository";
import { RecoveryRepository } from "./repositories/recovery.repository";
import { SettingsRepository } from "./repositories/settings.repository";

export function createRepositories(database: SportKompasDatabase = db) {
  return {
    profile: new ProfileRepository(database.profiles),
    exercises: new ExerciseRepository(database.exercises),
    workout: new WorkoutRepository(
      database.workoutRoutines,
      database.routineDays,
      database.scheduledSessions,
      database.workoutSessions,
      database.workoutSets
    ),
    cardio: new CardioRepository(database.cardioSessions),
    nutrition: new NutritionRepository(
      database.foodItems,
      database.mealLogs,
      database.waterLogs
    ),
    measurements: new MeasurementRepository(database.bodyMeasurements),
    recovery: new RecoveryRepository(database.recoveryLogs),
    settings: new SettingsRepository(database.appSettings),
  };
}

export type Repositories = ReturnType<typeof createRepositories>;

let realRepos: Repositories | null = null;
let demoRepos: Repositories | null = null;

export function getRepositories(isDemo = false): Repositories {
  if (isDemo) {
    if (!demoRepos) {
      demoRepos = createRepositories(getDatabase(true));
    }
    return demoRepos;
  }
  if (!realRepos) {
    realRepos = createRepositories(getDatabase(false));
  }
  return realRepos;
}

export const repositories = createRepositories(db);

export * from "./dexie";
export * from "./errors";
export * from "./capacity";
export * from "./schema";
export * from "./DatabaseContext";
export * from "./demo/seedDemo";
export * from "./demo/demoData";
