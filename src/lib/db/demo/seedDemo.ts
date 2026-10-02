import { SportKompasDatabase, getDatabase } from "../dexie";
import { generateDemoData } from "./demoData";

/**
 * Vult een SportKompasDatabase instantie met realistische, reproduceerbare voorbeelddata.
 * Wordt uitsluitend aangeroepen op de afgeschermde SportKompasDemoDB.
 */
export async function seedDemoDatabase(
  database: SportKompasDatabase = getDatabase(true),
  baseDate = new Date()
): Promise<void> {
  const data = generateDemoData(baseDate);

  await database.transaction(
    "rw",
    [
      database.profiles,
      database.exercises,
      database.workoutRoutines,
      database.routineDays,
      database.scheduledSessions,
      database.workoutSessions,
      database.workoutSets,
      database.cardioSessions,
      database.goals,
      database.foodItems,
      database.mealLogs,
      database.waterLogs,
      database.bodyMeasurements,
      database.recoveryLogs,
      database.appSettings,
    ],
    async () => {
      await database.profiles.put(data.profile);
      await database.exercises.bulkPut(data.exercises);
      await database.workoutRoutines.put(data.routine);
      await database.routineDays.bulkPut(data.routineDays);
      await database.scheduledSessions.bulkPut(data.scheduledSessions);
      await database.workoutSessions.bulkPut(data.workoutSessions);
      await database.workoutSets.bulkPut(data.workoutSets);
      await database.cardioSessions.bulkPut(data.cardioSessions);
      await database.goals.bulkPut(data.goals);
      await database.foodItems.bulkPut(data.foodItems);
      await database.mealLogs.bulkPut(data.mealLogs);
      await database.waterLogs.bulkPut(data.waterLogs);
      await database.bodyMeasurements.bulkPut(data.bodyMeasurements);
      await database.recoveryLogs.bulkPut(data.recoveryLogs);
      await database.appSettings.put(data.appSettings);
    }
  );
}

/**
 * Controleert of de demodatabase al gevuld is met data.
 */
export async function isDemoDatabaseSeeded(
  database: SportKompasDatabase = getDatabase(true)
): Promise<boolean> {
  try {
    await database.open();
    const count = await database.profiles.count();
    return count > 0;
  } catch (error) {
    console.error("Fout bij controleren van demodatabase:", error);
    return false;
  }
}

/**
 * Wist alle tabellen in de demodatabase en seed deze opnieuw.
 * Garandeert dat de echte SportKompasDB nooit geraakt of gewijzigd wordt.
 */
export async function resetDemoDatabase(
  database: SportKompasDatabase = getDatabase(true),
  baseDate = new Date()
): Promise<void> {
  await database.open();

  // Wis uitsluitend de tabellen van deze demodatabase
  await Promise.all(database.tables.map((table) => table.clear()));

  // Herbevolk met een schone set consistente voorbeelddata
  await seedDemoDatabase(database, baseDate);
}
