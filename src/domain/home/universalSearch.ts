import type {
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  BodyMeasurement,
  Exercise,
} from "@/types/database";
import { parseLocalDate } from "@/domain/dates/calendar";

export type UniversalCategory = "alle" | "kracht" | "cardio" | "voeding" | "meting";
export type DateFilterPeriod = "alle" | "7d" | "30d" | "90d" | "365d";

export interface UniversalSearchResult {
  id: string;
  category: "kracht" | "cardio" | "voeding" | "meting";
  title: string;
  subtitle: string;
  calendarDate: string; // YYYY-MM-DD
  formattedDate: string; // bv. "14 okt 2026"
  matchSnippet?: string;
  targetUrl: string;
  metaBadge?: string;
  score: number;
}

export interface UniversalSearchParams {
  query: string;
  category?: UniversalCategory;
  datePeriod?: DateFilterPeriod;
  referenceDate?: string;
  workoutSessions: WorkoutSession[];
  workoutSets?: WorkoutSet[];
  exercises?: Exercise[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  measurements: BodyMeasurement[];
}

/**
 * Pure domeinzoekfunctie die door alle historische pijlers van SportKompas zoekt.
 */
export function searchUniversalHistory({
  query,
  category = "alle",
  datePeriod = "alle",
  referenceDate,
  workoutSessions,
  workoutSets = [],
  exercises = [],
  cardioSessions,
  mealLogs,
  measurements,
}: UniversalSearchParams): UniversalSearchResult[] {
  const trimmed = query.trim().toLowerCase();
  const searchTerms = trimmed.split(/\s+/).filter((t) => t.length > 0);

  // Datumfilter berekenen indien van toepassing
  let minDate = "";
  if (datePeriod !== "alle" && referenceDate) {
    const days =
      datePeriod === "7d"
        ? 7
        : datePeriod === "30d"
        ? 30
        : datePeriod === "90d"
        ? 90
        : 365;

    const ref = parseLocalDate(referenceDate);
    ref.setDate(ref.getDate() - days);
    const y = ref.getFullYear();
    const m = String(ref.getMonth() + 1).padStart(2, "0");
    const d = String(ref.getDate()).padStart(2, "0");
    minDate = `${y}-${m}-${d}`;
  }

  const results: UniversalSearchResult[] = [];

  // Helper voor datumformattering
  const formatDate = (dateStr: string) => {
    try {
      const d = parseLocalDate(dateStr);
      return d.toLocaleDateString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  // Helper voor token matching
  const matchesSearch = (text: string): boolean => {
    if (searchTerms.length === 0) return true;
    const lower = text.toLowerCase();
    return searchTerms.every((term) => lower.includes(term));
  };

  // 1. KRACHTTRAINING ZOEKEN
  if (category === "alle" || category === "kracht") {
    // Map exerciseId -> exerciseName
    const exerciseNamesMap = new Map<string, string>();
    for (const ex of exercises) {
      exerciseNamesMap.set(ex.id, ex.name);
    }

    for (const session of workoutSessions) {
      if (minDate && session.calendarDate < minDate) continue;

      const routineName = session.snapshot?.routineName || "Vrije Training";
      const exerciseNames =
        session.snapshot?.exercises?.map((e) => e.exerciseName).join(", ") || "";
      const notes = session.notes || "";
      const searchable = `${routineName} ${exerciseNames} ${notes} ${session.calendarDate}`;

      if (matchesSearch(searchable)) {
        let score = 10;
        let snippet = "";

        if (routineName.toLowerCase().includes(trimmed)) score += 20;
        if (exerciseNames.toLowerCase().includes(trimmed)) {
          score += 15;
          snippet = `Bevat: ${exerciseNames}`;
        }
        if (notes.toLowerCase().includes(trimmed)) {
          score += 10;
          snippet = snippet ? `${snippet} • "${notes}"` : `Notitie: "${notes}"`;
        }

        const setsCount = session.snapshot?.exercises?.reduce(
          (acc, ex) => acc + (ex.targetSets || 0),
          0
        );

        results.push({
          id: session.id,
          category: "kracht",
          title: routineName,
          subtitle: `${session.snapshot?.exercises?.length || 0} oefeningen`,
          calendarDate: session.calendarDate,
          formattedDate: formatDate(session.calendarDate),
          matchSnippet: snippet || `Status: ${session.status}`,
          targetUrl: `/training`,
          metaBadge: `${session.overallRpe ? `RPE ${session.overallRpe}` : session.status}`,
          score,
        });
      }
    }
  }

  // 2. CARDIO ZOEKEN
  if (category === "alle" || category === "cardio") {
    for (const session of cardioSessions) {
      if (minDate && session.calendarDate < minDate) continue;

      const actType = session.activityType || "Cardio";
      const notes = session.notes || "";
      const km = session.distanceMeters ? (session.distanceMeters / 1000).toFixed(1) : null;
      const mins = session.durationSeconds ? Math.round(session.durationSeconds / 60) : null;
      const searchable = `${actType} ${notes} ${km ? `${km} km` : ""} ${session.calendarDate}`;

      if (matchesSearch(searchable)) {
        let score = 10;
        if (actType.toLowerCase().includes(trimmed)) score += 20;
        if (notes.toLowerCase().includes(trimmed)) score += 15;

        const distanceStr = km ? `${km} km` : `${mins || 0} min`;
        const burnedStr = session.estimatedCaloriesBurned
          ? `${session.estimatedCaloriesBurned} kcal`
          : "";

        results.push({
          id: session.id,
          category: "cardio",
          title: capitalizeFirstLetter(actType),
          subtitle: `${distanceStr}${mins ? ` (${mins} min)` : ""}`,
          calendarDate: session.calendarDate,
          formattedDate: formatDate(session.calendarDate),
          matchSnippet: notes ? `Notitie: "${notes}"` : undefined,
          targetUrl: `/cardio`,
          metaBadge: burnedStr || undefined,
          score,
        });
      }
    }
  }

  // 3. VOEDING ZOEKEN
  if (category === "alle" || category === "voeding") {
    for (const meal of mealLogs) {
      if (minDate && meal.calendarDate < minDate) continue;

      const mealType = capitalizeFirstLetter(meal.mealType);
      const itemNames = meal.items?.map((i) => i.foodName).join(", ") || "";
      const searchable = `${mealType} ${itemNames} ${meal.calendarDate}`;

      if (matchesSearch(searchable)) {
        let score = 10;
        if (itemNames.toLowerCase().includes(trimmed)) score += 20;
        if (mealType.toLowerCase().includes(trimmed)) score += 10;

        results.push({
          id: meal.id,
          category: "voeding",
          title: `${mealType} (${meal.totalCalories} kcal)`,
          subtitle: `${meal.items?.length || 0} product(en): ${itemNames.slice(0, 60)}${
            itemNames.length > 60 ? "..." : ""
          }`,
          calendarDate: meal.calendarDate,
          formattedDate: formatDate(meal.calendarDate),
          matchSnippet: itemNames ? `Producten: ${itemNames}` : undefined,
          targetUrl: `/voeding`,
          metaBadge: `${meal.totalCalories} kcal`,
          score,
        });
      }
    }
  }

  // 4. METINGEN ZOEKEN
  if (category === "alle" || category === "meting") {
    for (const measurement of measurements) {
      if (minDate && measurement.calendarDate < minDate) continue;

      const weightStr = `${measurement.weightKg} kg`;
      const notes = measurement.notes || "";
      const searchable = `gewicht weging ${weightStr} ${notes} ${measurement.calendarDate}`;

      if (matchesSearch(searchable)) {
        let score = 10;
        if (notes.toLowerCase().includes(trimmed)) score += 15;
        if (trimmed.includes("gewicht") || trimmed.includes("weging")) score += 20;

        results.push({
          id: measurement.id,
          category: "meting",
          title: `Lichaamsgewicht: ${weightStr}`,
          subtitle: measurement.bodyFatPercentage
            ? `Vetpercentage: ${measurement.bodyFatPercentage}%`
            : "Weging geregistreerd",
          calendarDate: measurement.calendarDate,
          formattedDate: formatDate(measurement.calendarDate),
          matchSnippet: notes ? `Notitie: "${notes}"` : undefined,
          targetUrl: `/profiel`,
          metaBadge: `${measurement.weightKg} kg`,
          score,
        });
      }
    }
  }

  // Sorteer resultaten: eerst op score aflopend, daarna op datum aflopend
  return results.sort((a, b) => {
    if (searchTerms.length > 0 && b.score !== a.score) {
      return b.score - a.score;
    }
    return b.calendarDate.localeCompare(a.calendarDate);
  });
}

function capitalizeFirstLetter(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}
