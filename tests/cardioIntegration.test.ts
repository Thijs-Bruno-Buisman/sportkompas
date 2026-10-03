import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import { ValidationError } from "@/lib/db/errors";
import type { CardioSession, CardioActivityType } from "@/types/database";

describe("Cardio Integration & Database Layer", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestCardioDB";

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
  });

  it("slaagt in opslaan en ophalen van een cardiosessie met canonieke eenheden (meters & seconden)", async () => {
    const session: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-03",
      startTime: "2026-10-03T10:00:00.000Z",
      endTime: "2026-10-03T10:30:00.000Z",
      activityType: "hardlopen",
      distanceMeters: 5200, // 5.2 km
      durationSeconds: 1800, // 30 min
      avgHeartRateBpm: 152,
      maxHeartRateBpm: 174,
      estimatedCaloriesBurned: 430,
      elevationGainMeters: 35,
      cadenceRpm: 168,
      rpe: 8,
      notes: "Snelle duurloop in het park",
      status: "afgerond",
      provenance: { source: "user", isDemo: false },
    };

    const saved = await repos.cardio.save(session);
    expect(saved.id).toBe(session.id);
    expect(saved.distanceMeters).toBe(5200);
    expect(saved.durationSeconds).toBe(1800);
    expect(saved.cadenceRpm).toBe(168);

    const fromDb = await repos.cardio.getById(session.id);
    expect(fromDb).not.toBeNull();
    expect(fromDb?.activityType).toBe("hardlopen");
    expect(fromDb?.avgHeartRateBpm).toBe(152);
    expect(fromDb?.notes).toBe("Snelle duurloop in het park");
  });

  it("weigert ongeldige gegevens via Zod runtime validatie", async () => {
    const invalidSession = {
      id: crypto.randomUUID(),
      calendarDate: "ongeldige-datum",
      startTime: "geen-iso",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: -500, // Negatief niet toegestaan
      durationSeconds: 0, // Minimaal 1 seconde vereist
      avgHeartRateBpm: 300, // Max 250 bpm
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: null,
      elevationGainMeters: null,
      rpe: 15, // Max 10
      notes: "",
      provenance: { source: "user" as const },
    };

    await expect(
      repos.cardio.save(invalidSession as unknown as CardioSession)
    ).rejects.toThrow(ValidationError);
  });

  it("ondersteunt alle 7 gedefinieerde sporttypen", async () => {
    const sports: CardioActivityType[] = [
      "hardlopen",
      "fietsen",
      "roeien",
      "wandelen",
      "zwemmen",
      "crosstrainer",
      "overig",
    ];

    for (const sport of sports) {
      const s: CardioSession = {
        id: crypto.randomUUID(),
        calendarDate: "2026-10-02",
        startTime: new Date().toISOString(),
        endTime: null,
        activityType: sport,
        distanceMeters: 2000,
        durationSeconds: 900,
        avgHeartRateBpm: 130,
        maxHeartRateBpm: null,
        estimatedCaloriesBurned: 150,
        elevationGainMeters: null,
        rpe: 6,
        notes: `Test voor ${sport}`,
        status: "afgerond",
        provenance: { source: "user" },
      };
      await repos.cardio.save(s);
    }

    const all = await repos.cardio.getAll();
    expect(all).toHaveLength(7);

    const swimSessions = await repos.cardio.getSessionsByActivity("zwemmen");
    expect(swimSessions).toHaveLength(1);
    expect(swimSessions[0].activityType).toBe("zwemmen");
  });

  it("sorteert sessies met de meest recente datum en tijd bovenaan", async () => {
    const s1: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
      startTime: "2026-10-01T08:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 5000,
      durationSeconds: 1500,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 400,
      elevationGainMeters: null,
      rpe: null,
      notes: "Oudere sessie",
      status: "afgerond",
      provenance: { source: "user" },
    };

    const s2: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-03",
      startTime: "2026-10-03T18:00:00.000Z",
      endTime: null,
      activityType: "fietsen",
      distanceMeters: 20000,
      durationSeconds: 3000,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 600,
      elevationGainMeters: null,
      rpe: null,
      notes: "Nieuwste sessie",
      status: "afgerond",
      provenance: { source: "user" },
    };

    await repos.cardio.save(s1);
    await repos.cardio.save(s2);

    const sorted = await repos.cardio.getAllSessionsSorted();
    expect(sorted).toHaveLength(2);
    expect(sorted[0].id).toBe(s2.id); // Nieuwste bovenaan
    expect(sorted[1].id).toBe(s1.id);
  });

  it("berekent samenvattende statistieken en totalen correct en sluit geannuleerde sessies uit", async () => {
    const sRun: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-01",
      startTime: "2026-10-01T09:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 10000, // 10 km
      durationSeconds: 3000, // 50 min
      avgHeartRateBpm: 155,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 700,
      elevationGainMeters: null,
      rpe: 7,
      notes: "",
      status: "afgerond",
      provenance: { source: "user" },
    };

    const sBike: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T10:00:00.000Z",
      endTime: null,
      activityType: "fietsen",
      distanceMeters: 30000, // 30 km
      durationSeconds: 4500, // 75 min
      avgHeartRateBpm: 140,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 850,
      elevationGainMeters: null,
      rpe: 6,
      notes: "",
      status: "afgerond",
      provenance: { source: "user" },
    };

    const sCancelled: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-03",
      startTime: "2026-10-03T11:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 1000,
      durationSeconds: 300,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 70,
      elevationGainMeters: null,
      rpe: null,
      notes: "Afgebroken",
      status: "geannuleerd",
      provenance: { source: "user" },
    };

    await repos.cardio.save(sRun);
    await repos.cardio.save(sBike);
    await repos.cardio.save(sCancelled);

    const stats = await repos.cardio.getSummaryStats();
    expect(stats.totalSessions).toBe(2); // Alleen sRun en sBike
    expect(stats.totalDistanceMeters).toBe(40000);
    expect(stats.totalDurationSeconds).toBe(7500);
    expect(stats.totalCalories).toBe(1550);

    expect(stats.byActivity.hardlopen.count).toBe(1);
    expect(stats.byActivity.hardlopen.distanceMeters).toBe(10000);

    expect(stats.byActivity.fietsen.count).toBe(1);
    expect(stats.byActivity.fietsen.distanceMeters).toBe(30000);
  });

  it("ondersteunt bijwerken (update) en verwijderen (delete) van sessies", async () => {
    const session: CardioSession = {
      id: crypto.randomUUID(),
      calendarDate: "2026-10-03",
      startTime: new Date().toISOString(),
      endTime: null,
      activityType: "wandelen",
      distanceMeters: 4000,
      durationSeconds: 3000,
      avgHeartRateBpm: 105,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 220,
      elevationGainMeters: null,
      rpe: 4,
      notes: "Oorspronkelijke notitie",
      status: "afgerond",
      provenance: { source: "user" },
    };

    await repos.cardio.save(session);

    // Update
    const updated: CardioSession = {
      ...session,
      distanceMeters: 4500,
      notes: "Aangepaste notitie na GPS-correctie",
    };
    await repos.cardio.save(updated);

    const fromDb = await repos.cardio.getById(session.id);
    expect(fromDb?.distanceMeters).toBe(4500);
    expect(fromDb?.notes).toBe("Aangepaste notitie na GPS-correctie");

    // Delete
    await repos.cardio.delete(session.id);
    const afterDelete = await repos.cardio.getById(session.id);
    expect(afterDelete).toBeNull();
  });
});
