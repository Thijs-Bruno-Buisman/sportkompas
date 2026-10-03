import { BaseRepository } from "./base.repository";
import type {
  WorkoutRoutine,
  RoutineDay,
  ScheduledSession,
  WorkoutSession,
  WorkoutSet,
  WorkoutRoutineSnapshot,
  WorkoutExerciseSnapshot,
  PlannedExerciseInDay,
  Exercise,
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
import { getLocalDateString } from "@/domain/dates/calendar";
import {
  calculateSessionVolume,
  calculateExercisePRs,
  type ExercisePRs,
} from "@/domain/strength/volumeAndPR";
import {
  buildExerciseProgressionPoints,
  filterWorkoutSessions,
  type ExerciseHistoryPoint,
  type DateFilterType,
  type CustomDateRange,
} from "@/domain/strength/progression";
import {
  detectSessionPRs,
  detectAllPRsAcrossHistory,
  getRecentAchievedPRs,
  evaluateSetForPRs,
  type AchievedPR,
} from "@/domain/strength/personalRecords";

export interface FinishSessionOptions {
  overallRpe?: number;
  notes?: string;
  incompleteSetsAction?: "discard" | "mark_completed";
}

export interface UpdateCompletedSessionOptions {
  calendarDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  overallRpe?: number | null;
  notes?: string;
}

export class WorkoutRepository {
  public readonly routines: BaseRepository<WorkoutRoutine>;
  public readonly routineDays: BaseRepository<RoutineDay>;
  public readonly scheduledSessions: BaseRepository<ScheduledSession>;
  public readonly sessions: BaseRepository<WorkoutSession>;
  public readonly sets: BaseRepository<WorkoutSet>;

  private readonly routinesTable: Table<WorkoutRoutine, string>;
  private readonly routineDaysTable: Table<RoutineDay, string>;
  private readonly scheduledSessionsTable: Table<ScheduledSession, string>;
  private readonly sessionsTable: Table<WorkoutSession, string>;
  private readonly setsTable: Table<WorkoutSet, string>;

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
    this.sessionsTable = sessionsTable;
    this.setsTable = setsTable;

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
   * Haalt een geplande sessie op op basis van id.
   */
  async getScheduledSessionById(
    sessionId: string
  ): Promise<ScheduledSession | null> {
    return await this.scheduledSessions.getById(sessionId);
  }

  // =========================================================================
  // ACTIEVE WORKOUT SESSIES & STATE (PROMPT 09)
  // =========================================================================

  /**
   * Haalt de momenteel actieve krachttraining op, of null indien er geen training loopt.
   * Garandeert dat er conform afspraak maximaal één actieve training tegelijk is.
   */
  async getActiveWorkoutSession(): Promise<WorkoutSession | null> {
    const list = await this.sessionsTable
      .where("status")
      .equals("actief")
      .toArray();

    return list.length > 0 ? list[0] : null;
  }

  /**
   * Bewaakt dat er slechts één actieve training tegelijkertijd kan bestaan.
   */
  async ensureNoActiveWorkoutSession(allowSessionId?: string): Promise<void> {
    const active = await this.getActiveWorkoutSession();
    if (active && active.id !== allowSessionId) {
      const sessionName =
        active.snapshot.routineDayName ||
        active.snapshot.routineName ||
        "Actieve training";
      throw new Error(
        `Er is al een actieve training bezig: "${sessionName}". Rond deze eerst af of annuleer deze voordat je een nieuwe training start.`
      );
    }
  }

  /**
   * Start een workout vanuit een geplande sessie.
   * Maakt een onveranderlijke snapshot van de schemadag op dit exacte moment.
   * Markeert de geplande sessie als 'afgerond' en koppelt het completedSessionId.
   */
  async startWorkoutFromScheduledSession(
    scheduledSessionId: string,
    options?: { force?: boolean }
  ): Promise<WorkoutSession> {
    if (!options?.force) {
      await this.ensureNoActiveWorkoutSession();
    }

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
          measurementType: e.measurementType,
          effortScale: e.effortScale,
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          targetDurationSeconds: e.targetDurationSeconds,
          targetWeightKg: e.targetWeightKg ?? null,
          targetRpe: e.targetRpe ?? null,
          targetRir: e.targetRir ?? null,
          restSeconds: e.restSeconds,
          notes: e.notes || "",
        })) ?? [],
    };

    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate: scheduled.calendarDate,
      startTime: now,
      startedAt: now,
      endTime: null,
      status: "actief",
      currentExerciseIndex: 0,
      activeExerciseId: snapshot.exercises[0]?.exerciseId || null,
      routineId: routine ? routine.id : null,
      routineDayId: routineDay ? routineDay.id : null,
      routineVersion: routine ? routine.version : null,
      scheduledSessionId: scheduled.id,
      snapshot,
      overallRpe: null,
      notes: scheduled.notes || "",
      provenance: { source: "user" },
      updatedAt: now,
    };

    const savedWorkout = await this.sessions.save(newSession);

    // Initialiseer voorgeplande sets voor elke oefening in de snapshot
    for (const ex of snapshot.exercises) {
      const numSets = ex.targetSets || 3;
      const isAssisted = ex.measurementType === "assisted";
      const isTimeBased = ex.measurementType === "tijd";
      for (let s = 1; s <= numSets; s++) {
        const newSet: WorkoutSet = {
          id: crypto.randomUUID(),
          sessionId: savedWorkout.id,
          exerciseId: ex.exerciseId,
          setNumber: s,
          setType: "normal",
          weightKg: ex.targetWeightKg ?? 0,
          reps: isTimeBased ? 0 : (ex.targetRepsMin ?? 8),
          durationSeconds: isTimeBased ? (ex.targetDurationSeconds ?? 60) : null,
          targetRpe: ex.targetRpe ?? null,
          actualRpe: null,
          targetRir: ex.targetRir ?? null,
          actualRir: null,
          isAssisted,
          restTimeSeconds: ex.restSeconds || 90,
          completed: false,
          loggedAt: now,
        };
        await this.sets.save(newSet);
      }
    }

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
    calendarDate: string,
    options?: { force?: boolean }
  ): Promise<WorkoutSession> {
    if (!options?.force) {
      await this.ensureNoActiveWorkoutSession();
    }

    const routine = await this.routines.getById(routineId);
    const routineDay = await this.routineDays.getById(routineDayId);

    const now = new Date().toISOString();

    const snapshot: WorkoutRoutineSnapshot = {
      routineName: routine?.name || "Trainingssessie",
      routineDayName: routineDay?.name || "Workout Dag",
      exercises:
        routineDay?.plannedExercises.map((e) => ({
          exerciseId: e.exerciseId,
          exerciseName: e.exerciseName,
          primaryMuscleGroup: "onbekend",
          measurementType: e.measurementType,
          effortScale: e.effortScale,
          targetSets: e.targetSets,
          targetRepsMin: e.targetRepsMin,
          targetRepsMax: e.targetRepsMax,
          targetDurationSeconds: e.targetDurationSeconds,
          targetWeightKg: e.targetWeightKg ?? null,
          targetRpe: e.targetRpe ?? null,
          targetRir: e.targetRir ?? null,
          restSeconds: e.restSeconds,
          notes: e.notes || "",
        })) ?? [],
    };

    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate,
      startTime: now,
      startedAt: now,
      endTime: null,
      status: "actief",
      currentExerciseIndex: 0,
      activeExerciseId: snapshot.exercises[0]?.exerciseId || null,
      routineId: routine ? routine.id : null,
      routineDayId: routineDay ? routineDay.id : null,
      routineVersion: routine ? routine.version : null,
      snapshot,
      overallRpe: null,
      notes: "",
      provenance: { source: "user" },
      updatedAt: now,
    };

    const savedWorkout = await this.sessions.save(newSession);

    // Initialiseer sets
    for (const ex of snapshot.exercises) {
      const numSets = ex.targetSets || 3;
      const isAssisted = ex.measurementType === "assisted";
      const isTimeBased = ex.measurementType === "tijd";
      for (let s = 1; s <= numSets; s++) {
        const newSet: WorkoutSet = {
          id: crypto.randomUUID(),
          sessionId: savedWorkout.id,
          exerciseId: ex.exerciseId,
          setNumber: s,
          setType: "normal",
          weightKg: ex.targetWeightKg ?? 0,
          reps: isTimeBased ? 0 : (ex.targetRepsMin ?? 8),
          durationSeconds: isTimeBased ? (ex.targetDurationSeconds ?? 60) : null,
          targetRpe: ex.targetRpe ?? null,
          actualRpe: null,
          targetRir: ex.targetRir ?? null,
          actualRir: null,
          isAssisted,
          restTimeSeconds: ex.restSeconds || 90,
          completed: false,
          loggedAt: now,
        };
        await this.sets.save(newSet);
      }
    }

    // Registreer ook een voltooide ScheduledSession zodat weekplanning en agenda de sessie tonen
    const scheduledToSave: ScheduledSession = {
      id: crypto.randomUUID(),
      calendarDate,
      routineId,
      routineDayId,
      routineVersion: routine?.version ?? 1,
      status: "afgerond",
      completedSessionId: savedWorkout.id,
      notes: "",
      createdAt: now,
      updatedAt: now,
    };
    await this.scheduledSessions.save(scheduledToSave);

    return savedWorkout;
  }

  /**
   * Start een lege losse / vrije training (zonder vooraf gedefinieerd schema).
   * Oefeningen kunnen direct tijdens de sessie worden toegevoegd.
   */
  async startEmptyWorkout(options?: {
    calendarDate?: string;
    workoutName?: string;
    notes?: string;
    force?: boolean;
  }): Promise<WorkoutSession> {
    if (!options?.force) {
      await this.ensureNoActiveWorkoutSession();
    }

    const now = new Date().toISOString();
    const calendarDate = options?.calendarDate || getLocalDateString();

    const snapshot: WorkoutRoutineSnapshot = {
      routineName: options?.workoutName || "Vrije Krachttraining",
      routineDayName: "Losse Training",
      exercises: [],
    };

    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      calendarDate,
      startTime: now,
      startedAt: now,
      endTime: null,
      status: "actief",
      currentExerciseIndex: 0,
      activeExerciseId: null,
      routineId: null,
      routineDayId: null,
      routineVersion: null,
      snapshot,
      overallRpe: null,
      notes: options?.notes || "",
      provenance: { source: "user" },
      updatedAt: now,
    };

    return await this.sessions.save(newSession);
  }

  /**
   * Wijzigt de actieve oefening binnen een lopende sessie.
   * Persistent opgeslagen zodat browser-reload de gebruiker exact op deze oefening houdt.
   */
  async updateActiveSessionExercise(
    sessionId: string,
    exerciseIndex: number
  ): Promise<WorkoutSession> {
    const session = await this.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Sessie met ID ${sessionId} niet gevonden.`);
    }

    const activeExercise = session.snapshot.exercises[exerciseIndex];
    const updated: WorkoutSession = {
      ...session,
      currentExerciseIndex: exerciseIndex,
      activeExerciseId: activeExercise?.exerciseId || null,
      updatedAt: new Date().toISOString(),
    };

    return await this.sessions.save(updated);
  }

  /**
   * Voegt tijdens een lopende training (los of uit schema) een oefening toe aan de sessie snapshot.
   */
  async addExerciseToActiveSession(
    sessionId: string,
    exerciseData: Partial<WorkoutExerciseSnapshot> & { exerciseId: string }
  ): Promise<WorkoutSession> {
    const session = await this.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Sessie met ID ${sessionId} niet gevonden.`);
    }

    let snap: WorkoutExerciseSnapshot;
    if (
      !exerciseData.exerciseName ||
      !exerciseData.primaryMuscleGroup ||
      exerciseData.restSeconds === undefined ||
      !exerciseData.measurementType
    ) {
      const ex = (await this.sessionsTable.db
        .table("exercises")
        .get(exerciseData.exerciseId)) as Exercise | undefined;
      snap = {
        ...exerciseData,
        exerciseId: exerciseData.exerciseId,
        exerciseName: exerciseData.exerciseName || ex?.name || "Oefening",
        primaryMuscleGroup:
          exerciseData.primaryMuscleGroup || ex?.primaryMuscleGroup || "full_body",
        measurementType:
          exerciseData.measurementType || ex?.measurementType || "gewicht_herhalingen",
        targetSets: exerciseData.targetSets || 3,
        targetWeightKg: exerciseData.targetWeightKg ?? null,
        targetRepsMin: exerciseData.targetRepsMin ?? 8,
        targetRepsMax: exerciseData.targetRepsMax ?? 10,
        effortScale: exerciseData.effortScale || "rpe",
        targetRpe: exerciseData.targetRpe ?? null,
        targetRir: exerciseData.targetRir ?? null,
        restSeconds: exerciseData.restSeconds || 90,
      } as WorkoutExerciseSnapshot;
    } else {
      snap = exerciseData as WorkoutExerciseSnapshot;
    }

    const isFirstExercise = session.snapshot.exercises.length === 0;
    const updatedExercises = [...session.snapshot.exercises, snap];

    const updatedSession: WorkoutSession = {
      ...session,
      snapshot: {
        ...session.snapshot,
        exercises: updatedExercises,
      },
      currentExerciseIndex: isFirstExercise
        ? 0
        : session.currentExerciseIndex ?? 0,
      activeExerciseId: isFirstExercise
        ? snap.exerciseId
        : session.activeExerciseId,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.sessions.save(updatedSession);

    // Initialiseer sets voor de toegevoegde oefening
    const numSets = exerciseData.targetSets || 3;
    const isAssisted = exerciseData.measurementType === "assisted";
    const isTimeBased = exerciseData.measurementType === "tijd";
    const now = new Date().toISOString();
    for (let s = 1; s <= numSets; s++) {
      const newSet: WorkoutSet = {
        id: crypto.randomUUID(),
        sessionId: session.id,
        exerciseId: exerciseData.exerciseId,
        setNumber: s,
        setType: "normal",
        weightKg: exerciseData.targetWeightKg ?? 0,
        reps: isTimeBased ? 0 : (exerciseData.targetRepsMin ?? 8),
        durationSeconds: isTimeBased ? (exerciseData.targetDurationSeconds ?? 60) : null,
        targetRpe: exerciseData.targetRpe ?? null,
        actualRpe: null,
        targetRir: exerciseData.targetRir ?? null,
        actualRir: null,
        isAssisted,
        restTimeSeconds: exerciseData.restSeconds || 90,
        completed: false,
        loggedAt: now,
      };
      await this.sets.save(newSet);
    }

    return saved;
  }

  /**
   * Verwijdert een oefening en bijbehorende sets uit een actieve sessie snapshot.
   */
  async removeExerciseFromActiveSession(
    sessionId: string,
    exerciseIndex: number
  ): Promise<WorkoutSession> {
    const session = await this.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Sessie met ID ${sessionId} niet gevonden.`);
    }

    const removedExercise = session.snapshot.exercises[exerciseIndex];
    if (!removedExercise) return session;

    // Verwijder sets van deze specifieke oefening
    const existingSets = await this.setsTable
      .where("sessionId")
      .equals(sessionId)
      .filter((s) => s.exerciseId === removedExercise.exerciseId)
      .toArray();

    if (existingSets.length > 0) {
      await this.setsTable.bulkDelete(existingSets.map((s) => s.id));
    }

    const updatedExercises = session.snapshot.exercises.filter(
      (_, idx) => idx !== exerciseIndex
    );

    let nextIndex = session.currentExerciseIndex ?? 0;
    if (nextIndex >= updatedExercises.length) {
      nextIndex = Math.max(0, updatedExercises.length - 1);
    }

    const updatedSession: WorkoutSession = {
      ...session,
      snapshot: {
        ...session.snapshot,
        exercises: updatedExercises,
      },
      currentExerciseIndex: nextIndex,
      activeExerciseId: updatedExercises[nextIndex]?.exerciseId || null,
      updatedAt: new Date().toISOString(),
    };

    return await this.sessions.save(updatedSession);
  }

  /**
   * Haalt alle sets op voor een specifieke oefening binnen een sessie.
   */
  async getSetsForSessionAndExercise(
    sessionId: string,
    exerciseId: string
  ): Promise<WorkoutSet[]> {
    return await this.setsTable
      .where("sessionId")
      .equals(sessionId)
      .filter((s) => s.exerciseId === exerciseId)
      .sortBy("setNumber");
  }

  /**
   * Slaat een set op of werkt deze bij in IndexedDB.
   */
  async saveWorkoutSet(set: WorkoutSet): Promise<WorkoutSet> {
    return await this.sets.save(set);
  }

  /**
   * Verwijdert een set uit de database.
   */
  async deleteWorkoutSet(setId: string): Promise<void> {
    await this.setsTable.delete(setId);
  }

  /**
   * Haalt de prestaties van de vorige voltooide sessie op voor een specifieke oefening.
   * Zoekt naar de meest recente afgeronde sessie waarin deze oefening voorkwam,
   * en geeft de voltooide sets terug voor progressieve overload referentie.
   */
  async getPreviousPerformanceForExercise(
    exerciseId: string,
    excludeSessionId?: string
  ): Promise<{
    sessionDate: string;
    calendarDate?: string;
    routineName?: string;
    workoutName?: string;
    exerciseNotes?: string;
    sets: WorkoutSet[];
  } | null> {
    const completedSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    // Sorteer nieuwste eerst op endTime of startTime
    completedSessions.sort((a, b) => {
      const timeA = new Date(a.endTime || a.startTime).getTime();
      const timeB = new Date(b.endTime || b.startTime).getTime();
      return timeB - timeA;
    });

    for (const session of completedSessions) {
      if (excludeSessionId && session.id === excludeSessionId) continue;

      const matchingExercise = session.snapshot.exercises.find(
        (e) => e.exerciseId === exerciseId
      );

      if (matchingExercise) {
        const sets = await this.setsTable
          .where("sessionId")
          .equals(session.id)
          .filter((s) => s.exerciseId === exerciseId && s.completed)
          .sortBy("setNumber");

        if (sets.length > 0) {
          const workoutName =
            session.snapshot.routineName && session.snapshot.routineDayName
              ? `${session.snapshot.routineName} - ${session.snapshot.routineDayName}`
              : session.snapshot.routineDayName ||
                session.snapshot.routineName ||
                "Vorige Training";

          return {
            sessionDate: session.calendarDate,
            calendarDate: session.calendarDate,
            routineName:
              session.snapshot.routineDayName ||
              session.snapshot.routineName ||
              "Vorige Training",
            workoutName,
            exerciseNotes: matchingExercise.notes || undefined,
            sets,
          };
        }
      }
    }

    return null;
  }

  /**
   * Werkt de sessie-specifieke notitie bij voor een oefening in de actieve sessie.
   */
  async updateSessionExerciseNotes(
    sessionId: string,
    exerciseIndex: number,
    notes: string
  ): Promise<WorkoutSession> {
    const session = await this.sessions.getById(sessionId);
    if (!session) {
      throw new Error(`Sessie met id ${sessionId} niet gevonden`);
    }

    if (!session.snapshot.exercises[exerciseIndex]) {
      throw new Error(`Oefening op index ${exerciseIndex} niet gevonden in sessie`);
    }

    const updatedExercises = [...session.snapshot.exercises];
    updatedExercises[exerciseIndex] = {
      ...updatedExercises[exerciseIndex],
      notes,
    };

    const updatedSession: WorkoutSession = {
      ...session,
      snapshot: {
        ...session.snapshot,
        exercises: updatedExercises,
      },
      updatedAt: new Date().toISOString(),
    };

    return await this.sessions.save(updatedSession);
  }

  /**
   * Sluit of annuleert een actieve sessie met een expliciete gebruikerskeuze:
   * - "keep_draft": Laat de sessie actief in IndexedDB staan (kan later worden hervat).
   * - "mark_cancelled": Markeert de sessie als 'geannuleerd' met eindtijd.
   * - "discard_delete": Verwijdert de sessie en bijbehorende sets volledig uit IndexedDB.
   *   Indien de sessie afkomstig was van een geplande sessie, herstelt deze naar 'gepland'.
   */
  async cancelOrDiscardActiveSession(
    sessionId: string,
    action: "keep_draft" | "mark_cancelled" | "discard_delete"
  ): Promise<{ success: boolean; session?: WorkoutSession | null }> {
    const session = await this.sessions.getById(sessionId);
    if (!session) {
      return { success: false, session: null };
    }

    if (action === "keep_draft") {
      return { success: true, session };
    }

    if (action === "mark_cancelled") {
      const now = new Date().toISOString();
      const updated: WorkoutSession = {
        ...session,
        status: "geannuleerd",
        endTime: now,
        cancelledAt: now,
        updatedAt: now,
      };
      const saved = await this.sessions.save(updated);
      return { success: true, session: saved };
    }

    if (action === "discard_delete") {
      // 1. Verwijder alle sets van deze sessie
      const sets = await this.setsTable
        .where("sessionId")
        .equals(sessionId)
        .toArray();
      if (sets.length > 0) {
        await this.setsTable.bulkDelete(sets.map((s) => s.id));
      }

      // 2. Herstel eventuele gekoppelde geplande sessie terug naar 'gepland'
      if (session.scheduledSessionId) {
        const ss = await this.scheduledSessions.getById(session.scheduledSessionId);
        if (ss) {
          await this.scheduledSessions.save({
            ...ss,
            status: "gepland",
            completedSessionId: null,
            updatedAt: new Date().toISOString(),
          });
        }
      } else {
        const linked = await this.scheduledSessionsTable
          .filter((s) => s.completedSessionId === sessionId)
          .toArray();
        for (const ss of linked) {
          await this.scheduledSessions.save({
            ...ss,
            status: "gepland",
            completedSessionId: null,
            updatedAt: new Date().toISOString(),
          });
        }
      }

      // 3. Verwijder de workoutsessie zelf
      await this.sessionsTable.delete(sessionId);
      return { success: true, session: null };
    }

    return { success: false, session };
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
      startedAt: now,
      endTime: null,
      status: "actief",
      currentExerciseIndex: 0,
      activeExerciseId: snapshot.exercises[0]?.exerciseId || null,
      routineId: routine ? routine.id : null,
      routineDayId: routineDay ? routineDay.id : null,
      routineVersion: routine ? routine.version : null,
      snapshot,
      overallRpe: null,
      notes,
      provenance: { source: "user" },
      updatedAt: now,
    };

    return await this.sessions.save(newSession);
  }

  /**
   * Rond een actieve trainingssessie af met eindtijd en RPE score.
   * Atomair opgeslagen in Dexie:
   * - Alleen voltooide sets tellen mee.
   * - Incomplete sets worden naar keuze van de gebruiker afgehandeld ('discard' of 'mark_completed').
   * - Koppelt atomair aan de geplande sessie (status 'afgerond', completedSessionId) zonder duplicaten.
   * - Idempotent: dubbelklikken / herhaald afronden geeft veilig het bestaande record terug.
   */
  async finishSession(
    sessionId: string,
    overallRpeOrOptions?: number | FinishSessionOptions,
    maybeNotes?: string
  ): Promise<WorkoutSession | null> {
    let overallRpe: number | undefined;
    let notes: string | undefined;
    let incompleteSetsAction: "discard" | "mark_completed" = "discard";

    if (
      typeof overallRpeOrOptions === "object" &&
      overallRpeOrOptions !== null
    ) {
      overallRpe = overallRpeOrOptions.overallRpe;
      notes = overallRpeOrOptions.notes;
      if (overallRpeOrOptions.incompleteSetsAction) {
        incompleteSetsAction = overallRpeOrOptions.incompleteSetsAction;
      }
    } else {
      overallRpe = overallRpeOrOptions;
      notes = maybeNotes;
    }

    return await this.sessionsTable.db.transaction(
      "rw",
      [this.sessionsTable, this.setsTable, this.scheduledSessionsTable],
      async () => {
        const session = await this.sessionsTable.get(sessionId);
        if (!session) return null;

        // Idempotency guard: reeds afgerond
        if (session.status === "afgerond") {
          return session;
        }

        const now = new Date().toISOString();
        const startTimeMs = new Date(session.startTime).getTime();
        const endTimeMs = new Date(now).getTime();
        const durationMinutes = Math.max(
          0,
          Math.round((endTimeMs - startTimeMs) / 60000)
        );

        // 1. Incomplete sets afhandeling
        const existingSets = await this.setsTable
          .where("sessionId")
          .equals(sessionId)
          .toArray();

        const incompleteSets = existingSets.filter((s) => !s.completed);

        if (incompleteSetsAction === "mark_completed") {
          for (const s of incompleteSets) {
            await this.setsTable.update(s.id, {
              completed: true,
              completedAt: now,
            });
          }
        } else {
          // Default: "discard" -> niet-voltooide sets worden verwijderd
          for (const s of incompleteSets) {
            await this.setsTable.delete(s.id);
          }
        }

        // 2. Koppel aan geplande sessie indien aanwezig, zonder duplicaten
        let linkedScheduledId = session.scheduledSessionId;

        if (linkedScheduledId) {
          const sched = await this.scheduledSessionsTable.get(linkedScheduledId);
          if (sched) {
            sched.status = "afgerond";
            sched.completedSessionId = session.id;
            sched.updatedAt = now;
            await this.scheduledSessionsTable.put(
              ScheduledSessionSchema.parse(sched)
            );
          }
        } else if (session.routineId) {
          // Zoek een geplande sessie op dezelfde datum zonder completedSessionId
          const schedOnDate = await this.scheduledSessionsTable
            .where("calendarDate")
            .equals(session.calendarDate)
            .filter(
              (s) =>
                s.routineId === session.routineId &&
                (!session.routineDayId ||
                  s.routineDayId === session.routineDayId) &&
                s.status === "gepland" &&
                !s.completedSessionId
            )
            .first();

          if (schedOnDate) {
            schedOnDate.status = "afgerond";
            schedOnDate.completedSessionId = session.id;
            schedOnDate.updatedAt = now;
            await this.scheduledSessionsTable.put(
              ScheduledSessionSchema.parse(schedOnDate)
            );
            linkedScheduledId = schedOnDate.id;
          }
        }

        // 3. Update en persist WorkoutSession
        const updated: WorkoutSession = {
          ...session,
          endTime: now,
          status: "afgerond",
          durationMinutes,
          scheduledSessionId: linkedScheduledId ?? session.scheduledSessionId,
          overallRpe: overallRpe !== undefined ? overallRpe : session.overallRpe,
          notes: notes !== undefined ? notes : session.notes,
          updatedAt: now,
        };

        const validatedSession = WorkoutSessionSchema.parse(updated);
        await this.sessionsTable.put(validatedSession);

        return validatedSession;
      }
    );
  }

  /**
   * Rond een actieve trainingssessie af (alias voor finishSession met opties-object).
   */
  async finishActiveSession(
    sessionId: string,
    options?: FinishSessionOptions | { sessionRpe?: number; notes?: string }
  ): Promise<WorkoutSession | null> {
    const opts: FinishSessionOptions = {
      overallRpe: (options as any)?.overallRpe ?? (options as any)?.sessionRpe,
      notes: options?.notes,
      incompleteSetsAction: (options as any)?.incompleteSetsAction,
    };
    return await this.finishSession(sessionId, opts);
  }

  /**
   * Werkt een voltooide workoutsessie bij (bv. datum, duur, notities of overall RPE).
   * Atomair en veilig.
   */
  async updateCompletedSession(
    sessionId: string,
    updates: UpdateCompletedSessionOptions
  ): Promise<WorkoutSession> {
    return await this.sessionsTable.db.transaction(
      "rw",
      [this.sessionsTable, this.scheduledSessionsTable],
      async () => {
        const session = await this.sessionsTable.get(sessionId);
        if (!session) {
          throw new ValidationError(`Sessie met ID ${sessionId} niet gevonden`);
        }

        const now = new Date().toISOString();

        const updatedSession: WorkoutSession = {
          ...session,
          calendarDate: updates.calendarDate ?? session.calendarDate,
          startTime: updates.startTime ?? session.startTime,
          endTime: updates.endTime ?? session.endTime,
          durationMinutes:
            updates.durationMinutes !== undefined
              ? updates.durationMinutes
              : session.durationMinutes,
          overallRpe:
            updates.overallRpe !== undefined
              ? updates.overallRpe
              : session.overallRpe,
          notes: updates.notes !== undefined ? updates.notes : session.notes,
          updatedAt: now,
        };

        const validated = WorkoutSessionSchema.parse(updatedSession);
        await this.sessionsTable.put(validated);

        // Als de kalenderdatum is aangepast en er is een gekoppelde geplande sessie,
        // synchroniseer dan ook de kalenderdatum van de geplande sessie
        if (updates.calendarDate && session.scheduledSessionId) {
          const sched = await this.scheduledSessionsTable.get(
            session.scheduledSessionId
          );
          if (sched) {
            sched.calendarDate = updates.calendarDate;
            sched.updatedAt = now;
            await this.scheduledSessionsTable.put(
              ScheduledSessionSchema.parse(sched)
            );
          }
        }

        return validated;
      }
    );
  }

  /**
   * Verwijdert een voltooide workoutsessie veilig met opschoning van alle sets
   * en ontkoppeling van eventuele geplande sessies (status weer teruggezet naar 'gepland').
   */
  async deleteCompletedSession(sessionId: string): Promise<void> {
    await this.sessionsTable.db.transaction(
      "rw",
      [this.sessionsTable, this.setsTable, this.scheduledSessionsTable],
      async () => {
        const session = await this.sessionsTable.get(sessionId);
        if (!session) return;

        const now = new Date().toISOString();

        // 1. Verwijder alle sets van deze sessie
        await this.setsTable.where("sessionId").equals(sessionId).delete();

        // 2. Indien gekoppeld aan geplande sessie, ontkoppel en herstel status naar "gepland"
        if (session.scheduledSessionId) {
          const sched = await this.scheduledSessionsTable.get(
            session.scheduledSessionId
          );
          if (sched) {
            sched.status = "gepland";
            sched.completedSessionId = null;
            sched.updatedAt = now;
            await this.scheduledSessionsTable.put(
              ScheduledSessionSchema.parse(sched)
            );
          }
        }

        // Ook controleren of een andere scheduledSession naar deze sessie verwees
        const linkedScheds = await this.scheduledSessionsTable
          .filter((s) => s.completedSessionId === sessionId)
          .toArray();

        for (const ls of linkedScheds) {
          ls.status = "gepland";
          ls.completedSessionId = null;
          ls.updatedAt = now;
          await this.scheduledSessionsTable.put(
            ScheduledSessionSchema.parse(ls)
          );
        }

        // 3. Verwijder de sessie zelf
        await this.sessionsTable.delete(sessionId);
      }
    );
  }

  /**
   * Voegt een nieuwe set toe aan een specifieke oefening binnen een sessie.
   */
  async addSetToSession(
    sessionId: string,
    exerciseId: string,
    initialValues?: Partial<WorkoutSet>
  ): Promise<WorkoutSet> {
    const existingSets = await this.setsTable
      .where("sessionId")
      .equals(sessionId)
      .filter((s) => s.exerciseId === exerciseId)
      .toArray();

    const nextSetNumber =
      existingSets.length > 0
        ? Math.max(...existingSets.map((s) => s.setNumber)) + 1
        : 1;

    const newSet: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId,
      exerciseId,
      setNumber: nextSetNumber,
      setType: initialValues?.setType ?? "normal",
      weightKg: initialValues?.weightKg ?? 0,
      reps: initialValues?.reps ?? 0,
      durationSeconds: initialValues?.durationSeconds ?? null,
      targetRpe: initialValues?.targetRpe ?? null,
      actualRpe: initialValues?.actualRpe ?? null,
      targetRir: initialValues?.targetRir ?? null,
      actualRir: initialValues?.actualRir ?? null,
      isAssisted: initialValues?.isAssisted ?? false,
      restTimeSeconds: initialValues?.restTimeSeconds ?? 90,
      completed: initialValues?.completed ?? true,
      completedAt: initialValues?.completed ? new Date().toISOString() : null,
      loggedAt: new Date().toISOString(),
    };

    const validated = WorkoutSetSchema.parse(newSet);
    await this.setsTable.put(validated);
    return validated;
  }

  /**
   * Werkt velden van een individuele set bij (bv. gewicht, reps, type, voltooid).
   */
  async updateWorkoutSet(
    setId: string,
    updates: Partial<WorkoutSet>
  ): Promise<WorkoutSet> {
    const existing = await this.setsTable.get(setId);
    if (!existing) {
      throw new ValidationError(`Set met ID ${setId} niet gevonden`);
    }

    const updated: WorkoutSet = {
      ...existing,
      ...updates,
      id: existing.id,
      sessionId: existing.sessionId,
      exerciseId: updates.exerciseId ?? existing.exerciseId,
    };

    const validated = WorkoutSetSchema.parse(updated);
    await this.setsTable.put(validated);
    return validated;
  }

  /**
   * Berekent het totale volume (in kg) voor een sessie op basis van actuele voltooide sets.
   */
  async calculateSessionVolume(sessionId: string): Promise<number> {
    const sets = await this.getSetsForSession(sessionId);
    return calculateSessionVolume(sets);
  }

  /**
   * Berekent dynamisch de PR's voor een oefening op basis van alle voltooide sessies.
   */
  async getExercisePRs(exerciseId: string): Promise<ExercisePRs> {
    const completedSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    const completedSessionIds = new Set(completedSessions.map((s) => s.id));

    const setsForExercise = await this.setsTable
      .where("exerciseId")
      .equals(exerciseId)
      .toArray();

    const validSets = setsForExercise.filter((s) =>
      completedSessionIds.has(s.sessionId)
    );

    return calculateExercisePRs(exerciseId, validSets);
  }

  /**
   * Berekent en retourneert alle behaalde persoonlijke records (PR's) voor een specifieke sessie.
   * Houdt rekening met eerdere afgeronde sessies, assisted oefeningen, 1-10 reps 1RM regels en tie-bescherming.
   */
  async getSessionPRs(
    sessionId: string,
    formula: "epley" | "brzycki" = "epley"
  ): Promise<AchievedPR[]> {
    const session = await this.sessionsTable.get(sessionId);
    if (!session) return [];

    const allSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    // Als de sessie zelf nog niet in allSessions zit (bv. actieve tracking), voeg hem toe
    if (!allSessions.some((s) => s.id === session.id)) {
      allSessions.push(session);
    }

    const allSets = await this.setsTable.toArray();
    const exercises: Exercise[] = await this.sessionsTable.db
      .table("exercises")
      .toArray();

    return detectSessionPRs(session, allSessions, allSets, exercises, formula);
  }

  /**
   * Berekent alle behaalde PR's over de gehele trainingshistorie.
   */
  async getAllPRs(
    formula: "epley" | "brzycki" = "epley"
  ): Promise<AchievedPR[]> {
    const completedSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    const allSets = await this.setsTable.toArray();
    const exercises: Exercise[] = await this.sessionsTable.db
      .table("exercises")
      .toArray();

    return detectAllPRsAcrossHistory(
      completedSessions,
      allSets,
      exercises,
      formula
    );
  }

  /**
   * Haalt de behaalde records op van de afgelopen N dagen (standaard 7 dagen / deze week).
   * Ideaal voor de Home cockpit widget.
   */
  async getRecentPRs(
    days = 7,
    referenceDate = new Date(),
    formula: "epley" | "brzycki" = "epley"
  ): Promise<AchievedPR[]> {
    const completedSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    const allSets = await this.setsTable.toArray();
    const exercises: Exercise[] = await this.sessionsTable.db
      .table("exercises")
      .toArray();

    return getRecentAchievedPRs(
      completedSessions,
      allSets,
      exercises,
      days,
      referenceDate,
      formula
    );
  }

  /**
   * Evalueert een kandidaat-set tijdens actieve tracking tegen alle eerdere afgeronde sets.
   */
  async evaluateCandidateSet(
    set: WorkoutSet,
    sessionId: string,
    formula: "epley" | "brzycki" = "epley"
  ): Promise<AchievedPR[]> {
    const session = await this.sessionsTable.get(sessionId);
    if (!session) return [];

    const exercise: Exercise | undefined = await this.sessionsTable.db
      .table("exercises")
      .get(set.exerciseId);
    if (!exercise) return [];

    const completedSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    const sessionStart = session.startTime || session.calendarDate;
    const priorCompletedSessions = completedSessions.filter((s) => {
      if (s.id === session.id) return false;
      const sDate = s.startTime || s.calendarDate;
      return sDate.localeCompare(sessionStart) <= 0;
    });

    const priorSessionIds = new Set(priorCompletedSessions.map((s) => s.id));
    const exerciseSets = await this.setsTable
      .where("exerciseId")
      .equals(set.exerciseId)
      .toArray();

    const priorSets = exerciseSets.filter(
      (s) => priorSessionIds.has(s.sessionId) && s.completed && s.id !== set.id
    );

    return evaluateSetForPRs(set, exercise, session, priorSets, formula);
  }

  /**
   * Haalt een specifieke workoutsessie op op basis van sessie ID.
   */
  async getSessionById(sessionId: string): Promise<WorkoutSession | null> {
    return await this.sessions.getById(sessionId);
  }

  /**
   * Haal alle sets op voor een specifieke sessie.
   */
  async getSetsForSession(sessionId: string): Promise<WorkoutSet[]> {
    return await this.setsTable
      .where("sessionId")
      .equals(sessionId)
      .sortBy("setNumber");
  }

  /**
   * Haal alle workoutsessies op voor een bepaalde kalenderdatum (YYYY-MM-DD).
   */
  async getSessionsByDate(calendarDate: string): Promise<WorkoutSession[]> {
    return await this.sessionsTable
      .where("calendarDate")
      .equals(calendarDate)
      .toArray();
  }

  /**
   * Haalt alle datapunten op voor de progressie van een oefening over tijd.
   */
  async getExerciseProgression(
    exerciseId: string,
    options?: { userBodyweightKg?: number | null }
  ): Promise<{
    exercise: Exercise | null;
    points: ExerciseHistoryPoint[];
  }> {
    const exercise = (await this.sessionsTable.db
      .table("exercises")
      .get(exerciseId)) as Exercise | undefined;
    if (!exercise) {
      return { exercise: null, points: [] };
    }

    const completedSessions = await this.sessionsTable
      .where("status")
      .equals("afgerond")
      .toArray();

    const sets = await this.setsTable
      .where("exerciseId")
      .equals(exerciseId)
      .toArray();

    const points = buildExerciseProgressionPoints(
      exercise,
      completedSessions,
      sets,
      options?.userBodyweightKg
    );

    return { exercise, points };
  }

  /**
   * Zoekt en filtert door workoutsessies op basis van datumfilter en zoekopdracht.
   */
  async searchSessions(
    queryOrOptions?:
      | string
      | {
          filterType?: DateFilterType;
          customRange?: CustomDateRange;
          searchQuery?: string;
          exerciseId?: string;
        }
  ): Promise<WorkoutSession[]> {
    const opts =
      typeof queryOrOptions === "string"
        ? { searchQuery: queryOrOptions }
        : queryOrOptions;

    const all = await this.sessionsTable.toArray();
    // Sorteer nieuwste eerst
    all.sort((a, b) => b.calendarDate.localeCompare(a.calendarDate));
    return filterWorkoutSessions(all, opts?.filterType || "all", {
      customRange: opts?.customRange,
      searchQuery: opts?.searchQuery,
      exerciseId: opts?.exerciseId,
    });
  }
}
