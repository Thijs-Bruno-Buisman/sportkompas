import { describe, it, expect } from "vitest";
import {
  calculatePace,
  getMetValue,
  calculateCalories,
  calculateHeartRateZones,
  getHeartRateZoneForBpm,
  getActivityMetadata,
} from "./calculations";

describe("Cardio Calculations Domain", () => {
  describe("Pace and Speed calculation", () => {
    it("correctly calculates running pace (min/km) and speed (km/h) for 5km in 25min", () => {
      // 5000m in 1500s = 5:00 /km, 12.0 km/u
      const result = calculatePace(5000, 1500, "hardlopen");
      expect(result.paceSecondsPerKm).toBe(300);
      expect(result.formattedPace).toBe("5:00 /km");
      expect(result.speedKmH).toBe(12.0);
      expect(result.formattedSpeed).toBe("12.0 km/u");
    });

    it("correctly calculates 10km in 54min 30s", () => {
      // 10000m in 3270s = 327s/km = 5:27 /km
      const result = calculatePace(10000, 3270, "hardlopen");
      expect(result.paceSecondsPerKm).toBe(327);
      expect(result.formattedPace).toBe("5:27 /km");
      expect(result.speedKmH).toBe(11.0);
    });

    it("correctly calculates rowing 500m split for 2000m in 8 minutes", () => {
      // 2000m in 480s -> 500m split = 480 * (500 / 2000) = 120s = 2:00 /500m
      const result = calculatePace(2000, 480, "roeien");
      expect(result.split500mSeconds).toBe(120);
      expect(result.formattedSplit500m).toBe("2:00 /500m");
      expect(result.speedKmH).toBe(15.0);
    });

    it("correctly calculates swimming 100m pace for 1500m in 30 minutes", () => {
      // 1500m in 1800s -> 100m pace = 1800 * (100 / 1500) = 120s = 2:00 /100m
      const result = calculatePace(1500, 1800, "zwemmen");
      expect(result.swimPace100mSeconds).toBe(120);
      expect(result.formattedSwimPace100m).toBe("2:00 /100m");
      expect(result.speedKmH).toBe(3.0);
    });

    it("handles zero distance or duration safely without NaN or DivisionByZero", () => {
      const zeroDist = calculatePace(0, 1200, "hardlopen");
      expect(zeroDist.paceSecondsPerKm).toBe(0);
      expect(zeroDist.formattedPace).toBe("--:-- /km");
      expect(zeroDist.speedKmH).toBe(0);

      const zeroDur = calculatePace(5000, 0, "hardlopen");
      expect(zeroDur.paceSecondsPerKm).toBe(0);
      expect(zeroDur.formattedPace).toBe("--:-- /km");
      expect(zeroDur.speedKmH).toBe(0);
    });
  });

  describe("MET values and intensity scaling", () => {
    it("returns base MET when speed is not provided", () => {
      expect(getMetValue("hardlopen")).toBe(9.8);
      expect(getMetValue("fietsen")).toBe(7.5);
      expect(getMetValue("wandelen")).toBe(3.8);
      expect(getMetValue("roeien")).toBe(7.0);
      expect(getMetValue("zwemmen")).toBe(7.0);
    });

    it("scales MET according to running speed", () => {
      expect(getMetValue("hardlopen", 7.5)).toBe(8.0); // slow jog
      expect(getMetValue("hardlopen", 10.0)).toBe(10.5); // 10 km/h
      expect(getMetValue("hardlopen", 12.5)).toBe(11.8); // 12.5 km/h
      expect(getMetValue("hardlopen", 15.0)).toBe(14.5); // fast race pace
    });

    it("scales MET according to cycling speed", () => {
      expect(getMetValue("fietsen", 14.0)).toBe(5.8); // city
      expect(getMetValue("fietsen", 18.0)).toBe(6.8); // leisure
      expect(getMetValue("fietsen", 24.0)).toBe(8.5); // brisk
      expect(getMetValue("fietsen", 28.0)).toBe(10.5); // road bike fast
      expect(getMetValue("fietsen", 32.0)).toBe(12.0); // racing
    });
  });

  describe("Calorie calculation via MET formula", () => {
    it("calculates calories using user body weight", () => {
      // 30 min (0.5 hour) running at 10 km/h (MET 10.5) for an 80kg runner:
      // Cal = 10.5 * 80 * 0.5 = 420 kcal
      const result = calculateCalories({
        activityType: "hardlopen",
        durationSeconds: 1800,
        distanceMeters: 5000,
        userWeightKg: 80,
      });

      expect(result.calories).toBe(420);
      expect(result.met).toBe(10.5);
      expect(result.usedWeightKg).toBe(80);
      expect(result.isDefaultWeight).toBe(false);
    });

    it("falls back to standard 75kg when weight is missing or invalid", () => {
      const result = calculateCalories({
        activityType: "wandelen",
        durationSeconds: 3600, // 1 hour
        distanceMeters: 5000, // 5 km/h -> MET 3.8
        userWeightKg: null,
      });

      // 3.8 * 75 * 1 = 285 kcal
      expect(result.calories).toBe(285);
      expect(result.usedWeightKg).toBe(75);
      expect(result.isDefaultWeight).toBe(true);
    });

    it("handles zero duration gracefully", () => {
      const result = calculateCalories({
        activityType: "fietsen",
        durationSeconds: 0,
        userWeightKg: 70,
      });
      expect(result.calories).toBe(0);
    });
  });

  describe("Heart rate zones calculation", () => {
    it("calculates zones using Gellish formula based on age", () => {
      // Age 30: Gellish max HR = 207 - (0.7 * 30) = 207 - 21 = 186 bpm
      const zones = calculateHeartRateZones({ age: 30 });
      expect(zones).toHaveLength(5);

      // Z1: 50-60% of 186 = 93 - 111 bpm
      expect(zones[0].zone).toBe(1);
      expect(zones[0].minBpm).toBe(93);

      // Z2: 60-70% of 186 = 112 - 129 bpm
      expect(zones[1].zone).toBe(2);
      expect(zones[1].minBpm).toBe(112);

      // Z5: 90-100% of 186 = 167 - 186 bpm
      expect(zones[4].zone).toBe(5);
      expect(zones[4].minBpm).toBe(167);
      expect(zones[4].maxBpm).toBe(186);
    });

    it("uses explicit max heart rate if provided", () => {
      const zones = calculateHeartRateZones({ maxHeartRateBpm: 200, age: 40 });
      expect(zones[4].maxBpm).toBe(200);
      expect(zones[0].minBpm).toBe(100); // 50%
      expect(zones[1].minBpm).toBe(120); // 60%
    });

    it("correctly identifies the heart rate zone for a given bpm", () => {
      const zones = calculateHeartRateZones({ maxHeartRateBpm: 200 });
      // Z1: 100-119, Z2: 120-139, Z3: 140-159, Z4: 160-179, Z5: 180-200
      expect(getHeartRateZoneForBpm(130, zones)?.zone).toBe(2);
      expect(getHeartRateZoneForBpm(155, zones)?.zone).toBe(3);
      expect(getHeartRateZoneForBpm(175, zones)?.zone).toBe(4);
      expect(getHeartRateZoneForBpm(190, zones)?.zone).toBe(5);
      expect(getHeartRateZoneForBpm(80, zones)?.zone).toBe(1); // below Z1 treated as recovery
      expect(getHeartRateZoneForBpm(null, zones)).toBeNull();
    });
  });

  describe("Activity metadata", () => {
    it("returns correct metadata for all supported sports", () => {
      const sports = [
        "hardlopen",
        "fietsen",
        "roeien",
        "wandelen",
        "zwemmen",
        "crosstrainer",
        "overig",
      ] as const;

      for (const sport of sports) {
        const meta = getActivityMetadata(sport);
        expect(meta.id).toBe(sport);
        expect(meta.label).toBeTruthy();
        expect(meta.baseMet).toBeGreaterThan(0);
      }
    });
  });
});
