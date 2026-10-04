import type { CardioSession, CardioActivityType } from "@/types/database";
import {
  calculatePace,
  calculateHeartRateZones,
  getHeartRateZoneForBpm,
} from "./calculations";

export type PeriodFilter = "7d" | "30d" | "90d" | "1j" | "alles";

export interface AggregatedCardioBucket {
  key: string; // bv. "2026-10-01" of "Wk 40" of "Okt '26"
  label: string;
  startDate: string;
  endDate: string;
  totalDistanceMeters: number;
  totalDurationSeconds: number;
  totalCalories: number;
  sessionCount: number;
  avgSpeedKmH: number;
  bySport: Record<CardioActivityType, { distanceMeters: number; durationSeconds: number; count: number }>;
}

export interface PaceTrendPoint {
  sessionId: string;
  calendarDate: string;
  distanceMeters: number;
  durationSeconds: number;
  speedKmH: number;
  paceSecondsPerKm: number;
  formattedMetric: string;
  metricValue: number; // Numerieke waarde voor grafiekas
  rpe?: number | null;
  avgHeartRateBpm?: number | null;
}

export interface HeartRateZoneDistribution {
  totalWithHeartRate: number;
  distribution: Array<{
    zone: number;
    name: string;
    shortName: string;
    count: number;
    percentage: number;
    color: string;
  }>;
}

/**
 * Filtert sessies op basis van een gekozen tijdsperiode (7d, 30d, 90d, 1j, alles).
 */
export function filterSessionsByPeriod(
  sessions: CardioSession[],
  period: PeriodFilter,
  referenceDateStr: string = new Date().toISOString().split("T")[0]
): CardioSession[] {
  if (period === "alles") {
    return sessions.filter((s) => s.status !== "geannuleerd");
  }

  const refDate = new Date(referenceDateStr);
  let daysBack = 7;

  if (period === "30d") daysBack = 30;
  else if (period === "90d") daysBack = 90;
  else if (period === "1j") daysBack = 365;

  const cutoffDate = new Date(refDate);
  cutoffDate.setDate(cutoffDate.getDate() - daysBack);
  const cutoffStr = cutoffDate.toISOString().split("T")[0];

  return sessions.filter(
    (s) => s.status !== "geannuleerd" && s.calendarDate >= cutoffStr && s.calendarDate <= referenceDateStr
  );
}

/**
 * Groepeert sessies per dag, week of maand voor visualisatie in staafdiagrammen.
 */
export function groupSessionsByBucket(
  sessions: CardioSession[],
  period: PeriodFilter
): AggregatedCardioBucket[] {
  const validSessions = sessions
    .filter((s) => s.status !== "geannuleerd")
    .sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));

  if (validSessions.length === 0) return [];

  const bucketsMap = new Map<string, AggregatedCardioBucket>();

  for (const s of validSessions) {
    let key = s.calendarDate;
    let label = s.calendarDate;

    if (period === "7d") {
      // Per dag
      key = s.calendarDate;
      const d = new Date(s.calendarDate);
      const dayNames = ["Zo", "Ma", "Di", "Wo", "Do", "Vr", "Za"];
      label = `${dayNames[d.getDay()]} ${d.getDate()}`;
    } else if (period === "30d" || period === "90d") {
      // Per week (maandag t/m zondag)
      const d = new Date(s.calendarDate);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(d.setDate(diff));
      key = monday.toISOString().split("T")[0];
      label = `Wk ${getIsoWeekNumber(monday)}`;
    } else {
      // Per maand (voor 1j en alles)
      key = s.calendarDate.substring(0, 7); // YYYY-MM
      const [year, month] = key.split("-");
      const monthNames = ["Jan", "Feb", "Mrt", "Apr", "Mei", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dec"];
      label = `${monthNames[parseInt(month, 10) - 1]} '${year.slice(2)}`;
    }

    let bucket = bucketsMap.get(key);
    if (!bucket) {
      bucket = {
        key,
        label,
        startDate: s.calendarDate,
        endDate: s.calendarDate,
        totalDistanceMeters: 0,
        totalDurationSeconds: 0,
        totalCalories: 0,
        sessionCount: 0,
        avgSpeedKmH: 0,
        bySport: {
          hardlopen: { distanceMeters: 0, durationSeconds: 0, count: 0 },
          fietsen: { distanceMeters: 0, durationSeconds: 0, count: 0 },
          roeien: { distanceMeters: 0, durationSeconds: 0, count: 0 },
          wandelen: { distanceMeters: 0, durationSeconds: 0, count: 0 },
          zwemmen: { distanceMeters: 0, durationSeconds: 0, count: 0 },
          crosstrainer: { distanceMeters: 0, durationSeconds: 0, count: 0 },
          overig: { distanceMeters: 0, durationSeconds: 0, count: 0 },
        },
      };
      bucketsMap.set(key, bucket);
    }

    bucket.totalDistanceMeters += s.distanceMeters;
    bucket.totalDurationSeconds += s.durationSeconds;
    bucket.totalCalories += s.estimatedCaloriesBurned ?? 0;
    bucket.sessionCount += 1;
    if (s.calendarDate > bucket.endDate) bucket.endDate = s.calendarDate;

    const sport = s.activityType in bucket.bySport ? s.activityType : "overig";
    bucket.bySport[sport].distanceMeters += s.distanceMeters;
    bucket.bySport[sport].durationSeconds += s.durationSeconds;
    bucket.bySport[sport].count += 1;
  }

  // Bereken gemiddelde snelheid per bucket
  const result: AggregatedCardioBucket[] = [];
  for (const bucket of bucketsMap.values()) {
    if (bucket.totalDurationSeconds > 0 && bucket.totalDistanceMeters > 0) {
      const hours = bucket.totalDurationSeconds / 3600;
      bucket.avgSpeedKmH = Math.round(((bucket.totalDistanceMeters / 1000) / hours) * 10) / 10;
    }
    result.push(bucket);
  }

  return result;
}

