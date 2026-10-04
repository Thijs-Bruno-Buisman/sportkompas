import type {
  WorkoutSession,
  WorkoutSet,
  Exercise,
  CardioSession,
  MealLog,
  BodyMeasurement,
} from "@/types/database";

export type CsvDelimiter = "," | ";";
export type DecimalSeparator = "." | ",";

export interface CsvExportOptions {
  delimiter?: CsvDelimiter;
  decimalSeparator?: DecimalSeparator;
  includeBom?: boolean;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
}

/**
 * UTF-8 Byte Order Mark om Excel te dwingen UTF-8 encoding te gebruiken.
 */
export const UTF8_BOM = "\uFEFF";

/**
 * Formatteert een waarde veilig conform RFC 4180 voor CSV.
 * Verwerkt quotes, delimiters en newlines.
 */
export function escapeCsvField(
  value: unknown,
  delimiter: CsvDelimiter = ";",
  decimalSeparator: DecimalSeparator = ","
): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = "";
  if (typeof value === "number") {
    if (isNaN(value)) return "";
    str = String(value);
    if (decimalSeparator === ",") {
      str = str.replace(".", ",");
    }
  } else if (typeof value === "boolean") {
    str = value ? "Ja" : "Nee";
  } else {
    str = String(value);
  }

  // Als de string delimiters, quotes of newlines bevat, omring met dubbele quotes
  const needsQuotes =
    str.includes(delimiter) ||
    str.includes('"') ||
    str.includes("\n") ||
    str.includes("\r");

  if (needsQuotes) {
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }

  return str;
}

/**
 * Filtert records op basis van optionele start- en einddatum (YYYY-MM-DD).
 */
export function isWithinDateRange(
  calendarDate: string,
  startDate?: string,
  endDate?: string
): boolean {
  if (startDate && calendarDate < startDate) return false;
  if (endDate && calendarDate > endDate) return false;
  return true;
}

/**
 * Berekent geschatte 1RM via de Epley-formule: gewicht * (1 + reps / 30).
 */
function calculateEpley1RM(weightKg: number, reps: number): number | null {
  if (weightKg <= 0 || reps <= 0) return null;
  if (reps === 1) return weightKg;
  const val = weightKg * (1 + reps / 30);
  return Math.round(val * 10) / 10;
}

/**
 * Converteert meters naar kilometers met 2 decimalen.
 */
function metersToKm(meters: number): number {
  return Math.round((meters / 1000) * 100) / 100;
}

/**
 * Converteert seconden naar minuten afgerond.
 */
function secondsToMinutes(seconds: number): number {
  return Math.round((seconds / 60) * 10) / 10;
}

/**
 * Berekent gemiddeld tempo in mm:ss per km.
 */
function calculatePaceString(distanceMeters: number, durationSeconds: number): string {
  if (distanceMeters <= 0 || durationSeconds <= 0) return "-";
  const secondsPerKm = durationSeconds / (distanceMeters / 1000);
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Berekent snelheid in km/u met 1 decimaal.
 */
function calculateSpeedKmh(distanceMeters: number, durationSeconds: number): number | null {
  if (distanceMeters <= 0 || durationSeconds <= 0) return null;
  const km = distanceMeters / 1000;
  const hours = durationSeconds / 3600;
  return Math.round((km / hours) * 10) / 10;
}

/**
 * 1. WORKOUTS CSV EXPORT
 * Exporteert alle geregistreerde sets per sessie met oefeningdetails en volume.
 */
export function exportWorkoutsToCsv(
  sessions: WorkoutSession[],
  sets: WorkoutSet[],
  exercises: Exercise[],
  options: CsvExportOptions = {}
): string {
  const delimiter = options.delimiter ?? ";";
  const decimalSeparator = options.decimalSeparator ?? (delimiter === ";" ? "," : ".");
  const includeBom = options.includeBom ?? true;

  const exerciseMap = new Map<string, Exercise>();
  for (const ex of exercises) {
    exerciseMap.set(ex.id, ex);
  }

  const sessionMap = new Map<string, WorkoutSession>();
  for (const s of sessions) {
    if (isWithinDateRange(s.calendarDate, options.startDate, options.endDate)) {
      sessionMap.set(s.id, s);
    }
  }

  // Filter sets die horen bij de gefilterde sessies
  const validSets = sets.filter((set) => sessionMap.has(set.sessionId));

  // Sorteer op sessie datum (descending) en setnummer
  validSets.sort((a, b) => {
    const sA = sessionMap.get(a.sessionId);
    const sB = sessionMap.get(b.sessionId);
    if (!sA || !sB) return 0;
    if (sA.calendarDate !== sB.calendarDate) {
      return sB.calendarDate.localeCompare(sA.calendarDate);
    }
    if (a.exerciseId !== b.exerciseId) {
      return a.exerciseId.localeCompare(b.exerciseId);
    }
    return a.setNumber - b.setNumber;
  });

  const headers = [
    "Datum",
    "Starttijd",
    "Eindtijd",
    "Workout Naam",
    "Status",
    "Oefening",
    "Spiergroep",
    "Set Nr",
    "Set Type",
    "Gewicht (kg)",
    "Herhalingen",
    "Volume (kg)",
    "Geschatte 1RM (kg)",
    "RPE Doel",
    "RPE Werkelijk",
    "RIR Werkelijk",
    "Voltooid",
    "Rusttijd (sec)",
    "Sessie RPE",
    "Sessie Notities",
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => escapeCsvField(h, delimiter, decimalSeparator)).join(delimiter));

  for (const set of validSets) {
    const session = sessionMap.get(set.sessionId);
    if (!session) continue;

    const exercise = exerciseMap.get(set.exerciseId);
    const exerciseName =
      exercise?.name ||
      session.snapshot?.exercises?.find((e) => e.exerciseId === set.exerciseId)?.exerciseName ||
      "Onbekende oefening";
    const muscleGroup = exercise?.primaryMuscleGroup || "-";

    const volume = Math.round(set.weightKg * set.reps * 10) / 10;
    const est1rm = calculateEpley1RM(set.weightKg, set.reps);

    const startTimeFormatted = session.startTime ? session.startTime.substring(11, 16) : "";
    const endTimeFormatted = session.endTime ? session.endTime.substring(11, 16) : "";

    const row = [
      session.calendarDate,
      startTimeFormatted,
      endTimeFormatted,
      session.snapshot?.routineName || "Losse training",
      session.status,
      exerciseName,
      muscleGroup,
      set.setNumber,
      set.setType,
      set.weightKg,
      set.reps,
      volume,
      est1rm ?? "",
      set.targetRpe ?? "",
      set.actualRpe ?? "",
      set.actualRir ?? "",
      set.completed,
      set.restTimeSeconds,
      session.overallRpe ?? "",
      session.notes || "",
    ];

    rows.push(row.map((val) => escapeCsvField(val, delimiter, decimalSeparator)).join(delimiter));
  }

  const csvContent = rows.join("\r\n");
  return includeBom ? UTF8_BOM + csvContent : csvContent;
}

