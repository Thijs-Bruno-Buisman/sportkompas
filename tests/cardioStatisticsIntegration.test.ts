import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import type { CardioSession } from "@/types/database";
import {
  filterSessionsByPeriod,
  groupSessionsByBucket,
  calculatePaceTrend,
  calculateHeartRateDistribution,
} from "@/domain/cardio/statistics";

describe("Cardio Statistics Integration Tests", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestCardioStatsDB";

  beforeEach(async () => {
    await Dexie.delete(testDbName);
    db = new SportKompasDatabase(testDbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    await db.close();
    await Dexie.delete(testDbName);
  });

  it("persists sessions in Dexie and calculates accurate period filters, buckets, and pace trends", async () => {
    const today = new Date().toISOString().split("T")[0];
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString().split("T")[0];
    const fortyDaysAgo = new Date(Date.now() - 40 * 24 * 3600 * 1000).toISOString().split("T")[0];

    const idTodayRun = "11111111-1111-4111-8111-111111111111";
    const id5dRun = "22222222-2222-4222-8222-222222222222";
    const id20dBike = "33333333-3333-4333-8333-333333333333";
    const id40dRun = "44444444-4444-4444-8444-444444444444";
    const idCancelled = "55555555-5555-4555-8555-555555555555";

    const testSessions: CardioSession[] = [
      {
        id: idTodayRun,
        calendarDate: today,
        startTime: `${today}T08:00:00.000Z`,
        endTime: `${today}T08:30:00.000Z`,
        activityType: "hardlopen",
        distanceMeters: 5000,
        durationSeconds: 1500, // 5:00 min/km, 12 km/h
        avgHeartRateBpm: 155, // Zone 4
        maxHeartRateBpm: 172,
        estimatedCaloriesBurned: 380,
        elevationGainMeters: 25,
        rpe: 7,
        notes: "Lekker ochtendrondje",
        status: "afgerond",
        provenance: { source: "user" },
      },
      {
        id: id5dRun,
        calendarDate: fiveDaysAgo,
        startTime: `${fiveDaysAgo}T09:00:00.000Z`,
        endTime: `${fiveDaysAgo}T09:35:00.000Z`,
        activityType: "hardlopen",
        distanceMeters: 6000,
        durationSeconds: 1680, // 4:40 min/km (sneller)
        avgHeartRateBpm: 162, // Zone 4
        maxHeartRateBpm: 178,
        estimatedCaloriesBurned: 460,
        elevationGainMeters: 10,
        rpe: 8,
        notes: "Intervals",
        status: "afgerond",
        provenance: { source: "user" },
      },
      {
        id: id20dBike,
        calendarDate: twentyDaysAgo,
        startTime: `${twentyDaysAgo}T14:00:00.000Z`,
        endTime: `${twentyDaysAgo}T15:00:00.000Z`,
        activityType: "fietsen",
        distanceMeters: 26000,
        durationSeconds: 3600, // 26.0 km/u
        avgHeartRateBpm: 135, // Zone 2 / 3
        maxHeartRateBpm: 150,
        estimatedCaloriesBurned: 620,
        elevationGainMeters: 80,
        rpe: 6,
        notes: "Duurrit",
        status: "afgerond",
        provenance: { source: "user" },
      },
      {
        id: id40dRun,
        calendarDate: fortyDaysAgo,
        startTime: `${fortyDaysAgo}T10:00:00.000Z`,
        endTime: `${fortyDaysAgo}T11:00:00.000Z`,
        activityType: "hardlopen",
        distanceMeters: 10000,
        durationSeconds: 3300, // 5:30 min/km
        avgHeartRateBpm: 148,
        maxHeartRateBpm: 165,
        estimatedCaloriesBurned: 750,
        elevationGainMeters: 40,
        rpe: 7,
        notes: "Lange duurloop vorige maand",
        status: "afgerond",
        provenance: { source: "user" },
      },
      {
        id: idCancelled,
        calendarDate: today,
        startTime: `${today}T12:00:00.000Z`,
        endTime: null,
        activityType: "hardlopen",
        distanceMeters: 1200,
        durationSeconds: 400,
        avgHeartRateBpm: 130,
        maxHeartRateBpm: null,
        estimatedCaloriesBurned: 90,
        elevationGainMeters: null,
        rpe: null,
        notes: "Afgebroken wegens regen",
        status: "geannuleerd",
        provenance: { source: "user" },
      },
    ];

    // Save all to Dexie repository
    for (const session of testSessions) {
      await repos.cardio.save(session);
    }

    // Retrieve sorted sessions from Dexie
    const storedSessions = await repos.cardio.getAllSessionsSorted();
    expect(storedSessions).toHaveLength(5);

    // 1. Test Periode filtering
    const sessions7d = filterSessionsByPeriod(storedSessions, "7d", today);
    expect(sessions7d).toHaveLength(2); // idTodayRun and id5dRun (idCancelled excluded, others >7d)
    expect(sessions7d.map((s) => s.id)).toEqual(
      expect.arrayContaining([idTodayRun, id5dRun])
    );

    const sessions30d = filterSessionsByPeriod(storedSessions, "30d", today);
    expect(sessions30d).toHaveLength(3); // idTodayRun, id5dRun, id20dBike
    expect(sessions30d.find((s) => s.id === id40dRun)).toBeUndefined();

    const sessionsAll = filterSessionsByPeriod(storedSessions, "alles", today);
    expect(sessionsAll).toHaveLength(4); // All 4 completed sessions (excluding cancelled)

    // 2. Test Aggregatie in Buckets
    const buckets7d = groupSessionsByBucket(sessions7d, "7d");
    expect(buckets7d.length).toBeGreaterThanOrEqual(2);
    const totalDist7d = buckets7d.reduce((sum, b) => sum + b.totalDistanceMeters, 0);
    expect(totalDist7d).toBe(11000); // 5000 + 6000

    const buckets30d = groupSessionsByBucket(sessions30d, "30d");
    const totalDist30d = buckets30d.reduce((sum, b) => sum + b.totalDistanceMeters, 0);
    expect(totalDist30d).toBe(37000); // 5000 + 6000 + 26000
    const totalCalories30d = buckets30d.reduce((sum, b) => sum + b.totalCalories, 0);
    expect(totalCalories30d).toBe(380 + 460 + 620);

    // 3. Test Tempo Trends
    const runTrends = calculatePaceTrend(storedSessions, "hardlopen");
    expect(runTrends).toHaveLength(3); // fortyDaysAgo, fiveDaysAgo, today (chronological order)
    expect(runTrends[0].sessionId).toBe(id40dRun);
    expect(runTrends[0].formattedMetric).toBe("5:30 /km");
    expect(runTrends[1].sessionId).toBe(id5dRun);
    expect(runTrends[1].formattedMetric).toBe("4:40 /km");
    expect(runTrends[2].sessionId).toBe(idTodayRun);
    expect(runTrends[2].formattedMetric).toBe("5:00 /km");

    const bikeTrends = calculatePaceTrend(storedSessions, "fietsen");
    expect(bikeTrends).toHaveLength(1);
    expect(bikeTrends[0].formattedMetric).toBe("26.0 km/u");
    expect(bikeTrends[0].speedKmH).toBe(26.0);

    // 4. Test Hartslagzone distributie (Gellish 207 - 0.7 * 30 = 186 max HR)
    const hrDist = calculateHeartRateDistribution(storedSessions, 30);
    expect(hrDist.totalWithHeartRate).toBe(4); // 4 completed sessions with HR
    expect(hrDist.distribution).toHaveLength(5);
    const sumZoneCounts = hrDist.distribution.reduce((acc, z) => acc + z.count, 0);
    expect(sumZoneCounts).toBe(4);
  });
});
