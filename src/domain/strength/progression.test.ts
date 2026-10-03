import { describe, it, expect } from "vitest";
import {
  getStartDateForFilter,
  filterWorkoutSessions,
  buildExerciseProgressionPoints,
  convertProgressionPointsToLbs,
} from "./progression";
import type { WorkoutSession, WorkoutSet, Exercise } from "@/types/database";

describe("progression domeinlogica (Prompt 13)", () => {
  const mockBaseExercise = (overrides?: Partial<Exercise>): Exercise => ({
    id: "ex-bench-press",
    name: "Bankdrukken",
    category: "kracht",
    primaryMuscleGroup: "borst",
    secondaryMuscleGroups: ["schouders", "armen"],
    equipment: "barbell",
    measurementType: "gewicht_herhalingen",
    isCustom: false,
    isArchived: false,
    instructions: "Duw de halter omhoog.",
    provenance: { source: "system" },
    createdAt: "2026-01-01T00:00:00Z",
    ...overrides,
  });

  const mockSession = (
    id: string,
    calendarDate: string,
    status: "actief" | "afgerond" | "geannuleerd" = "afgerond",
    exerciseId = "ex-bench-press"
  ): WorkoutSession => ({
    id,
    calendarDate,
    startTime: `${calendarDate}T10:00:00Z`,
    endTime: `${calendarDate}T11:00:00Z`,
    status,
    routineId: "routine-1",
    routineDayId: "day-1",
    routineVersion: 1,
    snapshot: {
      routineName: "Full Body A",
      routineDayName: "Borst en Benen",
      exercises: [
        {
          exerciseId,
          exerciseName: "Bankdrukken",
          primaryMuscleGroup: "borst",
          targetSets: 3,
          restSeconds: 90,
        },
      ],
    },
    overallRpe: 8,
    notes: "Prima training",
    provenance: { source: "user" },
  });

  const mockSet = (
    id: string,
    sessionId: string,
    exerciseId: string,
    weightKg: number,
    reps: number,
    completed = true,
    actualRpe: number | null = 8
  ): WorkoutSet => ({
    id,
    sessionId,
    exerciseId,
    setNumber: 1,
    setType: "normal",
    weightKg,
    reps,
    targetRpe: null,
    actualRpe,
    restTimeSeconds: 90,
    completed,
    loggedAt: "2026-01-01T10:15:00Z",
  });

  const fixedNow = new Date("2026-10-15T12:00:00Z");

  describe("getStartDateForFilter", () => {
    it("geeft null voor 'all'", () => {
      expect(getStartDateForFilter("all", undefined, fixedNow)).toBeNull();
    });

    it("berekent 7 dagen geleden voor '7d'", () => {
      expect(getStartDateForFilter("7d", undefined, fixedNow)).toBe("2026-10-08");
    });

    it("berekent 30 dagen geleden voor '30d'", () => {
      expect(getStartDateForFilter("30d", undefined, fixedNow)).toBe("2026-09-15");
    });

    it("ondersteunt custom bereik", () => {
      expect(
        getStartDateForFilter(
          "custom",
          { startDate: "2026-01-01", endDate: "2026-06-01" },
          fixedNow
        )
      ).toBe("2026-01-01");
    });
  });

  describe("filterWorkoutSessions", () => {
    const sessions = [
      mockSession("s1", "2026-10-10"),
      mockSession("s2", "2026-10-01"),
      mockSession("s3", "2026-08-01"),
    ];

    it("filtert correct op datumbereik", () => {
      // 7 dagen filter vanaf 2026-10-15 moet alleen s1 opleveren
      const filtered = filterWorkoutSessions(sessions, "7d", {
        now: fixedNow,
      });
      expect(filtered.length).toBe(1);
      expect(filtered[0].id).toBe("s1");
    });

    it("filtert op zoekopdracht in sessienaam en oefeningen", () => {
      const filtered = filterWorkoutSessions(sessions, "all", {
        searchQuery: "borst",
      });
      expect(filtered.length).toBe(3);

      const none = filterWorkoutSessions(sessions, "all", {
        searchQuery: "onbekende-zoekterm-xyz",
      });
      expect(none.length).toBe(0);
    });
  });

  describe("buildExerciseProgressionPoints", () => {
    it("berekent accurate datapunten voor gewicht_herhalingen oefeningen", () => {
      const exercise = mockBaseExercise();
      const sessions = [
        mockSession("s1", "2026-10-01"),
        mockSession("s2", "2026-10-08"),
      ];
      const sets = [
        // Sessie 1: 80kg x 8 (RPE 8), 80kg x 8 (RPE 8.5)
        mockSet("set1", "s1", exercise.id, 80, 8, true, 8),
        mockSet("set2", "s1", exercise.id, 80, 8, true, 8.5),
        // Sessie 2: 85kg x 8 (RPE 9), 90kg x 6 (RPE 9.5)
        mockSet("set3", "s2", exercise.id, 85, 8, true, 9),
        mockSet("set4", "s2", exercise.id, 90, 6, true, 9.5),
      ];

      const points = buildExerciseProgressionPoints(exercise, sessions, sets);

      expect(points.length).toBe(2);

      // Sessie 1
      expect(points[0].calendarDate).toBe("2026-10-01");
      expect(points[0].maxWeightKg).toBe(80);
      expect(points[0].maxReps).toBe(8);
      expect(points[0].worksetVolumeKg).toBe(1280); // 80*8 + 80*8
      expect(points[0].averageRpe).toBe(8.3);
      expect(points[0].estimated1RM).toBe(101.3); // 80 * (1 + 8/30) = 101.3

      // Sessie 2 (progressie zichtbaar!)
      expect(points[1].calendarDate).toBe("2026-10-08");
      expect(points[1].maxWeightKg).toBe(90);
      expect(points[1].maxReps).toBe(8);
      expect(points[1].worksetVolumeKg).toBe(1220); // 85*8 + 90*6 = 680 + 540 = 1220
      expect(points[1].averageRpe).toBe(9.3);
    });

    it("scheidt assisted oefeningen strikt en telt machinehulp niet als positief extern volume", () => {
      const exercise = mockBaseExercise({
        id: "ex-assisted-pullup",
        name: "Assisted Pull-up",
        measurementType: "assisted",
      });
      const sessions = [mockSession("s1", "2026-10-01", "afgerond", exercise.id)];
      const sets = [
        mockSet("set1", "s1", exercise.id, 25, 8, true), // 25kg machine hulp
        mockSet("set2", "s1", exercise.id, 20, 8, true), // 20kg machine hulp (betere prestatie!)
      ];

      const points = buildExerciseProgressionPoints(exercise, sessions, sets);

      expect(points.length).toBe(1);
      expect(points[0].isAssisted).toBe(true);
      // Minimaal gewicht = beste prestatie bij assisted
      expect(points[0].maxWeightKg).toBe(20);
      // Volume = 0 want machinehulp mag positief volume niet vervuilen
      expect(points[0].worksetVolumeKg).toBe(0);
      expect(points[0].volumeDefinition).toContain("Assisted machine");
    });

    it("behandelt lichaamsgewicht volume conform de regels (alleen bij bekend gewicht)", () => {
      const exercise = mockBaseExercise({
        id: "ex-pullup",
        name: "Optrekken",
        measurementType: "lichaamsgewicht",
      });
      const sessions = [mockSession("s1", "2026-10-01", "afgerond", exercise.id)];
      const sets = [
        mockSet("set1", "s1", exercise.id, 0, 10, true),
        mockSet("set2", "s1", exercise.id, 0, 8, true),
      ];

      // Geval A: geen lichaamsgewicht bekend
      const pointsWithoutBw = buildExerciseProgressionPoints(
        exercise,
        sessions,
        sets,
        null
      );
      expect(pointsWithoutBw[0].worksetVolumeKg).toBe(0);
      expect(pointsWithoutBw[0].volumeDefinition).toContain(
        "geen actueel lichaamsgewicht geregistreerd"
      );

      // Geval B: lichaamsgewicht 80 kg bekend
      const pointsWithBw = buildExerciseProgressionPoints(
        exercise,
        sessions,
        sets,
        80
      );
      // Volume: (80 + 0) * 10 + (80 + 0) * 8 = 800 + 640 = 1440 kg
      expect(pointsWithBw[0].worksetVolumeKg).toBe(1440);
      expect(pointsWithBw[0].volumeDefinition).toContain("80 kg lichaamsgewicht");
    });

    it("maakt expliciet onderscheid tussen 0 en null (ontbrekend)", () => {
      const exercise = mockBaseExercise({
        id: "ex-plank",
        name: "Plank",
        measurementType: "tijd",
      });
      const sessions = [mockSession("s1", "2026-10-01", "afgerond", exercise.id)];
      const sets = [
        {
          ...mockSet("set1", "s1", exercise.id, 0, 0, true, null),
          durationSeconds: 60,
          actualRpe: null, // Niet ingevuld!
        },
      ];

      const points = buildExerciseProgressionPoints(exercise, sessions, sets);

      expect(points[0].maxWeightKg).toBeNull(); // Null, niet 0!
      expect(points[0].averageRpe).toBeNull(); // Null, niet 0!
    });
  });

  describe("convertProgressionPointsToLbs", () => {
    it("converteert gewicht en volume naar lbs zonder brongegevens te wijzigen", () => {
      const points = [
        {
          calendarDate: "2026-10-01",
          sessionId: "s1",
          sessionTitle: "Workout",
          measurementType: "gewicht_herhalingen" as const,
          isAssisted: false,
          completedSetsCount: 1,
          maxWeightKg: 100, // 100 kg -> 220.5 lbs
          maxReps: 8,
          worksetVolumeKg: 800, // 800 kg -> 1763.7 lbs
          volumeDefinition: "test",
          averageRpe: 8,
          averageRir: null,
          estimated1RM: 126.7,
        },
      ];

      const converted = convertProgressionPointsToLbs(points);

      expect(converted[0].maxWeightKg).toBe(220.5);
      expect(converted[0].worksetVolumeKg).toBe(1763.7);
      // Origineel ongewijzigd
      expect(points[0].maxWeightKg).toBe(100);
    });
  });
});
