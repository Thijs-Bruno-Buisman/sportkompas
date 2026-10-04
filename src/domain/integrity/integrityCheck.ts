import type { SportKompasDatabase } from "@/lib/db/dexie";
import { TABLE_DISPLAY_NAMES } from "@/domain/backup/backup";

export type IntegritySeverity = "error" | "warning" | "info";

export interface IntegrityIssue {
  severity: IntegritySeverity;
  table: string;
  recordId?: string;
  message: string;
}

export interface TableIntegrityStat {
  tableName: string;
  displayName: string;
  recordCount: number;
  issueCount: number;
  status: "gezond" | "waarschuwing" | "fout";
}

export interface DatabaseIntegrityReport {
  status: "gezond" | "aandacht" | "beschadigd";
  healthScore: number; // 0..100
  checkedAt: string; // ISO
  schemaVersion: number;
  databaseName: string;
  totalRecords: number;
  totalTables: number;
  tableStats: TableIntegrityStat[];
  issues: IntegrityIssue[];
  summary: {
    errorsCount: number;
    warningsCount: number;
    infoCount: number;
  };
}

/**
 * Valideert of een datumstring het formaat YYYY-MM-DD heeft.
 */
function isValidDateString(dateStr: string): boolean {
  if (!dateStr || typeof dateStr !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

/**
 * Valideert of een string een geldige ISO timestamp is.
 */
function isValidIsoString(isoStr: string): boolean {
  if (!isoStr || typeof isoStr !== "string") return false;
  const d = new Date(isoStr);
  return !isNaN(d.getTime());
}

/**
 * Voert een diepgaande integriteitscontrole uit over alle tabellen, relaties en velden in Dexie.
 */
export async function runDatabaseIntegrityCheck(
  db: SportKompasDatabase
): Promise<DatabaseIntegrityReport> {
  const issues: IntegrityIssue[] = [];
  const checkedAt = new Date().toISOString();
  const schemaVersion = db.verno;

  // 1. Haal alle records parallel op uit de 16 tabellen
  const [
    profiles,
    exercises,
    workoutRoutines,
    routineDays,
    scheduledSessions,
    workoutSessions,
    workoutSets,
    cardioSessions,
    goals,
    foodItems,
    recipes,
    mealLogs,
    plannedMeals,
    waterLogs,
    bodyMeasurements,
    recoveryLogs,
    appSettings,
  ] = await Promise.all([
    db.profiles.toArray(),
    db.exercises.toArray(),
    db.workoutRoutines.toArray(),
    db.routineDays.toArray(),
    db.scheduledSessions.toArray(),
    db.workoutSessions.toArray(),
    db.workoutSets.toArray(),
    db.cardioSessions.toArray(),
    db.goals.toArray(),
    db.foodItems.toArray(),
    db.recipes.toArray(),
    db.mealLogs.toArray(),
    db.plannedMeals.toArray(),
    db.waterLogs.toArray(),
    db.bodyMeasurements.toArray(),
    db.recoveryLogs.toArray(),
    db.appSettings.toArray(),
  ]);

  // Id-sets voor snelle referentiële integriteitscontroles
  const exerciseIds = new Set(exercises.map((e) => e.id));
  const sessionIds = new Set(workoutSessions.map((s) => s.id));
  const routineIds = new Set(workoutRoutines.map((r) => r.id));
  const foodItemIds = new Set(foodItems.map((f) => f.id));

  // --- A. Controles op Profiles ---
  for (const p of profiles) {
    if (!p.id) {
      issues.push({ severity: "error", table: "profiles", message: "Profiel heeft geen uniek ID." });
    }
    if (p.heightMeters !== null && (p.heightMeters < 0.5 || p.heightMeters > 2.6)) {
      issues.push({
        severity: "warning",
        table: "profiles",
        recordId: p.id,
        message: `Ongebruikelijke lichaamslengte (${p.heightMeters} m).`,
      });
    }
    if (p.startWeightKg !== null && (p.startWeightKg < 20 || p.startWeightKg > 400)) {
      issues.push({
        severity: "warning",
        table: "profiles",
        recordId: p.id,
        message: `Ongebruikelijk startgewicht (${p.startWeightKg} kg).`,
      });
    }
  }

  // --- B. Controles op Exercises ---
  for (const ex of exercises) {
    if (!ex.id) {
      issues.push({ severity: "error", table: "exercises", message: "Oefening mist ID." });
    }
    if (!ex.name || ex.name.trim() === "") {
      issues.push({ severity: "error", table: "exercises", recordId: ex.id, message: "Oefening heeft een lege naam." });
    }
    if (!ex.primaryMuscleGroup) {
      issues.push({
        severity: "warning",
        table: "exercises",
        recordId: ex.id,
        message: `Oefening '${ex.name}' mist een primaire spiergroep.`,
      });
    }
  }

  // --- C. Controles op Workout Routines & Dagen ---
  for (const r of workoutRoutines) {
    if (!r.id) {
      issues.push({ severity: "error", table: "workoutRoutines", message: "Schema mist ID." });
    }
    if (!r.name || r.name.trim() === "") {
      issues.push({ severity: "warning", table: "workoutRoutines", recordId: r.id, message: "Schema heeft geen naam." });
    }
  }

  for (const rd of routineDays) {
    if (!rd.id) {
      issues.push({ severity: "error", table: "routineDays", message: "Schemadag mist ID." });
    }
    if (!routineIds.has(rd.routineId)) {
      issues.push({
        severity: "error",
        table: "routineDays",
        recordId: rd.id,
        message: `Schemadag '${rd.name}' verwijst naar niet-bestaand schema (routineId: ${rd.routineId}).`,
      });
    }
  }

  // --- D. Controles op Workout Sessions ---
  for (const s of workoutSessions) {
    if (!s.id) {
      issues.push({ severity: "error", table: "workoutSessions", message: "Workoutsessie mist ID." });
    }
    if (!isValidDateString(s.calendarDate)) {
      issues.push({
        severity: "error",
        table: "workoutSessions",
        recordId: s.id,
        message: `Ongeldige kalenderdatum '${s.calendarDate}'.`,
      });
    }
    if (s.startTime && !isValidIsoString(s.startTime)) {
      issues.push({
        severity: "warning",
        table: "workoutSessions",
        recordId: s.id,
        message: `Ongeldige startTime ISO string '${s.startTime}'.`,
      });
    }
    if (s.routineId && !routineIds.has(s.routineId)) {
      issues.push({
        severity: "info",
        table: "workoutSessions",
        recordId: s.id,
        message: `Workoutsessie is gekoppeld aan gearchiveerd of verwijderd schema (routineId: ${s.routineId}).`,
      });
    }
  }

  // --- E. Controles op Workout Sets (Referentiële integriteit) ---
  for (const set of workoutSets) {
    if (!set.id) {
      issues.push({ severity: "error", table: "workoutSets", message: "Set mist ID." });
    }
    if (!sessionIds.has(set.sessionId)) {
      issues.push({
        severity: "error",
        table: "workoutSets",
        recordId: set.id,
        message: `Wees-set (orphan): verwijst naar niet-bestaande sessie (${set.sessionId}).`,
      });
    }
    if (!exerciseIds.has(set.exerciseId)) {
      issues.push({
        severity: "warning",
        table: "workoutSets",
        recordId: set.id,
        message: `Set verwijst naar ontbrekende oefening (${set.exerciseId}).`,
      });
    }
    if (set.weightKg < 0) {
      issues.push({
        severity: "error",
        table: "workoutSets",
        recordId: set.id,
        message: `Negatief gewicht op set (${set.weightKg} kg).`,
      });
    }
    if (set.reps < 0) {
      issues.push({
        severity: "error",
        table: "workoutSets",
        recordId: set.id,
        message: `Negatieve herhalingen op set (${set.reps}).`,
      });
    }
  }

  // --- F. Controles op Cardio Sessions ---
  for (const c of cardioSessions) {
    if (!c.id) {
      issues.push({ severity: "error", table: "cardioSessions", message: "Cardiosessie mist ID." });
    }
    if (!isValidDateString(c.calendarDate)) {
      issues.push({
        severity: "error",
        table: "cardioSessions",
        recordId: c.id,
        message: `Ongeldige kalenderdatum '${c.calendarDate}'.`,
      });
    }
    if (c.distanceMeters < 0) {
      issues.push({
        severity: "error",
        table: "cardioSessions",
        recordId: c.id,
        message: `Negatieve afstand (${c.distanceMeters} m).`,
      });
    }
    if (c.durationSeconds <= 0) {
      issues.push({
        severity: "warning",
        table: "cardioSessions",
        recordId: c.id,
        message: `Duur van cardio is 0 of negatief (${c.durationSeconds} s).`,
      });
    }
  }

  // --- G. Controles op Voeding (MealLogs & PlannedMeals) ---
  for (const m of mealLogs) {
    if (!m.id) {
      issues.push({ severity: "error", table: "mealLogs", message: "Maaltijdlog mist ID." });
    }
    if (!isValidDateString(m.calendarDate)) {
      issues.push({
        severity: "error",
        table: "mealLogs",
        recordId: m.id,
        message: `Ongeldige kalenderdatum '${m.calendarDate}'.`,
      });
    }
    if (m.totalCalories < 0) {
      issues.push({
        severity: "error",
        table: "mealLogs",
        recordId: m.id,
        message: `Negatief aantal calorieën (${m.totalCalories}).`,
      });
    }
    // Controleer losse items op foodItemId
    if (m.items) {
      for (const item of m.items) {
        if (item.foodItemId && !foodItemIds.has(item.foodItemId)) {
          issues.push({
            severity: "info",
            table: "mealLogs",
            recordId: m.id,
            message: `Maaltijditem '${item.foodName}' verwijst naar niet-geïndexeerd product (${item.foodItemId}).`,
          });
        }
      }
    }
  }

  for (const pm of plannedMeals) {
    if (!pm.id) {
      issues.push({ severity: "error", table: "plannedMeals", message: "Geplande maaltijd mist ID." });
    }
    if (!isValidDateString(pm.calendarDate)) {
      issues.push({
        severity: "error",
        table: "plannedMeals",
        recordId: pm.id,
        message: `Ongeldige kalenderdatum '${pm.calendarDate}'.`,
      });
    }
  }

  // --- H. Controles op Water, Metingen & Herstel ---
  for (const w of waterLogs) {
    if (!w.id) {
      issues.push({ severity: "error", table: "waterLogs", message: "Waterlog mist ID." });
    }
    if (w.amountMl <= 0) {
      issues.push({
        severity: "warning",
        table: "waterLogs",
        recordId: w.id,
        message: `Waterinname is 0 of negatief (${w.amountMl} ml).`,
      });
    }
  }

  for (const bm of bodyMeasurements) {
    if (!bm.id) {
      issues.push({ severity: "error", table: "bodyMeasurements", message: "Lichaamsmeting mist ID." });
    }
    if (!isValidDateString(bm.calendarDate)) {
      issues.push({
        severity: "error",
        table: "bodyMeasurements",
        recordId: bm.id,
        message: `Ongeldige kalenderdatum '${bm.calendarDate}'.`,
      });
    }
    if (bm.weightKg <= 0 || bm.weightKg > 400) {
      issues.push({
        severity: "warning",
        table: "bodyMeasurements",
        recordId: bm.id,
        message: `Ongebruikelijk gewicht bij meting (${bm.weightKg} kg).`,
      });
    }
  }

  for (const rec of recoveryLogs) {
    if (!rec.id) {
      issues.push({ severity: "error", table: "recoveryLogs", message: "Herstellog mist ID." });
    }
    if (!isValidDateString(rec.calendarDate)) {
      issues.push({
        severity: "error",
        table: "recoveryLogs",
        recordId: rec.id,
        message: `Ongeldige kalenderdatum '${rec.calendarDate}'.`,
      });
    }
  }

  // Samenvatting en categorisering
  const errorsCount = issues.filter((i) => i.severity === "error").length;
  const warningsCount = issues.filter((i) => i.severity === "warning").length;
  const infoCount = issues.filter((i) => i.severity === "info").length;

  let status: DatabaseIntegrityReport["status"] = "gezond";
  if (errorsCount > 0) {
    status = "beschadigd";
  } else if (warningsCount > 0) {
    status = "aandacht";
  }

  // Gezondheidsscore berekenen (100 min strafpunten)
  const healthScore = Math.max(0, Math.min(100, 100 - errorsCount * 15 - warningsCount * 3));

  const tableDataMap: Record<string, unknown[]> = {
    profiles,
    exercises,
    workoutRoutines,
    routineDays,
    scheduledSessions,
    workoutSessions,
    workoutSets,
    cardioSessions,
    goals,
    foodItems,
    recipes,
    mealLogs,
    plannedMeals,
    waterLogs,
    bodyMeasurements,
    recoveryLogs,
    appSettings,
  };

  const tableStats: TableIntegrityStat[] = Object.keys(tableDataMap).map((tableKey) => {
    const records = tableDataMap[tableKey] || [];
    const tableIssues = issues.filter((i) => i.table === tableKey);
    const hasErrors = tableIssues.some((i) => i.severity === "error");
    const hasWarnings = tableIssues.some((i) => i.severity === "warning");

    let tableStatus: TableIntegrityStat["status"] = "gezond";
    if (hasErrors) tableStatus = "fout";
    else if (hasWarnings) tableStatus = "waarschuwing";

    return {
      tableName: tableKey,
      displayName: TABLE_DISPLAY_NAMES[tableKey] || tableKey,
      recordCount: records.length,
      issueCount: tableIssues.length,
      status: tableStatus,
    };
  });

  const totalRecords = tableStats.reduce((acc, t) => acc + t.recordCount, 0);

  return {
    status,
    healthScore,
    checkedAt,
    schemaVersion,
    databaseName: db.name,
    totalRecords,
    totalTables: tableStats.length,
    tableStats,
    issues,
    summary: {
      errorsCount,
      warningsCount,
      infoCount,
    },
  };
}

/**
 * Optionele veilige reparatiefunctie:
 * Ruimt wees-sets (orphans) op waarvan de workoutSession definitief niet meer bestaat.
 */
export async function repairOrphanedWorkoutSets(
  db: SportKompasDatabase
): Promise<{ repairedCount: number }> {
  const sessions = await db.workoutSessions.toArray();
  const sessionIds = new Set(sessions.map((s) => s.id));
  const sets = await db.workoutSets.toArray();

  const orphanedSetIds: string[] = [];
  for (const set of sets) {
    if (!sessionIds.has(set.sessionId)) {
      orphanedSetIds.push(set.id);
    }
  }

  if (orphanedSetIds.length > 0) {
    await db.workoutSets.bulkDelete(orphanedSetIds);
  }

  return { repairedCount: orphanedSetIds.length };
}
