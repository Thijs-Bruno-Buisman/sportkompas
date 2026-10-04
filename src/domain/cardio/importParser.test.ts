import { describe, it, expect } from "vitest";
import {
  calculateHaversineDistanceMeters,
  mapActivityType,
  parseGpxString,
  parseTcxString,
  parseCardioFile,
} from "./importParser";

describe("Cardio Import Parser Domain Logic", () => {
  describe("calculateHaversineDistanceMeters", () => {
    it("berekent de afstand tussen twee geografische coördinaten accuraat", () => {
      // Twee punten in Utrecht op ~111 meter afstand
      const lat1 = 52.0907;
      const lon1 = 5.1214;
      const lat2 = 52.0917;
      const lon2 = 5.1214;

      const dist = calculateHaversineDistanceMeters(lat1, lon1, lat2, lon2);
      expect(Math.round(dist)).toBe(111);
    });
  });

  describe("mapActivityType", () => {
    it("mapt gangbare sportnamen correct naar SportKompas CardioActivityType", () => {
      expect(mapActivityType("Running")).toBe("hardlopen");
      expect(mapActivityType("Biking")).toBe("fietsen");
      expect(mapActivityType("Cycling")).toBe("fietsen");
      expect(mapActivityType("Walking")).toBe("wandelen");
      expect(mapActivityType("Hiking")).toBe("wandelen");
      expect(mapActivityType("Swimming")).toBe("zwemmen");
      expect(mapActivityType("Rowing")).toBe("roeien");
      expect(mapActivityType("Elliptical")).toBe("crosstrainer");
      expect(mapActivityType("OnbekendeSport")).toBe("hardlopen");
    });
  });

  describe("parseGpxString", () => {
    const validGpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Connect">
  <trk>
    <name>Ochtendrun Utrecht</name>
    <type>running</type>
    <trkseg>
      <trkpt lat="52.0907" lon="5.1214">
        <ele>10.0</ele>
        <time>2026-10-04T08:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>142</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="52.0917" lon="5.1214">
        <ele>15.0</ele>
        <time>2026-10-04T08:00:30Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>150</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
      <trkpt lat="52.0927" lon="5.1214">
        <ele>18.0</ele>
        <time>2026-10-04T08:01:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>158</gpxtpx:hr>
          </gpxtpx:TrackPointExtension>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    it("parsed een geldig GPX bestand met trackpoints, afstand, duur en hartslag", () => {
      const parsed = parseGpxString(validGpx, 75);

      expect(parsed.format).toBe("gpx");
      expect(parsed.activityType).toBe("hardlopen");
      expect(parsed.calendarDate).toBe("2026-10-04");
      expect(parsed.trackpointsCount).toBe(3);
      expect(parsed.durationSeconds).toBe(60);
      // Afstand: 2 intervallen van ~111m = ~222m
      expect(parsed.distanceMeters).toBeGreaterThan(200);
      expect(parsed.distanceMeters).toBeLessThan(250);
      // Hoogtemeters: (15 - 10) + (18 - 15) = 5 + 3 = 8m
      expect(parsed.elevationGainMeters).toBe(8);
      // Hartslag: (142 + 150 + 158) / 3 = 150 gem, 158 max
      expect(parsed.avgHeartRateBpm).toBe(150);
      expect(parsed.maxHeartRateBpm).toBe(158);
      expect(parsed.estimatedCaloriesBurned).toBeGreaterThan(0);
    });

    it("gooit een duidelijke foutmelding bij GPX zonder trackpoints", () => {
      const emptyGpx = `<gpx><trk><name>Lege track</name></trk></gpx>`;
      expect(() => parseGpxString(emptyGpx)).toThrow(
        "bevat geen geldige GPS trackpoints"
      );
    });
  });

  describe("parseTcxString", () => {
    const validTcx = `<?xml version="1.0" encoding="UTF-8"?>
<TrainingCenterDatabase xmlns="http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2">
  <Activities>
    <Activity Sport="Biking">
      <Id>2026-10-03T09:30:00Z</Id>
      <Lap StartTime="2026-10-03T09:30:00Z">
        <TotalTimeSeconds>1800.0</TotalTimeSeconds>
        <DistanceMeters>12500.0</DistanceMeters>
        <Calories>410</Calories>
        <AverageHeartRateBpm>
          <Value>145</Value>
        </AverageHeartRateBpm>
        <MaximumHeartRateBpm>
          <Value>168</Value>
        </MaximumHeartRateBpm>
        <Track>
          <Trackpoint>
            <Time>2026-10-03T09:30:00Z</Time>
            <AltitudeMeters>5.0</AltitudeMeters>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-10-03T09:45:00Z</Time>
            <AltitudeMeters>25.0</AltitudeMeters>
          </Trackpoint>
          <Trackpoint>
            <Time>2026-10-03T10:00:00Z</Time>
            <AltitudeMeters>40.0</AltitudeMeters>
          </Trackpoint>
        </Track>
      </Lap>
    </Activity>
  </Activities>
</TrainingCenterDatabase>`;

    it("parsed een geldig TCX bestand met Laps, afstand, duur, calorieën en hartslag", () => {
      const parsed = parseTcxString(validTcx, 80);

      expect(parsed.format).toBe("tcx");
      expect(parsed.activityType).toBe("fietsen");
      expect(parsed.calendarDate).toBe("2026-10-03");
      expect(parsed.distanceMeters).toBe(12500);
      expect(parsed.durationSeconds).toBe(1800); // 30 min
      expect(parsed.estimatedCaloriesBurned).toBe(410);
      expect(parsed.avgHeartRateBpm).toBe(145);
      expect(parsed.maxHeartRateBpm).toBe(168);
      // Hoogtemeters: (25 - 5) + (40 - 25) = 20 + 15 = 35m
      expect(parsed.elevationGainMeters).toBe(35);
      expect(parsed.trackpointsCount).toBe(3);
    });

    it("gooit een duidelijke foutmelding bij leeg TCX bestand", () => {
      const emptyTcx = `<TrainingCenterDatabase><Activities></Activities></TrainingCenterDatabase>`;
      expect(() => parseTcxString(emptyTcx)).toThrow(
        "bevat geen geldige sessie- of lapgegevens"
      );
    });
  });

  describe("parseCardioFile dispatcher", () => {
    it("herkent automatisch GPX formaat", () => {
      const gpx = `<gpx><trk><type>running</type><trkseg><trkpt lat="52.0" lon="5.0"><time>2026-10-01T10:00:00Z</time></trkpt><trkpt lat="52.01" lon="5.0"><time>2026-10-01T10:10:00Z</time></trkpt></trkseg></trk></gpx>`;
      const res = parseCardioFile(gpx);
      expect(res.format).toBe("gpx");
      expect(res.activityType).toBe("hardlopen");
    });

    it("herkent automatisch TCX formaat", () => {
      const tcx = `<TrainingCenterDatabase><Activity Sport="Running"><Lap StartTime="2026-10-01T10:00:00Z"><TotalTimeSeconds>600</TotalTimeSeconds><DistanceMeters>2000</DistanceMeters></Lap></Activity></TrainingCenterDatabase>`;
      const res = parseCardioFile(tcx);
      expect(res.format).toBe("tcx");
      expect(res.distanceMeters).toBe(2000);
    });

    it("geeft een behulpzame instructie bij binaire FIT bestanden", () => {
      const fit = `\x0e\x10\x46\x49\x54.FIT binary data`;
      expect(() => parseCardioFile(fit)).toThrow(
        "FIT-bestanden zijn binair gecomprimeerd"
      );
    });

    it("gooit een foutmelding bij onbekende tekstbestanden", () => {
      expect(() => parseCardioFile("Willekeurige tekst zonder XML tags")).toThrow(
        "Onbekend of niet-ondersteund bestandsformaat"
      );
    });
  });
});
