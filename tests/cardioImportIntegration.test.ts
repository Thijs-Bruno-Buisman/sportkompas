import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { SportKompasDatabase } from "@/lib/db/dexie";
import { createRepositories } from "@/lib/db";
import {
  parseCardioFile,
  parseGpxString,
  parseTcxString,
} from "@/domain/cardio/importParser";
import type { CardioSession } from "@/types/database";

describe("Stap 46 / Prompt 40 — GPX & TCX Cardio Bestand Import Integratietest", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const testDbName = "TestCardioImportDB";

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

  const sampleGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Forerunner 265">
  <trk>
    <name>Ochtendronde Amelisweerd</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="52.0700" lon="5.1600">
        <ele>8.0</ele>
        <time>2026-10-04T07:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>138</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="52.0750" lon="5.1600">
        <ele>14.0</ele>
        <time>2026-10-04T07:05:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>152</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="52.0800" lon="5.1600">
        <ele>19.0</ele>
        <time>2026-10-04T07:10:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>164</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

  const sampleTcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>2026-10-02T13:00:00Z</Id>
      <Lap StartTime="2026-10-02T13:00:00Z">
        <TotalTimeSeconds>3600.0</TotalTimeSeconds>
        <DistanceMeters>28500.0</DistanceMeters>
        <Calories>720</Calories>
        <AverageHeartRateBpm>
          <Value>148</Value>
        </AverageHeartRateBpm>
        <MaximumHeartRateBpm>
          <Value>174</Value>
        </MaximumHeartRateBpm>
        <Track>
          <Trackpoint>
            <Time>2026-10-02T13:00:00Z</Time>
            <AltitudeMeters>12.0</AltitudeMeters>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-10-02T13:30:00Z</Time>
            <AltitudeMeters>35.0</AltitudeMeters>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-10-02T14:00:00Z</Time>
            <AltitudeMeters>45.0</AltitudeMeters>
          </Trackpoint>
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

  it("parsed GPX bestand, berekent afstand en slaat sessie persistent op in IndexedDB", async () => {
    const parsed = parseCardioFile(sampleGpx, 75);

    expect(parsed.format).toBe("gpx");
    expect(parsed.activityType).toBe("hardlopen");
    expect(parsed.calendarDate).toBe("2026-10-04");
    expect(parsed.durationSeconds).toBe(600); // 10 min
    expect(parsed.distanceMeters).toBeGreaterThan(1000); // ~1.1 km
    expect(parsed.elevationGainMeters).toBe(11); // (14-8) + (19-14) = 6 + 5 = 11m
    expect(parsed.avgHeartRateBpm).toBe(151); // (138 + 152 + 164) / 3 = 151.3
    expect(parsed.maxHeartRateBpm).toBe(164);
    expect(parsed.estimatedCaloriesBurned).toBeGreaterThan(50);

    // Converteer naar CardioSession en sla op in repository
    const gpxId = crypto.randomUUID();
    const cardioSession: CardioSession = {
      id: gpxId,
      calendarDate: parsed.calendarDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      activityType: parsed.activityType,
      distanceMeters: parsed.distanceMeters,
      durationSeconds: parsed.durationSeconds,
      avgHeartRateBpm: parsed.avgHeartRateBpm,
      maxHeartRateBpm: parsed.maxHeartRateBpm,
      estimatedCaloriesBurned: parsed.estimatedCaloriesBurned,
      elevationGainMeters: parsed.elevationGainMeters,
      rpe: 7,
      notes: parsed.notes,
      status: "afgerond",
      provenance: { source: "user", isDemo: false },
      updatedAt: new Date().toISOString(),
    };

    await repos.cardio.save(cardioSession);

    // Verifieer ophalen uit IndexedDB
    const saved = await repos.cardio.getById(gpxId);
    expect(saved).toBeDefined();
    expect(saved?.activityType).toBe("hardlopen");
    expect(saved?.distanceMeters).toBe(parsed.distanceMeters);
    expect(saved?.avgHeartRateBpm).toBe(151);
  });

  it("parsed TCX bestand met laps en integreert direct in Cardio statistieken", async () => {
    const parsed = parseCardioFile(sampleTcx, 80);

    expect(parsed.format).toBe("tcx");
    expect(parsed.activityType).toBe("fietsen");
    expect(parsed.calendarDate).toBe("2026-10-02");
    expect(parsed.distanceMeters).toBe(28500);
    expect(parsed.durationSeconds).toBe(3600); // 1 uur
    expect(parsed.estimatedCaloriesBurned).toBe(720);
    expect(parsed.avgHeartRateBpm).toBe(148);
    expect(parsed.maxHeartRateBpm).toBe(174);
    expect(parsed.elevationGainMeters).toBe(33); // (35-12) + (45-35) = 23 + 10 = 33m

    const tcxId = crypto.randomUUID();
    const cardioSession: CardioSession = {
      id: tcxId,
      calendarDate: parsed.calendarDate,
      startTime: parsed.startTime,
      endTime: parsed.endTime,
      activityType: parsed.activityType,
      distanceMeters: parsed.distanceMeters,
      durationSeconds: parsed.durationSeconds,
      avgHeartRateBpm: parsed.avgHeartRateBpm,
      maxHeartRateBpm: parsed.maxHeartRateBpm,
      estimatedCaloriesBurned: parsed.estimatedCaloriesBurned,
      elevationGainMeters: parsed.elevationGainMeters,
      rpe: null,
      notes: parsed.notes,
      status: "afgerond",
      provenance: { source: "user", isDemo: false },
      updatedAt: new Date().toISOString(),
    };

    await repos.cardio.save(cardioSession);

    // Verifieer dat summary statistics direct correct worden bijgewerkt
    const stats = await repos.cardio.getSummaryStats();
    expect(stats.totalSessions).toBe(1);
    expect(stats.totalDistanceMeters).toBe(28500);
    expect(stats.totalDurationSeconds).toBe(3600);
    expect(stats.totalCalories).toBe(720);
  });

  it("handhaaft graceful fallback met instructies voor binaire FIT bestanden", () => {
    const binaryFitMock = "\x0e\x10\x46\x49\x54.FIT binary Garmin protocol header";
    expect(() => parseCardioFile(binaryFitMock)).toThrow(
      "FIT-bestanden zijn binair gecomprimeerd"
    );
  });
});
