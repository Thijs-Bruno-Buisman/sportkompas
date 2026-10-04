import type { CardioActivityType, CardioSession } from "@/types/database";
import { calculateCalories } from "@/domain/cardio/calculations";

export interface StravaAthlete {
  id: number;
  username?: string | null;
  firstname?: string | null;
  lastname?: string | null;
  city?: string | null;
  country?: string | null;
  profile?: string | null;
  profile_medium?: string | null;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number; // seconds
  total_elevation_gain: number; // meters
  type: string; // e.g. "Run", "Ride"
  sport_type?: string; // e.g. "TrailRun", "GravelRide"
  start_date: string; // UTC ISO: 2026-10-04T07:30:00Z
  start_date_local: string; // Local ISO: 2026-10-04T09:30:00Z
  timezone?: string;
  average_speed?: number;
  max_speed?: number;
  average_cadence?: number | null;
  average_heartrate?: number | null;
  max_heartrate?: number | null;
  calories?: number | null;
  has_heartrate?: boolean;
}

export interface StravaTokenResponse {
  token_type: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: StravaAthlete;
}

/**
 * Mapt Strava sport_type / type string naar een canoniek SportKompas CardioActivityType.
 */
export function mapStravaSportTypeToCardio(
  sportType?: string,
  type?: string
): CardioActivityType {
  const raw = (sportType || type || "").trim().toLowerCase();

  if (raw.includes("run") || raw.includes("loop") || raw === "virtualrun") {
    return "hardlopen";
  }
  if (
    raw.includes("ride") ||
    raw.includes("bike") ||
    raw.includes("cycling") ||
    raw.includes("fiets") ||
    raw === "virtualride" ||
    raw === "ebikeride" ||
    raw === "gravelride" ||
    raw === "mountainbikeride"
  ) {
    return "fietsen";
  }
  if (raw.includes("walk") || raw.includes("hike") || raw.includes("wandel")) {
    return "wandelen";
  }
  if (raw.includes("swim") || raw.includes("zwem")) {
    return "zwemmen";
  }
  if (raw.includes("row") || raw.includes("roei")) {
    return "roeien";
  }
  if (raw.includes("elliptical") || raw.includes("cross")) {
    return "crosstrainer";
  }

  return "overig";
}

/**
 * Converteert een Strava API activiteit naar een persistent SportKompas CardioSession.
 */
