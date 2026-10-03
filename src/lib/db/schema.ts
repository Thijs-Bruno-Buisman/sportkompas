import { z } from "zod";

// ISO UTC timestamp Regex (YYYY-MM-DDTHH:mm:ss...)
const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/;
// Calendar date Regex (YYYY-MM-DD)
const calendarDateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Provenance Schema
export const ProvenanceSchema = z.object({
  source: z.enum([
    "user",
    "system",
    "ai",
    "import_csv",
    "import_gpx",
    "strava",
    "demo",
  ]),
  isDemo: z.boolean().optional(),
  externalId: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  proposedAt: z.string().regex(isoDateRegex).optional(),
  acceptedAt: z.string().regex(isoDateRegex).optional(),
  notes: z.string().optional(),
});

// Profile Schema
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  birthDate: z.string().regex(calendarDateRegex).nullable(),
  gender: z.enum(["man", "vrouw", "anders", "onbekend"]),
  heightMeters: z.number().min(0.5).max(2.8).nullable(),
  startWeightKg: z.number().min(20).max(400).nullable(),
  targetWeightKg: z.number().min(20).max(400).nullable(),
  activityLevel: z.enum([
    "sedentair",
    "licht",
    "gemiddeld",
    "zeer",
    "onbekend",
  ]),
  primaryGoal: z.enum([
    "kracht",
    "spieropbouw",
    "conditie",
    "afvallen",
    "fit_blijven",
    "onbekend",
  ]),
  experienceLevel: z.enum(["beginner", "gemiddeld", "gevorderd", "onbekend"]),
  strengthDaysPerWeek: z.number().int().min(0).max(7),
  cardioDaysPerWeek: z.number().int().min(0).max(7),
  availableEquipment: z.array(
    z.enum([
      "barbell",
      "dumbbell",
      "kabel",
      "machine",
      "lichaamsgewicht",
      "elastiek",
      "cardio_apparatuur",
    ])
  ),
  unitPreference: z.enum(["metric", "imperial"]),
  formulaPreference: z.enum(["mifflin_st_jeor", "katch_mcardle", "onbekend"]),
  onboardingCompleted: z.boolean(),
  provenance: ProvenanceSchema.optional(),
  createdAt: z.string().regex(isoDateRegex),
  updatedAt: z.string().regex(isoDateRegex),
});

// Exercise Measurement Type Schema
export const ExerciseMeasurementTypeSchema = z.enum([
  "gewicht_herhalingen",
  "lichaamsgewicht",
  "extra_gewicht",
  "assisted",
  "tijd",
]);

export const MuscleGroupSchema = z.enum([
  "borst",
  "rug",
  "benen",
  "schouders",
  "armen",
  "core",
  "kuiten",
  "cardio",
  "full_body",
]);

export const EquipmentEnumSchema = z.enum([
  "geen",
  "lichaamsgewicht",
  "barbell",
  "dumbbell",
  "kettlebell",
  "kabel",
  "machine",
  "elastiek",
  "overig",
]);

// Exercise Schema
export const ExerciseSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Oefeningnaam is verplicht"),
  alternativeNames: z.array(z.string()).default([]),
  category: z.enum(["kracht", "cardio", "lichaamsgewicht", "stretching"]),
  primaryMuscleGroup: MuscleGroupSchema,
  secondaryMuscleGroups: z.array(MuscleGroupSchema),
  equipment: EquipmentEnumSchema,
  measurementType: ExerciseMeasurementTypeSchema.default("gewicht_herhalingen"),
  isCustom: z.boolean(),
  isArchived: z.boolean().default(false),
  instructions: z.string(),
  techniqueNotes: z.string().optional(),
  videoUrl: z.string().url().or(z.literal("")).nullable().optional(),
  provenance: ProvenanceSchema,
  createdAt: z.string().regex(isoDateRegex),
  updatedAt: z.string().regex(isoDateRegex).optional(),
});

// Routine & Day Schemas
export const PlannedExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  exerciseName: z.string(),
  measurementType: ExerciseMeasurementTypeSchema.optional(),
  targetSets: z.number().int().min(1).max(20),
  targetRepsMin: z.number().int().min(1).max(100).optional(),
  targetRepsMax: z.number().int().min(1).max(100).optional(),
  targetDurationSeconds: z.number().int().min(1).max(3600).optional(),
  targetWeightKg: z.number().min(0).max(1000).nullable().optional(),
  effortScale: z.enum(["geen", "rpe", "rir"]).optional(),
  targetRpe: z.number().min(1).max(10).nullable().optional(),
  targetRir: z.number().int().min(0).max(10).nullable().optional(),
  restSeconds: z.number().int().min(0).max(600),
  notes: z.string().optional(),
});

