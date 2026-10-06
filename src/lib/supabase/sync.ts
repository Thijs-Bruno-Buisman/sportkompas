import { supabase } from "./client";
import { db } from "@/lib/db/dexie";
import type { User } from "@supabase/supabase-js";

export interface SyncStatus {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  error: string | null;
}

/**
 * Synchroniseert lokale IndexedDB gegevens veilig met Supabase PostgreSQL.
 * Werkt uitsluitend als er een ingelogde gebruiker is en verbinding aanwezig is.
 */
export async function syncLocalDataWithSupabase(user: User): Promise<{ success: boolean; error?: string }> {
  if (!supabase || !user) {
    return { success: false, error: "Niet ingelogd of geen Supabase verbinding." };
  }

  try {
    const userId = user.id;

    // 1. Synchroniseer Profiel
    const localProfile = await db.profiles.toCollection().first();
    if (localProfile) {
      await supabase.from("profiles").upsert({
        id: userId,
        name: localProfile.name,
        birth_date: localProfile.birthDate,
        gender: localProfile.gender,
        height_meters: localProfile.heightMeters,
        start_weight_kg: localProfile.startWeightKg,
        target_weight_kg: localProfile.targetWeightKg,
        activity_level: localProfile.activityLevel,
        primary_goal: localProfile.primaryGoal,
        experience_level: localProfile.experienceLevel,
        strength_days_per_week: localProfile.strengthDaysPerWeek,
        cardio_days_per_week: localProfile.cardioDaysPerWeek,
        available_equipment: localProfile.availableEquipment,
        unit_preference: localProfile.unitPreference,
        formula_preference: localProfile.formulaPreference,
        onboarding_completed: localProfile.onboardingCompleted,
        updated_at: new Date().toISOString(),
      });
    }

    // 2. Synchroniseer Workouts (Laatste 50 sessies)
    const localWorkouts = await db.workoutSessions.toArray();
    if (localWorkouts.length > 0) {
      const payload = localWorkouts.map((w) => ({
        id: w.id,
        user_id: userId,
        calendar_date: w.calendarDate,
        start_time: w.startTime,
        end_time: w.endTime,
        status: w.status,
        current_exercise_index: w.currentExerciseIndex || 0,
        routine_id: w.routineId,
        routine_day_id: w.routineDayId,
        duration_minutes: w.durationMinutes,
        snapshot: w.snapshot,
        overall_rpe: w.overallRpe,
        notes: w.notes,
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("workout_sessions").upsert(payload);
    }

    // 3. Synchroniseer Workout Sets
    const localSets = await db.workoutSets.toArray();
    if (localSets.length > 0) {
      const setsPayload = localSets.map((s) => ({
        id: s.id,
        user_id: userId,
        session_id: s.sessionId,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        set_type: s.setType,
        weight_kg: s.weightKg,
        reps: s.reps,
        duration_seconds: s.durationSeconds,
        target_rpe: s.targetRpe,
        actual_rpe: s.actualRpe,
        rest_time_seconds: s.restTimeSeconds,
        completed: s.completed,
        completed_at: s.completedAt,
        logged_at: s.loggedAt,
      }));
      await supabase.from("workout_sets").upsert(setsPayload);
    }

    // 4. Synchroniseer Cardio
    const localCardio = await db.cardioSessions.toArray();
    if (localCardio.length > 0) {
      const cardioPayload = localCardio.map((c) => ({
        id: c.id,
        user_id: userId,
        calendar_date: c.calendarDate,
        start_time: c.startTime,
        end_time: c.endTime,
        activity_type: c.activityType,
        distance_meters: c.distanceMeters,
        duration_seconds: c.durationSeconds,
        avg_heart_rate_bpm: c.avgHeartRateBpm,
        max_heart_rate_bpm: c.maxHeartRateBpm,
        estimated_calories_burned: c.estimatedCaloriesBurned,
        elevation_gain_meters: c.elevationGainMeters,
        cadence_rpm: c.cadenceRpm,
        rpe: c.rpe,
        notes: c.notes,
        status: c.status || "afgerond",
        updated_at: new Date().toISOString(),
      }));
      await supabase.from("cardio_sessions").upsert(cardioPayload);
    }

    // 5. Synchroniseer Maaltijden
    const localMeals = await db.mealLogs.toArray();
    if (localMeals.length > 0) {
      const mealsPayload = localMeals.map((m) => ({
        id: m.id,
        user_id: userId,
        calendar_date: m.calendarDate,
        meal_type: m.mealType,
        items: m.items,
        total_calories: m.totalCalories,
        total_protein_grams: m.totalProteinGrams,
        total_carbs_grams: m.totalCarbsGrams,
        total_fat_grams: m.totalFatGrams,
        total_fiber_grams: m.totalFiberGrams || 0,
        logged_at: m.loggedAt,
      }));
      await supabase.from("meal_logs").upsert(mealsPayload);
    }

    // 6. Synchroniseer Water
    const localWater = await db.waterLogs.toArray();
    if (localWater.length > 0) {
      const waterPayload = localWater.map((w) => ({
        id: w.id,
        user_id: userId,
        calendar_date: w.calendarDate,
        amount_ml: w.amountMl,
        logged_at: w.loggedAt,
      }));
      await supabase.from("water_logs").upsert(waterPayload);
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("Fout tijdens synchronisatie met Supabase:", err);
    return { success: false, error: errorMsg };
  }
}