/**
 * 2. CARDIO CSV EXPORT
 * Exporteert alle cardio-sessies met afstand, duur, tempo, hartslag en calorieën.
 */
export function exportCardioToCsv(
  sessions: CardioSession[],
  options: CsvExportOptions = {}
): string {
  const delimiter = options.delimiter ?? ";";
  const decimalSeparator = options.decimalSeparator ?? (delimiter === ";" ? "," : ".");
  const includeBom = options.includeBom ?? true;

  const filtered = sessions.filter((s) =>
    isWithinDateRange(s.calendarDate, options.startDate, options.endDate)
  );

  // Sorteer op datum descending
  filtered.sort((a, b) => b.calendarDate.localeCompare(a.calendarDate));

  const headers = [
    "Datum",
    "Starttijd",
    "Eindtijd",
    "Activiteit",
    "Afstand (km)",
    "Duur (min)",
    "Tempo (min/km)",
    "Snelheid (km/u)",
    "Calorieën (kcal)",
    "Gem Hartslag (bpm)",
    "Max Hartslag (bpm)",
    "Hoogtemeters (m)",
    "RPE",
    "Notities",
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => escapeCsvField(h, delimiter, decimalSeparator)).join(delimiter));

  for (const s of filtered) {
    const km = metersToKm(s.distanceMeters);
    const durationMin = secondsToMinutes(s.durationSeconds);
    const pace = calculatePaceString(s.distanceMeters, s.durationSeconds);
    const speed = calculateSpeedKmh(s.distanceMeters, s.durationSeconds);
    const startTimeFormatted = s.startTime ? s.startTime.substring(11, 16) : "";
    const endTimeFormatted = s.endTime ? s.endTime.substring(11, 16) : "";

    const row = [
      s.calendarDate,
      startTimeFormatted,
      endTimeFormatted,
      s.activityType,
      km,
      durationMin,
      pace,
      speed ?? "",
      s.estimatedCaloriesBurned ?? "",
      s.avgHeartRateBpm ?? "",
      s.maxHeartRateBpm ?? "",
      s.elevationGainMeters ?? "",
      s.rpe ?? "",
      s.notes || "",
    ];

    rows.push(row.map((val) => escapeCsvField(val, delimiter, decimalSeparator)).join(delimiter));
  }

  const csvContent = rows.join("\r\n");
  return includeBom ? UTF8_BOM + csvContent : csvContent;
}

/**
 * 3. VOEDING CSV EXPORT
 * Exporteert voedingslogs op productniveau met macro's en portiegrootte.
 */