export function convertStravaActivityToCardioSession(
  act: StravaActivity,
  userWeightKg: number = 75,
  isDemo: boolean = false
): CardioSession {
  const dateStr = act.start_date_local || act.start_date;
  const calendarDate = dateStr.slice(0, 10); // YYYY-MM-DD
  const startTime = new Date(dateStr).toISOString();

  const durationSec = Math.max(
    1,
    Math.round(act.moving_time > 0 ? act.moving_time : act.elapsed_time || 60)
  );
  const endTime = new Date(
    new Date(startTime).getTime() + (act.elapsed_time || durationSec) * 1000
  ).toISOString();

  const activityType = mapStravaSportTypeToCardio(act.sport_type, act.type);
  const distanceMeters = Math.max(0, Math.round(act.distance || 0));

  // Calorieën: gebruik Strava gerapporteerde calorieën, of bereken via MET formule
  let calories: number | null = null;
  if (typeof act.calories === "number" && act.calories > 0) {
    calories = Math.round(act.calories);
  } else {
    calories = calculateCalories({
      activityType,
      durationSeconds: durationSec,
      distanceMeters: distanceMeters > 0 ? distanceMeters : undefined,
      userWeightKg,
    }).calories;
  }

  const avgHeartRateBpm =
    typeof act.average_heartrate === "number" && act.average_heartrate > 30
      ? Math.round(act.average_heartrate)
      : null;
  const maxHeartRateBpm =
    typeof act.max_heartrate === "number" && act.max_heartrate > 30
      ? Math.round(act.max_heartrate)
      : null;
  const elevationGainMeters =
    typeof act.total_elevation_gain === "number" && act.total_elevation_gain >= 0
      ? Math.round(act.total_elevation_gain)
      : null;
  const cadenceRpm =
    typeof act.average_cadence === "number" && act.average_cadence > 0
      ? Math.round(act.average_cadence)
      : null;

  const activityTitle = act.name?.trim() || "Strava Activiteit";
  const notes = `${activityTitle} (Strava #${act.id})`;

  return {
    id: crypto.randomUUID(),
    calendarDate,
    startTime,
    endTime,
    activityType,
    distanceMeters,
    durationSeconds: durationSec,
    avgHeartRateBpm,
    maxHeartRateBpm,
    estimatedCaloriesBurned: calories,
    elevationGainMeters,
    cadenceRpm,
    rpe: null,
    notes,
    status: "afgerond",
    provenance: {
      source: "strava",
      isDemo,
    },
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Controleert of een Strava activiteit al eerder is geïmporteerd in de database.
 */
export function isStravaActivityAlreadyImported(
  act: StravaActivity,
  existingSessions: CardioSession[]
): boolean {
  const stravaIdTag = `(Strava #${act.id})`;
  const actDate = (act.start_date_local || act.start_date).slice(0, 10);
  const actDuration = Math.round(act.moving_time > 0 ? act.moving_time : act.elapsed_time);
  const actDist = Math.round(act.distance);
  const mappedType = mapStravaSportTypeToCardio(act.sport_type, act.type);

  return existingSessions.some((session) => {
    // 1. Expliciete Strava ID match in notes
    if (session.notes && session.notes.includes(stravaIdTag)) {
      return true;
    }
    // 2. Exacte duplicaten op datum, type, afstand (+/- 50m) en tijdsduur (+/- 60s)
    if (
      session.calendarDate === actDate &&
      session.activityType === mappedType &&
      Math.abs(session.distanceMeters - actDist) <= 50 &&
      Math.abs(session.durationSeconds - actDuration) <= 60
    ) {
      return true;
    }
    return false;
  });
}

/**
 * Filtert inkomende Strava activiteiten op nieuw vs duplicaat.
 */
export function filterNewStravaActivities(
  activities: StravaActivity[],
  existingSessions: CardioSession[]
): {
  newActivities: StravaActivity[];
  duplicateActivities: StravaActivity[];
} {
  const newActivities: StravaActivity[] = [];
  const duplicateActivities: StravaActivity[] = [];

  for (const act of activities) {
    if (isStravaActivityAlreadyImported(act, existingSessions)) {
      duplicateActivities.push(act);
    } else {
      newActivities.push(act);
    }
  }

  return { newActivities, duplicateActivities };
}

/**
 * Bouwt een veilige Strava OAuth URL met de vereiste scopes en optionele state parameter.
 */
export function buildStravaAuthorizeUrl(
  clientId: string,
  redirectUri: string,
  state?: string
): string {
  const params = new URLSearchParams({
    client_id: clientId.trim(),
    response_type: "code",
    redirect_uri: redirectUri.trim(),
    approval_prompt: "auto",
    scope: "read,activity:read_all",
  });

  if (state) {
    params.set("state", state);
  }

  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

/**
 * Realistische mock atleet voor testdoeleinden en demomodus conform Rule 8.
 */
export function getMockStravaAthlete(): StravaAthlete {
  return {
    id: 10842199,
    username: "alex_vandijk",
    firstname: "Alex",
    lastname: "van Dijk",
    city: "Utrecht",
    country: "Nederland",
    profile: null,
  };
}

/**
 * Realistische mock activiteiten (hardlopen, wielrennen, wandelen) voor offline/demotests.
 */
export function getMockStravaActivities(): StravaActivity[] {
  const today = new Date();
  const dateStr = (offsetDays: number, hour: number, min: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - offsetDays);
    d.setHours(hour, min, 0, 0);
    return d.toISOString();
  };

  return [
    {
      id: 9812401,
      name: "Ochtendloop Maliebaan & Singel",
      type: "Run",
      sport_type: "Run",
      distance: 8240, // 8.24 km
      moving_time: 2592, // 43m 12s
      elapsed_time: 2640,
      total_elevation_gain: 18,
      start_date: dateStr(1, 7, 30),
      start_date_local: dateStr(1, 7, 30),
      average_heartrate: 152,
      max_heartrate: 168,
      calories: 465,
      average_cadence: 164,
    },
    {
      id: 9812402,
      name: "Gravelrit Utrechtse Heuvelrug",
      type: "Ride",
      sport_type: "GravelRide",
      distance: 42150, // 42.15 km
      moving_time: 5900, // 1u 38m 20s
      elapsed_time: 6300,
      total_elevation_gain: 312,
      start_date: dateStr(3, 9, 15),
      start_date_local: dateStr(3, 9, 15),
      average_heartrate: 142,
      max_heartrate: 165,
      calories: 940,
      average_cadence: 84,
    },
    {
      id: 9812403,
      name: "Intervaltraining Atletiekbaan",
      type: "Run",
      sport_type: "Run",
      distance: 5000, // 5.00 km
      moving_time: 1450, // 24m 10s
      elapsed_time: 1600,
      total_elevation_gain: 5,
      start_date: dateStr(5, 18, 45),
      start_date_local: dateStr(5, 18, 45),
      average_heartrate: 168,
      max_heartrate: 182,
      calories: 325,
      average_cadence: 172,
    },
    {
      id: 9812404,
      name: "Herstelwandeling Amelisweerd",
      type: "Walk",
      sport_type: "Walk",
      distance: 4800, // 4.80 km
      moving_time: 3120, // 52 min
      elapsed_time: 3300,
      total_elevation_gain: 12,
      start_date: dateStr(6, 14, 0),
      start_date_local: dateStr(6, 14, 0),
      average_heartrate: 104,
      max_heartrate: 118,
      calories: 195,
    },
  ];
}
