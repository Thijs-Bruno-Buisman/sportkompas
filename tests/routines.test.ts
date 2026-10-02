import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import {
  ROUTINE_TEMPLATES,
  instantiateTemplate,
} from "@/domain/strength/routineTemplates";
import { validateRoutineData } from "@/domain/strength/routineValidation";
import type {
  WorkoutRoutine,
  RoutineDay,
  PlannedExerciseInDay,
  WorkoutSession,
} from "@/types/database";
import Dexie from "dexie";
import { ValidationError } from "@/lib/db/errors";

describe("Stap 07 — Schema's & Routines Creator (Prompt 07)", () => {
  let dbName: string;
  let db: SportKompasDatabase;
  let repos: Repositories;

  beforeEach(async () => {
    dbName = `test_routines_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db = new SportKompasDatabase(dbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      db.close();
    }
    await Dexie.delete(dbName);
  });

  // =========================================================================
  // 1. AANMAKEN, PERSISTENTIE & HEROPENEN (3-DAAGS SCHEMA)
  // =========================================================================
  describe("1. Driedaags schema aanmaken, opslaan en heropenen", () => {
    it("maakt een 3-daags schema aan, bewaart in IndexedDB en laadt correct na heropening", async () => {
      const routineId = crypto.randomUUID();
      const now = new Date().toISOString();

      const routine: WorkoutRoutine = {
        id: routineId,
        name: "Mijn 3-Daagse Krachtbasis",
        description: "Persoonlijk schema gericht op basiskracht",
        version: 1,
        isActive: true,
        isArchived: false,
        provenance: { source: "user", isDemo: false },
        createdAt: now,
        updatedAt: now,
      };

      const days: RoutineDay[] = [
        {
          id: crypto.randomUUID(),
          routineId,
          dayIndex: 1,
          name: "Dag 1 — Borst & Triceps",
          plannedExercises: [
            {
              exerciseId: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001",
              exerciseName: "Bankdrukken (Barbell)",
              measurementType: "gewicht_herhalingen",
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 8,
              targetWeightKg: 80,
              effortScale: "rpe",
              targetRpe: 8,
              restSeconds: 120,
              notes: "Pauzeer 1 sec op borst",
            },
            {
              exerciseId: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e018",
              exerciseName: "Triceps Pushdown (Kabel)",
              measurementType: "gewicht_herhalingen",
              targetSets: 3,
              targetRepsMin: 10,
              targetRepsMax: 12,
              targetWeightKg: 25,
              effortScale: "rir",
              targetRir: 2,
              restSeconds: 90,
            },
          ],
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          routineId,
          dayIndex: 2,
          name: "Dag 2 — Rug & Biceps",
          plannedExercises: [
            {
              exerciseId: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e003",
              exerciseName: "Conventionele Deadlift",
              measurementType: "gewicht_herhalingen",
              targetSets: 3,
              targetRepsMin: 5,
              targetRepsMax: 5,
              targetWeightKg: 120,
              effortScale: "rpe",
              targetRpe: 8.5,
              restSeconds: 180,
            },
          ],
          createdAt: now,
        },
        {
          id: crypto.randomUUID(),
          routineId,
          dayIndex: 3,
          name: "Dag 3 — Benen & Core",
          plannedExercises: [
            {
              exerciseId: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e002",
              exerciseName: "Kniebuigen (Barbell Back Squat)",
              measurementType: "gewicht_herhalingen",
              targetSets: 4,
              targetRepsMin: 6,
              targetRepsMax: 8,
              targetWeightKg: 100,
              effortScale: "rpe",
              targetRpe: 8,
              restSeconds: 150,
            },
            {
              exerciseId: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e012",
              exerciseName: "Plank",
              measurementType: "tijd",
              targetSets: 3,
              targetDurationSeconds: 60,
              effortScale: "geen",
              restSeconds: 60,
            },
          ],
          createdAt: now,
        },
      ];

      // Opslaan via repository
      const saved = await repos.workout.saveRoutineWithDays(routine, days);
      expect(saved.routine.id).toBe(routineId);
      expect(saved.routine.version).toBe(1);
      expect(saved.days.length).toBe(3);

      // Simuleer een volledige herstart / pagina-herlaad door de database te sluiten en opnieuw te openen
      db.close();
      const reopenedDb = new SportKompasDatabase(dbName);
      const reopenedRepos = createRepositories(reopenedDb);
      await reopenedDb.open();

      const loaded = await reopenedRepos.workout.getRoutineWithDays(routineId);
      expect(loaded).not.toBeNull();
      expect(loaded?.routine.name).toBe("Mijn 3-Daagse Krachtbasis");
      expect(loaded?.routine.isActive).toBe(true);
      expect(loaded?.routine.isArchived).toBe(false);
      expect(loaded?.days.length).toBe(3);

      // Controleer Dag 1 details
      expect(loaded?.days[0].name).toBe("Dag 1 — Borst & Triceps");
      expect(loaded?.days[0].plannedExercises.length).toBe(2);
      expect(loaded?.days[0].plannedExercises[0].exerciseName).toBe("Bankdrukken (Barbell)");
      expect(loaded?.days[0].plannedExercises[0].targetRepsMin).toBe(6);
      expect(loaded?.days[0].plannedExercises[0].targetRepsMax).toBe(8);
      expect(loaded?.days[0].plannedExercises[0].targetWeightKg).toBe(80);
      expect(loaded?.days[0].plannedExercises[0].targetRpe).toBe(8);

      // Controleer Tijd-gebaseerde oefening in Dag 3
      expect(loaded?.days[2].plannedExercises[1].exerciseName).toBe("Plank");
      expect(loaded?.days[2].plannedExercises[1].measurementType).toBe("tijd");
      expect(loaded?.days[2].plannedExercises[1].targetDurationSeconds).toBe(60);

      reopenedDb.close();
    });
  });

  // =========================================================================
  // 2. SCHEMA DUPLICEREN
  // =========================================================================
  describe("2. Schema dupliceren", () => {
    it("dupliceert een bestaand schema naar een nieuw schema met unieke IDs en versie 1", async () => {
      // 1. Maak bronschema aan
      const source = instantiateTemplate("template-full-body-3d")!;
      await repos.workout.saveRoutineWithDays(source.routine, source.days);

      // 2. Dupliceer schema
      const duplicated = await repos.workout.duplicateRoutine(
        source.routine.id,
        "Mijn Full Body Kopie"
      );

      expect(duplicated.routine.id).not.toBe(source.routine.id);
      expect(duplicated.routine.name).toBe("Mijn Full Body Kopie");
      expect(duplicated.routine.version).toBe(1);
      expect(duplicated.routine.isActive).toBe(false);
      expect(duplicated.routine.isArchived).toBe(false);
      expect(duplicated.days.length).toBe(source.days.length);

      // Dagen moeten nieuwe unieke IDs hebben en verwijzen naar de nieuwe routineId
      duplicated.days.forEach((day, idx) => {
        expect(day.id).not.toBe(source.days[idx].id);
        expect(day.routineId).toBe(duplicated.routine.id);
        expect(day.plannedExercises.length).toBe(
          source.days[idx].plannedExercises.length
        );
      });

      // Zowel bronschema als kopie moeten in de database bestaan
      const allRoutines = await repos.workout.getRoutines();
      expect(allRoutines.length).toBe(2);
    });
  });

  // =========================================================================
  // 3. ACTIEF PROGRAMMA & ARCHIVERING
  // =========================================================================
  describe("3. Actief programma beheer en veilige archivering", () => {
    it("activeert één schema tegelijk en deactiveert eerdere actieve schema's", async () => {
      const t1 = instantiateTemplate("template-full-body-3d", "Schema A")!;
      const t2 = instantiateTemplate("template-ppl-3d", "Schema B")!;

      await repos.workout.saveRoutineWithDays(t1.routine, t1.days);
      await repos.workout.saveRoutineWithDays(t2.routine, t2.days);

      // Activeer Schema A
      await repos.workout.setActiveRoutine(t1.routine.id);
      let rA = await repos.workout.routines.getById(t1.routine.id);
      let rB = await repos.workout.routines.getById(t2.routine.id);
      expect(rA?.isActive).toBe(true);
      expect(rB?.isActive).toBe(false);

      // Activeer Schema B -> Schema A moet gedeactiveerd worden
      await repos.workout.setActiveRoutine(t2.routine.id);
      rA = await repos.workout.routines.getById(t1.routine.id);
      rB = await repos.workout.routines.getById(t2.routine.id);
      expect(rA?.isActive).toBe(false);
      expect(rB?.isActive).toBe(true);
    });

    it("archiveert en dearchiveert een schema veilig met behoud van data", async () => {
      const t = instantiateTemplate("template-full-body-3d")!;
      await repos.workout.saveRoutineWithDays(t.routine, t.days);
      await repos.workout.setActiveRoutine(t.routine.id);

      // Archiveer
      const archived = await repos.workout.archiveRoutine(t.routine.id);
      expect(archived.isArchived).toBe(true);
      expect(archived.isActive).toBe(false); // Mag niet meer actief zijn

      // getRoutines(false) sluit gearchiveerde uit
      const activeList = await repos.workout.getRoutines(false);
      expect(activeList.some((r) => r.id === t.routine.id)).toBe(false);

      // getRoutines(true) toont ook gearchiveerde
      const fullList = await repos.workout.getRoutines(true);
      expect(fullList.some((r) => r.id === t.routine.id)).toBe(true);

      // Dearchiveer
      const restored = await repos.workout.unarchiveRoutine(t.routine.id);
      expect(restored.isArchived).toBe(false);

      const activeListAfter = await repos.workout.getRoutines(false);
      expect(activeListAfter.some((r) => r.id === t.routine.id)).toBe(true);
    });
  });

  // =========================================================================
  // 4. DOMEINVALIDATIE (LEGE DAGEN, ONGELDIGE REPBEREIKEN, MEETTYPES)
  // =========================================================================
  describe("4. Domeinvalidatie van routines en trainingsdagen", () => {
    it("wijst een schema zonder naam of zonder dagen af", () => {
      const errs1 = validateRoutineData("", [
        {
          name: "Dag 1",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Squat",
              targetSets: 3,
              targetRepsMin: 5,
              targetRepsMax: 5,
              restSeconds: 120,
            },
          ],
        },
      ]);
      expect(errs1.some((e) => e.field === "routineName")).toBe(true);

      const errs2 = validateRoutineData("Mijn Schema", []);
      expect(errs2.some((e) => e.field === "days")).toBe(true);
    });

    it("wijst een schema met lege dagen af (elke dag vereist minimaal 1 oefening)", () => {
      const errs = validateRoutineData("Mijn Schema", [
        {
          name: "Dag 1 (Gevuld)",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Squat",
              targetSets: 3,
              targetRepsMin: 5,
              targetRepsMax: 5,
              restSeconds: 120,
            },
          ],
        },
        {
          name: "Dag 2 (Leeg)",
          plannedExercises: [],
        },
      ]);

      expect(errs.length).toBeGreaterThan(0);
      expect(errs.some((e) => e.message.includes("heeft geen oefeningen"))).toBe(true);
    });

    it("wijst een ongeldig repbereik af (targetRepsMin > targetRepsMax)", () => {
      const errs = validateRoutineData("Mijn Schema", [
        {
          name: "Dag 1",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Bankdrukken",
              targetSets: 3,
              targetRepsMin: 12,
              targetRepsMax: 8, // Ongeldig: 12 > 8!
              restSeconds: 90,
            },
          ],
        },
      ]);

      expect(errs.some((e) => e.message.includes("Ongeldig repbereik"))).toBe(true);
    });

    it("valideert tijd-gebaseerde oefeningen op aanwezigheid van seconden", () => {
      const errs = validateRoutineData("Mijn Schema", [
        {
          name: "Dag 1",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Plank",
              measurementType: "tijd",
              targetSets: 3,
              targetDurationSeconds: 0, // Ongeldig: moet >= 1 zijn
              restSeconds: 60,
            },
          ],
        },
      ]);

      expect(errs.some((e) => e.message.includes("Duuroefeningen vereisen een tijdsduur"))).toBe(true);
    });

    it("valideert RPE (1-10) en RIR (0-10) grenzen", () => {
      const errsRpe = validateRoutineData("Mijn Schema", [
        {
          name: "Dag 1",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Squat",
              targetSets: 3,
              targetRepsMin: 5,
              targetRepsMax: 5,
              effortScale: "rpe",
              targetRpe: 12, // Ongeldig: > 10
              restSeconds: 120,
            },
          ],
        },
      ]);
      expect(errsRpe.some((e) => e.message.includes("RPE doelwaarde moet tussen 1 en 10 liggen"))).toBe(true);

      const errsRir = validateRoutineData("Mijn Schema", [
        {
          name: "Dag 1",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Squat",
              targetSets: 3,
              targetRepsMin: 5,
              targetRepsMax: 5,
              effortScale: "rir",
              targetRir: -1, // Ongeldig: < 0
              restSeconds: 120,
            },
          ],
        },
      ]);
      expect(errsRir.some((e) => e.message.includes("RIR doelwaarde"))).toBe(true);
    });

    it("gooit een ValidationError wanneer saveRoutineWithDays wordt aangeroepen met ongeldige data", async () => {
      const routine: WorkoutRoutine = {
        id: crypto.randomUUID(),
        name: "", // Lege naam
        description: "",
        version: 1,
        isActive: false,
        isArchived: false,
        provenance: { source: "user", isDemo: false },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await expect(
        repos.workout.saveRoutineWithDays(routine, [])
      ).rejects.toThrow(ValidationError);
    });
  });

  // =========================================================================
  // 5. VERSIEBEHEER & ONVERANDERLIJKE HISTORIE
  // =========================================================================
  describe("5. Automatisch versiebeheer bij bestaande sessies", () => {
    it("verhoogt automatisch de versie van een schema als er al voltooide/actieve sessies naar verwijzen", async () => {
      const routineId = crypto.randomUUID();
      const dayId = crypto.randomUUID();
      const now = new Date().toISOString();

      const routine: WorkoutRoutine = {
        id: routineId,
        name: "Upper / Lower V1",
        description: "Initiële versie",
        version: 1,
        isActive: true,
        isArchived: false,
        provenance: { source: "user", isDemo: false },
        createdAt: now,
        updatedAt: now,
      };

      const days: RoutineDay[] = [
        {
          id: dayId,
          routineId,
          dayIndex: 1,
          name: "Upper Day",
          plannedExercises: [
            {
              exerciseId: crypto.randomUUID(),
              exerciseName: "Bankdrukken",
              measurementType: "gewicht_herhalingen",
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 10,
              restSeconds: 90,
            },
          ],
          createdAt: now,
        },
      ];

      // Sla versie 1 op
      const v1 = await repos.workout.saveRoutineWithDays(routine, days);
      expect(v1.routine.version).toBe(1);

      // Simuleer een gelogde sessie die expliciet naar routineId en routineVersion: 1 verwijst
      const workoutSession: WorkoutSession = {
        id: crypto.randomUUID(),
        calendarDate: "2026-10-02",
        startTime: now,
        endTime: now,
        status: "afgerond",
        routineId: routineId,
        routineDayId: dayId,
        routineVersion: 1,
        snapshot: {
          routineName: "Upper / Lower V1",
          routineDayName: "Upper Day",
          exercises: [
            {
              exerciseId: days[0].plannedExercises[0].exerciseId,
              exerciseName: "Bankdrukken",
              primaryMuscleGroup: "borst",
              targetSets: 3,
              targetRepsMin: 8,
              targetRepsMax: 10,
              restSeconds: 90,
            },
          ],
        },
        overallRpe: 8,
        notes: "Goeie sessie",
        provenance: { source: "user", isDemo: false },
      };
      await repos.workout.sessions.save(workoutSession);

      // Nu past de gebruiker het schema aan (bijv. verhoogt reps naar 10-12)
      const updatedDays: RoutineDay[] = [
        {
          ...days[0],
          plannedExercises: [
            {
              ...days[0].plannedExercises[0],
              targetRepsMin: 10,
              targetRepsMax: 12,
            },
          ],
        },
      ];

      // Sla opnieuw op: omdat versie 1 al in gebruik is door een sessie, MOET versie automatisch v2 worden!
      const v2 = await repos.workout.saveRoutineWithDays(v1.routine, updatedDays);
      expect(v2.routine.version).toBe(2);

      // Controleer dat de historische sessie nog steeds naar versie 1 verwijst met ongewijzigde snapshot
      const savedSession = await repos.workout.sessions.getById(workoutSession.id);
      expect(savedSession?.routineVersion).toBe(1);
      expect(savedSession?.snapshot.exercises[0].targetRepsMin).toBe(8);
      expect(savedSession?.snapshot.exercises[0].targetRepsMax).toBe(10);
    });

    it("verhoogt de versie NIET als er nog geen sessies naar de huidige versie verwijzen", async () => {
      const source = instantiateTemplate("template-ppl-3d", "Concept Schema")!;
      const saved1 = await repos.workout.saveRoutineWithDays(source.routine, source.days);
      expect(saved1.routine.version).toBe(1);

      // Gebruiker past schema meteen weer aan zonder getraind te hebben
      saved1.routine.description = "Aangepaste omschrijving";
      const saved2 = await repos.workout.saveRoutineWithDays(saved1.routine, saved1.days);
      expect(saved2.routine.version).toBe(1); // Blijft v1
    });
  });

  // =========================================================================
  // 6. VOORBEELD TEMPLATES & SJABLONEN
  // =========================================================================
  describe("6. Voorbeeldsjablonen (Templates)", () => {
    it("bevat 3 geldige sjablonen (Full Body, Upper/Lower, Push/Pull/Legs)", () => {
      expect(ROUTINE_TEMPLATES.length).toBe(3);
      const ids = ROUTINE_TEMPLATES.map((t) => t.id);
      expect(ids).toContain("template-full-body-3d");
      expect(ids).toContain("template-upper-lower-4d");
      expect(ids).toContain("template-ppl-3d");

      ROUTINE_TEMPLATES.forEach((tpl) => {
        expect(tpl.name.length).toBeGreaterThan(0);
        expect(tpl.days.length).toBeGreaterThanOrEqual(3);
        const errs = validateRoutineData(tpl.name, tpl.days);
        expect(errs.length).toBe(0);
      });
    });

    it("instantiateTemplate genereert een concept dat NIET automatisch in de database staat", async () => {
      const beforeCount = await db.workoutRoutines.count();
      const instantiated = instantiateTemplate("template-full-body-3d");

      expect(instantiated).not.toBeNull();
      expect(instantiated?.routine.version).toBe(1);
      expect(instantiated?.days.length).toBe(3);

      // Mag nog NIET in de database staan!
      const afterCount = await db.workoutRoutines.count();
      expect(afterCount).toBe(beforeCount);
    });
  });
});
