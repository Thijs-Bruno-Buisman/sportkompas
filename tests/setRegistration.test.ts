import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import type {
  WorkoutRoutine,
  RoutineDay,
  PlannedExerciseInDay,
  Exercise,
  WorkoutSet,
} from "@/types/database";
import Dexie from "dexie";
import {
  parseDecimalInput,
  parseRepsInput,
  parseDurationInput,
  formatDurationSeconds,
  duplicateSetValues,
  compareSetPerformance,
  getWeightFieldLabel,
} from "@/domain/strength/setParser";

describe("Stap 10 â€” Sets Registreren & Meettypes (Prompt 10)", () => {
  let db: SportKompasDatabase;
  let repos: Repositories;
  const testDbName = "sportkompas-test-sets-step10";

  let benchPressExercise: Exercise;
  let assistedPullupExercise: Exercise;
  let plankExercise: Exercise;
  let testRoutine: WorkoutRoutine;
  let testDay: RoutineDay;

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    await db.open();
    repos = createRepositories(db);

    // Vul database met standaardoefeningen
    await repos.exercises.ensureDefaultExercises();
    const allEx = await repos.exercises.getAll();
    benchPressExercise = allEx.find(
      (e) => e.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001"
    )!; // gewicht_herhalingen

    // Maak of zoek assisted en tijd oefeningen
    let assisted = allEx.find((e) => e.measurementType === "assisted");
    if (!assisted) {
      const now = new Date().toISOString();
      assisted = await repos.exercises.save({
        id: crypto.randomUUID(),
        name: "Assisted Pull-up Machine",
        category: "kracht",
        primaryMuscleGroup: "rug",
        secondaryMuscleGroups: [],
        equipment: "machine",
        measurementType: "assisted",
        isCustom: false,
        isArchived: false,
        instructions: "Stel het contragewicht in. Minder tegengewicht = zwaardere belasting.",
        provenance: { source: "user", isDemo: false },
        createdAt: now,
      });
    }
    assistedPullupExercise = assisted;

    const plank = allEx.find((e) => e.measurementType === "tijd");
    plankExercise = plank || {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e012",
      name: "Plank",
      category: "lichaamsgewicht",
      primaryMuscleGroup: "core",
      secondaryMuscleGroups: [],
      equipment: "lichaamsgewicht",
      measurementType: "tijd",
      isCustom: false,
      isArchived: false,
      instructions: "Houd je core strak.",
      provenance: { source: "system", isDemo: false },
      createdAt: "2026-01-01T00:00:00.000Z",
    };

    // Maak een testschema aan met 2 oefeningen
    const routineId = crypto.randomUUID();
    const dayId = crypto.randomUUID();

    const dayExercises: PlannedExerciseInDay[] = [
      {
        exerciseId: benchPressExercise.id,
        exerciseName: benchPressExercise.name,
        measurementType: "gewicht_herhalingen",
        targetSets: 3,
        targetRepsMin: 8,
        targetRepsMax: 10,
        targetWeightKg: 80,
        restSeconds: 90,
      },
      {
        exerciseId: assistedPullupExercise.id,
        exerciseName: assistedPullupExercise.name,
        measurementType: "assisted",
        targetSets: 3,
        targetRepsMin: 6,
        targetRepsMax: 8,
        targetWeightKg: 30, // 30kg tegengewicht hulp
        restSeconds: 120,
      },
    ];

    const now = new Date().toISOString();
    testRoutine = {
      id: routineId,
      name: "Kracht & Pull-ups",
      description: "Testroutine voor prompt 10",
      version: 1,
      isActive: true,
      isArchived: false,
      provenance: { source: "user", isDemo: false },
      createdAt: now,
      updatedAt: now,
    };

    testDay = {
      id: dayId,
      routineId,
      dayIndex: 1,
      name: "Borst & Rug Dag",
      plannedExercises: dayExercises,
      createdAt: now,
    };

    await repos.workout.saveRoutineWithDays(testRoutine, [testDay]);
  });

  afterEach(async () => {
    await db.close();
  });

  // ---------------------------------------------------------------------------
  // 1. INVOEREN VAN 3 SETS, BEWERKEN VAN 1, HERLADEN UIT INDEXEDDB
  // ---------------------------------------------------------------------------
  it("kan 3 sets registreren, 1 bewerken, herladen uit IndexedDB en verifiÃ«ren dat data persistent is", async () => {
    // 1. Start sessie
    const session = await repos.workout.startWorkoutFromDay(
      testRoutine.id,
      testDay.id,
      "2026-03-29"
    );

    // 2. Haal gegenereerde sets op voor de eerste oefening (Bankdrukken)
    const initialSets = await repos.workout.getSetsForSessionAndExercise(
      session.id,
      benchPressExercise.id
    );
    expect(initialSets.length).toBe(3);

    // 3. Vul Set 1 in en markeer als voltooid: 80kg x 10 @ RPE 8
    const set1 = initialSets[0];
    const updatedSet1: WorkoutSet = {
      ...set1,
      weightKg: 80,
      reps: 10,
      actualRpe: 8,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    await repos.workout.saveWorkoutSet(updatedSet1);

    // 4. Vul Set 2 in: 82.5kg x 8 @ RPE 9
    const set2 = initialSets[1];
    const updatedSet2: WorkoutSet = {
      ...set2,
      weightKg: 82.5,
      reps: 8,
      actualRpe: 9,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    await repos.workout.saveWorkoutSet(updatedSet2);

    // 5. Vul Set 3 in: 85kg x 6, maar NIET voltooid
    const set3 = initialSets[2];
    const updatedSet3: WorkoutSet = {
      ...set3,
      weightKg: 85,
      reps: 6,
      completed: false,
    };
    await repos.workout.saveWorkoutSet(updatedSet3);

    // 6. Wijzig Set 2 achteraf (bijv. gebruiker had 9 reps gehaald ipv 8 en setType is warmup)
    const modifiedSet2: WorkoutSet = {
      ...updatedSet2,
      reps: 9,
      setType: "drop",
      actualRpe: 9.5,
    };
    await repos.workout.saveWorkoutSet(modifiedSet2);

    // 7. Simuleer scherm herladen: herlaad direct vanuit de database
    const reloadedSets = await repos.workout.getSetsForSessionAndExercise(
      session.id,
      benchPressExercise.id
    );

    expect(reloadedSets.length).toBe(3);

    // Verifieer Set 1
    const s1 = reloadedSets.find((s) => s.id === set1.id)!;
    expect(s1.weightKg).toBe(80);
    expect(s1.reps).toBe(10);
    expect(s1.actualRpe).toBe(8);
    expect(s1.completed).toBe(true);

    // Verifieer Gewijzigde Set 2
    const s2 = reloadedSets.find((s) => s.id === set2.id)!;
    expect(s2.weightKg).toBe(82.5);
    expect(s2.reps).toBe(9); // Correct gewijzigd!
    expect(s2.actualRpe).toBe(9.5);
    expect(s2.setType).toBe("drop");
    expect(s2.completed).toBe(true);

    // Verifieer Set 3 (niet voltooid)
    const s3 = reloadedSets.find((s) => s.id === set3.id)!;
    expect(s3.weightKg).toBe(85);
    expect(s3.reps).toBe(6);
    expect(s3.completed).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 2. DECIMAALSCHEIDING MET KOMMA Ã‰N PUNT
  // ---------------------------------------------------------------------------
  it("ondersteunt zowel komma als punt als decimaalscheidingsteken zonder focusverlies of NaN", () => {
    // Komma invoer (Nederlands toetsenbord)
    expect(parseDecimalInput("72,5")).toBe(72.5);
    expect(parseDecimalInput("102,75")).toBe(102.75);
    expect(parseDecimalInput(",5")).toBe(0.5);

    // Punt invoer (Engels toetsenbord)
    expect(parseDecimalInput("72.5")).toBe(72.5);
    expect(parseDecimalInput(".5")).toBe(0.5);

    // Invoer met spaties
    expect(parseDecimalInput("  85,5  ")).toBe(85.5);

    // Ongeldige waarden vallen terug op null
    expect(parseDecimalInput("abc")).toBeNull();
    expect(parseDecimalInput("")).toBeNull();
    expect(parseDecimalInput("-10")).toBeNull(); // Negatieve gewichten niet toegestaan
    expect(parseDecimalInput("1500")).toBeNull(); // Onrealistisch hoog boven limiet 1000kg
  });

  it("parseert herhalingen en tijd/duur invoer correct", () => {
    // Reps parsing
    expect(parseRepsInput("12")).toBe(12);
    expect(parseRepsInput(" 8 ")).toBe(8);
    expect(parseRepsInput("0")).toBe(0);
    expect(parseRepsInput("-2")).toBeNull();
    expect(parseRepsInput("600")).toBeNull(); // Boven max 500

    // Duur parsing (seconden of mm:ss)
    expect(parseDurationInput("45")).toBe(45);
    expect(parseDurationInput("1:30")).toBe(90);
    expect(parseDurationInput("02:15")).toBe(135);
    expect(parseDurationInput("invalid")).toBeNull();

    // Formatteren van seconden
    expect(formatDurationSeconds(45)).toBe("45s");
    expect(formatDurationSeconds(90)).toBe("1m 30s");
    expect(formatDurationSeconds(125)).toBe("2m 5s");
  });

  // ---------------------------------------------------------------------------
  // 3. KOPIEER VORIGE SET LOGICA
  // ---------------------------------------------------------------------------
  it("kopieert vorige set met behoud van gewicht en reps, maar initialiseert completed=false en actualRpe=null", () => {
    const previousSet: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      exerciseId: benchPressExercise.id,
      setNumber: 1,
      setType: "normal",
      weightKg: 95.5,
      reps: 8,
      durationSeconds: null,
      targetRpe: 8,
      actualRpe: 8.5,
      isAssisted: false,
      restTimeSeconds: 120,
      completed: true,
      completedAt: "2026-03-29T10:00:00Z",
      loggedAt: "2026-03-29T10:00:00Z",
    };

    const newId = crypto.randomUUID();
    const copiedSet = duplicateSetValues(previousSet, 2, newId);

    expect(copiedSet.id).toBe(newId);
    expect(copiedSet.setNumber).toBe(2);
    expect(copiedSet.weightKg).toBe(95.5);
    expect(copiedSet.reps).toBe(8);
    expect(copiedSet.setType).toBe("normal");
    expect(copiedSet.targetRpe).toBe(8);
    expect(copiedSet.restTimeSeconds).toBe(120);

    // Belangrijke eisen: gekopieerde set is nog NIET voltooid en heeft geen actualRpe
    expect(copiedSet.completed).toBe(false);
    expect(copiedSet.actualRpe).toBeNull();
    expect(copiedSet.completedAt).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // 4. ASSISTED OEFENINGEN: LAGERE HULP = BETERE PRESTATIE
  // ---------------------------------------------------------------------------
  it("behandelt assisted gewicht correct: minder tegengewicht is een betere prestatie", () => {
    const set30kgAssistance: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      exerciseId: assistedPullupExercise.id,
      setNumber: 1,
      setType: "normal",
      weightKg: 30, // 30kg machinehulp
      reps: 8,
      isAssisted: true,
      targetRpe: null,
      actualRpe: null,
      restTimeSeconds: 90,
      completed: true,
      loggedAt: new Date().toISOString(),
    };

    const set20kgAssistance: WorkoutSet = {
      id: crypto.randomUUID(),
      sessionId: crypto.randomUUID(),
      exerciseId: assistedPullupExercise.id,
      setNumber: 2,
      setType: "normal",
      weightKg: 20, // 20kg machinehulp (minder hulp = zwaarder = beter!)
      reps: 8,
      isAssisted: true,
      targetRpe: null,
      actualRpe: null,
      restTimeSeconds: 90,
      completed: true,
      loggedAt: new Date().toISOString(),
    };

    // Vergelijk prestaties: 20kg tegengewicht moet WINNEN van 30kg tegengewicht
    const cmp = compareSetPerformance(set20kgAssistance, set30kgAssistance);
    expect(cmp).toBeGreaterThan(0); // 20kg is een betere prestatie dan 30kg!

    // Omgekeerd: 30kg vergelijken met 20kg geeft een negatieve score
    const cmpReverse = compareSetPerformance(set30kgAssistance, set20kgAssistance);
    expect(cmpReverse).toBeLessThan(0);

    // Zelfde tegengewicht maar meer herhalingen wint ook
    const set20kgWith10Reps = { ...set20kgAssistance, reps: 10 };
    expect(compareSetPerformance(set20kgWith10Reps, set20kgAssistance)).toBeGreaterThan(0);

    // Reguliere oefening (Bankdrukken): HOGER gewicht is beter
    const regular80kg = { ...set30kgAssistance, weightKg: 80, isAssisted: false };
    const regular90kg = { ...set30kgAssistance, weightKg: 90, isAssisted: false };
    expect(compareSetPerformance(regular90kg, regular80kg)).toBeGreaterThan(0);
  });

  it("geeft de juiste gewicht labels per meettype", () => {
    expect(getWeightFieldLabel("assisted", true).label).toBe("Tegengewicht (hulp)");
    expect(getWeightFieldLabel("lichaamsgewicht").label).toBe("Extra gewicht (+/-)");
    expect(getWeightFieldLabel("gewicht_herhalingen").label).toBe("Gewicht");
  });

  // ---------------------------------------------------------------------------
  // 5. NIET-VOLTOOIDE SETS TELLEN NIET MEE ALS PRESTATIE
  // ---------------------------------------------------------------------------
  it("sluit niet-voltooide sets uit van eerdere prestaties en progressieve overload", async () => {
    // Sessie 1 uitvoeren
    const session1 = await repos.workout.startWorkoutFromDay(
      testRoutine.id,
      testDay.id,
      "2026-03-20"
    );

    const s1Sets = await repos.workout.getSetsForSessionAndExercise(
      session1.id,
      benchPressExercise.id
    );

    // Set 1 voltooid (80kg x 8)
    await repos.workout.saveWorkoutSet({
      ...s1Sets[0],
      weightKg: 80,
      reps: 8,
      completed: true,
      completedAt: new Date().toISOString(),
    });

    // Set 2 NIET voltooid (stond gepland op 85kg x 8)
    await repos.workout.saveWorkoutSet({
      ...s1Sets[1],
      weightKg: 85,
      reps: 8,
      completed: false,
    });

    // Set 3 NIET voltooid
    await repos.workout.saveWorkoutSet({
      ...s1Sets[2],
      weightKg: 90,
      reps: 6,
      completed: false,
    });

    // Rond sessie 1 af
    await repos.workout.finishSession(session1.id, 8, "Goede eerste sessie");

    // Start een nieuwe Sessie 2 en vraag eerdere prestaties op (met uitsluiting van session2)
    const session2 = await repos.workout.startWorkoutFromDay(
      testRoutine.id,
      testDay.id,
      "2026-03-25"
    );

    const previous = await repos.workout.getPreviousPerformanceForExercise(
      benchPressExercise.id,
      session2.id
    );

    expect(previous).not.toBeNull();
    // Alleen de 1 voltooide set mag terugkomen! De niet-voltooide sets mogen NIET meedoen
    expect(previous?.sets.length).toBe(1);
    expect(previous?.sets[0].weightKg).toBe(80);
    expect(previous?.sets[0].reps).toBe(8);
  });

  // ---------------------------------------------------------------------------
  // 6. SET VERWIJDEREN EN HERNORMERING
  // ---------------------------------------------------------------------------
  it("kan een tussenliggende set verwijderen en overgebleven sets stabiel hernummeren", async () => {
    const session = await repos.workout.startWorkoutFromDay(
      testRoutine.id,
      testDay.id,
      "2026-03-29"
    );

    const initialSets = await repos.workout.getSetsForSessionAndExercise(
      session.id,
      benchPressExercise.id
    );
    expect(initialSets.length).toBe(3);

    // Verwijder set 2 (id = initialSets[1].id)
    const setToDelete = initialSets[1];
    await repos.workout.deleteWorkoutSet(setToDelete.id);

    // Hernummer resterende sets (set 1 en set 3 worden set 1 en set 2)
    const remaining = [initialSets[0], initialSets[2]].map((s, idx) => ({
      ...s,
      setNumber: idx + 1,
    }));
    for (const s of remaining) {
      await repos.workout.saveWorkoutSet(s);
    }

    // Herlaad uit database en controleer
    const reloaded = await repos.workout.getSetsForSessionAndExercise(
      session.id,
      benchPressExercise.id
    );
    expect(reloaded.length).toBe(2);
    expect(reloaded[0].setNumber).toBe(1);
    expect(reloaded[1].setNumber).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // 7. ZOD SCHEMA VEILIGHEID EN ONGELDIGE DATA
  // ---------------------------------------------------------------------------
  it("weerhoudt het opslaan van sets met ongeldige data via Zod validatie", async () => {
    const invalidSet = {
      id: "niet-een-uuid",
      sessionId: "ook-geen-uuid",
      exerciseId: benchPressExercise.id,
      setNumber: -1, // Ongeldig: moet >= 1 zijn
      setType: "onbekend-type", // Ongeldig enum
      weightKg: -50, // Ongeldig: negatief gewicht
      reps: -5,
      restTimeSeconds: 90,
      completed: true,
      loggedAt: "ongeldige-datum",
    };

    await expect(
      repos.workout.saveWorkoutSet(invalidSet as any)
    ).rejects.toThrow();
  });
});

