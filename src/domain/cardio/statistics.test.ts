import { describe, it, expect } from "vitest";
import type { CardioSession } from "@/types/database";
import {
  filterSessionsByPeriod,
  groupSessionsByBucket,
  calculatePaceTrend,
  calculateHeartRateDistribution,
} from "./statistics";

describe("Cardio Statistics Domain", () => {
  const dummySessions: CardioSession[] = [
    {
      id: "s1",
      calendarDate: "2026-10-01",
      startTime: "2026-10-01T08:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 5000,
      durationSeconds: 1500, // 5:00 /km, 12 km/h
      avgHeartRateBpm: 150,
      maxHeartRateBpm: 170,
      estimatedCaloriesBurned: 400,
      elevationGainMeters: null,
      rpe: 7,
      notes: "Sessie 1",
      status: "afgerond",
      provenance: { source: "user" },
    },
    {
      id: "s2",
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T08:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 6000,
      durationSeconds: 1680, // 4:40 /km (faster)
      avgHeartRateBpm: 165,
      maxHeartRateBpm: 180,
      estimatedCaloriesBurned: 500,
      elevationGainMeters: null,
      rpe: 8,
      notes: "Sessie 2",
      status: "afgerond",
      provenance: { source: "user" },
    },
    {
      id: "s3",
      calendarDate: "2026-10-03",
      startTime: "2026-10-03T10:00:00.000Z",
      endTime: null,
      activityType: "fietsen",
      distanceMeters: 25000,
      durationSeconds: 3600, // 25 km/u
      avgHeartRateBpm: 135,
      maxHeartRateBpm: 150,
      estimatedCaloriesBurned: 650,
      elevationGainMeters: null,
      rpe: 6,
      notes: "Sessie 3",
      status: "afgerond",
      provenance: { source: "user" },
    },
    {
      id: "s-cancelled",
      calendarDate: "2026-10-02",
      startTime: "2026-10-02T12:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 1000,
      durationSeconds: 300,
      avgHeartRateBpm: null,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 70,
      elevationGainMeters: null,
      rpe: null,
      notes: "Geannuleerd",
      status: "geannuleerd",
      provenance: { source: "user" },
    },
    {
      id: "s-old",
      calendarDate: "2026-08-01",
      startTime: "2026-08-01T08:00:00.000Z",
      endTime: null,
      activityType: "hardlopen",
      distanceMeters: 10000,
      durationSeconds: 3200,
      avgHeartRateBpm: 155,
      maxHeartRateBpm: null,
      estimatedCaloriesBurned: 800,
      elevationGainMeters: null,
      rpe: 8,
      notes: "Oude sessie",
      status: "afgerond",
      provenance: { source: "user" },
    },
  ];

  describe("filterSessionsByPeriod", () => {
    it("filters to 7 days and excludes cancelled sessions", () => {
      const filtered = filterSessionsByPeriod(dummySessions, "7d", "2026-10-03");
      expect(filtered).toHaveLength(3); // s1, s2, s3 (s-old is 2 months ago, s-cancelled is cancelled)
      expect(filtered.find((s) => s.id === "s-cancelled")).toBeUndefined();
      expect(filtered.find((s) => s.id === "s-old")).toBeUndefined();
    });

    it("includes older sessions when period is 'alles' or '1j'", () => {
      const all = filterSessionsByPeriod(dummySessions, "alles", "2026-10-03");
      expect(all).toHaveLength(4); // s1, s2, s3, s-old
      expect(all.find((s) => s.id === "s-old")).toBeDefined();
    });
  });

  describe("groupSessionsByBucket", () => {
    it("groups sessions by day for 7d period and aggregates metrics", () => {
      const recent = filterSessionsByPeriod(dummySessions, "7d", "2026-10-03");
      const buckets = groupSessionsByBucket(recent, "7d");

      expect(buckets).toHaveLength(3); // 2026-10-01, 2026-10-02, 2026-10-03
      expect(buckets[0].totalDistanceMeters).toBe(5000);
      expect(buckets[1].totalDistanceMeters).toBe(6000);
      expect(buckets[2].totalDistanceMeters).toBe(25000);
      expect(buckets[2].bySport.fietsen.count).toBe(1);
    });
  });

  describe("calculatePaceTrend", () => {
    it("extracts pace progression points for running", () => {
      const trend = calculatePaceTrend(dummySessions, "hardlopen");
      expect(trend).toHaveLength(3); // s-old, s1, s2 in chronological order

      expect(trend[0].calendarDate).toBe("2026-08-01");
      expect(trend[1].calendarDate).toBe("2026-10-01");
      expect(trend[1].formattedMetric).toBe("5:00 /km");
      expect(trend[2].calendarDate).toBe("2026-10-02");
      expect(trend[2].formattedMetric).toBe("4:40 /km");
      expect(trend[2].speedKmH).toBeGreaterThan(trend[1].speedKmH); // speed increased
    });

    it("uses speed (km/h) as primary metric for cycling", () => {
      const trend = calculatePaceTrend(dummySessions, "fietsen");
      expect(trend).toHaveLength(1);
      expect(trend[0].formattedMetric).toBe("25.0 km/u");
      expect(trend[0].speedKmH).toBe(25.0);
    });
  });

  describe("calculateHeartRateDistribution", () => {
    it("distributes heart rate into zones 1 to 5", () => {
      const result = calculateHeartRateDistribution(dummySessions, 30);

      expect(result.totalWithHeartRate).toBe(4);
      expect(result.distribution).toHaveLength(5);

      const z3 = result.distribution.find((z) => z.zone === 3);
      const z4 = result.distribution.find((z) => z.zone === 4);

      expect(z3?.count).toBe(1); // s3
      expect(z4?.count).toBe(3); // s1, s2, s-old
      expect(z4?.percentage).toBe(75); // 3 of 4 = 75%
    });
  });
});

