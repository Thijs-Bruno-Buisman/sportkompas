import { z } from "zod";
import type { SportKompasDatabase } from "@/lib/db/dexie";
import type {
  Profile,
  Exercise,
  WorkoutRoutine,
  RoutineDay,
  ScheduledSession,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  Goal,
  FoodItem,
  Recipe,
  MealLog,
  PlannedMeal,
  WaterLog,
  BodyMeasurement,
  RecoveryLog,
  AppSettings,
} from "@/types/database";

export const BACKUP_FORMAT_VERSION = "1.0.0" as const;
export const CURRENT_DATABASE_SCHEMA_VERSION = 7 as const;
export const APP_VERSION = "0.1.0" as const;

export interface BackupMetadata {
  appName: "SportKompas";
  appVersion: string;
  formatVersion: typeof BACKUP_FORMAT_VERSION;
  schemaVersion: number;
  exportedAt: string; // ISO string
  databaseName: string;
  recordCounts: Record<string, number>;
}

export interface SportKompasBackupPayload {
  metadata: BackupMetadata;
  data: {
    profiles: Profile[];
    exercises: Exercise[];
    workoutRoutines: WorkoutRoutine[];
    routineDays: RoutineDay[];
    scheduledSessions: ScheduledSession[];
    workoutSessions: WorkoutSession[];
    workoutSets: WorkoutSet[];
    cardioSessions: CardioSession[];
    goals: Goal[];
    foodItems: FoodItem[];
    recipes: Recipe[];
    mealLogs: MealLog[];
    plannedMeals: PlannedMeal[];
    waterLogs: WaterLog[];
    bodyMeasurements: BodyMeasurement[];
    recoveryLogs: RecoveryLog[];
    appSettings: AppSettings[];
  };
}

export interface TableSummary {
  tableName: string;
  displayName: string;
  count: number;
}

export interface BackupPreview {
  metadata: BackupMetadata;
  totalRecords: number;
  tables: TableSummary[];
  isCompatible: boolean;
  compatibilityWarning?: string;
}

export interface ImportResult {
  success: boolean;
  mode: "replace" | "merge";
  importedAt: string;
  recordsImported: number;
  tableCounts: Record<string, number>;
  error?: string;
}

const BackupMetadataSchema = z.object({
  appName: z.literal("SportKompas"),
  appVersion: z.string(),
  formatVersion: z.string(),
  schemaVersion: z.number().int().min(1),
  exportedAt: z.string(),
  databaseName: z.string(),
  recordCounts: z.record(z.string(), z.number()),
});

export const SportKompasBackupPayloadSchema = z.object({
  metadata: BackupMetadataSchema,
  data: z.object({
    profiles: z.array(z.any()).default([]),
    exercises: z.array(z.any()).default([]),
    workoutRoutines: z.array(z.any()).default([]),
    routineDays: z.array(z.any()).default([]),
    scheduledSessions: z.array(z.any()).default([]),
    workoutSessions: z.array(z.any()).default([]),
    workoutSets: z.array(z.any()).default([]),
    cardioSessions: z.array(z.any()).default([]),
    goals: z.array(z.any()).default([]),
    foodItems: z.array(z.any()).default([]),
    recipes: z.array(z.any()).default([]),
    mealLogs: z.array(z.any()).default([]),
    plannedMeals: z.array(z.any()).default([]),
    waterLogs: z.array(z.any()).default([]),
    bodyMeasurements: z.array(z.any()).default([]),
    recoveryLogs: z.array(z.any()).default([]),
    appSettings: z.array(z.any()).default([]),
  }),
});

