import { BaseRepository } from "./base.repository";
import type {
  WorkoutRoutine,
  RoutineDay,
  ScheduledSession,
  WorkoutSession,
  WorkoutSet,
  WorkoutRoutineSnapshot,
  PlannedExerciseInDay,
} from "@/types/database";
import {
  WorkoutRoutineSchema,
  RoutineDaySchema,
  ScheduledSessionSchema,
  WorkoutSessionSchema,
  WorkoutSetSchema,
} from "../schema";
import { type Table } from "dexie";
import { validateRoutineData } from "@/domain/strength/routineValidation";
import { ValidationError } from "../errors";

export class WorkoutRepository {
  public readonly routines: BaseRepository<WorkoutRoutine>;
  public readonly routineDays: BaseRepository<RoutineDay>;
  public readonly scheduledSessions: BaseRepository<ScheduledSession>;
  public readonly sessions: BaseRepository<WorkoutSession>;
  public readonly sets: BaseRepository<WorkoutSet>;

  private readonly routinesTable: Table<WorkoutRoutine, string>;
  private readonly routineDaysTable: Table<RoutineDay, string>;
  private readonly scheduledSessionsTable: Table<ScheduledSession, string>;

  constructor(
    routinesTable: Table<WorkoutRoutine, string>,
    routineDaysTable: Table<RoutineDay, string>,
    scheduledSessionsTable: Table<ScheduledSession, string>,
    sessionsTable: Table<WorkoutSession, string>,
    setsTable: Table<WorkoutSet, string>
  ) {
    this.routinesTable = routinesTable;
    this.routineDaysTable = routineDaysTable;
    this.scheduledSessionsTable = scheduledSessionsTable;

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

  // =========================================================================
  // SCHEMA & ROUTINE BEHEER (PROMPT 07)
  // =========================================================================

  /**
   * Haalt alle trainingsschema's op, standaard met uitsluiting van gearchiveerde schema's.
   * Gesorteerd: actief schema eerst, daarna nieuwste eerst.
   */
  async getRoutines(includeArchived = false): Promise<WorkoutRoutine[]> {
    let list = await this.routinesTable.toArray();
    if (!includeArchived) {
      list = list.filter((r) => !r.isArchived);
    }

    return list.sort((a, b) => {
      // Actief schema altijd bovenaan
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      // Daarna sorteren op createdAt aflopend
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Haalt een schema op inclusief alle bijbehorende schemadagen, geordend op dayIndex.
   */
  async getRoutineWithDays(
    routineId: string
  ): Promise<{ routine: WorkoutRoutine; days: RoutineDay[] } | null> {
    const routine = await this.routines.getById(routineId);
    if (!routine) return null;

    const days = await this.routineDaysTable
      .where("routineId")
      .equals(routineId)
      .sortBy("dayIndex");

    return { routine, days };
  }

  /**
   * Slaat een schema en de bijbehorende trainingsdagen op.
   * Controleert integriteit (lege dagen, ongeldige repbereiken, incompatibele meettypes).
   * Verhoogt automatisch het versienummer indien bestaande workoutsessies naar de huidige versie verwijzen.
   */
  async saveRoutineWithDays(
    routineData: WorkoutRoutine,
    daysData: RoutineDay[]
  ): Promise<{ routine: WorkoutRoutine; days: RoutineDay[] }> {
    // 1. Domeinvalidatie
    const validationErrors = validateRoutineData(routineData.name, daysData);
    if (validationErrors.length > 0) {
      throw new ValidationError(
        validationErrors.map((e) => e.message).join(" "),
        validationErrors
      );
    }

    const now = new Date().toISOString();
    let targetVersion = routineData.version || 1;

    // 2. Controleer of bestaande workoutsessies al naar deze schemaversie verwijzen
    const existingSessionsCount = await this.sessions["table"]
      .where("routineId")
      .equals(routineData.id)
      .filter((s) => s.routineVersion === routineData.version)
      .count();

    // Indien er al sessies naar deze versie verwijzen: verhoog versienummer!
    if (existingSessionsCount > 0) {
      targetVersion = targetVersion + 1;
    }

    const routineToSave: WorkoutRoutine = {
      ...routineData,
      version: targetVersion,
      isArchived: routineData.isArchived ?? false,
      updatedAt: now,
    };

    // 3. Schema opslaan via Zod-validatie
    const savedRoutine = await this.routines.save(routineToSave);

    // 4. Schemadagen synchroniseren (verwijder oude verwijderde dagen van dit schema)
    const existingDays = await this.routineDaysTable
      .where("routineId")
      .equals(savedRoutine.id)
      .toArray();

    const newDayIds = new Set(daysData.map((d) => d.id));
    const dayIdsToDelete = existingDays
      .map((d) => d.id)
      .filter((id) => !newDayIds.has(id));

    if (dayIdsToDelete.length > 0) {
      await this.routineDaysTable.bulkDelete(dayIdsToDelete);
    }

    // 5. Schemadagen opslaan met correcte dayIndex en routineId
    const savedDays: RoutineDay[] = [];
    for (let i = 0; i < daysData.length; i++) {
      const day = daysData[i];
      const dayToSave: RoutineDay = {
        id: day.id || crypto.randomUUID(),
        routineId: savedRoutine.id,
        dayIndex: i + 1,
        name: day.name.trim(),
        plannedExercises: day.plannedExercises.map((pe) => ({ ...pe })),
        createdAt: day.createdAt || now,
      };

      const validatedDay = await this.routineDays.save(dayToSave);
      savedDays.push(validatedDay);
    }

    return { routine: savedRoutine, days: savedDays };
  }

  /**
   * Dupliceert een bestaand schema en alle bijbehorende dagen met nieuwe unieke UUIDs.
   */
  async duplicateRoutine(
    routineId: string,
    customName?: string
  ): Promise<{ routine: WorkoutRoutine; days: RoutineDay[] }> {
    const original = await this.getRoutineWithDays(routineId);
    if (!original) {
      throw new Error(`Schema met ID ${routineId} is niet gevonden om te dupliceren.`);
    }

    const newRoutineId = crypto.randomUUID();
    const now = new Date().toISOString();

    const clonedRoutine: WorkoutRoutine = {
      id: newRoutineId,
      name: customName || `${original.routine.name} (Kopie)`,
      description: original.routine.description,
      version: 1,
      isActive: false,
      isArchived: false,
      provenance: { source: "user", isDemo: false },
      createdAt: now,
      updatedAt: now,
    };

    const clonedDays: RoutineDay[] = original.days.map((d, idx) => ({
      id: crypto.randomUUID(),
      routineId: newRoutineId,
      dayIndex: idx + 1,
      name: d.name,
      plannedExercises: d.plannedExercises.map((pe) => ({ ...pe })),
      createdAt: now,
    }));

    return await this.saveRoutineWithDays(clonedRoutine, clonedDays);
  }

  /**
   * Archiveert een schema veilig. Als het schema actief was, wordt isActive op false gezet.
   */
  async archiveRoutine(routineId: string): Promise<WorkoutRoutine> {
    const routine = await this.routines.getById(routineId);
    if (!routine) {
      throw new Error(`Schema met ID ${routineId} is niet gevonden.`);
    }

    const updated: WorkoutRoutine = {
      ...routine,
      isArchived: true,
      isActive: false,
      updatedAt: new Date().toISOString(),
    };

    return await this.routines.save(updated);
  }

  /**
   * Dearchiveert / herstelt een schema.
   */
  async unarchiveRoutine(routineId: string): Promise<WorkoutRoutine> {
    const routine = await this.routines.getById(routineId);
    if (!routine) {
      throw new Error(`Schema met ID ${routineId} is niet gevonden.`);
    }

    const updated: WorkoutRoutine = {
      ...routine,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };

    return await this.routines.save(updated);
  }

  /**
   * Markeert een schema als het actieve trainingsprogramma van de gebruiker.
   * Deactiveert automatisch elk ander actief schema.
   */
  async setActiveRoutine(routineId: string): Promise<WorkoutRoutine> {
    const target = await this.routines.getById(routineId);
    if (!target) {
      throw new Error(`Schema met ID ${routineId} is niet gevonden.`);
    }

    // Deactiveer elk ander actief schema
    const allRoutines = await this.routinesTable.toArray();
    for (const r of allRoutines) {
      if (r.isActive && r.id !== routineId) {
        await this.routines.save({
          ...r,
          isActive: false,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Activeer het doelschema
    const updated: WorkoutRoutine = {
      ...target,
      isActive: true,
      isArchived: false,
      updatedAt: new Date().toISOString(),
    };

    return await this.routines.save(updated);
  }

  // =========================================================================
  // PLANNING & ACTIEF PROGRAMMA (PROMPT 08)
  // =========================================================================

  /**
   * Haalt het actieve trainingsschema op met al zijn geordende trainingsdagen.
   */
  async getActiveRoutine(): Promise<{ routine: WorkoutRoutine; days: RoutineDay[] } | null> {
    const allRoutines = await this.routinesTable.toArray();
    const active = allRoutines.find((r) => r.isActive && !r.isArchived);
    if (!active) return null;
    return await this.getRoutineWithDays(active.id);
  }

  /**
   * Haalt alle geplande sessies op binnen een datumbereik (inclusief start en eind).
   * Verrijkt elk record met de naam van het schema en de schemadag.
   */
  async getScheduledSessionsForDateRange(
    startDate: string,
    endDate: string
  ): Promise<
    (ScheduledSession & {
      routineName: string;
      routineDayName: string;
      exerciseCount: number;
      plannedExercises: PlannedExerciseInDay[];
    })[]
  > {
    const sessions = await this.scheduledSessionsTable
      .where("calendarDate")
      .between(startDate, endDate, true, true)
      .toArray();

    const enriched = await Promise.all(
      sessions.map(async (ss) => {
        const routine = await this.routines.getById(ss.routineId);
        const day = await this.routineDays.getById(ss.routineDayId);
        return {
          ...ss,
          routineName: routine?.name || "Trainingsschema",
          routineDayName: day?.name || "Workout Dag",
          dayName: day?.name || "Workout Dag",
          exerciseCount: day?.plannedExercises.length || 0,
          plannedExercises: day?.plannedExercises || [],
        };
      })
    );

    return enriched.sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));
  }

  /**
   * Haalt de geplande sessie op voor een specifieke kalenderdatum ('YYYY-MM-DD').
   */
  async getScheduledSessionForDate(
    calendarDate: string
  ): Promise<
    | (ScheduledSession & {
        routineName: string;
        routineDayName: string;
        dayName: string;
        exerciseCount: number;
        plannedExercises: PlannedExerciseInDay[];
      })
    | null
  > {
    const list = await this.scheduledSessionsTable
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();

    if (list.length === 0) return null;

    // Pak bij voorkeur een niet-geannuleerde sessie
    const target = list.find((s) => s.status !== "geannuleerd") || list[0];
    const routine = await this.routines.getById(target.routineId);
    const day = await this.routineDays.getById(target.routineDayId);

    return {
      ...target,
      routineName: routine?.name || "Trainingsschema",
      routineDayName: day?.name || "Workout Dag",
      dayName: day?.name || "Workout Dag",
      exerciseCount: day?.plannedExercises.length || 0,
      plannedExercises: day?.plannedExercises || [],
    };
  }

  /**
   * Plant één schemadag op een specifieke kalenderdatum.
   */
  async scheduleSession(data: {
    calendarDate: string;
    routineId: string;
    routineDayId: string;
    notes?: string;
  }): Promise<ScheduledSession> {
    const routine = await this.routines.getById(data.routineId);
    if (!routine) {
      throw new Error(`Schema met ID ${data.routineId} niet gevonden.`);
    }

    const day = await this.routineDays.getById(data.routineDayId);
    if (!day) {
      throw new Error(`Schemadag met ID ${data.routineDayId} niet gevonden.`);
    }

    const now = new Date().toISOString();

    // Verwijder eventuele bestaande geplande (niet afgeronde) sessie op die datum
    const existingOnDate = await this.scheduledSessionsTable
      .where("calendarDate")
      .equals(data.calendarDate)
      .filter((s) => s.status === "gepland")
      .toArray();

    if (existingOnDate.length > 0) {
      await this.scheduledSessionsTable.bulkDelete(existingOnDate.map((s) => s.id));
    }

    const sessionToSave: ScheduledSession = {
      id: crypto.randomUUID(),
      calendarDate: data.calendarDate,
      routineId: data.routineId,
      routineDayId: data.routineDayId,
      routineVersion: routine.version,
      status: "gepland",
      completedSessionId: null,
      notes: data.notes || "",
      createdAt: now,
      updatedAt: now,
    };

    return await this.scheduledSessions.save(sessionToSave);
  }

  /**
   * Plant een complete week voor een schema op basis van opgegeven toewijzingen.
   */
  async scheduleWeek(
    routineId: string,
    assignments: { routineDayId: string | null; calendarDate: string; notes?: string }[]
  ): Promise<ScheduledSession[]> {
    const saved: ScheduledSession[] = [];
    for (const item of assignments) {
      if (!item.routineDayId) {
        // Rustdag: verwijder eventuele bestaande niet-afgeronde geplande sessie op die datum
        const existingOnDate = await this.scheduledSessionsTable
          .where("calendarDate")
          .equals(item.calendarDate)
          .filter((s) => s.status === "gepland")
          .toArray();
        if (existingOnDate.length > 0) {
          await this.scheduledSessionsTable.bulkDelete(existingOnDate.map((s) => s.id));
        }
        continue;
      }
      const s = await this.scheduleSession({
        routineId,
        routineDayId: item.routineDayId,
        calendarDate: item.calendarDate,
        notes: item.notes,
      });
      saved.push(s);
    }
    return saved;
  }

  /**
   * Verplaatst een geplande sessie naar een andere datum.
   */
  async moveScheduledSession(
    sessionId: string,
    newCalendarDate: string
  ): Promise<ScheduledSession> {
    const session = await this.scheduledSessions.getById(sessionId);
    if (!session) {
      throw new Error(`Geplande sessie met ID ${sessionId} niet gevonden.`);
    }

    const updated: ScheduledSession = {
      ...session,
      calendarDate: newCalendarDate,
      updatedAt: new Date().toISOString(),
    };

    return await this.scheduledSessions.save(updated);
  }

  /**
   * Markeert een geplande sessie als 'overgeslagen' zonder eerdere geschiedenis te wissen.
   */
  async skipScheduledSession(sessionId: string): Promise<ScheduledSession> {
    const session = await this.scheduledSessions.getById(sessionId);
    if (!session) {
      throw new Error(`Geplande sessie met ID ${sessionId} niet gevonden.`);
    }

    const updated: ScheduledSession = {
      ...session,
      status: "overgeslagen",
      updatedAt: new Date().toISOString(),
    };

    return await this.scheduledSessions.save(updated);
  }

  /**
   * Herstelt een overgeslagen sessie terug naar 'gepland'.
   */
  async unskipScheduledSession(sessionId: string): Promise<ScheduledSession> {
    const session = await this.scheduledSessions.getById(sessionId);
    if (!session) {
      throw new Error(`Geplande sessie met ID ${sessionId} niet gevonden.`);
    }

    const updated: ScheduledSession = {
      ...session,
      status: "gepland",
      updatedAt: new Date().toISOString(),
    };

    return await this.scheduledSessions.save(updated);
  }

  /**
   * Verwijdert een geplande sessie (maakt van de dag weer een rustdag).
   */
  async deleteScheduledSession(sessionId: string): Promise<void> {
    await this.scheduledSessionsTable.delete(sessionId);
  }

  /**
   * Start een workout vanuit een geplande sessie.
   * Maakt een onveranderlijke snapshot van de schemadag op dit exacte moment.
   * Markeert de geplande sessie als 'afgerond' en koppelt het completedSessionId.
   */
  async startWorkoutFromScheduledSession(
    scheduledSessionId: string
  ): Promise<WorkoutSession> {
    const scheduled = await this.scheduledSessions.getById(scheduledSessionId);
    if (!scheduled) {
      throw new Error(`Geplande sessie ${scheduledSessionId} niet gevonden.`);
    }

    const routine = await this.routines.getById(scheduled.routineId);
    const routineDay = await this.routineDays.getById(scheduled.routineDayId);

    const now = new Date().toISOString();

    const snapshot: WorkoutRoutineSnapshot = {
      routineName: routine?.name || "Geplande Workout",
      routineDayName: routineDay?.name || "Trainingsdag",
      exercises:
        routineDay?.plannedExercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          primaryMuscleGroup: "onbekend",
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          targetDurationSeconds: e.targetDurationSeconds,
          restSeconds: e.restSeconds,
        })) ?? [],
    };

    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate: scheduled.calendarDate,
      startTime: now,
      endTime: null,
      status: "actief",
      routineId: routine ? routine.id : null,
      routineDayId: routineDay ? routineDay.id : null,
      routineVersion: routine ? routine.version : null,
      snapshot,
      overallRpe: null,
      notes: scheduled.notes || "",
      provenance: { source: "user" },
    };

    const savedWorkout = await this.sessions.save(newSession);

    // Koppel de gestarte workout aan de geplande sessie en zet status op 'afgerond'
    const updatedScheduled: ScheduledSession = {
      ...scheduled,
      status: "afgerond",
      completedSessionId: savedWorkout.id,
      updatedAt: now,
    };
    await this.scheduledSessions.save(updatedScheduled);

    return savedWorkout;
  }

  /**
   * Start direct een workout vanuit een willekeurige schemadag (bv. ad-hoc training).
   */
  async startWorkoutFromDay(
    routineId: string,
    routineDayId: string,
    calendarDate: string
  ): Promise<WorkoutSession> {
    const routine = await this.routines.getById(routineId);
    const routineDay = await this.routineDays.getById(routineDayId);

    const workout = await this.startSessionWithSnapshot({
      calendarDate,
      routine,
      routineDay,
    });

    // Registreer ook een voltooide ScheduledSession zodat weekplanning en agenda de sessie tonen
    const now = new Date().toISOString();
    const scheduledToSave: ScheduledSession = {
      id: crypto.randomUUID(),
      calendarDate,
      routineId,
      routineDayId,
      routineVersion: routine?.version ?? 1,
      status: "afgerond",
      completedSessionId: workout.id,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    await this.scheduledSessions.save(scheduledToSave);

    return workout;
  }

  // =========================================================================
  // WORKOUT SESSIES & SNAPSHOTS (BESTAANDE METHODES)
  // =========================================================================

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
