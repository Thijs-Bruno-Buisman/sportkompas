import { BaseRepository } from "./base.repository";
import type {
  WorkoutRoutine,
  RoutineDay,
  ScheduledSession,
  WorkoutSession,
  WorkoutSet,
  WorkoutRoutineSnapshot,
} from "@/types/database";
import {
  WorkoutRoutineSchema,
  RoutineDaySchema,
  ScheduledSessionSchema,
  WorkoutSessionSchema,
  WorkoutSetSchema,
} from "../schema";
import { type Table } from "dexie";

export class WorkoutRepository {
  public readonly routines: BaseRepository<WorkoutRoutine>;
  public readonly routineDays: BaseRepository<RoutineDay>;
  public readonly scheduledSessions: BaseRepository<ScheduledSession>;
  public readonly sessions: BaseRepository<WorkoutSession>;
  public readonly sets: BaseRepository<WorkoutSet>;

  constructor(
    routinesTable: Table<WorkoutRoutine, string>,
    routineDaysTable: Table<RoutineDay, string>,
    scheduledSessionsTable: Table<ScheduledSession, string>,
    sessionsTable: Table<WorkoutSession, string>,
    setsTable: Table<WorkoutSet, string>
  ) {
    this.routines = new (class extends BaseRepository<WorkoutRoutine> {})(
      routinesTable,
      WorkoutRoutineSchema
    );
    this.routineDays = new (class extends BaseRepository<RoutineDay> {})(
      routineDaysTable,
      RoutineDaySchema
    );
    this.scheduledSessions = new (class extends BaseRepository<ScheduledSession> {})(
      scheduledSessionsTable,
      ScheduledSessionSchema
    );
    this.sessions = new (class extends BaseRepository<WorkoutSession> {})(
      sessionsTable,
      WorkoutSessionSchema
    );
    this.sets = new (class extends BaseRepository<WorkoutSet> {})(
      setsTable,
      WorkoutSetSchema
    );
  }

  /**
   * Start een nieuwe trainingssessie met een onveranderlijke snapshot van de schemadag.
   * Dit garandeert dat latere schemawijzigingen eerdere voltooide workouts niet beïnvloeden.
   */
  async startSessionWithSnapshot({
    calendarDate,
    routine,
    routineDay,
    notes = "",
  }: {
    calendarDate: string;
    routine?: WorkoutRoutine | null;
    routineDay?: RoutineDay | null;
    notes?: string;
  }): Promise<WorkoutSession> {
    const now = new Date().toISOString();

    const snapshot: WorkoutRoutineSnapshot = {
      routineName: routine?.name,
      routineDayName: routineDay?.name,
      exercises:
        routineDay?.plannedExercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          primaryMuscleGroup: "onbekend",
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          restSeconds: e.restSeconds,
        })) ?? [],
    };

    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate,
      startTime: now,
      endTime: null,
      status: "actief",
      routineId: routine ? routine.id : null,
      routineDayId: routineDay ? routineDay.id : null,
      routineVersion: routine ? routine.version : null,
      snapshot,
      overallRpe: null,
      notes,
      provenance: { source: "user" },
    };

    return await this.sessions.save(newSession);
  }

  /**
   * Rond een actieve trainingssessie af met eindtijd en RPE score.
   */
  async finishSession(
    sessionId: string,
    overallRpe?: number,
    notes?: string
  ): Promise<WorkoutSession | null> {
    const session = await this.sessions.getById(sessionId);
    if (!session) return null;

    const updated: WorkoutSession = {
      ...session,
      endTime: new Date().toISOString(),
      status: "afgerond",
      overallRpe: overallRpe ?? session.overallRpe,
      notes: notes !== undefined ? notes : session.notes,
    };

    return await this.sessions.save(updated);
  }

  /**
   * Haal alle sets op voor een specifieke sessie.
   */
  async getSetsForSession(sessionId: string): Promise<WorkoutSet[]> {
    return await this.sets["table"]
      .where("sessionId")
      .equals(sessionId)
      .sortBy("setNumber");
  }

  /**
   * Haal alle workoutsessies op voor een bepaalde kalenderdatum (YYYY-MM-DD).
   */
  async getSessionsByDate(calendarDate: string): Promise<WorkoutSession[]> {
    return await this.sessions["table"]
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();
  }
}