export const TABLE_DISPLAY_NAMES: Record<string, string> = {
  profiles: "Gebruikersprofiel",
  exercises: "Oefeningenbibliotheek",
  workoutRoutines: "Trainingsschema's",
  routineDays: "Schemadagen",
  scheduledSessions: "Geplande Workouts",
  workoutSessions: "Voltooide Workouts",
  workoutSets: "Geregistreerde Sets",
  cardioSessions: "Cardiosessies",
  goals: "Doelen",
  foodItems: "Voedingsmiddelen",
  recipes: "Recepten & Gerechten",
  mealLogs: "Maaltijdendagboek",
  plannedMeals: "Geplande Maaltijden",
  waterLogs: "Waterinname",
  bodyMeasurements: "Lichaamsmetingen",
  recoveryLogs: "Herstellogs",
  appSettings: "App Instellingen",
};

/**
 * Genereert een vriendelijke bestandsnaam met datum en tijd.
 * Bv: sportkompas-backup-2026-10-14-1430.json
 */
export function generateBackupFilename(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");
  return `sportkompas-backup-${y}-${m}-${d}-${hh}${mm}.json`;
}

/**
 * Exporteert alle tabellen van de opgegeven Dexie database naar een JSON structuur.
 */
export async function exportDatabaseToJson(db: SportKompasDatabase): Promise<{
  payload: SportKompasBackupPayload;
  jsonString: string;
  filename: string;
  sizeBytes: number;
}> {
  const [
    profiles,
    exercises,
    workoutRoutines,
    routineDays,
    scheduledSessions,
    workoutSessions,
    workoutSets,
    cardioSessions,
    goals,
    foodItems,
    recipes,
    mealLogs,
    plannedMeals,
    waterLogs,
    bodyMeasurements,
    recoveryLogs,
    appSettings,
  ] = await Promise.all([
    db.profiles.toArray(),
    db.exercises.toArray(),
    db.workoutRoutines.toArray(),
    db.routineDays.toArray(),
    db.scheduledSessions.toArray(),
    db.workoutSessions.toArray(),
    db.workoutSets.toArray(),
    db.cardioSessions.toArray(),
    db.goals.toArray(),
    db.foodItems.toArray(),
    db.recipes.toArray(),
    db.mealLogs.toArray(),
    db.plannedMeals.toArray(),
    db.waterLogs.toArray(),
    db.bodyMeasurements.toArray(),
    db.recoveryLogs.toArray(),
    db.appSettings.toArray(),
  ]);

  const recordCounts: Record<string, number> = {
    profiles: profiles.length,
    exercises: exercises.length,
    workoutRoutines: workoutRoutines.length,
    routineDays: routineDays.length,
    scheduledSessions: scheduledSessions.length,
    workoutSessions: workoutSessions.length,
    workoutSets: workoutSets.length,
    cardioSessions: cardioSessions.length,
    goals: goals.length,
    foodItems: foodItems.length,
    recipes: recipes.length,
    mealLogs: mealLogs.length,
    plannedMeals: plannedMeals.length,
    waterLogs: waterLogs.length,
    bodyMeasurements: bodyMeasurements.length,
    recoveryLogs: recoveryLogs.length,
    appSettings: appSettings.length,
  };

  const metadata: BackupMetadata = {
    appName: "SportKompas",
    appVersion: APP_VERSION,
    formatVersion: BACKUP_FORMAT_VERSION,
    schemaVersion: CURRENT_DATABASE_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    databaseName: db.name,
    recordCounts,
  };

  const payload: SportKompasBackupPayload = {
    metadata,
    data: {
      profiles,
      exercises,
      workoutRoutines,
      routineDays,
      scheduledSessions,
      workoutSessions,
      workoutSets,
      cardioSessions,
      goals,
      foodItems,
      recipes,
      mealLogs,
      plannedMeals,
      waterLogs,
      bodyMeasurements,
      recoveryLogs,
      appSettings,
    },
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const sizeBytes = new Blob([jsonString]).size;
  const filename = generateBackupFilename(new Date());

  return {
    payload,
    jsonString,
    filename,
    sizeBytes,
  };
}

/**
 * Valideert een JSON back-up bestand en genereert een preview.
 */
export function validateBackupFile(jsonString: string): {
  isValid: boolean;
  payload?: SportKompasBackupPayload;
  preview?: BackupPreview;
  errorMessage?: string;
} {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    return {
      isValid: false,
      errorMessage: "Het bestand is geen geldige JSON. Controleer of het bestand niet beschadigd is.",
    };
  }

  const result = SportKompasBackupPayloadSchema.safeParse(parsed);
  if (!result.success) {
    const errorDetails = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ");
    return {
      isValid: false,
      errorMessage: `Geen geldig SportKompas back-upbestand: ${errorDetails}`,
    };
  }

  const payload = result.data as SportKompasBackupPayload;
  const { metadata, data } = payload;

  const tables: TableSummary[] = Object.keys(TABLE_DISPLAY_NAMES).map((key) => {
    const tableData = (data as unknown as Record<string, unknown[]>)[key] || [];
    return {
      tableName: key,
      displayName: TABLE_DISPLAY_NAMES[key] || key,
      count: tableData.length,
    };
  });

  const totalRecords = tables.reduce((acc, t) => acc + t.count, 0);

  let isCompatible = true;
  let compatibilityWarning: string | undefined;

  if (metadata.schemaVersion > CURRENT_DATABASE_SCHEMA_VERSION) {
    isCompatible = false;
    compatibilityWarning = `Dit back-upbestand is gemaakt met een nieuwere databaseversie (v${metadata.schemaVersion}) dan de huidige app ondersteunt (v${CURRENT_DATABASE_SCHEMA_VERSION}).`;
  }

  const preview: BackupPreview = {
    metadata,
    totalRecords,
    tables,
    isCompatible,
    compatibilityWarning,
  };

  return {
    isValid: true,
    payload,
    preview,
  };
}

