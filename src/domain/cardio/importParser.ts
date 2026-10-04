/**
 * Domeinlogica voor het importeren en parseren van GPX en TCX cardiobestanden (Stap 46 / Prompt 40)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Belangrijke principes:
 * 1. 100% Lokale Verwerking (Regel 8):
 *    - Bestanden worden direct in de browser geparsed; geen externe servers of cloud services.
 * 2. Echte Persistentie (Regel 3):
 *    - Gestructureerde data wordt opgeslagen in Dexie IndexedDB (cardioSessions).
 * 3. Robuustheid & Onafhankelijkheid:
 *    - Werkt zowel in Node.js (Vitest) als in moderne browsers zonder externe zware dependencies.
 */

import type { CardioActivityType } from "@/types/database";
import { calculateCalories } from "./calculations";

export interface ParsedCardioImport {
  activityType: CardioActivityType;
  calendarDate: string; // YYYY-MM-DD
  startTime: string; // UTC ISO
  endTime: string | null; // UTC ISO
  distanceMeters: number;
  durationSeconds: number;
  elevationGainMeters: number | null;
  avgHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  estimatedCaloriesBurned: number | null;
  notes: string;
  format: "gpx" | "tcx";
  trackpointsCount: number;
}

export interface Trackpoint {
  lat: number;
  lon: number;
  ele?: number | null;
  time?: string | null;
  hr?: number | null;
}

/**
 * Berekent de afstand over de aardbol in meters tussen twee coördinaten via de Haversine-formule.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Aardstraal in meters
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Mapt een ruwe sport- of activiteitstitel uit GPX of TCX naar het SportKompas CardioActivityType.
 */
export function mapActivityType(rawType: string): CardioActivityType {
  const t = rawType.toLowerCase().trim();
  if (t.includes("run") || t.includes("hardlopen") || t.includes("jogging")) {
    return "hardlopen";
  }
  if (
    t.includes("bike") ||
    t.includes("cycle") ||
    t.includes("cycling") ||
    t.includes("fietsen") ||
    t.includes("biking") ||
    t.includes("ride")
  ) {
    return "fietsen";
  }
  if (t.includes("walk") || t.includes("wandelen") || t.includes("hike") || t.includes("hiking")) {
    return "wandelen";
  }
  if (t.includes("swim") || t.includes("zwemmen")) {
    return "zwemmen";
  }
  if (t.includes("row") || t.includes("roeien") || t.includes("ergometer")) {
    return "roeien";
  }
  if (t.includes("elliptical") || t.includes("crosstrainer")) {
    return "crosstrainer";
  }
  return "hardlopen"; // Standaard
}

/**
 * Parsed een GPX XML string en extraheert alle relevante cardio-metriek.
 */
