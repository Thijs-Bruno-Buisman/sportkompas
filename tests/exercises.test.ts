import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories, type Repositories } from "@/lib/db";
import { DEFAULT_EXERCISES } from "@/domain/strength/defaultExercises";
import type { Exercise } from "@/types/database";
import Dexie from "dexie";
import { ValidationError } from "@/lib/db/errors";

describe("Stap 06 — Oefeningenbibliotheek & Opslag", () => {
  let dbName: string;
  let db: SportKompasDatabase;
  let repos: Repositories;

  beforeEach(async () => {
    dbName = `test_exercises_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
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

  describe("1. Standaard Oefeningen & Initialisatie", () => {
    it("bevolkt de lege database met alle 42 standaard catalogus oefeningen", async () => {
      const initialCount = await db.exercises.count();
      expect(initialCount).toBe(0);

      const inserted = await repos.exercises.ensureDefaultExercises();
      expect(inserted).toBe(DEFAULT_EXERCISES.length);
      expect(inserted).toBeGreaterThanOrEqual(35);

      const stored = await repos.exercises.getAll();
      expect(stored.length).toBe(inserted);

      // Controleer dat alle standaard oefeningen valide zijn
      stored.forEach((ex) => {
        expect(ex.id).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        );
        expect(ex.name.length).toBeGreaterThan(0);
        expect(ex.isCustom).toBe(false);
        expect(ex.isArchived).toBe(false);
        expect(ex.instructions.length).toBeGreaterThan(10);
      });
    });

    it("is idempotent: herhaaldelijk aanroepen van ensureDefaultExercises overschrijft of dupliceert niet", async () => {
      await repos.exercises.ensureDefaultExercises();
      const count1 = await db.exercises.count();

      const secondRun = await repos.exercises.ensureDefaultExercises();
      expect(secondRun).toBe(0);
      const count2 = await db.exercises.count();
      expect(count2).toBe(count1);
    });

    it("bevat oefeningen voor alle 5 vereiste meetmethodes", async () => {
      await repos.exercises.ensureDefaultExercises();
      const all = await repos.exercises.getAll();

      const gewichtReps = all.filter((ex) => ex.measurementType === "gewicht_herhalingen");
      const lichaamsgewicht = all.filter((ex) => ex.measurementType === "lichaamsgewicht");
      const extraGewicht = all.filter((ex) => ex.measurementType === "extra_gewicht");
      const assisted = all.filter((ex) => ex.measurementType === "assisted");
      const tijd = all.filter((ex) => ex.measurementType === "tijd");

      expect(gewichtReps.length).toBeGreaterThan(10);
      expect(lichaamsgewicht.length).toBeGreaterThanOrEqual(3);
      expect(extraGewicht.length).toBeGreaterThanOrEqual(2);
      expect(assisted.length).toBeGreaterThanOrEqual(2);
      expect(tijd.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("2. Zoeken en Meertalige Synoniemen", () => {
    beforeEach(async () => {
      await repos.exercises.ensureDefaultExercises();
    });

    it("vindt oefeningen via Nederlandse primaire namen", async () => {
      const results = await repos.exercises.searchAndFilter({ query: "Bankdrukken" });
      expect(results.length).toBeGreaterThan(0);
      expect(results.some((ex) => ex.name.includes("Bankdrukken"))).toBe(true);
    });

    it("vindt oefeningen via Engelse alternatieve namen (synoniemen)", async () => {
      // Zoek op "Bench Press"
      const benchResults = await repos.exercises.searchAndFilter({ query: "Bench Press" });
      expect(benchResults.length).toBeGreaterThan(0);
      expect(benchResults.some((ex) => ex.name.includes("Bankdrukken"))).toBe(true);

      // Zoek op "Deadlift"
      const dlResults = await repos.exercises.searchAndFilter({ query: "Deadlift" });
      expect(dlResults.length).toBeGreaterThan(0);

      // Zoek op "OHP"
      const ohpResults = await repos.exercises.searchAndFilter({ query: "OHP" });
      expect(ohpResults.length).toBeGreaterThan(0);
      expect(ohpResults[0].name).toContain("Schouderdrukken");
    });

    it("zoekt case-insensitief en trimt spaties", async () => {
      const res = await repos.exercises.searchAndFilter({ query: "  sQuAt  " });
      expect(res.length).toBeGreaterThan(0);
      expect(res.some((ex) => ex.name.includes("Kniebuigen"))).toBe(true);
    });
  });

  describe("3. Geavanceerde Filters (Spiergroep, Materiaal, Meettype)", () => {
    beforeEach(async () => {
      await repos.exercises.ensureDefaultExercises();
    });

    it("filtert op primaire en secundaire spiergroepen", async () => {
      const borstOefeningen = await repos.exercises.searchAndFilter({
        muscleGroup: "borst",
      });
      expect(borstOefeningen.length).toBeGreaterThan(4);
      borstOefeningen.forEach((ex) => {
        const matchesPrimary = ex.primaryMuscleGroup === "borst";
        const matchesSecondary = ex.secondaryMuscleGroups?.includes("borst");
        expect(matchesPrimary || matchesSecondary).toBe(true);
      });
    });

    it("filtert op apparatuur / materiaal", async () => {
      const barbells = await repos.exercises.searchAndFilter({
        equipment: "barbell",
      });
      expect(barbells.length).toBeGreaterThan(5);
      barbells.forEach((ex) => {
        expect(ex.equipment).toBe("barbell");
      });
    });

    it("filtert op specifiek meettype (bijv. tijd)", async () => {
      const tijdOefeningen = await repos.exercises.searchAndFilter({
        measurementType: "tijd",
      });
      expect(tijdOefeningen.length).toBeGreaterThanOrEqual(3);
      tijdOefeningen.forEach((ex) => {
        expect(ex.measurementType).toBe("tijd");
      });
    });

    it("combineert meerdere filters en zoekopdracht naadloos", async () => {
      const combined = await repos.exercises.searchAndFilter({
        query: "kabel",
        muscleGroup: "rug",
        equipment: "kabel",
        measurementType: "gewicht_herhalingen",
      });

      expect(combined.length).toBeGreaterThan(0);
      combined.forEach((ex) => {
        expect(ex.equipment).toBe("kabel");
        expect(ex.measurementType).toBe("gewicht_herhalingen");
      });
    });
  });

  describe("4. Eigen Oefeningen Aanmaken, Bewerken en Persistentie", () => {
    it("slaat een eigen aangepaste oefening op en behoudt deze na heropenen van de database", async () => {
      const customId = crypto.randomUUID();
      const customExercise: Exercise = {
        id: customId,
        name: "Deficit Trap Bar Deadlift",
        alternativeNames: ["Hex Bar Deadlift", "Trap Bar"],
        category: "kracht",
        primaryMuscleGroup: "benen",
        secondaryMuscleGroups: ["rug", "core"],
        equipment: "barbell",
        measurementType: "gewicht_herhalingen",
        isCustom: true,
        isArchived: false,
        instructions: "Sta op een verhoging van 5 cm binnen de trap bar voor extra bewegingsuitslag.",
        videoUrl: "https://example.com/trap-bar-technique",
        provenance: { source: "user", isDemo: false },
        createdAt: new Date().toISOString(),
      };

      await repos.exercises.save(customExercise);

      // Sluit en heropen database (simuleert page reload)
      db.close();
      const reloadedDb = new SportKompasDatabase(dbName);
      const reloadedRepos = createRepositories(reloadedDb);
      await reloadedDb.open();

      const retrieved = await reloadedRepos.exercises.getById(customId);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.name).toBe("Deficit Trap Bar Deadlift");
      expect(retrieved?.alternativeNames).toContain("Hex Bar Deadlift");
      expect(retrieved?.isCustom).toBe(true);
      expect(retrieved?.videoUrl).toBe("https://example.com/trap-bar-technique");

      // Bewerken van de oefening
      const updatedExercise: Exercise = {
        ...retrieved!,
        name: "Deficit Trap Bar Deadlift (Verhoogd)",
        instructions: "Aangepaste instructie: focus op maximale heupstrekking.",
      };
      await reloadedRepos.exercises.save(updatedExercise);

      const afterEdit = await reloadedRepos.exercises.getById(customId);
      expect(afterEdit?.name).toBe("Deficit Trap Bar Deadlift (Verhoogd)");
      expect(afterEdit?.instructions).toBe("Aangepaste instructie: focus op maximale heupstrekking.");
      expect(afterEdit?.updatedAt).toBeDefined();

      reloadedDb.close();
    });
  });

  describe("5. Veilig Archiveren & Historie Behoud", () => {
    beforeEach(async () => {
      await repos.exercises.ensureDefaultExercises();
    });

    it("archiveert een oefening veilig zonder de referentie te wissen", async () => {
      // Pak een willekeurige oefening (bijv. Bankdrukken)
      const benchPress = await repos.exercises.getById("e4a77e80-8b1b-4b10-9fc6-2b4a3901e001");
      expect(benchPress).not.toBeNull();
      expect(benchPress?.isArchived).toBe(false);

      // Archiveer
      const archived = await repos.exercises.archiveExercise("e4a77e80-8b1b-4b10-9fc6-2b4a3901e001");
      expect(archived.isArchived).toBe(true);
      expect(archived.updatedAt).toBeDefined();

      // getAll() sluit standaard gearchiveerde items uit
      const activeList = await repos.exercises.getAll(false);
      expect(activeList.some((ex) => ex.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001")).toBe(false);

      // searchAndFilter sluit standaard gearchiveerde items uit
      const searchRes = await repos.exercises.searchAndFilter({ query: "Bankdrukken" });
      expect(searchRes.some((ex) => ex.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001")).toBe(false);

      // Maar getById kan de oefening nog steeds 100% ophalen (cruciaal voor historische workouts!)
      const stillAccessible = await repos.exercises.getById("e4a77e80-8b1b-4b10-9fc6-2b4a3901e001");
      expect(stillAccessible).not.toBeNull();
      expect(stillAccessible?.isArchived).toBe(true);

      // Met includeArchived: true verschijnt hij weer in zoekresultaten
      const withArchived = await repos.exercises.searchAndFilter({
        query: "Bankdrukken",
        includeArchived: true,
      });
      expect(withArchived.some((ex) => ex.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001")).toBe(true);

      // Dearchiveer weer
      const unarchived = await repos.exercises.unarchiveExercise("e4a77e80-8b1b-4b10-9fc6-2b4a3901e001");
      expect(unarchived.isArchived).toBe(false);

      const restoredList = await repos.exercises.getAll(false);
      expect(restoredList.some((ex) => ex.id === "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001")).toBe(true);
    });
  });

  describe("6. Validatie en Foutafhandeling", () => {
    it("weigert opslaan van een oefening met lege naam of ongeldige velden", async () => {
      const invalidExercise: any = {
        id: crypto.randomUUID(),
        name: "", // Ongeldig: leeg
        category: "kracht",
        primaryMuscleGroup: "borst",
        secondaryMuscleGroups: [],
        equipment: "barbell",
        measurementType: "gewicht_herhalingen",
        isCustom: true,
        instructions: "Test",
        provenance: { source: "user" },
        createdAt: new Date().toISOString(),
      };

      await expect(repos.exercises.save(invalidExercise)).rejects.toThrow(ValidationError);
    });

    it("weigert opslaan van een ongeldige URL voor instructievideo", async () => {
      const invalidUrlExercise: any = {
        id: crypto.randomUUID(),
        name: "Test Oefening",
        category: "kracht",
        primaryMuscleGroup: "borst",
        secondaryMuscleGroups: [],
        equipment: "barbell",
        measurementType: "gewicht_herhalingen",
        isCustom: true,
        instructions: "Test",
        videoUrl: "dit-is-geen-url", // Ongeldig
        provenance: { source: "user" },
        createdAt: new Date().toISOString(),
      };

      await expect(repos.exercises.save(invalidUrlExercise)).rejects.toThrow(ValidationError);
    });
  });
});