/**
 * Berekent tempo-ontwikkeling over tijd voor een specifieke sport.
 */
export function calculatePaceTrend(
  sessions: CardioSession[],
  activityType: CardioActivityType
): PaceTrendPoint[] {
  const filtered = sessions
    .filter(
      (s) =>
        s.status !== "geannuleerd" &&
        s.activityType === activityType &&
        s.distanceMeters > 0 &&
        s.durationSeconds > 0
    )
    .sort((a, b) => a.calendarDate.localeCompare(b.calendarDate));

  return filtered.map((s) => {
    const pace = calculatePace(s.distanceMeters, s.durationSeconds, activityType);
    let metricValue = pace.paceSecondsPerKm;
    let formattedMetric = pace.formattedPace;

    if (activityType === "fietsen" || activityType === "crosstrainer") {
      metricValue = pace.speedKmH;
      formattedMetric = pace.formattedSpeed;
    } else if (activityType === "roeien" && pace.split500mSeconds) {
      metricValue = pace.split500mSeconds;
      formattedMetric = pace.formattedSplit500m ?? `${pace.split500mSeconds}s`;
    } else if (activityType === "zwemmen" && pace.swimPace100mSeconds) {
      metricValue = pace.swimPace100mSeconds;
      formattedMetric = pace.formattedSwimPace100m ?? `${pace.swimPace100mSeconds}s`;
    }

    return {
      sessionId: s.id,
      calendarDate: s.calendarDate,
      distanceMeters: s.distanceMeters,
      durationSeconds: s.durationSeconds,
      speedKmH: pace.speedKmH,
      paceSecondsPerKm: pace.paceSecondsPerKm,
      metricValue,
      formattedMetric,
      rpe: s.rpe,
      avgHeartRateBpm: s.avgHeartRateBpm,
    };
  });
}

/**
 * Berekent de verdeling van sessies over de 5 fysiologische hartslagzones.
 */
export function calculateHeartRateDistribution(
  sessions: CardioSession[],
  userAge?: number | null
): HeartRateZoneDistribution {
  const validWithHr = sessions.filter(
    (s) => s.status !== "geannuleerd" && s.avgHeartRateBpm && s.avgHeartRateBpm > 0
  );

  const zones = calculateHeartRateZones({ age: userAge });
  const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  for (const s of validWithHr) {
    const zone = getHeartRateZoneForBpm(s.avgHeartRateBpm, zones);
    if (zone) {
      counts[zone.zone] += 1;
    }
  }

  const total = validWithHr.length;
  const distribution = zones.map((z) => ({
    zone: z.zone,
    name: z.name,
    shortName: z.shortName,
    count: counts[z.zone] ?? 0,
    percentage: total > 0 ? Math.round(((counts[z.zone] ?? 0) / total) * 100) : 0,
    color: z.color,
  }));

  return {
    totalWithHeartRate: total,
    distribution,
  };
}

/**
 * ISO weeknummer berekening.
 */
function getIsoWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}
