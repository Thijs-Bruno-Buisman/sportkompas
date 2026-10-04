import { describe, it, expect } from "vitest";
import {
  escapeCsvField,
  isWithinDateRange,
  exportWorkoutsToCsv,
  exportCardioToCsv,
  exportNutritionToCsv,
  exportMeasurementsToCsv,
  generateCsvFilename,
  UTF8_BOM,
} from "./csvExport";
import type {
  WorkoutSession,
  WorkoutSet,
  Exercise,
  CardioSession,
  MealLog,
  BodyMeasurement,
} from "@/types/database";

describe("Domain: csvExport", () => {
  describe("escapeCsvField", () => {
    it("laat eenvoudige tekst ongewijzigd", () => {
      expect(escapeCsvField("Bench Press", ";", ",")).toBe("Bench Press");
    });

    it("plaatst aanhalingstekens rond tekst met het scheidingsteken", () => {
      expect(escapeCsvField("Kip, rijst en broccoli", ",", ".")).toBe('"Kip, rijst en broccoli"');
      expect(escapeCsvField("Set 1; 80kg", ";", ",")).toBe('"Set 1; 80kg"');
    });

    it("escapet dubbele aanhalingstekens door ze te verdubbelen", () => {
      expect(escapeCsvField('Zware "PR" poging', ";", ",")).toBe('"Zware ""PR"" poging"');
    });

    it("plaatst aanhalingstekens bij regeleinden", () => {
      expect(escapeCsvField("Regel 1\nRegel 2", ";", ",")).toBe('"Regel 1\nRegel 2"');
    });

    it("converteert getallen en decimalen op basis van de instelling", () => {
      expect(escapeCsvField(82.5, ";", ",")).toBe("82,5");
      expect(escapeCsvField(82.5, ",", ".")).toBe("82.5");
    });

    it("verwerkt booleans en lege waarden netjes", () => {
      expect(escapeCsvField(true)).toBe("Ja");
      expect(escapeCsvField(false)).toBe("Nee");
      expect(escapeCsvField(null)).toBe("");
      expect(escapeCsvField(undefined)).toBe("");
    });
  });

  describe("isWithinDateRange", () => {
    it("filtert correct binnen start- en einddatum", () => {
      expect(isWithinDateRange("2026-10-10", "2026-10-01", "2026-10-15")).toBe(true);
      expect(isWithinDateRange("2026-10-01", "2026-10-01", "2026-10-15")).toBe(true);
      expect(isWithinDateRange("2026-10-15", "2026-10-01", "2026-10-15")).toBe(true);
      expect(isWithinDateRange("2026-09-30", "2026-10-01", "2026-10-15")).toBe(false);
      expect(isWithinDateRange("2026-10-16", "2026-10-01", "2026-10-15")).toBe(false);
    });

    it("werkt met alleen start- of alleen einddatum", () => {
      expect(isWithinDateRange("2026-10-10", "2026-10-01")).toBe(true);
      expect(isWithinDateRange("2026-09-30", "2026-10-01")).toBe(false);
      expect(isWithinDateRange("2026-10-10", undefined, "2026-10-15")).toBe(true);
      expect(isWithinDateRange("2026-10-20", undefined, "2026-10-15")).toBe(false);
    });
  });

  describe("exportWorkoutsToCsv", () => {
    const mockExercises: Exercise[] = [
      {
        id: "ex-1",
        name: "Barbell Bench Press",
        category: "kracht",
        primaryMuscleGroup: "borst",
        secondaryMuscleGroups: ["armen"],
        equipment: "barbell",
        measurementType: "gewicht_herhalingen",
        isCustom: false,
        isArchived: false,
        instructions: "Liggend bankdrukken",
        provenance: { source: "user" },
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ];

    const mockSessions: WorkoutSession[] = [
      {
        id: "sess-1",
        calendarDate: "2026-10-10",
        startTime: "2026-10-10T09:30:00.000Z",
        endTime: "2026-10-10T10:45:00.000Z",
        status: "afgerond",
        routineId: null,
        routineDayId: null,
        routineVersion: null,
        snapshot: {
          routineName: "Chest & Triceps",
          exercises: [],
        },
        overallRpe: 8,
        notes: "Goeie energie vandaag!",
        provenance: { source: "user" },
      },
    ];

    const mockSets: WorkoutSet[] = [
      {
        id: "set-1",
        sessionId: "sess-1",
        exerciseId: "ex-1",
        setNumber: 1,
        setType: "normal",
        weightKg: 80,
        reps: 10,
        completed: true,
        restTimeSeconds: 90,
        actualRpe: 8,
        targetRpe: 8,
        loggedAt: "2026-10-10T09:40:00.000Z",
      },
    ];

    it("genereert een geldige CSV string met BOM en headers", () => {
      const csv = exportWorkoutsToCsv(mockSessions, mockSets, mockExercises, {
        delimiter: ";",
        includeBom: true,
      });

      expect(csv.startsWith(UTF8_BOM)).toBe(true);
      expect(csv).toContain("Datum;Starttijd;Eindtijd;Workout Naam");
      expect(csv).toContain("2026-10-10;09:30;10:45;Chest & Triceps;afgerond;Barbell Bench Press;borst;1;normal;80;10;800");
      expect(csv).toContain("Goeie energie vandaag!");
    });

    it("respecteert datumfiltering", () => {
      const csv = exportWorkoutsToCsv(mockSessions, mockSets, mockExercises, {
        startDate: "2026-10-11",
      });

      const lines = csv.replace(UTF8_BOM, "").trim().split("\r\n");
      expect(lines.length).toBe(1); // Alleen headers
    });
  });

  describe("exportCardioToCsv", () => {
    const mockCardio: CardioSession[] = [
      {
        id: "cardio-1",
        calendarDate: "2026-10-12",
        startTime: "2026-10-12T07:00:00.000Z",
        endTime: "2026-10-12T07:45:00.000Z",
        activityType: "hardlopen",
        distanceMeters: 7500,
        durationSeconds: 2700, // 45 min
        avgHeartRateBpm: 155,
        maxHeartRateBpm: 172,
        estimatedCaloriesBurned: 580,
        elevationGainMeters: 45,
        rpe: 7,
        notes: "Mooie ochtendloop",
        provenance: { source: "user" },
      },
    ];

    it("berekent correct afstand in km, duur in min, en tempo", () => {
      const csv = exportCardioToCsv(mockCardio, { delimiter: ";", decimalSeparator: "," });

      expect(csv).toContain("7,5;45;6:00;10;580;155;172;45;7;Mooie ochtendloop");
    });
  });

  describe("exportNutritionToCsv", () => {
    const mockMealLogs: MealLog[] = [
      {
        id: "meal-1",
        calendarDate: "2026-10-13",
        mealType: "ontbijt",
        loggedAt: "2026-10-13T08:15:00.000Z",
        items: [
          {
            foodItemId: "item-1",
            foodName: "Havermout met melk",
            portionGrams: 250,
            calories: 320,
            proteinGrams: 16.5,
            carbsGrams: 48.0,
            fatGrams: 5.2,
            fiberGrams: 6.0,
          },
        ],
        totalCalories: 320,
        totalProteinGrams: 16.5,
        totalCarbsGrams: 48.0,
        totalFatGrams: 5.2,
        totalFiberGrams: 6.0,
      },
    ];

    it("exporteert maaltijditems met macro's", () => {
      const csv = exportNutritionToCsv(mockMealLogs, { delimiter: ";", decimalSeparator: "," });

      expect(csv).toContain("2026-10-13;08:15;ontbijt;Havermout met melk;250;320;16,5;48;5,2;6");
    });
  });

  describe("exportMeasurementsToCsv", () => {
    const mockMeasurements: BodyMeasurement[] = [
      {
        id: "meas-1",
        calendarDate: "2026-10-14",
        measuredAt: "2026-10-14T07:30:00.000Z",
        weightKg: 78.4,
        bodyFatPercentage: 14.8,
        waistMeters: 0.825, // 82.5 cm
        chestMeters: 1.02,  // 102 cm
        hipsMeters: null,
        armsMeters: 0.38,   // 38 cm
        thighsMeters: null,
        notes: "Nuchter gewogen",
        provenance: { source: "user" },
      },
    ];

    it("converteert lichaamsomtrekken van meters naar centimeters", () => {
      const csv = exportMeasurementsToCsv(mockMeasurements, { delimiter: ";", decimalSeparator: "," });

      expect(csv).toContain("2026-10-14;07:30;78,4;14,8;102;82,5;;38;;Nuchter gewogen");
    });
  });

  describe("generateCsvFilename", () => {
    it("genereert een correcte Nederlandse bestandsnaam met datum", () => {
      const fixedDate = new Date(2026, 9, 25); // 25 oktober 2026
      expect(generateCsvFilename("workouts", fixedDate)).toBe("sportkompas-workouts-2026-10-25.csv");
      expect(generateCsvFilename("cardio", fixedDate)).toBe("sportkompas-cardio-2026-10-25.csv");
    });
  });
});