export const RoutineDaySchema = z.object({
  id: z.string().uuid(),
  routineId: z.string().uuid(),
  dayIndex: z.number().int().min(1),
  name: z.string().min(1),
  plannedExercises: z.array(PlannedExerciseSchema),
  createdAt: z.string().regex(isoDateRegex),
});

export const WorkoutRoutineSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Schemanaam is verplicht"),
  description: z.string().optional().default(""),
  version: z.number().int().min(1),
  isActive: z.boolean(),
  isArchived: z.boolean().optional().default(false),
  provenance: ProvenanceSchema,
  createdAt: z.string().regex(isoDateRegex),
  updatedAt: z.string().regex(isoDateRegex),
});

export const ScheduledSessionStatusSchema = z.enum([
  "gepland",
  "afgerond",
  "geannuleerd",
  "overgeslagen",
]);

export const ScheduledSessionSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  routineId: z.string().uuid(),
  routineDayId: z.string().uuid(),
  routineVersion: z.number().int().optional(),
  status: ScheduledSessionStatusSchema,
  completedSessionId: z.string().uuid().nullable().optional(),
  notes: z.string().optional().default(""),
  createdAt: z.string().regex(isoDateRegex),
  updatedAt: z.string().regex(isoDateRegex).optional(),
});

// Workout Session & Set Schemas
export const WorkoutExerciseSnapshotSchema = z.object({
  exerciseId: z.string().uuid(),
  exerciseName: z.string(),
  primaryMuscleGroup: z.string(),
  measurementType: z
    .enum([
      "gewicht_herhalingen",
      "lichaamsgewicht",
      "extra_gewicht",
      "assisted",
      "tijd",
    ])
    .optional(),
  effortScale: z.enum(["geen", "rpe", "rir"]).optional(),
  targetSets: z.number().int(),
  targetRepsMin: z.number().int().optional(),
  targetRepsMax: z.number().int().optional(),
  targetDurationSeconds: z.number().int().optional(),
  targetWeightKg: z.number().min(0).max(1000).nullable().optional(),
  targetRpe: z.number().min(1).max(10).nullable().optional(),
  targetRir: z.number().int().min(0).max(10).nullable().optional(),
  restSeconds: z.number().int(),
  notes: z.string().optional(),
});

export const WorkoutSessionSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  startTime: z.string().regex(isoDateRegex),
  startedAt: z.string().regex(isoDateRegex).optional(),
  endTime: z.string().regex(isoDateRegex).nullable(),
  cancelledAt: z.string().regex(isoDateRegex).nullable().optional(),
  status: z.enum(["actief", "afgerond", "geannuleerd"]),
  currentExerciseIndex: z.number().int().min(0).default(0).optional(),
  activeExerciseId: z.string().uuid().nullable().optional(),
  routineId: z.string().uuid().nullable(),
  routineDayId: z.string().uuid().nullable(),
  routineVersion: z.number().int().nullable(),
  scheduledSessionId: z.string().uuid().nullable().optional(),
  durationMinutes: z.number().int().min(0).nullable().optional(),
  snapshot: z.object({
    routineName: z.string().optional(),
    routineDayName: z.string().optional(),
    exercises: z.array(WorkoutExerciseSnapshotSchema),
  }),
  overallRpe: z.number().min(1).max(10).nullable(),
  notes: z.string(),
  provenance: ProvenanceSchema,
  updatedAt: z.string().regex(isoDateRegex).optional(),
});

export const WorkoutSetSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  exerciseId: z.string().uuid(),
  setNumber: z.number().int().min(1),
  setType: z.enum(["warmup", "normal", "drop", "failure"]),
  weightKg: z.number().min(0).max(1000),
  reps: z.number().int().min(0).max(500),
  durationSeconds: z.number().int().min(0).max(86400).nullable().optional(),
  targetRpe: z.number().min(1).max(10).nullable(),
  actualRpe: z.number().min(1).max(10).nullable(),
  targetRir: z.number().int().min(0).max(10).nullable().optional(),
  actualRir: z.number().int().min(0).max(10).nullable().optional(),
  isAssisted: z.boolean().optional(),
  restTimeSeconds: z.number().int().min(0).max(1200),
  completed: z.boolean(),
  completedAt: z.string().regex(isoDateRegex).nullable().optional(),
  loggedAt: z.string().regex(isoDateRegex),
});

// Cardio Schema
export const CardioActivityTypeSchema = z.enum([
  "hardlopen",
  "fietsen",
  "roeien",
  "wandelen",
  "zwemmen",
  "crosstrainer",
  "overig",
]);

