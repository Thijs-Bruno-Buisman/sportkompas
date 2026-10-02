import { describe, it, expect } from "vitest";
import { calculateBmi, estimate1RmEpley } from "./health";

describe("Domain: Health & Kracht Berekeningen", () => {
  describe("calculateBmi", () => {
    it("berekent correct de BMI voor 80kg en 180cm", () => {
      // 80 / (1.8 * 1.8) = 80 / 3.24 = 24.69... afgerond 24.7
      expect(calculateBmi(80, 180)).toBe(24.7);
    });

    it("gooit een foutmelding bij niet-positieve getallen", () => {
      expect(() => calculateBmi(-80, 180)).toThrow();
      expect(() => calculateBmi(80, 0)).toThrow();
    });
  });

  describe("estimate1RmEpley", () => {
    it("geeft het daadwerkelijke gewicht terug bij 1 herhaling", () => {
      expect(estimate1RmEpley(100, 1)).toBe(100);
    });

    it("schat de 1RM nauwkeurig in volgens de Epley formule voor 100kg x 5 reps", () => {
      // 100 * (1 + 5/30) = 100 * (1 + 0.1666...) = 116.7
      expect(estimate1RmEpley(100, 5)).toBe(116.7);
    });

    it("gooit een foutmelding bij ongeldige invoer (negatief gewicht of 0 reps)", () => {
      expect(() => estimate1RmEpley(-50, 5)).toThrow();
      expect(() => estimate1RmEpley(100, 0)).toThrow();
    });
  });
});

