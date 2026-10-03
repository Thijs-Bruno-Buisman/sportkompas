import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { CardioSession } from "@/types/database";
import {
  startLiveTracker,
  getLiveElapsedSeconds,
  pauseLiveTracker,
  resumeLiveTracker,
  addLapSplit,
  updateLiveDistance,
  saveLiveTrackerToStorage,
  loadLiveTrackerFromStorage,
  clearLiveTrackerFromStorage,
} from "@/domain/cardio/liveTracker";

describe("Cardio Live Tracker Integration", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestLiveCardioDB";

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    repos = createRepositories(db);
    await db.open();
    clearLiveTrackerFromStorage();
  });

  afterEach(async () => {
    db.close();
    await Dexie.delete(testDbName);
    clearLiveTrackerFromStorage();
  });

  it("slaat actieve live tracker toestand op en herstelt deze na herlading", () => {
    const t0 = 1700000000000;
    let tracker = startLiveTracker("hardlopen", t0);
    tracker = updateLiveDistance(tracker, 3500);
    tracker = addLapSplit(tracker, t0 + 900 * 1000);

    saveLiveTrackerToStorage(tracker);

    const reloaded = loadLiveTrackerFromStorage();
    expect(reloaded).not.toBeNull();
    expect(reloaded?.id).toBe(tracker.id);
    expect(reloaded?.activityType).toBe("hardlopen");
    expect(reloaded?.distanceMeters).toBe(3500);
    expect(reloaded?.laps).toHaveLength(1);
    expect(reloaded?.laps[0].lapDurationSeconds).toBe(900);
  });

  it("voltooit een live sessie en slaat deze persistent op in IndexedDB", async () => {
    const t0 = 1700000000000;
    let tracker = startLiveTracker("hardlopen", t0);
    tracker = updateLiveDistance(tracker, 5000); // 5 km
    tracker = addLapSplit(tracker, t0 + 1500 * 1000); // 25 min

    const finalDurationSeconds = 1500;
    const completedSession: CardioSession = {
      id: tracker.id,
      calendarDate: "2026-10-03",
      startTime: new Date(t0).toISOString(),
      endTime: new Date(t0 + finalDurationSeconds * 1000).toISOString(),
      activityType: tracker.activityType,
      distanceMeters: tracker.distanceMeters,
      durationSeconds: finalDurationSeconds,
      avgHeartRateBpm: 155,
      maxHeartRateBpm: 172,
      estimatedCaloriesBurned: 410,
      elevationGainMeters: 20,
      cadenceRpm: 170,
      rpe: 8,
      notes: "Goede live duurloop met stabiel tempo",
      status: "afgerond",
      provenance: { source: "user" },
    };

    await repos.cardio.save(completedSession);
    clearLiveTrackerFromStorage();

    // Verifieer opslag in Dexie
    const inDb = await repos.cardio.getById(completedSession.id);
    expect(inDb).not.toBeNull();
    expect(inDb?.status).toBe("afgerond");
    expect(inDb?.distanceMeters).toBe(5000);
    expect(inDb?.durationSeconds).toBe(1500);
    expect(inDb?.cadenceRpm).toBe(170);

    // Verifieer dat storage leeg is na afronden
    expect(loadLiveTrackerFromStorage()).toBeNull();

    // Verifieer dat statistieken direct zijn bijgewerkt
    const stats = await repos.cardio.getSummaryStats();
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalDistanceMeters).toBe(5000);
    expect(stats.totalDurationSeconds).toBe(1500);
    expect(stats.totalCalories).toBe(410);
    expect(stats.byActivity.hardlopen.count).toBe(1);
  });

  it("handelt afbreken en opslaan als geannuleerd correct af zonder statistieken te vervuilen", async () => {
    const t0 = 1700000000000;
    const tracker = startLiveTracker("fietsen", t0);

    const cancelledSession: CardioSession = {
      id: tracker.id,
      calendarDate: "2026-10-03",
      startTime: new Date(t0).toISOString(),
      endTime: new Date(t0 + 600 * 1000).toISOString(),
      activityType: tracker.activityType,
      distanceMeters: 2000,
      durationSeconds: 600,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: null,
      elevationGainMeters: null,
      rpe: null,
      notes: "Sessie geannuleerd wegens regen",
      status: "geannuleerd",
      provenance: { source: "user" },
    };

    await repos.cardio.save(cancelledSession);
    clearLiveTrackerFromStorage();

    // Sessie staat wel in de database voor data-integriteit
    const inDb = await repos.cardio.getById(cancelledSession.id);
    expect(inDb).not.toBeNull();
    expect(inDb?.status).toBe("geannuleerd");

    // Maar telt NIET mee voor totale volume-statistieken
    const stats = await repos.cardio.getSummaryStats();
    expect(stats.totalSessions).toBe(0);
    expect(stats.totalDistanceMeters).toBe(0);
  });
});
