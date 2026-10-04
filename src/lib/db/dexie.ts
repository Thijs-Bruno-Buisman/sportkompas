import Dexie, { type Table } from "dexie";
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
  WaterLog,
  BodyMeasurement,
  RecoveryLog,
  AppSettings,
} from "@/types/database";

export class SportKompasDatabase extends Dexie {
  // Tabellen
  profiles!: Table<Profile, string>;
  exercises!: Table<Exercise, string>;
  workoutRoutines!: Table<WorkoutRoutine, string>;
  routineDays!: Table<RoutineDay, string>;
  scheduledSessions!: Table<ScheduledSession, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  workoutSets!: Table<WorkoutSet, string>;
  cardioSessions!: Table<CardioSession, string>;
  goals!: Table<Goal, string>;
  foodItems!: Table<FoodItem, string>;
  recipes!: Table<Recipe, string>;
  mealLogs!: Table<MealLog, string>;
  waterLogs!: Table<WaterLog, string>;
  bodyMeasurements!: Table<BodyMeasurement, string>;
  recoveryLogs!: Table<RecoveryLog, string>;
  appSettings!: Table<AppSettings, string>;

  constructor(databaseName = "SportKompasDB") {
    super(databaseName);

    // =========================================================================
    // VERSIE 1: Initiële schema-opzet
    // =========================================================================
    this.version(1).stores({
      profiles: "id, name, createdAt",
      exercises: "id, name, category, primaryMuscleGroup, isCustom, createdAt",
      workoutRoutines: "id, name, version, isActive, createdAt",
      routineDays: "id, routineId, dayIndex",
      scheduledSessions: "id, calendarDate, routineId, status",
      workoutSessions: "id, calendarDate, startTime, status, routineId",
      workoutSets: "id, sessionId, exerciseId, setNumber",
      cardioSessions: "id, calendarDate, startTime, activityType",
      goals: "id, category, status, targetDate",
      foodItems: "id, name, isCustom, createdAt",
      mealLogs: "id, calendarDate, mealType, loggedAt",
      waterLogs: "id, calendarDate, loggedAt",
      bodyMeasurements: "id, calendarDate, measuredAt",
      recoveryLogs: "id, calendarDate, loggedAt",
      appSettings: "id",
    });

    // =========================================================================
    // VERSIE 2: Geoptimaliseerde samengestelde indexen & migratie
    // Behoudt 100% van de bestaande gebruikersdata zonder dataverlies
    // =========================================================================
    this.version(2)
      .stores({
        profiles: "id, name, createdAt",
        exercises: "id, name, category, primaryMuscleGroup, isCustom, createdAt",
        workoutRoutines: "id, name, version, isActive, createdAt",
        routineDays: "id, routineId, dayIndex",
        scheduledSessions:
          "id, calendarDate, routineId, status, [calendarDate+status]",
        workoutSessions:
          "id, calendarDate, startTime, status, routineId, [calendarDate+status]",
        workoutSets:
          "id, sessionId, exerciseId, setNumber, [sessionId+exerciseId]",
        cardioSessions: "id, calendarDate, startTime, activityType",
        goals: "id, category, status, targetDate",
        foodItems: "id, name, isCustom, createdAt",
        mealLogs: "id, calendarDate, mealType, loggedAt",
        waterLogs: "id, calendarDate, loggedAt",
        bodyMeasurements: "id, calendarDate, measuredAt",
        recoveryLogs: "id, calendarDate, loggedAt",
        appSettings: "id",
      })
      .upgrade(async (tx) => {
        // Upgrade logica: garandeer dat alle records een provenance-object hebben
        // indien ze gemigreerd zijn vanuit een oudere versie
        await tx
          .table("exercises")
          .toCollection()
          .modify((exercise) => {
            if (!exercise.provenance) {
              exercise.provenance = { source: "system" };
            }
          });

        await tx
          .table("workoutSessions")
          .toCollection()
          .modify((session) => {
            if (!session.provenance) {
              session.provenance = { source: "user" };
            }
            if (!session.snapshot) {
              session.snapshot = { exercises: [] };
            }
          });
      });

    // =========================================================================
    // VERSIE 3: Oefeningenbibliotheek uitbreiding (isArchived, measurementType)
    // =========================================================================
    this.version(3)
      .stores({
        profiles: "id, name, createdAt",
        exercises:
          "id, name, category, primaryMuscleGroup, equipment, measurementType, isCustom, isArchived, createdAt",
        workoutRoutines: "id, name, version, isActive, createdAt",
        routineDays: "id, routineId, dayIndex",
        scheduledSessions:
          "id, calendarDate, routineId, status, [calendarDate+status]",
        workoutSessions:
          "id, calendarDate, startTime, status, routineId, [calendarDate+status]",
        workoutSets:
          "id, sessionId, exerciseId, setNumber, [sessionId+exerciseId]",
        cardioSessions: "id, calendarDate, startTime, activityType",
        goals: "id, category, status, targetDate",
        foodItems: "id, name, isCustom, createdAt",
        mealLogs: "id, calendarDate, mealType, loggedAt",
        waterLogs: "id, calendarDate, loggedAt",
        bodyMeasurements: "id, calendarDate, measuredAt",
        recoveryLogs: "id, calendarDate, loggedAt",
        appSettings: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table("exercises")
          .toCollection()
          .modify((exercise) => {
            if (exercise.isArchived === undefined) {
              exercise.isArchived = false;
            }
            if (!exercise.measurementType) {
              exercise.measurementType = "gewicht_herhalingen";
            }
            if (!exercise.alternativeNames) {
              exercise.alternativeNames = [];
            }
          });
      });

    // =========================================================================
    // VERSIE 4: Schema- en Routinebeheer (isArchived indexering op workoutRoutines)
    // =========================================================================
    this.version(4)
      .stores({
        profiles: "id, name, createdAt",
        exercises:
          "id, name, category, primaryMuscleGroup, equipment, measurementType, isCustom, isArchived, createdAt",
        workoutRoutines: "id, name, version, isActive, isArchived, createdAt",
        routineDays: "id, routineId, dayIndex",
        scheduledSessions:
          "id, calendarDate, routineId, status, [calendarDate+status]",
        workoutSessions:
          "id, calendarDate, startTime, status, routineId, [calendarDate+status]",
        workoutSets:
          "id, sessionId, exerciseId, setNumber, [sessionId+exerciseId]",
        cardioSessions: "id, calendarDate, startTime, activityType",
        goals: "id, category, status, targetDate",
        foodItems: "id, name, isCustom, createdAt",
        mealLogs: "id, calendarDate, mealType, loggedAt",
        waterLogs: "id, calendarDate, loggedAt",
        bodyMeasurements: "id, calendarDate, measuredAt",
        recoveryLogs: "id, calendarDate, loggedAt",
        appSettings: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table("workoutRoutines")
          .toCollection()
          .modify((routine) => {
            if (routine.isArchived === undefined) {
              routine.isArchived = false;
            }
          });
      });

    // =========================================================================
    // VERSIE 5: Voedingsmiddelen & Recepten Database (Prompt 20 / Stap 25)
    // =========================================================================
    this.version(5)
      .stores({
        profiles: "id, name, createdAt",
        exercises:
          "id, name, category, primaryMuscleGroup, equipment, measurementType, isCustom, isArchived, createdAt",
        workoutRoutines: "id, name, version, isActive, isArchived, createdAt",
        routineDays: "id, routineId, dayIndex",
        scheduledSessions:
          "id, calendarDate, routineId, status, [calendarDate+status]",
        workoutSessions:
          "id, calendarDate, startTime, status, routineId, [calendarDate+status]",
        workoutSets:
          "id, sessionId, exerciseId, setNumber, [sessionId+exerciseId]",
        cardioSessions: "id, calendarDate, startTime, activityType",
        goals: "id, category, status, targetDate",
        foodItems: "id, name, category, isCustom, isFavorite, createdAt",
        recipes: "id, name, isCustom, isFavorite, createdAt",
        mealLogs: "id, calendarDate, mealType, loggedAt",
        waterLogs: "id, calendarDate, loggedAt",
        bodyMeasurements: "id, calendarDate, measuredAt",
        recoveryLogs: "id, calendarDate, loggedAt",
        appSettings: "id",
      })
      .upgrade(async (tx) => {
        await tx
          .table("foodItems")
          .toCollection()
          .modify((food) => {
            if (!food.category) {
              food.category = "overig";
            }
            if (food.isFavorite === undefined) {
              food.isFavorite = false;
            }
          });
      });
  }
}

export const DB_NAME_REAL = "SportKompasDB";
export const DB_NAME_DEMO = "SportKompasDemoDB";

// Singleton instanties voor client-side gebruik (echt vs demo volledig gescheiden)
let realDbInstance: SportKompasDatabase | null = null;
let demoDbInstance: SportKompasDatabase | null = null;

export function getDatabase(isDemo = false): SportKompasDatabase {
  if (isDemo) {
    if (!demoDbInstance) {
      demoDbInstance = new SportKompasDatabase(DB_NAME_DEMO);
    }
    return demoDbInstance;
  }

  if (!realDbInstance) {
    realDbInstance = new SportKompasDatabase(DB_NAME_REAL);
  }
  return realDbInstance;
}

export const db = getDatabase(false);