export function parseGpxString(
  xml: string,
  userWeightKg?: number | null
): ParsedCardioImport {
  // 1. Zoek activiteitstype
  let rawType = "hardlopen";
  const typeMatch = xml.match(/<type>([^<]+)<\/type>/i);
  if (typeMatch) {
    rawType = typeMatch[1];
  } else {
    // Kijk eventueel in de track naam
    const nameMatch = xml.match(/<name>([^<]+)<\/name>/i);
    if (nameMatch) rawType = nameMatch[1];
  }
  const activityType = mapActivityType(rawType);

  // 2. Extraheer trackpoints
  // Ondersteunt zowel lat="..." lon="..." als lon="..." lat="..."
  const trkptRegex = /<trkpt\s+([^>]+)>([\s\S]*?)<\/trkpt>/gi;
  const trackpoints: Trackpoint[] = [];

  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(xml)) !== null) {
    const attrString = match[1];
    const bodyString = match[2];

    const latMatch = attrString.match(/lat="([-\d.]+)"/i);
    const lonMatch = attrString.match(/lon="([-\d.]+)"/i);

    if (latMatch && lonMatch) {
      const lat = parseFloat(latMatch[1]);
      const lon = parseFloat(lonMatch[1]);

      let ele: number | null = null;
      const eleMatch = bodyString.match(/<ele>([-\d.]+)<\/ele>/i);
      if (eleMatch) ele = parseFloat(eleMatch[1]);

      let time: string | null = null;
      const timeMatch = bodyString.match(/<time>([^<]+)<\/time>/i);
      if (timeMatch) time = timeMatch[1].trim();

      let hr: number | null = null;
      const hrMatch = bodyString.match(/<(?:[a-zA-Z0-9_]+:)?hr>(\d+)<\/(?:[a-zA-Z0-9_]+:)?hr>/i);
      if (hrMatch) hr = parseInt(hrMatch[1], 10);

      trackpoints.push({ lat, lon, ele, time, hr });
    }
  }

  if (trackpoints.length === 0) {
    throw new Error(
      "Het GPX-bestand bevat geen geldige GPS trackpoints (<trkpt>). Controleer of het bestand een voltooide GPS-route bevat."
    );
  }

  // 3. Bereken afstand en hoogtemeters
  let totalDistanceMeters = 0;
  let elevationGainMeters = 0;
  const heartRates: number[] = [];

  for (let i = 0; i < trackpoints.length; i++) {
    const pt = trackpoints[i];
    if (typeof pt.hr === "number" && pt.hr > 0 && pt.hr < 250) {
      heartRates.push(pt.hr);
    }

    if (i > 0) {
      const prev = trackpoints[i - 1];
      const dist = calculateHaversineDistanceMeters(prev.lat, prev.lon, pt.lat, pt.lon);
      // Filter extreme GPS-glitches (> 10 km tussen opeenvolgende punten)
      if (dist < 10000) {
        totalDistanceMeters += dist;
      }

      if (typeof pt.ele === "number" && typeof prev.ele === "number") {
        const deltaEle = pt.ele - prev.ele;
        if (deltaEle > 0 && deltaEle < 1000) {
          elevationGainMeters += deltaEle;
        }
      }
    }
  }

  // 4. Bepaal starttijd, eindtijd en totale duur
  let startTime = new Date().toISOString();
  let endTime: string | null = null;
  let durationSeconds = 0;

  const firstTime = trackpoints.find((p) => p.time)?.time;
  const lastTime = [...trackpoints].reverse().find((p) => p.time)?.time;

  if (firstTime && lastTime) {
    const startMs = new Date(firstTime).getTime();
    const endMs = new Date(lastTime).getTime();
    if (!isNaN(startMs) && !isNaN(endMs) && endMs >= startMs) {
      startTime = new Date(startMs).toISOString();
      endTime = new Date(endMs).toISOString();
      durationSeconds = Math.round((endMs - startMs) / 1000);
    }
  }

  // Fallback voor duur indien geen tijdstempels
  if (durationSeconds <= 0 && totalDistanceMeters > 0) {
    // Schatting: 10 km/u (~166 m/min)
    durationSeconds = Math.round((totalDistanceMeters / 2.78));
  }

  const calendarDate = startTime.split("T")[0];

  // 5. Hartslag aggregaties
  const avgHeartRateBpm =
    heartRates.length > 0
      ? Math.round(heartRates.reduce((a, b) => a + b, 0) / heartRates.length)
      : null;
  const maxHeartRateBpm = heartRates.length > 0 ? Math.max(...heartRates) : null;

  // 6. Calorieën schatten
  const calculatedCal = calculateCalories({
    activityType,
    durationSeconds: Math.max(1, durationSeconds),
    distanceMeters: Math.round(totalDistanceMeters),
    userWeightKg,
  });

  return {
    activityType,
    calendarDate,
    startTime,
    endTime,
    distanceMeters: Math.round(totalDistanceMeters),
    durationSeconds: Math.max(1, durationSeconds),
    elevationGainMeters: elevationGainMeters > 0 ? Math.round(elevationGainMeters) : null,
    avgHeartRateBpm,
    maxHeartRateBpm,
    estimatedCaloriesBurned: calculatedCal.calories > 0 ? calculatedCal.calories : null,
    notes: `Geïmporteerd uit GPX (${trackpoints.length} trackpoints)`,
    format: "gpx",
    trackpointsCount: trackpoints.length,
  };
}

/**
 * Parsed een TCX XML string en extraheert alle relevante cardio-metriek.
 */