/**
 * Voert een import uit op de Dexie database in 'replace' of 'merge' modus.
 */
export async function importDatabaseFromJson(
  db: SportKompasDatabase,
  payload: SportKompasBackupPayload,
  mode: "replace" | "merge" = "replace"
): Promise<ImportResult> {
  const { data } = payload;
  const tableCounts: Record<string, number> = {};
  let totalImported = 0;

  try {
    await db.transaction(
      "rw",
      [
        db.profiles,
        db.exercises,
        db.workoutRoutines,
        db.routineDays,
        db.scheduledSessions,
        db.workoutSessions,
        db.workoutSets,
        db.cardioSessions,
        db.goals,
        db.foodItems,
        db.recipes,
        db.mealLogs,
        db.plannedMeals,
        db.waterLogs,
        db.bodyMeasurements,
        db.recoveryLogs,
        db.appSettings,
      ],
      async () => {
        const tableKeys = [
          "profiles",
          "exercises",
          "workoutRoutines",
          "routineDays",
          "scheduledSessions",
          "workoutSessions",
          "workoutSets",
          "cardioSessions",
          "goals",
          "foodItems",
          "recipes",
          "mealLogs",
          "plannedMeals",
          "waterLogs",
          "bodyMeasurements",
          "recoveryLogs",
          "appSettings",
        ] as const;

        for (const key of tableKeys) {
          const table = db[key] as unknown as {
            clear: () => Promise<void>;
            bulkPut: (items: unknown[]) => Promise<void>;
          };
          const records = data[key] || [];

          if (mode === "replace") {
            await table.clear();
          }

          if (records.length > 0) {
            await table.bulkPut(records);
          }

          tableCounts[key] = records.length;
          totalImported += records.length;
        }

        // Werk lastBackupAt bij in AppSettings
        const currentSettings = await db.appSettings.get("app_settings");
        if (currentSettings) {
          await db.appSettings.put({
            ...currentSettings,
            lastBackupAt: new Date().toISOString(),
          });
        }
      }
    );

    return {
      success: true,
      mode,
      importedAt: new Date().toISOString(),
      recordsImported: totalImported,
      tableCounts,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      mode,
      importedAt: new Date().toISOString(),
      recordsImported: 0,
      tableCounts: {},
      error: `Import mislukt: ${errorMsg}`,
    };
  }
}
