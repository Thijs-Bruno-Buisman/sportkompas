import { describe, it, expect } from "vitest";
import {
  parseDecimalInput,
  parseRepsInput,
  parseDurationInput,
  formatDurationSeconds,
  parseRpeInput,
  parseRirInput,
  duplicateSetValues,
  compareSetPerformance,
  getWeightFieldLabel,
} from "./setParser";
import type { WorkoutSet } from "@/types/database";

describe("Domain: setParser.ts (Prompt 10)", () => {
  describe("1. parseDecimalInput (Mobiele komma en punt ondersteuning)", () => {
    it("parseert getallen met komma correct naar getal", () => {
      expect(parseDecimalInput("72,5")).toBe(72.5);
      expect(parseDecimalInput("0,25")).toBe(0.25);
      expect(parseDecimalInput("100,75")).toBe(100.75);
    });

    it("parseert getallen met punt correct naar getal", () => {
      expect(parseDecimalInput("72.5")).toBe(72.5);
      expect(parseDecimalInput("80")).toBe(80);
      expect(parseDecimalInput("0")).toBe(0);
    });

    it("trimt witruimtes en accepteert number inputs", () => {
      expect(parseDecimalInput("   85,5   ")).toBe(85.5);
      expect(parseDecimalInput(92.5)).toBe(92.5);
      expect(parseDecimalInput(0)).toBe(0);
    });

    it("weigert ongeldige invoer, negatieve getallen en limiet-overschrijdingen", () => {
      expect(parseDecimalInput("")).toBeNull();
      expect(parseDecimalInput("   ")).toBeNull();
      expect(parseDecimalInput("abc")).toBeNull();
      expect(parseDecimalInput("-5")).toBeNull();
      expect(parseDecimalInput(1005)).toBeNull(); // max 1000 kg
      expect(parseDecimalInput(null)).toBeNull();
      expect(parseDecimalInput(undefined)).toBeNull();
    });
  });

  describe("2. parseRepsInput & parseDurationInput", () => {
    it("parseRepsInput accepteert alleen geldige gehele getallen", () => {
      expect(parseRepsInput("10")).toBe(10);
      expect(parseRepsInput("0")).toBe(0);
      expect(parseRepsInput("12.7")).toBe(12);
      expect(parseRepsInput("-1")).toBeNull();
      expect(parseRepsInput("501")).toBeNull(); // max 500 reps
      expect(parseRepsInput("twintig")).toBeNull();
    });

    it("parseDurationInput ondersteunt seconden en mm:ss formaten", () => {
      expect(parseDurationInput("60")).toBe(60);
      expect(parseDurationInput("90")).toBe(90);
      expect(parseDurationInput("1:30")).toBe(90);
      expect(parseDurationInput("02:15")).toBe(135);
      expect(parseDurationInput("invalid")).toBeNull();
    });

    it("formatDurationSeconds formatteert overzichtelijk", () => {
      expect(formatDurationSeconds(45)).toBe("45s");
      expect(formatDurationSeconds(60)).toBe("1m");
      expect(formatDurationSeconds(90)).toBe("1m 30s");
      expect(formatDurationSeconds(125)).toBe("2m 5s");
    });
  });

  describe("3. parseRpeInput & parseRirInput", () => {
    it("parseRpeInput rondt af op halve punten tussen 1 en 10", () => {
      expect(parseRpeInput("8")).toBe(8);
      expect(parseRpeInput("8,5")).toBe(8.5);
      expect(parseRpeInput("8.4")).toBe(8.5);
      expect(parseRpeInput("8.2")).toBe(8);
      expect(parseRpeInput("0.5")).toBeNull(); // onder min 1
      expect(parseRpeInput("10.5")).toBeNull(); // boven max 10
    });

    it("parseRirInput accepteert gehele getallen tussen 0 en 10", () => {
      expect(parseRirInput("0")).toBe(0);
      expect(parseRirInput("2")).toBe(2);
      expect(parseRirInput("11")).toBeNull();
    });
  });

  describe("4. duplicateSetValues (Vorige set kopiÃ«ren)", () => {
    const baseSet: WorkoutSet = {
      id: "set-111",
      sessionId: "session-1",
      exerciseId: "ex-1",
      setNumber: 1,
      setType: "normal",
      weightKg: 85,
      reps: 8,
      durationSeconds: null,
      targetRpe: 8,
      actualRpe: 8.5,
      targetRir: null,
      actualRir: 1,
      isAssisted: false,
      restTimeSeconds: 90,
      completed: true,
      completedAt: "2026-10-02T10:00:00Z",
      loggedAt: "2026-10-02T10:00:00Z",
    };

    it("kopieert gewicht, reps en setType maar markeert de nieuwe set als ONVOLTOOID", () => {
      const duplicated = duplicateSetValues(baseSet, 2, "set-222");

      expect(duplicated.id).toBe("set-222");
      expect(duplicated.setNumber).toBe(2);
      expect(duplicated.weightKg).toBe(85);
      expect(duplicated.reps).toBe(8);
      expect(duplicated.setType).toBe("normal");
      expect(duplicated.targetRpe).toBe(8);

      // Cruciaal conform Prompt 10: NOOIT automatisch als gedaan markeren!
      expect(duplicated.completed).toBe(false);
      expect(duplicated.actualRpe).toBeNull();
      expect(duplicated.actualRir).toBeNull();
    });
  });

  describe("5. compareSetPerformance (Herkenning van Assisted oefeningen)", () => {
    it("bij reguliere gewichten is zwaarder gewicht een betere prestatie", () => {
      const setA = { weightKg: 80, reps: 8, isAssisted: false };
      const setB = { weightKg: 75, reps: 8, isAssisted: false };

      // setA > setB (positief resultaat)
      expect(compareSetPerformance(setA, setB)).toBeGreaterThan(0);
    });

    it("bij assisted oefeningen is LAGER tegengewicht een BETERE prestatie", () => {
      // Prompt vereiste: 'Maak assisted-gewicht herkenbaar zodat lager assistance
      // niet als minder prestatie wordt gezien.'
      const setA_LesserAssistance = { weightKg: 20, reps: 8, isAssisted: true }; // 20 kg hulp
      const setB_MoreAssistance = { weightKg: 30, reps: 8, isAssisted: true }; // 30 kg hulp (makkelijker)

      // setA (minder hulp) is zwaarder en dus BETER dan setB
      expect(compareSetPerformance(setA_LesserAssistance, setB_MoreAssistance)).toBeGreaterThan(0);

      // Omgekeerd: meer hulp is een lagere prestatie
      expect(compareSetPerformance(setB_MoreAssistance, setA_LesserAssistance)).toBeLessThan(0);
    });

    it("bij gelijke assistentie beslist het aantal herhalingen", () => {
      const setA = { weightKg: 25, reps: 10, isAssisted: true };
      const setB = { weightKg: 25, reps: 8, isAssisted: true };

      expect(compareSetPerformance(setA, setB)).toBeGreaterThan(0);
    });
  });

  describe("6. getWeightFieldLabel", () => {
    it("geeft duidelijke labels voor assisted, lichaamsgewicht en regulier", () => {
      const assisted = getWeightFieldLabel("assisted");
      expect(assisted.label).toContain("Tegengewicht");
      expect(assisted.helperText).toContain("minder kg is een zwaardere prestatie");

      const extra = getWeightFieldLabel("extra_gewicht");
      expect(extra.label).toContain("Extra gewicht");

      const regular = getWeightFieldLabel("gewicht_herhalingen");
      expect(regular.label).toBe("Gewicht");
    });
  });
});

