import type {
  Profile,
  Exercise,
  WorkoutRoutine,
  RoutineDay,
  ScheduledSession,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  Goal,
  FoodItem,
  MealLog,
  WaterLog,
  BodyMeasurement,
  RecoveryLog,
  AppSettings,
  Provenance,
} from "@/types/database";
import { DEFAULT_EXERCISES } from "@/domain/strength/defaultExercises";

const DEMO_PROVENANCE: Provenance = {
  source: "demo",
  isDemo: true,
};

// Helper functies voor reproduceerbare relatieve datums en tijdstippen
export function getRelativeDateStr(offsetDays: number, baseDate = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

export function getRelativeISO(
  offsetDays: number,
  hours = 12,
  minutes = 0,
  baseDate = new Date()
): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + offsetDays);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function generateDemoData(baseDate = new Date()) {
  const nowISO = baseDate.toISOString();

  // 1. DEMO PROFIEL (Alex)
  const profile: Profile = {
    id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901b001",
    name: "Alex (Voorbeeld)",
    birthDate: "1995-06-12",
    gender: "man",
    heightMeters: 1.84, // 184 cm
    startWeightKg: 82.5,
    targetWeightKg: 80.0,
    activityLevel: "gemiddeld",
    primaryGoal: "kracht",
    experienceLevel: "gevorderd",
    strengthDaysPerWeek: 4,
    cardioDaysPerWeek: 2,
    availableEquipment: ["barbell", "dumbbell", "kabel", "machine", "lichaamsgewicht"],
    unitPreference: "metric",
    formulaPreference: "mifflin_st_jeor",
    onboardingCompleted: true,
    provenance: DEMO_PROVENANCE,
    createdAt: getRelativeISO(-30, 9, 0, baseDate),
    updatedAt: nowISO,
  };

  // 2. DEMO OEFENINGEN (De 12 oefeningen die Alex specifiek in zijn schema en logs gebruikt)
  const exercises: Exercise[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e001",
      name: "Barbell Bench Press",
      alternativeNames: ["Bankdrukken", "Flat Bench Press"],
      category: "kracht",
      primaryMuscleGroup: "borst",
      secondaryMuscleGroups: ["schouders", "armen"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Lig stabiel op de bank, trek schouderbladen in en druk explosief uit.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e002",
      name: "Barbell Back Squat",
      alternativeNames: ["Kniebuigen", "Back Squat"],
      category: "kracht",
      primaryMuscleGroup: "benen",
      secondaryMuscleGroups: ["core", "rug"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Plaats de stang op de trapezius, zak gecontroleerd tot minimaal parallel.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e003",
      name: "Conventional Deadlift",
      alternativeNames: ["Deadlift", "Kruistillen"],
      category: "kracht",
      primaryMuscleGroup: "rug",
      secondaryMuscleGroups: ["benen", "core", "armen"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Voeten heupbreedte, rechte neutrale rug, heup- en knie-extensie synchroon.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e004",
      name: "Overhead Press (OHP)",
      alternativeNames: ["OHP", "Schouderdrukken", "Military Press"],
      category: "kracht",
      primaryMuscleGroup: "schouders",
      secondaryMuscleGroups: ["armen", "core"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Sta rechtop, span buikspieren aan en druk de stang strak verticaal uit.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e005",
      name: "Barbell Bent-Over Row",
      alternativeNames: ["Bent Over Row", "Voorovergebogen Roeien"],
      category: "kracht",
      primaryMuscleGroup: "rug",
      secondaryMuscleGroups: ["armen", "schouders"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Scharnier 45 graden voorover en trek de stang gecontroleerd naar de navel.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e006",
      name: "Pull-up",
      alternativeNames: ["Optrekken", "Chin-up"],
      category: "lichaamsgewicht",
      primaryMuscleGroup: "rug",
      secondaryMuscleGroups: ["armen", "core"],
      equipment: "lichaamsgewicht",
      measurementType: "lichaamsgewicht",
      isCustom: false,
      isArchived: false,
      instructions: "Volledig uithangen tot kin over de stang met gecontroleerde neerwaartse fase.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e007",
      name: "Incline Dumbbell Press",
      alternativeNames: ["Schuin Bankdrukken", "Incline DB Press"],
      category: "kracht",
      primaryMuscleGroup: "borst",
      secondaryMuscleGroups: ["schouders", "armen"],
      equipment: "dumbbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Bank op 30 graden, druk omhoog en knijp de bovenste borstvezels aan.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e008",
      name: "Romanian Deadlift (RDL)",
      alternativeNames: ["Roemeense Deadlift", "RDL"],
      category: "kracht",
      primaryMuscleGroup: "benen",
      secondaryMuscleGroups: ["rug", "core"],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Duw de heupen ver naar achteren voor diepe rek op hamstrings en glutes.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e009",
      name: "Dumbbell Lateral Raise",
      alternativeNames: ["Zijwaarts Heffen", "Side Raise"],
      category: "kracht",
      primaryMuscleGroup: "schouders",
      secondaryMuscleGroups: ["rug"],
      equipment: "dumbbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Breng de dumbbells zijwaarts omhoog tot schouderhoogte.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e010",
      name: "Barbell Bicep Curl",
      alternativeNames: ["Biceps Curl", "Barbell Curl"],
      category: "kracht",
      primaryMuscleGroup: "armen",
      secondaryMuscleGroups: [],
      equipment: "barbell",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Ellebogen stil langs de romp en knijp de biceps krachtig samen bovenin.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e011",
      name: "Triceps Cable Pushdown",
      alternativeNames: ["Triceps Pushdown", "Kabel Drukken"],
      category: "kracht",
      primaryMuscleGroup: "armen",
      secondaryMuscleGroups: [],
      equipment: "kabel",
      measurementType: "gewicht_herhalingen",
      isCustom: false,
      isArchived: false,
      instructions: "Duw het touw naar beneden en spreid de polsen onderaan.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901e012",
      name: "Plank",
      alternativeNames: ["Forearm Plank", "Buikspierplank"],
      category: "lichaamsgewicht",
      primaryMuscleGroup: "core",
      secondaryMuscleGroups: ["schouders", "benen"],
      equipment: "lichaamsgewicht",
      measurementType: "tijd",
      isCustom: false,
      isArchived: false,
      instructions: "Kaarsrechte lijn van schouders tot enkels, span buik en billen stevig aan.",
      videoUrl: null,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
  ];


  // 3. DEMO ROUTINE & SCHEMA
  const routineId = "e4a77e80-8b1b-4b10-9fc6-2b4a3901r001";
  const routine: WorkoutRoutine = {
    id: routineId,
    name: "Upper / Lower Kracht & Massa",
    description: "Gestructureerd 4-daags split programma voor progressieve overbelasting en hypertrofie.",
    version: 1,
    isActive: true,
    provenance: DEMO_PROVENANCE,
    createdAt: getRelativeISO(-30, 9, 0, baseDate),
    updatedAt: nowISO,
  };

  const day1Id = "e4a77e80-8b1b-4b10-9fc6-2b4a3901d001";
  const day2Id = "e4a77e80-8b1b-4b10-9fc6-2b4a3901d002";
  const day3Id = "e4a77e80-8b1b-4b10-9fc6-2b4a3901d003";
  const day4Id = "e4a77e80-8b1b-4b10-9fc6-2b4a3901d004";

  const routineDays: RoutineDay[] = [
    {
      id: day1Id,
      routineId,
      dayIndex: 1,
      name: "Upper A (Krachtfocus)",
      plannedExercises: [
        {
          exerciseId: exercises[0].id, // Bench
          exerciseName: exercises[0].name,
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetRpe: 8,
          restSeconds: 120,
        },
        {
          exerciseId: exercises[4].id, // Row
          exerciseName: exercises[4].name,
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetRpe: 8,
          restSeconds: 120,
        },
        {
          exerciseId: exercises[3].id, // OHP
          exerciseName: exercises[3].name,
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetRpe: 8,
          restSeconds: 90,
        },
        {
          exerciseId: exercises[9].id, // Curl
          exerciseName: exercises[9].name,
          targetSets: 3,
          targetRepsMin: 10,
          targetRepsMax: 12,
          targetRpe: 8,
          restSeconds: 60,
        },
      ],
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: day2Id,
      routineId,
      dayIndex: 2,
      name: "Lower A (Squat & Hamstrings)",
      plannedExercises: [
        {
          exerciseId: exercises[1].id, // Squat
          exerciseName: exercises[1].name,
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 8,
          targetRpe: 8.5,
          restSeconds: 150,
        },
        {
          exerciseId: exercises[7].id, // RDL
          exerciseName: exercises[7].name,
          targetSets: 4,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetRpe: 8,
          restSeconds: 120,
        },
        {
          exerciseId: exercises[11].id, // Plank
          exerciseName: exercises[11].name,
          targetSets: 3,
          targetRepsMin: 45,
          targetRepsMax: 60,
          restSeconds: 60,
        },
      ],
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: day3Id,
      routineId,
      dayIndex: 3,
      name: "Upper B (Hypertrofie)",
      plannedExercises: [
        {
          exerciseId: exercises[6].id, // Incline DB
          exerciseName: exercises[6].name,
          targetSets: 4,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetRpe: 8,
          restSeconds: 90,
        },
        {
          exerciseId: exercises[5].id, // Pull-up
          exerciseName: exercises[5].name,
          targetSets: 4,
          targetRepsMin: 6,
          targetRepsMax: 10,
          targetRpe: 8.5,
          restSeconds: 90,
        },
        {
          exerciseId: exercises[8].id, // Lateral raise
          exerciseName: exercises[8].name,
          targetSets: 4,
          targetRepsMin: 12,
          targetRepsMax: 15,
          restSeconds: 60,
        },
        {
          exerciseId: exercises[10].id, // Pushdown
          exerciseName: exercises[10].name,
          targetSets: 3,
          targetRepsMin: 10,
          targetRepsMax: 12,
          restSeconds: 60,
        },
      ],
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: day4Id,
      routineId,
      dayIndex: 4,
      name: "Lower B (Deadlift & Benen)",
      plannedExercises: [
        {
          exerciseId: exercises[2].id, // Deadlift
          exerciseName: exercises[2].name,
          targetSets: 4,
          targetRepsMin: 5,
          targetRepsMax: 5,
          targetRpe: 9,
          restSeconds: 180,
        },
        {
          exerciseId: exercises[1].id, // Squat volume
          exerciseName: exercises[1].name,
          targetSets: 3,
          targetRepsMin: 8,
          targetRepsMax: 10,
          targetRpe: 8,
          restSeconds: 120,
        },
      ],
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
  ];

  // 4. HISTORISCHE WORKOUT SESSIES & SETS (Reproduceerbare progressieve overload)
  const workoutSessions: WorkoutSession[] = [];
  const workoutSets: WorkoutSet[] = [];
  const scheduledSessions: ScheduledSession[] = [];

  // 12 trainingssessies over de afgelopen 4 weken
  const sessionConfigs = [
    // Week 1
    { offsetDays: -26, day: routineDays[0], benchKg: 77.5, squatKg: 0, deadliftKg: 0 },
    { offsetDays: -24, day: routineDays[1], benchKg: 0, squatKg: 95.0, deadliftKg: 0 },
    { offsetDays: -22, day: routineDays[3], benchKg: 0, squatKg: 0, deadliftKg: 120.0 },
    // Week 2
    { offsetDays: -19, day: routineDays[0], benchKg: 80.0, squatKg: 0, deadliftKg: 0 },
    { offsetDays: -17, day: routineDays[1], benchKg: 0, squatKg: 100.0, deadliftKg: 0 },
    { offsetDays: -15, day: routineDays[3], benchKg: 0, squatKg: 0, deadliftKg: 125.0 },
    // Week 3
    { offsetDays: -12, day: routineDays[0], benchKg: 82.5, squatKg: 0, deadliftKg: 0 },
    { offsetDays: -10, day: routineDays[1], benchKg: 0, squatKg: 105.0, deadliftKg: 0 },
    { offsetDays: -8, day: routineDays[3], benchKg: 0, squatKg: 0, deadliftKg: 130.0 },
    // Week 4
    { offsetDays: -5, day: routineDays[0], benchKg: 85.0, squatKg: 0, deadliftKg: 0 },
    { offsetDays: -3, day: routineDays[1], benchKg: 0, squatKg: 110.0, deadliftKg: 0 }, // Squat PR!
    { offsetDays: -2, day: routineDays[3], benchKg: 0, squatKg: 0, deadliftKg: 135.0 }, // Deadlift PR!
    { offsetDays: -1, day: routineDays[0], benchKg: 87.5, squatKg: 0, deadliftKg: 0 }, // Bench PR!
  ];

  sessionConfigs.forEach((cfg, idx) => {
    const sId = `e4a77e80-8b1b-4b10-9fc6-2b4a3901s${String(idx + 1).padStart(3, "0")}`;
    const calDate = getRelativeDateStr(cfg.offsetDays, baseDate);
    const startIso = getRelativeISO(cfg.offsetDays, 17, 15, baseDate);
    const endIso = getRelativeISO(cfg.offsetDays, 18, 25, baseDate);

    // Geplande sessie record
    scheduledSessions.push({
      id: `e4a77e80-8b1b-4b10-9fc6-2b4a3901p${String(idx + 1).padStart(3, "0")}`,
      calendarDate: calDate,
      routineId,
      routineDayId: cfg.day.id,
      status: "afgerond",
      notes: "Sessie succesvol voltooid",
      createdAt: getRelativeISO(cfg.offsetDays - 1, 8, 0, baseDate),
    });

    // Workout sessie record met snapshot
    workoutSessions.push({
      id: sId,
      calendarDate: calDate,
      startTime: startIso,
      endTime: endIso,
      status: "afgerond",
      routineId,
      routineDayId: cfg.day.id,
      routineVersion: 1,
      snapshot: {
        routineName: routine.name,
        routineDayName: cfg.day.name,
        exercises: cfg.day.plannedExercises.map((pe) => ({
          exerciseId: pe.exerciseId,
          exerciseName: pe.exerciseName,
          primaryMuscleGroup: "spiergroep",
          targetSets: pe.targetSets,
          targetRepsMin: pe.targetRepsMin,
          targetRepsMax: pe.targetRepsMax,
          restSeconds: pe.restSeconds,
        })),
      },
      overallRpe: 8,
      notes: "Uitstekende training, progressieve overload gerealiseerd met strakke vorm.",
      provenance: DEMO_PROVENANCE,
    });

    // Sets genereren voor deze sessie
    let setCounter = 1;
    if (cfg.benchKg > 0) {
      // 3 sets Bench Press
      const benchReps =
        cfg.benchKg >= 87.5
          ? [6, 6, 5]
          : cfg.benchKg >= 85
          ? [7, 7, 6]
          : [8, 8, 7];
      benchReps.forEach((reps, sIdx) => {
        workoutSets.push({
          id: `e4a77e80-8b1b-4b10-9fc6-2b4a3901set${String(workoutSets.length + 1).padStart(4, "0")}`,
          sessionId: sId,
          exerciseId: exercises[0].id,
          setNumber: sIdx + 1,
          setType: "normal",
          weightKg: cfg.benchKg,
          reps: reps,
          targetRpe: 8,
          actualRpe: sIdx === 2 ? 8.5 : 8,
          restTimeSeconds: 120,
          completed: true,
          loggedAt: getRelativeISO(cfg.offsetDays, 17, 20 + sIdx * 3, baseDate),
        });
      });
      // 3 sets Bent-Over Row
      [8, 8, 8].forEach((reps, sIdx) => {
        workoutSets.push({
          id: `e4a77e80-8b1b-4b10-9fc6-2b4a3901set${String(workoutSets.length + 1).padStart(4, "0")}`,
          sessionId: sId,
          exerciseId: exercises[4].id,
          setNumber: sIdx + 1,
          setType: "normal",
          weightKg: 65 + idx * 1.5,
          reps: reps,
          targetRpe: 8,
          actualRpe: 8,
          restTimeSeconds: 90,
          completed: true,
          loggedAt: getRelativeISO(cfg.offsetDays, 17, 35 + sIdx * 3, baseDate),
        });
      });
    }

    if (cfg.squatKg > 0) {
      // 3 sets Squat
      [6, 6, 6].forEach((reps, sIdx) => {
        workoutSets.push({
          id: `e4a77e80-8b1b-4b10-9fc6-2b4a3901set${String(workoutSets.length + 1).padStart(4, "0")}`,
          sessionId: sId,
          exerciseId: exercises[1].id,
          setNumber: sIdx + 1,
          setType: "normal",
          weightKg: cfg.squatKg,
          reps: reps,
          targetRpe: 8.5,
          actualRpe: 8.5,
          restTimeSeconds: 150,
          completed: true,
          loggedAt: getRelativeISO(cfg.offsetDays, 17, 20 + sIdx * 4, baseDate),
        });
      });
      // 3 sets RDL
      [8, 8, 8].forEach((reps, sIdx) => {
        workoutSets.push({
          id: `e4a77e80-8b1b-4b10-9fc6-2b4a3901set${String(workoutSets.length + 1).padStart(4, "0")}`,
          sessionId: sId,
          exerciseId: exercises[7].id,
          setNumber: sIdx + 1,
          setType: "normal",
          weightKg: 80 + idx * 2,
          reps: reps,
          targetRpe: 8,
          actualRpe: 8,
          restTimeSeconds: 120,
          completed: true,
          loggedAt: getRelativeISO(cfg.offsetDays, 17, 40 + sIdx * 3, baseDate),
        });
      });
    }

    if (cfg.deadliftKg > 0) {
      // 3 sets Deadlift
      [5, 5, 5].forEach((reps, sIdx) => {
        workoutSets.push({
          id: `e4a77e80-8b1b-4b10-9fc6-2b4a3901set${String(workoutSets.length + 1).padStart(4, "0")}`,
          sessionId: sId,
          exerciseId: exercises[2].id,
          setNumber: sIdx + 1,
          setType: "normal",
          weightKg: cfg.deadliftKg,
          reps: reps,
          targetRpe: 9,
          actualRpe: 9,
          restTimeSeconds: 180,
          completed: true,
          loggedAt: getRelativeISO(cfg.offsetDays, 17, 20 + sIdx * 5, baseDate),
        });
      });
    }
  });

  // Extra geplande sessie voor morgen (status gepland)
  scheduledSessions.push({
    id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901p999",
    calendarDate: getRelativeDateStr(1, baseDate),
    routineId,
    routineDayId: routineDays[1].id,
    status: "gepland",
    notes: "Lower A focus op squats en hamstrings",
    createdAt: nowISO,
  });

  // 5. DEMO CARDIO SESSIES
  const cardioSessions: CardioSession[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901c001",
      calendarDate: getRelativeDateStr(-21, baseDate),
      startTime: getRelativeISO(-21, 10, 0, baseDate),
      endTime: getRelativeISO(-21, 10, 27, baseDate),
      activityType: "hardlopen",
      distanceMeters: 5000,
      durationSeconds: 1650, // 27:30 min (5:30 min/km)
      avgHeartRateBpm: 154,
      maxHeartRateBpm: 172,
      estimatedCaloriesBurned: 350,
      elevationGainMeters: 25,
      rpe: 7,
      notes: "Rustige duurloop in Zone 3.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901c002",
      calendarDate: getRelativeDateStr(-16, baseDate),
      startTime: getRelativeISO(-16, 11, 0, baseDate),
      endTime: getRelativeISO(-16, 11, 45, baseDate),
      activityType: "fietsen",
      distanceMeters: 20000, // 20 km
      durationSeconds: 2700, // 45 min (26.7 km/u)
      avgHeartRateBpm: 140,
      maxHeartRateBpm: 158,
      estimatedCaloriesBurned: 460,
      elevationGainMeters: 40,
      rpe: 6,
      notes: "Wielerrit poldergebied met lichte tegenwind.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901c003",
      calendarDate: getRelativeDateStr(-11, baseDate),
      startTime: getRelativeISO(-11, 9, 30, baseDate),
      endTime: getRelativeISO(-11, 10, 9, baseDate),
      activityType: "hardlopen",
      distanceMeters: 7500, // 7.5 km
      durationSeconds: 2340, // 39 min (5:12 min/km)
      avgHeartRateBpm: 156,
      maxHeartRateBpm: 174,
      estimatedCaloriesBurned: 530,
      elevationGainMeters: 30,
      rpe: 7.5,
      notes: "Tempo iets opgeschroefd in de laatste 2 km.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901c004",
      calendarDate: getRelativeDateStr(-7, baseDate),
      startTime: getRelativeISO(-7, 18, 0, baseDate),
      endTime: getRelativeISO(-7, 18, 22, baseDate),
      activityType: "roeien",
      distanceMeters: 5000, // 5 km roeien
      durationSeconds: 1290, // 21:30 min
      avgHeartRateBpm: 150,
      maxHeartRateBpm: 168,
      estimatedCaloriesBurned: 280,
      elevationGainMeters: 0,
      rpe: 7,
      notes: "Roei-ergometer sessie na upper workout.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901c005",
      calendarDate: getRelativeDateStr(-4, baseDate),
      startTime: getRelativeISO(-4, 9, 0, baseDate),
      endTime: getRelativeISO(-4, 9, 51, baseDate),
      activityType: "hardlopen",
      distanceMeters: 10000, // 10 km
      durationSeconds: 3060, // 51 min (5:06 min/km) - PR!
      avgHeartRateBpm: 161,
      maxHeartRateBpm: 179,
      estimatedCaloriesBurned: 715,
      elevationGainMeters: 35,
      rpe: 8.5,
      notes: "Persoonlijk record op de 10 kilometer! Sterke eindsprint.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901c006",
      calendarDate: getRelativeDateStr(-1, baseDate),
      startTime: getRelativeISO(-1, 14, 0, baseDate),
      endTime: getRelativeISO(-1, 14, 54, baseDate),
      activityType: "fietsen",
      distanceMeters: 25000, // 25 km
      durationSeconds: 3240, // 54 min (27.8 km/u)
      avgHeartRateBpm: 143,
      maxHeartRateBpm: 162,
      estimatedCaloriesBurned: 550,
      elevationGainMeters: 50,
      rpe: 6.5,
      notes: "Heerlijke herstelrit in het zonnetje.",
      provenance: DEMO_PROVENANCE,
    },
  ];

  // 6. DEMO DOELEN (Goals)
  const goals: Goal[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901g001",
      category: "kracht",
      title: "Bankdrukken 100 kg x 5 reps",
      targetValue: 100,
      currentValue: 87.5,
      unit: "kg",
      startDate: getRelativeDateStr(-30, baseDate),
      targetDate: getRelativeDateStr(60, baseDate),
      status: "actief",
      notes: "Op schema via wekelijkse progressieve overload.",
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901g002",
      category: "cardio",
      title: "10 km hardlopen onder 50 minuten",
      targetValue: 50,
      currentValue: 51,
      unit: "min",
      startDate: getRelativeDateStr(-30, baseDate),
      targetDate: getRelativeDateStr(45, baseDate),
      status: "actief",
      notes: "Recent 51:00 min neergezet.",
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901g003",
      category: "gewicht",
      title: "Lichaamsgewicht naar 80 kg",
      targetValue: 80.0,
      currentValue: 81.0,
      unit: "kg",
      startDate: getRelativeDateStr(-30, baseDate),
      targetDate: getRelativeDateStr(30, baseDate),
      status: "actief",
      notes: "Van 82.5 kg gestaag gedaald naar 81.0 kg.",
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
  ];

  // 7. DEMO VOEDINGSMIDDELEN (FoodItems)
  const foodItems: FoodItem[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f001",
      name: "Havermout (Fijn)",
      brand: "Quaker",
      caloriesPer100g: 370,
      proteinGramsPer100g: 13,
      carbsGramsPer100g: 60,
      fatGramsPer100g: 7,
      fiberGramsPer100g: 10,
      defaultPortionGrams: 80,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f002",
      name: "Halfvolle Melk",
      brand: "Campina",
      caloriesPer100g: 47,
      proteinGramsPer100g: 3.5,
      carbsGramsPer100g: 4.8,
      fatGramsPer100g: 1.5,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 200,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f003",
      name: "Whey Isolaat Proteïne",
      brand: "Body & Fit",
      caloriesPer100g: 380,
      proteinGramsPer100g: 88,
      carbsGramsPer100g: 2,
      fatGramsPer100g: 1.5,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 30,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f004",
      name: "Banaan",
      brand: null,
      caloriesPer100g: 89,
      proteinGramsPer100g: 1.1,
      carbsGramsPer100g: 23,
      fatGramsPer100g: 0.3,
      fiberGramsPer100g: 2.6,
      defaultPortionGrams: 120,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f005",
      name: "Kipfilet (Gebakken)",
      brand: null,
      caloriesPer100g: 110,
      proteinGramsPer100g: 24,
      carbsGramsPer100g: 0,
      fatGramsPer100g: 1.5,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 150,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f006",
      name: "Volkorenbrood",
      brand: null,
      caloriesPer100g: 240,
      proteinGramsPer100g: 9,
      carbsGramsPer100g: 41,
      fatGramsPer100g: 2.5,
      fiberGramsPer100g: 6.5,
      defaultPortionGrams: 70,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f007",
      name: "Scharrelei (Gekookt)",
      brand: null,
      caloriesPer100g: 143,
      proteinGramsPer100g: 13,
      carbsGramsPer100g: 0.7,
      fatGramsPer100g: 10,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 100,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f008",
      name: "Magere Franse Kwark",
      brand: "Campina",
      caloriesPer100g: 52,
      proteinGramsPer100g: 9,
      carbsGramsPer100g: 4,
      fatGramsPer100g: 0.1,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 300,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f009",
      name: "Blauwe Bessen",
      brand: null,
      caloriesPer100g: 57,
      proteinGramsPer100g: 0.7,
      carbsGramsPer100g: 14,
      fatGramsPer100g: 0.3,
      fiberGramsPer100g: 2.4,
      defaultPortionGrams: 100,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901f010",
      name: "Zalmmoot (Gebakken)",
      brand: null,
      caloriesPer100g: 208,
      proteinGramsPer100g: 20,
      carbsGramsPer100g: 0,
      fatGramsPer100g: 14,
      fiberGramsPer100g: 0,
      defaultPortionGrams: 150,
      isCustom: false,
      provenance: DEMO_PROVENANCE,
      createdAt: getRelativeISO(-30, 9, 0, baseDate),
    },
  ];

  // 8. DEMO MAALTIJDLOGS & WATERLOGS (Vandaag en gisteren)
  const mealLogs: MealLog[] = [
    // Vandaag: Ontbijt
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901m001",
      calendarDate: getRelativeDateStr(0, baseDate),
      mealType: "ontbijt",
      items: [
        {
          foodItemId: foodItems[0].id, // Havermout
          foodName: foodItems[0].name,
          portionGrams: 80,
          calories: 296,
          proteinGrams: 10.4,
          carbsGrams: 48,
          fatGrams: 5.6,
          fiberGrams: 8,
        },
        {
          foodItemId: foodItems[1].id, // Melk
          foodName: foodItems[1].name,
          portionGrams: 200,
          calories: 94,
          proteinGrams: 7,
          carbsGrams: 9.6,
          fatGrams: 3,
          fiberGrams: 0,
        },
        {
          foodItemId: foodItems[2].id, // Whey
          foodName: foodItems[2].name,
          portionGrams: 30,
          calories: 114,
          proteinGrams: 26.4,
          carbsGrams: 0.6,
          fatGrams: 0.5,
          fiberGrams: 0,
        },
      ],
      totalCalories: 504,
      totalProteinGrams: 43.8,
      totalCarbsGrams: 58.2,
      totalFatGrams: 9.1,
      loggedAt: getRelativeISO(0, 7, 45, baseDate),
    },
    // Vandaag: Lunch
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901m002",
      calendarDate: getRelativeDateStr(0, baseDate),
      mealType: "lunch",
      items: [
        {
          foodItemId: foodItems[5].id, // Volkorenbrood 3 sneden
          foodName: foodItems[5].name,
          portionGrams: 105,
          calories: 252,
          proteinGrams: 9.5,
          carbsGrams: 43,
          fatGrams: 2.6,
          fiberGrams: 6.8,
        },
        {
          foodItemId: foodItems[4].id, // Kipfilet
          foodName: foodItems[4].name,
          portionGrams: 80,
          calories: 88,
          proteinGrams: 19.2,
          carbsGrams: 0,
          fatGrams: 1.2,
          fiberGrams: 0,
        },
        {
          foodItemId: foodItems[6].id, // 2 eieren
          foodName: foodItems[6].name,
          portionGrams: 100,
          calories: 143,
          proteinGrams: 13,
          carbsGrams: 0.7,
          fatGrams: 10,
          fiberGrams: 0,
        },
      ],
      totalCalories: 483,
      totalProteinGrams: 41.7,
      totalCarbsGrams: 43.7,
      totalFatGrams: 13.8,
      loggedAt: getRelativeISO(0, 12, 30, baseDate),
    },
    // Vandaag: Tussendoor / Snack
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901m003",
      calendarDate: getRelativeDateStr(0, baseDate),
      mealType: "snacks",
      items: [
        {
          foodItemId: foodItems[7].id, // Kwark 300g
          foodName: foodItems[7].name,
          portionGrams: 300,
          calories: 156,
          proteinGrams: 27,
          carbsGrams: 12,
          fatGrams: 0.3,
          fiberGrams: 0,
        },
        {
          foodItemId: foodItems[8].id, // Bessen 100g
          foodName: foodItems[8].name,
          portionGrams: 100,
          calories: 57,
          proteinGrams: 0.7,
          carbsGrams: 14,
          fatGrams: 0.3,
          fiberGrams: 2.4,
        },
        {
          foodItemId: foodItems[3].id, // Banaan 120g
          foodName: foodItems[3].name,
          portionGrams: 120,
          calories: 107,
          proteinGrams: 1.3,
          carbsGrams: 27.6,
          fatGrams: 0.4,
          fiberGrams: 3.1,
        },
      ],
      totalCalories: 320,
      totalProteinGrams: 29.0,
      totalCarbsGrams: 53.6,
      totalFatGrams: 1.0,
      loggedAt: getRelativeISO(0, 15, 30, baseDate),
    },
    // Vandaag: Diner
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901m004",
      calendarDate: getRelativeDateStr(0, baseDate),
      mealType: "diner",
      items: [
        {
          foodItemId: foodItems[9].id, // Zalm 180g
          foodName: foodItems[9].name,
          portionGrams: 180,
          calories: 374,
          proteinGrams: 36,
          carbsGrams: 0,
          fatGrams: 25.2,
          fiberGrams: 0,
        },
        {
          foodItemId: foodItems[4].id, // Extra kip
          foodName: "Zilvervliesrijst & Broccoli",
          portionGrams: 250,
          calories: 369,
          proteinGrams: 7.5,
          carbsGrams: 58,
          fatGrams: 4.5,
          fiberGrams: 6,
        },
      ],
      totalCalories: 743,
      totalProteinGrams: 43.5,
      totalCarbsGrams: 58.0,
      totalFatGrams: 29.7,
      loggedAt: getRelativeISO(0, 18, 45, baseDate),
    },
  ];

  // Waterlogs vandaag (in totaal 2250 ml)
  const waterLogs: WaterLog[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901w001",
      calendarDate: getRelativeDateStr(0, baseDate),
      amountMl: 500,
      loggedAt: getRelativeISO(0, 8, 0, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901w002",
      calendarDate: getRelativeDateStr(0, baseDate),
      amountMl: 500,
      loggedAt: getRelativeISO(0, 11, 30, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901w003",
      calendarDate: getRelativeDateStr(0, baseDate),
      amountMl: 500,
      loggedAt: getRelativeISO(0, 14, 45, baseDate),
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901w004",
      calendarDate: getRelativeDateStr(0, baseDate),
      amountMl: 750,
      loggedAt: getRelativeISO(0, 19, 0, baseDate),
    },
  ];

  // 9. DEMO LICHAAMSMETINGEN (Wekelijks gestaag naar doelgewicht)
  const bodyMeasurements: BodyMeasurement[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901b001",
      calendarDate: getRelativeDateStr(-28, baseDate),
      measuredAt: getRelativeISO(-28, 7, 0, baseDate),
      weightKg: 82.5,
      bodyFatPercentage: 16.5,
      chestMeters: 1.05,
      waistMeters: 0.85,
      hipsMeters: 0.98,
      armsMeters: 0.38,
      thighsMeters: 0.60,
      notes: "Startmeting voor kracht & cut fase.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901b002",
      calendarDate: getRelativeDateStr(-21, baseDate),
      measuredAt: getRelativeISO(-21, 7, 0, baseDate),
      weightKg: 82.1,
      bodyFatPercentage: 16.3,
      chestMeters: 1.05,
      waistMeters: 0.84,
      hipsMeters: 0.98,
      armsMeters: 0.38,
      thighsMeters: 0.60,
      notes: "Goede trend, geen krachtverlies.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901b003",
      calendarDate: getRelativeDateStr(-14, baseDate),
      measuredAt: getRelativeISO(-14, 7, 0, baseDate),
      weightKg: 81.7,
      bodyFatPercentage: 16.1,
      chestMeters: 1.05,
      waistMeters: 0.835,
      hipsMeters: 0.97,
      armsMeters: 0.38,
      thighsMeters: 0.595,
      notes: "Taille krimpt subtiel, schouders en armen blijven op peil.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901b004",
      calendarDate: getRelativeDateStr(-7, baseDate),
      measuredAt: getRelativeISO(-7, 7, 0, baseDate),
      weightKg: 81.3,
      bodyFatPercentage: 15.9,
      chestMeters: 1.045,
      waistMeters: 0.83,
      hipsMeters: 0.97,
      armsMeters: 0.38,
      thighsMeters: 0.59,
      notes: "Consistente daling van ~400 gram per week.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901b005",
      calendarDate: getRelativeDateStr(0, baseDate),
      measuredAt: getRelativeISO(0, 7, 0, baseDate),
      weightKg: 81.0,
      bodyFatPercentage: 15.7,
      chestMeters: 1.045,
      waistMeters: 0.825,
      hipsMeters: 0.965,
      armsMeters: 0.38,
      thighsMeters: 0.59,
      notes: "Nieuw laagste gewicht. Nog 1.0 kg tot doelgewicht van 80 kg.",
      provenance: DEMO_PROVENANCE,
    },
  ];

  // 10. DEMO HERSTELLOGS (Recovery)
  const recoveryLogs: RecoveryLog[] = [
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901h001",
      calendarDate: getRelativeDateStr(-4, baseDate),
      loggedAt: getRelativeISO(-4, 7, 30, baseDate),
      sleepDurationMinutes: 460, // 7u 40m
      sleepQualityRating: 4,
      restingHeartRateBpm: 52,
      sorenessRating: 2,
      stressRating: 1,
      notes: "Goed uitgerust wakker geworden.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901h002",
      calendarDate: getRelativeDateStr(-3, baseDate),
      loggedAt: getRelativeISO(-3, 7, 30, baseDate),
      sleepDurationMinutes: 480, // 8 uur
      sleepQualityRating: 5,
      restingHeartRateBpm: 50,
      sorenessRating: 1,
      stressRating: 1,
      notes: "Diepe slaap, fit gevoel voor leg day.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901h003",
      calendarDate: getRelativeDateStr(-2, baseDate),
      loggedAt: getRelativeISO(-2, 7, 30, baseDate),
      sleepDurationMinutes: 450, // 7u 30m
      sleepQualityRating: 4,
      restingHeartRateBpm: 53,
      sorenessRating: 3, // Spierpijn van zware squats
      stressRating: 2,
      notes: "Lichte spierpijn in bovenbenen na squat PR.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901h004",
      calendarDate: getRelativeDateStr(-1, baseDate),
      loggedAt: getRelativeISO(-1, 7, 30, baseDate),
      sleepDurationMinutes: 490, // 8u 10m
      sleepQualityRating: 4,
      restingHeartRateBpm: 51,
      sorenessRating: 2,
      stressRating: 1,
      notes: "Goed hersteld dankzij ontspannen fietsritje.",
      provenance: DEMO_PROVENANCE,
    },
    {
      id: "e4a77e80-8b1b-4b10-9fc6-2b4a3901h005",
      calendarDate: getRelativeDateStr(0, baseDate),
      loggedAt: getRelativeISO(0, 7, 15, baseDate),
      sleepDurationMinutes: 485, // 8u 05m
      sleepQualityRating: 5,
      restingHeartRateBpm: 50,
      sorenessRating: 2,
      stressRating: 1,
      notes: "Klaar voor de dag, energieniveau hoog.",
      provenance: DEMO_PROVENANCE,
    },
  ];

  // 11. DEMO APP SETTINGS
  const appSettings: AppSettings = {
    id: "app_settings",
    theme: "dark",
    unitPreference: "metric",
    restTimerSeconds: 120,
    soundEnabled: true,
    hapticFeedbackEnabled: true,
    demoModeActive: true,
    activeProgramRoutineId: routineId,
    lastBackupAt: nowISO,
    updatedAt: nowISO,
  };

  return {
    profile,
    exercises,
    routine,
    routineDays,
    scheduledSessions,
    workoutSessions,
    workoutSets,
    cardioSessions,
    goals,
    foodItems,
    mealLogs,
    waterLogs,
    bodyMeasurements,
    recoveryLogs,
    appSettings,
  };
}