export function exportNutritionToCsv(
  mealLogs: MealLog[],
  options: CsvExportOptions = {}
): string {
  const delimiter = options.delimiter ?? ";";
  const decimalSeparator = options.decimalSeparator ?? (delimiter === ";" ? "," : ".");
  const includeBom = options.includeBom ?? true;

  const filtered = mealLogs.filter((log) =>
    isWithinDateRange(log.calendarDate, options.startDate, options.endDate)
  );

  // Sorteer op datum descending
  filtered.sort((a, b) => b.calendarDate.localeCompare(a.calendarDate));

  const headers = [
    "Datum",
    "Tijdstip",
    "Maaltijd",
    "Product / Item",
    "Portie (g)",
    "Calorieën (kcal)",
    "Eiwitten (g)",
    "Koolhydraten (g)",
    "Vetten (g)",
    "Vezels (g)",
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => escapeCsvField(h, delimiter, decimalSeparator)).join(delimiter));

  for (const log of filtered) {
    const timeFormatted = log.loggedAt ? log.loggedAt.substring(11, 16) : "";

    // Als de log losse items heeft, exporteer per item
    if (log.items && log.items.length > 0) {
      for (const item of log.items) {
        const row = [
          log.calendarDate,
          timeFormatted,
          log.mealType,
          item.foodName,
          Math.round(item.portionGrams),
          Math.round(item.calories),
          Math.round(item.proteinGrams * 10) / 10,
          Math.round(item.carbsGrams * 10) / 10,
          Math.round(item.fatGrams * 10) / 10,
          Math.round(item.fiberGrams * 10) / 10,
        ];
        rows.push(row.map((val) => escapeCsvField(val, delimiter, decimalSeparator)).join(delimiter));
      }
    } else {
      // Totaalregel voor logs zonder individuele items
      const row = [
        log.calendarDate,
        timeFormatted,
        log.mealType,
        "Geaggregeerde maaltijd",
        "",
        Math.round(log.totalCalories),
        Math.round(log.totalProteinGrams * 10) / 10,
        Math.round(log.totalCarbsGrams * 10) / 10,
        Math.round(log.totalFatGrams * 10) / 10,
        log.totalFiberGrams ? Math.round(log.totalFiberGrams * 10) / 10 : "",
      ];
      rows.push(row.map((val) => escapeCsvField(val, delimiter, decimalSeparator)).join(delimiter));
    }
  }

  const csvContent = rows.join("\r\n");
  return includeBom ? UTF8_BOM + csvContent : csvContent;
}

/**
 * 4. LICHAAMSMETINGEN CSV EXPORT
 * Exporteert lichaamsgewicht, omtrekken en vetpercentage.
 */
export function exportMeasurementsToCsv(
  measurements: BodyMeasurement[],
  options: CsvExportOptions = {}
): string {
  const delimiter = options.delimiter ?? ";";
  const decimalSeparator = options.decimalSeparator ?? (delimiter === ";" ? "," : ".");
  const includeBom = options.includeBom ?? true;

  const filtered = measurements.filter((m) =>
    isWithinDateRange(m.calendarDate, options.startDate, options.endDate)
  );

  // Sorteer op datum descending
  filtered.sort((a, b) => b.calendarDate.localeCompare(a.calendarDate));

  const headers = [
    "Datum",
    "Tijdstip",
    "Gewicht (kg)",
    "Vetpercentage (%)",
    "Borst (cm)",
    "Taille (cm)",
    "Heupen (cm)",
    "Armen (cm)",
    "Bovenbenen (cm)",
    "Notities",
  ];

  const rows: string[] = [];
  rows.push(headers.map((h) => escapeCsvField(h, delimiter, decimalSeparator)).join(delimiter));

  for (const m of filtered) {
    const timeFormatted = m.measuredAt ? m.measuredAt.substring(11, 16) : "";

    const chestCm = m.chestMeters ? Math.round(m.chestMeters * 100 * 10) / 10 : "";
    const waistCm = m.waistMeters ? Math.round(m.waistMeters * 100 * 10) / 10 : "";
    const hipsCm = m.hipsMeters ? Math.round(m.hipsMeters * 100 * 10) / 10 : "";
    const armsCm = m.armsMeters ? Math.round(m.armsMeters * 100 * 10) / 10 : "";
    const thighsCm = m.thighsMeters ? Math.round(m.thighsMeters * 100 * 10) / 10 : "";

    const row = [
      m.calendarDate,
      timeFormatted,
      m.weightKg,
      m.bodyFatPercentage ?? "",
      chestCm,
      waistCm,
      hipsCm,
      armsCm,
      thighsCm,
      m.notes || "",
    ];

    rows.push(row.map((val) => escapeCsvField(val, delimiter, decimalSeparator)).join(delimiter));
  }

  const csvContent = rows.join("\r\n");
  return includeBom ? UTF8_BOM + csvContent : csvContent;
}

/**
 * Genereert een standaard bestandsnaam voor CSV export.
 * Bv: sportkompas-workouts-2026-10-15.csv
 */
export function generateCsvFilename(category: "workouts" | "cardio" | "voeding" | "metingen", date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `sportkompas-${category}-${y}-${m}-${d}.csv`;
}

/**
 * Downloadt een gegenereerde CSV tekststring als bestand in de browser.
 */
export function downloadCsvString(content: string, filename: string): void {
  if (typeof window === "undefined") return;

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
