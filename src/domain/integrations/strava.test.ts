import { describe, it, expect } from "vitest";
import {
  mapStravaSportTypeToCardio,
  convertStravaActivityToCardioSession,
  isStravaActivityAlreadyImported,
  filterNewStravaActivities,
  buildStravaAuthorizeUrl,
  getMockStravaAthlete,
  getMockStravaActivities,
  type StravaActivity,
} from "./strava";
import type { CardioSession } from "@/types/database";

describe("Strava Domain Integratie", () => {
  describe("mapStravaSportTypeToCardio", () => {
    it("mapt hardloopactiviteiten correct", () => {
      expect(mapStravaSportTypeToCardio("Run")).toBe("hardlopen");
      expect(mapStravaSportTypeToCardio("TrailRun")).toBe("hardlopen");
      expect(mapStravaSportTypeToCardio("VirtualRun")).toBe("hardlopen");
    });

    it("mapt fietsactiviteiten correct", () => {
      expect(mapStravaSportTypeToCardio("Ride")).toBe("fietsen");
      expect(mapStravaSportTypeToCardio("GravelRide")).toBe("fietsen");
      expect(mapStravaSportTypeToCardio("MountainBikeRide")).toBe("fietsen");
      expect(mapStravaSportTypeToCardio("EBikeRide")).toBe("fietsen");
      expect(mapStravaSportTypeToCardio("VirtualRide")).toBe("fietsen");
    });

    it("mapt wandelen, zwemmen, roeien en crosstrainer", () => {
      expect(mapStravaSportTypeToCardio("Walk")).toBe("wandelen");
      expect(mapStravaSportTypeToCardio("Hike")).toBe("wandelen");
      expect(mapStravaSportTypeToCardio("Swim")).toBe("zwemmen");
      expect(mapStravaSportTypeToCardio("Rowing")).toBe("roeien");
      expect(mapStravaSportTypeToCardio("Elliptical")).toBe("crosstrainer");
    });

    it("valt terug op overig voor onbekende types", () => {
      expect(mapStravaSportTypeToCardio("Yoga")).toBe("overig");
      expect(mapStravaSportTypeToCardio("WeightTraining")).toBe("overig");
      expect(mapStravaSportTypeToCardio(undefined, undefined)).toBe("overig");
    });
  });

  describe("convertStravaActivityToCardioSession", () => {
    it("converteert een Strava activiteit naar een volwaardige CardioSession", () => {
      const mockAct: StravaActivity = {
        id: 12345678,
        name: "Middagloop langs de Vecht",
        distance: 10450.6,
        moving_time: 3240, // 54 min
        elapsed_time: 3300,
        total_elevation_gain: 24,
        type: "Run",
        sport_type: "Run",
        start_date: "2026-10-04T13:30:00Z",
        start_date_local: "2026-10-04T15:30:00Z",
        average_heartrate: 154.2,
        max_heartrate: 172,
        calories: 680,
        average_cadence: 166,
      };

      const session = convertStravaActivityToCardioSession(mockAct, 75);

      expect(session.id).toBeDefined();
      expect(session.calendarDate).toBe("2026-10-04");
      expect(session.activityType).toBe("hardlopen");
      expect(session.distanceMeters).toBe(10451);
      expect(session.durationSeconds).toBe(3240);
      expect(session.avgHeartRateBpm).toBe(154);
      expect(session.maxHeartRateBpm).toBe(172);
      expect(session.elevationGainMeters).toBe(24);
      expect(session.estimatedCaloriesBurned).toBe(680);
      expect(session.cadenceRpm).toBe(166);
      expect(session.status).toBe("afgerond");
      expect(session.notes).toBe("Middagloop langs de Vecht (Strava #12345678)");
      expect(session.provenance.source).toBe("strava");
      expect(session.provenance.isDemo).toBe(false);
    });

    it("berekent MET-calorieën als Strava geen calorieën doorgeeft", () => {
      const mockAct: StravaActivity = {
        id: 887766,
        name: "Ritje naar kantoor",
        distance: 15000,
        moving_time: 2400, // 40 min = 0.667 uur
        elapsed_time: 2500,
        total_elevation_gain: 10,
        type: "Ride",
        start_date: "2026-10-04T08:00:00Z",
        start_date_local: "2026-10-04T08:00:00Z",
        calories: null,
      };

      const session = convertStravaActivityToCardioSession(mockAct, 80);
      expect(session.estimatedCaloriesBurned).toBeGreaterThan(200);
      expect(session.activityType).toBe("fietsen");
    });
  });

  describe("Deduplicatie & filterNewStravaActivities", () => {
    it("herkent activiteit met expliciete Strava ID in notities als duplicaat", () => {
      const act: StravaActivity = {
        id: 999111,
        name: "Test Run",
        distance: 5000,
        moving_time: 1500,
        elapsed_time: 1550,
        total_elevation_gain: 0,
        type: "Run",
        start_date: "2026-10-04T10:00:00Z",
        start_date_local: "2026-10-04T10:00:00Z",
      };

      const existingSessions: CardioSession[] = [
        {
          id: "session-1",
          calendarDate: "2026-10-04",
          startTime: "2026-10-04T10:00:00.000Z",
          endTime: "2026-10-04T10:25:00.000Z",
          activityType: "hardlopen",
          distanceMeters: 5000,
          durationSeconds: 1500,
          avgHeartRateBpm: 150,
          maxHeartRateBpm: 165,
          estimatedCaloriesBurned: 350,
          elevationGainMeters: 0,
          rpe: null,
          notes: "Oude training (Strava #999111)",
          status: "afgerond",
          provenance: { source: "strava", isDemo: false },
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(isStravaActivityAlreadyImported(act, existingSessions)).toBe(true);
    });

    it("herkent activiteit met gelijke datum, type, afstand en duur als duplicaat", () => {
      const act: StravaActivity = {
        id: 555666,
        name: "Handmatig gelogde rit",
        distance: 20000,
        moving_time: 3600,
        elapsed_time: 3600,
        total_elevation_gain: 50,
        type: "Ride",
        start_date: "2026-10-03T14:00:00Z",
        start_date_local: "2026-10-03T14:00:00Z",
      };

      const existingSessions: CardioSession[] = [
        {
          id: "session-manual",
          calendarDate: "2026-10-03",
          startTime: "2026-10-03T14:00:00.000Z",
          endTime: null,
          activityType: "fietsen",
          distanceMeters: 20010, // ~10m verschil
          durationSeconds: 3610, // ~10s verschil
          avgHeartRateBpm: null,
          maxHeartRateBpm: null,
          estimatedCaloriesBurned: 500,
          elevationGainMeters: null,
          rpe: 6,
          notes: "Mooie zondagsrit",
          status: "afgerond",
          provenance: { source: "user", isDemo: false },
          updatedAt: new Date().toISOString(),
        },
      ];

      expect(isStravaActivityAlreadyImported(act, existingSessions)).toBe(true);
    });

    it("filtert correct nieuwe activiteiten vs duplicaten", () => {
      const activities = getMockStravaActivities();
      const existing: CardioSession[] = [
        {
          id: "existing-1",
          calendarDate: activities[0].start_date_local.slice(0, 10),
          startTime: new Date().toISOString(),
          endTime: null,
          activityType: "hardlopen",
          distanceMeters: activities[0].distance,
          durationSeconds: activities[0].moving_time,
          avgHeartRateBpm: null,
          maxHeartRateBpm: null,
          estimatedCaloriesBurned: null,
          elevationGainMeters: null,
          rpe: null,
          notes: `Eerder geïmporteerd (Strava #${activities[0].id})`,
          status: "afgerond",
          provenance: { source: "strava", isDemo: false },
        },
      ];

      const { newActivities, duplicateActivities } = filterNewStravaActivities(
        activities,
        existing
      );

      expect(newActivities.length).toBe(activities.length - 1);
      expect(duplicateActivities.length).toBe(1);
      expect(duplicateActivities[0].id).toBe(activities[0].id);
    });
  });

  describe("buildStravaAuthorizeUrl", () => {
    it("genereert een geldige autorisatie-URL met parameters", () => {
      const url = buildStravaAuthorizeUrl(
        "12345",
        "http://localhost:3000/profiel",
        "csrf-state-token"
      );

      expect(url).toContain("https://www.strava.com/oauth/authorize");
      expect(url).toContain("client_id=12345");
      expect(url).toContain("response_type=code");
      expect(url).toContain("scope=read%2Cactivity%3Aread_all");
      expect(url).toContain("state=csrf-state-token");
    });
  });

  describe("Mock Data Helpers", () => {
    it("levert valide mock atleet en mock activiteiten conform Rule 8", () => {
      const athlete = getMockStravaAthlete();
      expect(athlete.id).toBeGreaterThan(0);
      expect(athlete.firstname).toBe("Alex");

      const acts = getMockStravaActivities();
      expect(acts.length).toBeGreaterThanOrEqual(3);
      acts.forEach((a) => {
        expect(a.id).toBeGreaterThan(0);
        expect(a.distance).toBeGreaterThan(0);
        expect(a.moving_time).toBeGreaterThan(0);
      });
    });
  });
});
