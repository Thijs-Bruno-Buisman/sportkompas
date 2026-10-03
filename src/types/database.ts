/**
 * SportKompas Datamodel & Typen
 * Alle eenheden zijn strikt canoniek:
 * - Gewichten in kilogrammen (kg)
 * - Afstanden in meters (m)
 * - Tijden en duur in seconden (s)
 * - Voedingsstoffen in grammen (g) en energie in kcal
 * - Kalenderdagen als 'YYYY-MM-DD'
 * - Exacte tijdstippen als UTC ISO-8601 strings
 */

export type EntityId = string;

// Herkomst van een entiteit of voorstel
export interface Provenance {
  source:
    | "user"
    | "system"
    | "ai"
    | "import_csv"
    | "import_gpx"
    | "strava"
    | "demo";
  isDemo?: boolean;
  externalId?: string;
  confidence?: number; // 0..1 voor AI-voorstellen
  proposedAt?: string; // UTC ISO timestamp
  acceptedAt?: string; // UTC ISO timestamp
  notes?: string;
}

export type TrainingGoal =
  | "kracht"
  | "spieropbouw"
  | "conditie"
  | "afvallen"
  | "fit_blijven"
  | "onbekend";

export type ExperienceLevel =
  | "beginner"
  | "gemiddeld"
  | "gevorderd"
  | "onbekend";

export type EquipmentType =
  | "barbell"
  | "dumbbell"
  | "kabel"
  | "machine"
  | "lichaamsgewicht"
  | "elastiek"
  | "cardio_apparatuur";

export type UnitPreference = "metric" | "imperial";

export type EnergyFormulaPreference =
  | "mifflin_st_jeor"
  | "katch_mcardle"
  | "onbekend";

// 1. Gebruikersprofiel
export interface Profile {
  id: EntityId;
  name: string; // Optioneel (mag leeg zijn "")
  birthDate: string | null; // YYYY-MM-DD (optioneel)
  gender: "man" | "vrouw" | "anders" | "onbekend";
  heightMeters: number | null; // Optioneel (bv. 1.82 voor 182 cm)
  startWeightKg: number | null; // Optioneel (bv. 80.0)
  targetWeightKg: number | null; // Optioneel
  activityLevel: "sedentair" | "licht" | "gemiddeld" | "zeer" | "onbekend";
  primaryGoal: TrainingGoal;
  experienceLevel: ExperienceLevel;
  strengthDaysPerWeek: number; // 0..7
  cardioDaysPerWeek: number; // 0..7
  availableEquipment: EquipmentType[];
  unitPreference: UnitPreference;
  formulaPreference: EnergyFormulaPreference;
  onboardingCompleted: boolean;
  provenance?: Provenance;
  createdAt: string; // UTC ISO
  updatedAt: string; // UTC ISO
}

export type ExerciseMeasurementType =
  | "gewicht_herhalingen"
  | "lichaamsgewicht"
  | "extra_gewicht"
  | "assisted"
  | "tijd";

// 2. Oefeningen
export interface Exercise {
  id: EntityId;
  name: string;
  alternativeNames?: string[];
  category: "kracht" | "cardio" | "lichaamsgewicht" | "stretching";
  primaryMuscleGroup:
    | "borst"
    | "rug"
    | "benen"
    | "schouders"
    | "armen"
    | "core"
    | "kuiten"
    | "cardio"
    | "full_body";
  secondaryMuscleGroups: (
    | "borst"
    | "rug"
    | "benen"
    | "schouders"
    | "armen"
    | "core"
    | "kuiten"
    | "cardio"
    | "full_body"
  )[];
  equipment:
    | "geen"
    | "lichaamsgewicht"
    | "barbell"
    | "dumbbell"
    | "kettlebell"
    | "kabel"
    | "machine"
    | "elastiek"
    | "overig";
  measurementType: ExerciseMeasurementType;
  isCustom: boolean;
  isArchived: boolean;
  instructions: string;
  techniqueNotes?: string; // Blijvende persoonlijke technieknotitie per oefening (Prompt 11)
  videoUrl?: string | null;
  provenance: Provenance;
  createdAt: string; // UTC ISO
  updatedAt?: string; // UTC ISO
}

// 3. Trainingsschema's (Routines)
export interface WorkoutRoutine {
  id: EntityId;
  name: string;
  description: string;
  version: number;
  isActive: boolean;
  isArchived?: boolean;
  provenance: Provenance;
  createdAt: string; // UTC ISO
  updatedAt: string; // UTC ISO
}

// 4. Schemadagen
export interface PlannedExerciseInDay {
  exerciseId: EntityId;
  exerciseName: string;
  measurementType?: ExerciseMeasurementType;
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetDurationSeconds?: number;
  targetWeightKg?: number | null;
  effortScale?: "geen" | "rpe" | "rir";
  targetRpe?: number | null;
  targetRir?: number | null;
  restSeconds: number;
  notes?: string;
}

export interface RoutineDay {
  id: EntityId;
  routineId: EntityId;
  dayIndex: number; // 1, 2, 3...
  name: string; // bv. "Push Day"
  plannedExercises: PlannedExerciseInDay[];
  createdAt: string; // UTC ISO
}

// 5. Geplande Sessies
export type ScheduledSessionStatus =
  | "gepland"
  | "afgerond"
  | "geannuleerd"
  | "overgeslagen";

export interface ScheduledSession {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  routineId: EntityId;
  routineDayId: EntityId;
  routineVersion?: number;
  status: ScheduledSessionStatus;
  completedSessionId?: EntityId | null; // Id van de gestarte/afgeronde WorkoutSession
  notes: string;
  createdAt: string; // UTC ISO
  updatedAt?: string; // UTC ISO
}