export function parseTcxString(
  xml: string,
  userWeightKg?: number | null
): ParsedCardioImport {
  // 1. Sport type
  const sportMatch = xml.match(/<Activity\s+Sport="([^"]+)"/i);
  const rawSport = sportMatch ? sportMatch[1] : "Running";
  const activityType = mapActivityType(rawSport);

  // 2. StartTime & Id
  let startTime = new Date().toISOString();
  const idMatch = xml.match(/<Id>([^<]+)<\/Id>/i);
  const lapStartMatch = xml.match(/<Lap\s+StartTime="([^"]+)"/i);

  const potentialStart = idMatch ? idMatch[1].trim() : lapStartMatch ? lapStartMatch[1].trim() : null;
  if (potentialStart && !isNaN(new Date(potentialStart).getTime())) {
    startTime = new Date(potentialStart).toISOString();
  }

  // 3. TotalTimeSeconds & DistanceMeters aggregatie over alle rondes (Laps)
  let totalDurationSeconds = 0;
  let totalDistanceMeters = 0;
  let caloriesFromTcx: number | null = null;

  const timeMatches = xml.matchAll(/<TotalTimeSeconds>([-\d.]+)<\/TotalTimeSeconds>/gi);
  for (const tm of timeMatches) {
    const val = parseFloat(tm[1]);
    if (!isNaN(val) && val > 0) totalDurationSeconds += val;
  }

  const distMatches = xml.matchAll(/<DistanceMeters>([-\d.]+)<\/DistanceMeters>/gi);
  for (const dm of distMatches) {
    const val = parseFloat(dm[1]);
    if (!isNaN(val) && val > 0) totalDistanceMeters += val;
  }

  const calMatches = xml.matchAll(/<Calories>(\d+)<\/Calories>/gi);
  let summedCal = 0;
  let hasCal = false;
  for (const cm of calMatches) {
    const val = parseInt(cm[1], 10);
    if (!isNaN(val) && val > 0) {
      summedCal += val;
      hasCal = true;
    }
  }
  if (hasCal) caloriesFromTcx = summedCal;

  // 4. Hartslaggegevens
  const avgHrMatches = xml.match(/<AverageHeartRateBpm>[\s\S]*?<Value>(\d+)<\/Value>/i);
  const maxHrMatches = xml.match(/<MaximumHeartRateBpm>[\s\S]*?<Value>(\d+)<\/Value>/i);

  const avgHeartRateBpm = avgHrMatches ? parseInt(avgHrMatches[1], 10) : null;
  const maxHeartRateBpm = maxHrMatches ? parseInt(maxHrMatches[1], 10) : null;

  // 5. Trackpoints tellen en hoogtemeters
  const trackpointMatches = xml.matchAll(/<AltitudeMeters>([-\d.]+)<\/AltitudeMeters>/gi);
  let elevationGainMeters = 0;
  let prevAlt: number | null = null;
  let tpCount = 0;

  for (const am of trackpointMatches) {
    tpCount++;
    const alt = parseFloat(am[1]);
    if (!isNaN(alt)) {
      if (prevAlt !== null) {
        const delta = alt - prevAlt;
        if (delta > 0 && delta < 50) {
          elevationGainMeters += delta;
        }
      }
      prevAlt = alt;
    }
  }

  // Indien trackpoints niet specifiek zijn geteld met AltitudeMeters, tel algemene Trackpoints
  if (tpCount === 0) {
    const generalTp = xml.match(/<Trackpoint>/gi);
    if (generalTp) tpCount = generalTp.length;
  }

  // Bereken eindtijd
  const durationRounded = Math.round(totalDurationSeconds);
  const endTime =
    durationRounded > 0
      ? new Date(new Date(startTime).getTime() + durationRounded * 1000).toISOString()
      : null;

  const calendarDate = startTime.split("T")[0];

  // Calorieën fallback via MET indien niet in TCX
  let estimatedCaloriesBurned = caloriesFromTcx;
  if (!estimatedCaloriesBurned || estimatedCaloriesBurned <= 0) {
    const calculatedCal = calculateCalories({
      activityType,
      durationSeconds: Math.max(1, durationRounded),
      distanceMeters: Math.round(totalDistanceMeters),
      userWeightKg,
    });
    estimatedCaloriesBurned = calculatedCal.calories > 0 ? calculatedCal.calories : null;
  }

  if (totalDistanceMeters === 0 && durationRounded === 0 && tpCount === 0) {
    throw new Error(
      "Het TCX-bestand bevat geen geldige sessie- of lapgegevens (<TotalTimeSeconds>, <DistanceMeters> of <Trackpoint>)."
    );
  }

  return {
    activityType,
    calendarDate,
    startTime,
    endTime,
    distanceMeters: Math.round(totalDistanceMeters),
    durationSeconds: Math.max(1, durationRounded),
    elevationGainMeters: elevationGainMeters > 0 ? Math.round(elevationGainMeters) : null,
    avgHeartRateBpm: avgHeartRateBpm && avgHeartRateBpm > 30 ? avgHeartRateBpm : null,
    maxHeartRateBpm: maxHeartRateBpm && maxHeartRateBpm > 30 ? maxHeartRateBpm : null,
    estimatedCaloriesBurned,
    notes: `Geïmporteerd uit TCX`,
    format: "tcx",
    trackpointsCount: tpCount,
  };
}

/**
 * Centrale dispatcher voor bestandsimport.
 * Detecteert automatisch GPX of TCX en geeft heldere foutmeldingen bij binaire FIT bestanden.
 */
export function parseCardioFile(
  content: string,
  userWeightKg?: number | null
): ParsedCardioImport {
  const trimmed = content.trim();

  // 1. Detectie van binaire FIT bestanden
  // FIT headers beginnen typisch met bytes en '.FIT'
  if (
    trimmed.includes(".FIT") ||
    trimmed.startsWith("\x0e") ||
    trimmed.startsWith("\x20") ||
    content.includes("\0\0\0")
  ) {
    throw new Error(
      "FIT-bestanden zijn binair gecomprimeerd. Exporteer deze activiteit vanuit Garmin Connect, Strava of Wahoo als GPX of TCX om deze direct te importeren in SportKompas."
    );
  }

  // 2. TCX detectie
  if (
    trimmed.includes("<TrainingCenterDatabase") ||
    (trimmed.includes("<Activity") && trimmed.includes("Sport="))
  ) {
    return parseTcxString(trimmed, userWeightKg);
  }

  // 3. GPX detectie
  if (trimmed.includes("<gpx") || trimmed.includes("<trk>") || trimmed.includes("<trkpt")) {
    return parseGpxString(trimmed, userWeightKg);
  }

  throw new Error(
    "Onbekend of niet-ondersteund bestandsformaat. SportKompas ondersteunt standaard .gpx en .tcx XML-exportbestanden van sporthorloges."
  );
}
