import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import {
  getLocalDateString,
  parseLocalDate,
  getWeekStartDate,
  getWeekDays,
  formatFriendlyDate,
  addDaysToDateString,
  isSameDateString,
} from "@/domain/dates/calendar";
import type {
  WorkoutRoutine,
  RoutineDay,
  PlannedExerciseInDay,
} from "@/types/database";
import Dexie from "dexie";

describe("Stap 08 — Actief Programma, Weekplanning en Datumverwerking (Prompt 08)", () => {
  // =========================================================================
  // 1. DATUMVERWERKING & KALENDER (calendar.ts)
  // =========================================================================
  describe("1. Lokale datumverwerking & kalenderfuncties", () => {
    it("getLocalDateString formatteert een datum als lokale YYYY-MM-DD", () => {
      const fixedDate = new Date(2026, 9, 2, 14, 30, 0); // 2 oktober 2026 om 14:30
      const dateStr = getLocalDateString(fixedDate);
      expect(dateStr).toBe("2026-10-02");
    });

    it("getLocalDateString voorkomt de UTC midnight-shift bug", () => {
      // 2 oktober 2026 om 00:05 lokaal
      const justAfterMidnight = new Date(2026, 9, 2, 0, 5, 0);
      const dateStr = getLocalDateString(justAfterMidnight);
      expect(dateStr).toBe("2026-10-02");

      // 2 oktober 2026 om 23:55 lokaal
      const justBeforeMidnight = new Date(2026, 9, 2, 23, 55, 0);
      const dateStr2 = getLocalDateString(justBeforeMidnight);
      expect(dateStr2).toBe("2026-10-02");
    });

    it("parseLocalDate parset veilig naar het midden van de dag", () => {
      const parsed = parseLocalDate("2026-10-15");
      expect(parsed.getFullYear()).toBe(2026);
      expect(parsed.getMonth()).toBe(9); // 0-gebaseerd, 9 = oktober
      expect(parsed.getDate()).toBe(15);
      expect(parsed.getHours()).toBe(12); // midday trick tegen zomertijd wisselingen
    });

    it("addDaysToDateString rekent correct over maandgrenzen heen", () => {
      expect(addDaysToDateString("2026-09-30", 1)).toBe("2026-10-01");
      expect(addDaysToDateString("2026-10-01", -1)).toBe("2026-09-30");
      expect(addDaysToDateString("2026-10-05", 7)).toBe("2026-10-12");
    });

    it("getWeekStartDate berekent de juiste weekstart voor maandag én zondag", () => {
      // 2026-10-07 is een woensdag
      const wednesday = "2026-10-07";

      // Weekstart maandag -> 2026-10-05
      const mondayStart = getWeekStartDate(wednesday, "maandag");
      expect(mondayStart).toBe("2026-10-05");

      // Weekstart zondag -> 2026-10-04
      const sundayStart = getWeekStartDate(wednesday, "zondag");
      expect(sundayStart).toBe("2026-10-04");
    });

    it("getWeekDays genereert exact 7 dagen met correcte nummering en isToday vlag", () => {
      const monday = "2026-10-05";
      const daysMonday = getWeekDays(monday, "maandag", "2026-10-07");

      expect(daysMonday).toHaveLength(7);
      expect(daysMonday[0].dateStr).toBe("2026-10-05");
      expect(daysMonday[0].dayNameFull).toBe("Maandag");
      expect(daysMonday[0].dayNameShort).toBe("Ma");
      expect(daysMonday[0].dayNumber).toBe(5); // Dag van de maand
      expect(daysMonday[0].isToday).toBe(false);

      // Woensdag 7 oktober is gemarkeerd als isToday
      expect(daysMonday[2].dateStr).toBe("2026-10-07");
      expect(daysMonday[2].isToday).toBe(true);

      // Zondag 11 oktober is de laatste dag
      expect(daysMonday[6].dateStr).toBe("2026-10-11");
      expect(daysMonday[6].dayNumber).toBe(11);

      // Test ook weekstart zondag
      const daysSunday = getWeekDays(monday, "zondag", "2026-10-07");
      expect(daysSunday).toHaveLength(7);
      expect(daysSunday[0].dateStr).toBe("2026-10-04");
      expect(daysSunday[0].dayNameFull).toBe("Zondag");
      expect(daysSunday[0].dayOfWeekIndex).toBe(0);
    });

    it("formatFriendlyDate geeft herkenbare Nederlandse datums", () => {
      const todayStr = getLocalDateString();
      const tomorrowStr = addDaysToDateString(todayStr, 1);
      const yesterdayStr = addDaysToDateString(todayStr, -1);

      expect(formatFriendlyDate(todayStr)).toBe("Vandaag");
      expect(formatFriendlyDate(tomorrowStr)).toBe("Morgen");
      expect(formatFriendlyDate(yesterdayStr)).toBe("Gisteren");

      // Vaste datum controle (buiten Vandaag/Morgen/Gisteren venster)
      const fixedFormatted = formatFriendlyDate("2026-10-25");
      expect(fixedFormatted).toContain("okt");
    });

    it("isSameDateString vergelijkt datums accuraat", () => {
      expect(isSameDateString("2026-10-05", "2026-10-05")).toBe(true);
      expect(isSameDateString("2026-10-05", "2026-10-06")).toBe(false);
    });
  });

  // =========================================================================
  // 2. DATABASE REPOSITORY & PLANNING FUNCTIONALITEIT
  // =========================================================================
  describe("2. Actief Programma en Weekplanning Repositories", () => {
    let dbName: string;
    let db: SportKompasDatabase;
    let repos: Repositories;

    let testRoutineId: string;
    let dayAId: string;
    let dayBId: string;
    let dayCId: string;
    let ex1Id: string;
    let ex2Id: string;
    let ex3Id: string;

    beforeEach(async () => {
      dbName = `test_planning_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      db = new SportKompasDatabase(dbName);
      repos = createRepositories(db);
      await db.open();

      // Maak een test-schema met 3 dagen
      testRoutineId = crypto.randomUUID();
      dayAId = crypto.randomUUID();
      dayBId = crypto.randomUUID();
      dayCId = crypto.randomUUID();
      ex1Id = crypto.randomUUID();
      ex2Id = crypto.randomUUID();
      ex3Id = crypto.randomUUID();

      const now = new Date().toISOString();

      const exercise1: PlannedExerciseInDay = {
        exerciseId: ex1Id,
        exerciseName: "Kniebuigen (Squat)",
        measurementType: "gewicht_herhalingen",
        targetSets: 4,
        targetRepsMin: 6,
        targetRepsMax: 8,
        effortScale: "rpe",
        targetRpe: 8,
        restSeconds: 120,
      };

      const exercise2: PlannedExerciseInDay = {
        exerciseId: ex2Id,
        exerciseName: "Bankdrukken (Bench Press)",
        measurementType: "gewicht_herhalingen",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        effortScale: "rir",
        targetRir: 2,
        restSeconds: 90,
      };

      const exercise3: PlannedExerciseInDay = {
        exerciseId: ex3Id,
        exerciseName: "Conventionele Deadlift",
        measurementType: "gewicht_herhalingen",
        targetSets: 3,
        targetRepsMin: 5,
        targetRepsMax: 5,
        effortScale: "rpe",
        targetRpe: 8,
        restSeconds: 150,
      };

      const routine: WorkoutRoutine = {
        id: testRoutineId,
        name: "3-Dagen Kracht Split",
        description: "Push Pull Legs split voor krachtopbouw",
        version: 1,
        isActive: false,
        isArchived: false,
        provenance: { source: "user", isDemo: false },
        createdAt: now,
        updatedAt: now,
      };

      const days: RoutineDay[] = [
        {
          id: dayAId,
          routineId: testRoutineId,
          dayIndex: 1,
          name: "Dag A: Push & Borst",
          plannedExercises: [exercise2],
          createdAt: now,
        },
        {
          id: dayBId,
          routineId: testRoutineId,
          dayIndex: 2,
          name: "Dag B: Pull & Rug",
          plannedExercises: [exercise3],
          createdAt: now,
        },
        {
          id: dayCId,
          routineId: testRoutineId,
          dayIndex: 3,
          name: "Dag C: Legs & Benen",
          plannedExercises: [exercise1],
          createdAt: now,
        },
      ];

      await repos.workout.saveRoutineWithDays(routine, days);
    });

    afterEach(async () => {
      if (db.isOpen()) {
        db.close();
      }
      await Dexie.delete(dbName);
    });

    it("beheert het actieve programma: selecteren, ophalen en wisselen", async () => {
      // Initieel is er geen actief schema
      let active = await repos.workout.getActiveRoutine();
      expect(active).toBeNull();

      // Activeer het test routine
      await repos.workout.setActiveRoutine(testRoutineId);

      active = await repos.workout.getActiveRoutine();
      expect(active).not.toBeNull();
      expect(active?.routine.id).toBe(testRoutineId);
      expect(active?.routine.name).toBe("3-Dagen Kracht Split");
      expect(active?.days).toHaveLength(3);
      expect(active?.days[0].name).toBe("Dag A: Push & Borst");

      // Maak een tweede routine en activeer die
      const routine2Id = crypto.randomUUID();
      const routine2DayId = crypto.randomUUID();
      const routine2: WorkoutRoutine = {
        id: routine2Id,
        name: "Upper Lower Routine",
        description: "Tweedaagse split",
        version: 1,
        isActive: false,
        isArchived: false,
        provenance: { source: "user", isDemo: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const routine2Days: RoutineDay[] = [
        {
          id: routine2DayId,
          routineId: routine2Id,
          dayIndex: 1,
          name: "Bovenlichaam",
          plannedExercises: [
            {
              exerciseId: ex2Id,
              exerciseName: "Bench Press",
              measurementType: "gewicht_herhalingen",
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 10,
              restSeconds: 90,
            },
          ],
          createdAt: new Date().toISOString(),
        },
      ];
      await repos.workout.saveRoutineWithDays(routine2, routine2Days);
      await repos.workout.setActiveRoutine(routine2Id);

      // Check dat active nu routine 2 is en routine 1 niet meer actief is
      const newActive = await repos.workout.getActiveRoutine();
      expect(newActive?.routine.id).toBe(routine2Id);

      const oldRoutine = await repos.workout.getRoutineWithDays(testRoutineId);
      expect(oldRoutine?.routine.isActive).toBe(false);
    });

    it("plant een sessie op een concrete kalenderdatum", async () => {
      const scheduledDate = "2026-10-05";

      const session = await repos.workout.scheduleSession({
        calendarDate: scheduledDate,
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.calendarDate).toBe(scheduledDate);
      expect(session.routineId).toBe(testRoutineId);
      expect(session.routineDayId).toBe(dayAId);
      expect(session.status).toBe("gepland");

      // Haal op voor datum
      const fetched = await repos.workout.getScheduledSessionForDate(scheduledDate);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(session.id);
      expect(fetched?.routineName).toBe("3-Dagen Kracht Split");
      expect(fetched?.dayName).toBe("Dag A: Push & Borst");
      expect(fetched?.exerciseCount).toBe(1);
    });

    it("vervangt een ongeplande sessie op dezelfde datum bij opnieuw inplannen", async () => {
      const targetDate = "2026-10-06";

      // Plan eerst Dag A
      await repos.workout.scheduleSession({
        calendarDate: targetDate,
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      // Plan nu Dag B op dezelfde datum
      const session2 = await repos.workout.scheduleSession({
        calendarDate: targetDate,
        routineId: testRoutineId,
        routineDayId: dayBId,
      });

      // Er mag slechts 1 sessie bestaan voor die datum
      const fetched = await repos.workout.getScheduledSessionForDate(targetDate);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(session2.id);
      expect(fetched?.routineDayId).toBe(dayBId);
      expect(fetched?.dayName).toBe("Dag B: Pull & Rug");
    });

    it("plant een volledige week in met scheduleWeek en respecteert rustdagen", async () => {
      const weekAssignments = [
        { calendarDate: "2026-10-05", routineDayId: dayAId }, // Ma: Dag A
        { calendarDate: "2026-10-06", routineDayId: null },   // Di: Rustdag
        { calendarDate: "2026-10-07", routineDayId: dayBId }, // Wo: Dag B
        { calendarDate: "2026-10-08", routineDayId: null },   // Do: Rustdag
        { calendarDate: "2026-10-09", routineDayId: dayCId }, // Vr: Dag C
        { calendarDate: "2026-10-10", routineDayId: null },   // Za: Rustdag
        { calendarDate: "2026-10-11", routineDayId: null },   // Zo: Rustdag
      ];

      await repos.workout.scheduleWeek(testRoutineId, weekAssignments);

      const weekSessions = await repos.workout.getScheduledSessionsForDateRange(
        "2026-10-05",
        "2026-10-11"
      );

      // Er moeten exact 3 geplande sessies zijn voor de 3 gekozen trainingsdagen
      expect(weekSessions).toHaveLength(3);

      const dates = weekSessions.map((s) => s.calendarDate);
      expect(dates).toContain("2026-10-05");
      expect(dates).toContain("2026-10-07");
      expect(dates).toContain("2026-10-09");

      // Dinsdag, donderdag en weekend moeten rustdagen zijn (geen geplande sessie)
      const tuesday = await repos.workout.getScheduledSessionForDate("2026-10-06");
      expect(tuesday).toBeNull();
    });

    it("verplaatst een geplande sessie naar een andere datum (moveScheduledSession)", async () => {
      const originalDate = "2026-10-05";
      const newDate = "2026-10-06";

      const session = await repos.workout.scheduleSession({
        calendarDate: originalDate,
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      await repos.workout.moveScheduledSession(session.id, newDate);

      // Oude datum is nu leeg
      const oldCheck = await repos.workout.getScheduledSessionForDate(originalDate);
      expect(oldCheck).toBeNull();

      // Nieuwe datum bevat de sessie
      const newCheck = await repos.workout.getScheduledSessionForDate(newDate);
      expect(newCheck).not.toBeNull();
      expect(newCheck?.id).toBe(session.id);
      expect(newCheck?.calendarDate).toBe(newDate);
      expect(newCheck?.status).toBe("gepland");
    });

    it("slaat een geplande sessie over en herstelt deze weer (skip/unskip)", async () => {
      const session = await repos.workout.scheduleSession({
        calendarDate: "2026-10-05",
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      // Sla sessie over
      await repos.workout.skipScheduledSession(session.id);

      let fetched = await repos.workout.getScheduledSessionForDate("2026-10-05");
      expect(fetched).not.toBeNull();
      expect(fetched?.status).toBe("overgeslagen");

      // Herstel sessie
      await repos.workout.unskipScheduledSession(session.id);

      fetched = await repos.workout.getScheduledSessionForDate("2026-10-05");
      expect(fetched?.status).toBe("gepland");
    });

    it("verwijdert een geplande sessie (deleteScheduledSession) naar rustdag", async () => {
      const session = await repos.workout.scheduleSession({
        calendarDate: "2026-10-05",
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      await repos.workout.deleteScheduledSession(session.id);

      const check = await repos.workout.getScheduledSessionForDate("2026-10-05");
      expect(check).toBeNull();
    });

    it("start een workout vanuit een geplande sessie en bevriest een onveranderlijke snapshot", async () => {
      const scheduledDate = "2026-10-05";

      const scheduled = await repos.workout.scheduleSession({
        calendarDate: scheduledDate,
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      // Start de training
      const workoutSession = await repos.workout.startWorkoutFromScheduledSession(
        scheduled.id
      );

      expect(workoutSession).toBeDefined();
      expect(workoutSession.id).toBeDefined();
      expect(workoutSession.status).toBe("actief");
      expect(workoutSession.routineVersion).toBe(1);
      expect(workoutSession.routineDayId).toBe(scheduled.routineDayId);
      expect(workoutSession.snapshot).toBeDefined();
      expect(workoutSession.snapshot.routineName).toBe("3-Dagen Kracht Split");
      expect(workoutSession.snapshot.routineDayName).toBe("Dag A: Push & Borst");
      expect(workoutSession.snapshot.exercises).toHaveLength(1);
      expect(workoutSession.snapshot.exercises[0].exerciseId).toBe(ex2Id);

      // De geplande sessie moet gemarkeerd zijn als afgerond met referentie naar de workout
      const updatedScheduled = await repos.workout.getScheduledSessionForDate(
        scheduledDate
      );
      expect(updatedScheduled?.status).toBe("afgerond");
      expect(updatedScheduled?.completedSessionId).toBe(workoutSession.id);

      // Wijziging van het bronschema tast de reeds gestarte workout snapshot NIET aan
      const routineData = await repos.workout.getRoutineWithDays(testRoutineId);
      if (routineData) {
        routineData.routine.name = "Volledig Nieuwe Naam V2";
        await repos.workout.saveRoutineWithDays(
          routineData.routine,
          routineData.days
        );
      }

      // Herlaad de actieve workout
      const reloadedWorkout = await repos.workout.sessions.getById(
        workoutSession.id
      );
      expect(reloadedWorkout?.snapshot.routineName).toBe("3-Dagen Kracht Split");
      expect(reloadedWorkout?.routineVersion).toBe(1);
    });

    it("start een ad-hoc training direct vanuit een schemadag (startWorkoutFromDay)", async () => {
      const workout = await repos.workout.startWorkoutFromDay(
        testRoutineId,
        dayCId,
        "2026-10-08"
      );

      expect(workout).toBeDefined();
      expect(workout.snapshot.routineDayName).toBe("Dag C: Legs & Benen");
      expect(workout.snapshot.exercises[0].exerciseId).toBe(ex1Id);
      expect(workout.status).toBe("actief");

      // Controleer dat er ook een ScheduledSession met status afgerond is aangemaakt ter logging
      const scheduled = await repos.workout.getScheduledSessionForDate("2026-10-08");
      expect(scheduled).not.toBeNull();
      expect(scheduled?.status).toBe("afgerond");
      expect(scheduled?.completedSessionId).toBe(workout.id);
    });

    it("ondersteunt meerdere geplande sessies van hetzelfde schema met unieke IDs", async () => {
      const session1 = await repos.workout.scheduleSession({
        calendarDate: "2026-10-12",
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      const session2 = await repos.workout.scheduleSession({
        calendarDate: "2026-10-19",
        routineId: testRoutineId,
        routineDayId: dayAId,
      });

      expect(session1.id).not.toBe(session2.id);
      expect(session1.routineId).toBe(session2.routineId);
      expect(session1.routineDayId).toBe(session2.routineDayId);
      expect(session1.calendarDate).toBe("2026-10-12");
      expect(session2.calendarDate).toBe("2026-10-19");
    });
  });
});