// 6. Workout Snapshot & Sessie
export interface WorkoutExerciseSnapshot {
  exerciseId: EntityId;
  exerciseName: string;
  primaryMuscleGroup: string;
  measurementType?: ExerciseMeasurementType;
  effortScale?: "geen" | "rpe" | "rir";
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetDurationSeconds?: number;
  targetWeightKg?: number | null;
  targetRpe?: number | null;
  targetRir?: number | null;
  restSeconds: number;
  notes?: string;
}

export interface WorkoutRoutineSnapshot {
  routineName?: string;
  routineDayName?: string;
  exercises: WorkoutExerciseSnapshot[];
}

export interface WorkoutSession {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  startTime: string; // UTC ISO (gestartOp)
  startedAt?: string; // Optionele expliciete alias voor gestartOp
  endTime: string | null; // UTC ISO
  cancelledAt?: string | null; // UTC ISO
  status: "actief" | "afgerond" | "geannuleerd";
  currentExerciseIndex?: number; // 0-based index in snapshot.exercises
  activeExerciseId?: EntityId | null; // UUID van de actieve oefening
  routineId: EntityId | null;
  routineDayId: EntityId | null;
  routineVersion: number | null;
  scheduledSessionId?: EntityId | null;
  durationMinutes?: number | null;
  snapshot: WorkoutRoutineSnapshot;
  overallRpe: number | null; // 1..10
  notes: string;
  provenance: Provenance;
  updatedAt?: string; // UTC ISO
}

// 7. Workout Sets
export interface WorkoutSet {
  id: EntityId;
  sessionId: EntityId;
  exerciseId: EntityId;
  setNumber: number;
  setType: "warmup" | "normal" | "drop" | "failure";
  weightKg: number;
  reps: number;
  durationSeconds?: number | null;
  targetRpe: number | null;
  actualRpe: number | null;
  targetRir?: number | null;
  actualRir?: number | null;
  isAssisted?: boolean;
  restTimeSeconds: number;
  completed: boolean;
  completedAt?: string | null;
  loggedAt: string; // UTC ISO
}

// 8. Cardio Sessies
export interface CardioSession {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  startTime: string; // UTC ISO
  endTime: string | null; // UTC ISO
  activityType:
    | "hardlopen"
    | "fietsen"
    | "roeien"
    | "wandelen"
    | "zwemmen"
    | "crosstrainer"
    | "overig";
  distanceMeters: number; // bv. 5000 voor 5 km
  durationSeconds: number; // bv. 1800 voor 30 min
  avgHeartRateBpm: number | null;
  maxHeartRateBpm: number | null;
  estimatedCaloriesBurned: number | null;
  elevationGainMeters: number | null;
  rpe: number | null;
  notes: string;
  provenance: Provenance;
}

// 9. Doelen
export interface Goal {
  id: EntityId;
  category: "gewicht" | "kracht" | "cardio" | "voeding";
  title: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string; // YYYY-MM-DD
  targetDate: string; // YYYY-MM-DD
  status: "actief" | "behaald" | "geannuleerd";
  notes: string;
  createdAt: string; // UTC ISO
}

// 10. Voeding (Voedingsmiddelen)
export interface FoodItem {
  id: EntityId;
  name: string;
  brand: string | null;
  caloriesPer100g: number;
  proteinGramsPer100g: number;
  carbsGramsPer100g: number;
  fatGramsPer100g: number;
  fiberGramsPer100g: number;
  defaultPortionGrams: number;
  isCustom: boolean;
  provenance: Provenance;
  createdAt: string; // UTC ISO
}

// 11. Maaltijdlogs
export interface MealItemEntry {
  foodItemId: EntityId;
  foodName: string;
  portionGrams: number;
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  fiberGrams: number;
}

export interface MealLog {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  mealType: "ontbijt" | "lunch" | "diner" | "snacks";
  items: MealItemEntry[];
  totalCalories: number;
  totalProteinGrams: number;
  totalCarbsGrams: number;
  totalFatGrams: number;
  loggedAt: string; // UTC ISO
}

// 12. Waterlogs
export interface WaterLog {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  amountMl: number; // bv. 250
  loggedAt: string; // UTC ISO
}

// 13. Lichaamsmetingen
export interface BodyMeasurement {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  measuredAt: string; // UTC ISO
  weightKg: number;
  bodyFatPercentage: number | null;
  chestMeters: number | null;
  waistMeters: number | null;
  hipsMeters: number | null;
  armsMeters: number | null;
  thighsMeters: number | null;
  notes: string;
  provenance: Provenance;
}

// 14. Herstel
export interface RecoveryLog {
  id: EntityId;
  calendarDate: string; // YYYY-MM-DD
  loggedAt: string; // UTC ISO
  sleepDurationMinutes: number | null;
  sleepQualityRating: number | null; // 1..5
  restingHeartRateBpm: number | null;
  sorenessRating: number | null; // 1..5
  stressRating: number | null; // 1..5
  notes: string;
  provenance: Provenance;
}

// 15. Applicatie-instellingen (Singleton record)
export interface AppSettings {
  id: "app_settings";
  theme: "dark" | "light" | "system";
  unitPreference: UnitPreference;
  restTimerSeconds: number;
  soundEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  demoModeActive: boolean;
  activeProgramRoutineId: EntityId | null;
  weekStartsOn?: "maandag" | "zondag";
  favoriteExerciseIds?: EntityId[];
  lastBackupAt: string | null; // UTC ISO
  updatedAt: string; // UTC ISO
}