export const CardioSessionSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  startTime: z.string().regex(isoDateRegex),
  endTime: z.string().regex(isoDateRegex).nullable(),
  activityType: CardioActivityTypeSchema,
  distanceMeters: z.number().min(0),
  durationSeconds: z.number().min(1),
  avgHeartRateBpm: z.number().int().min(30).max(250).nullable(),
  maxHeartRateBpm: z.number().int().min(30).max(250).nullable(),
  estimatedCaloriesBurned: z.number().min(0).nullable(),
  elevationGainMeters: z.number().nullable(),
  cadenceRpm: z.number().int().min(0).max(300).nullable().optional(),
  rpe: z.number().min(1).max(10).nullable(),
  notes: z.string(),
  status: z.enum(["gepland", "actief", "afgerond", "geannuleerd"]).optional().default("afgerond"),
  provenance: ProvenanceSchema,
  updatedAt: z.string().regex(isoDateRegex).optional(),
});

// Food & Meal Schemas
export const FoodItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  brand: z.string().nullable(),
  caloriesPer100g: z.number().min(0),
  proteinGramsPer100g: z.number().min(0),
  carbsGramsPer100g: z.number().min(0),
  fatGramsPer100g: z.number().min(0),
  fiberGramsPer100g: z.number().min(0),
  defaultPortionGrams: z.number().min(1),
  isCustom: z.boolean(),
  provenance: ProvenanceSchema,
  createdAt: z.string().regex(isoDateRegex),
});

export const MealItemEntrySchema = z.object({
  foodItemId: z.string().uuid(),
  foodName: z.string(),
  portionGrams: z.number().min(0.1),
  calories: z.number().min(0),
  proteinGrams: z.number().min(0),
  carbsGrams: z.number().min(0),
  fatGrams: z.number().min(0),
  fiberGrams: z.number().min(0),
});

export const MealLogSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  mealType: z.enum(["ontbijt", "lunch", "diner", "snacks"]),
  items: z.array(MealItemEntrySchema),
  totalCalories: z.number().min(0),
  totalProteinGrams: z.number().min(0),
  totalCarbsGrams: z.number().min(0),
  totalFatGrams: z.number().min(0),
  loggedAt: z.string().regex(isoDateRegex),
});

// Water & Measurements
export const WaterLogSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  amountMl: z.number().min(1).max(10000),
  loggedAt: z.string().regex(isoDateRegex),
});

export const BodyMeasurementSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  measuredAt: z.string().regex(isoDateRegex),
  weightKg: z.number().min(20).max(400),
  bodyFatPercentage: z.number().min(1).max(70).nullable(),
  chestMeters: z.number().min(0.2).max(2.5).nullable(),
  waistMeters: z.number().min(0.2).max(2.5).nullable(),
  hipsMeters: z.number().min(0.2).max(2.5).nullable(),
  armsMeters: z.number().min(0.1).max(1.0).nullable(),
  thighsMeters: z.number().min(0.1).max(1.5).nullable(),
  notes: z.string(),
  provenance: ProvenanceSchema,
});

export const RecoveryLogSchema = z.object({
  id: z.string().uuid(),
  calendarDate: z.string().regex(calendarDateRegex),
  loggedAt: z.string().regex(isoDateRegex),
  sleepDurationMinutes: z.number().int().min(0).max(1440).nullable(),
  sleepQualityRating: z.number().int().min(1).max(5).nullable(),
  restingHeartRateBpm: z.number().int().min(30).max(200).nullable(),
  sorenessRating: z.number().int().min(1).max(5).nullable(),
  stressRating: z.number().int().min(1).max(5).nullable(),
  notes: z.string(),
  provenance: ProvenanceSchema,
});

export const AppSettingsSchema = z.object({
  id: z.literal("app_settings"),
  theme: z.enum(["dark", "light", "system"]),
  unitPreference: z.enum(["metric", "imperial"]),
  restTimerSeconds: z.number().int().min(10).max(600),
  soundEnabled: z.boolean(),
  hapticFeedbackEnabled: z.boolean(),
  demoModeActive: z.boolean(),
  activeProgramRoutineId: z.string().uuid().nullable(),
  weekStartsOn: z.enum(["maandag", "zondag"]).default("maandag"),
  weeklyWorkoutGoal: z.number().int().min(1).max(7).default(3).optional(),
  favoriteExerciseIds: z.array(z.string()).default([]).optional(),
  lastBackupAt: z.string().regex(isoDateRegex).nullable(),
  updatedAt: z.string().regex(isoDateRegex),
});
