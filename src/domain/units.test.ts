import { describe, it, expect } from "vitest";
import {
  kgToLbs,
  lbsToKg,
  metersToKm,
  kmToMeters,
  metersToMiles,
  milesToMeters,
  metersToCm,
  cmToMeters,
  parseLocalizedNumber,
  isValidBirthDate,
  formatWeight,
  formatDistance,
} from "./units";

describe("Domain: Units & Invoervalidatie", () => {
  describe("Gewicht conversies & formattering", () => {
    it("converteert 100 kg naar 220.5 lbs en vice versa", () => {
      expect(kgToLbs(100)).toBe(220.5);
      expect(lbsToKg(220.462)).toBe(100);
    });

    it("weigert negatieve gewichten bij conversie", () => {
      expect(() => kgToLbs(-10)).toThrow();
      expect(() => lbsToKg(-10)).toThrow();
    });

    it("formatteert gewicht correct volgens voorkeur", () => {
      expect(formatWeight(80, "metric")).toBe("80 kg");
      expect(formatWeight(80, "imperial")).toBe("176.4 lbs");
      expect(formatWeight(null, "metric")).toBe("—");
    });
  });

  describe("Afstand conversies", () => {
    it("converteert meters naar kilometers en miles", () => {
      expect(metersToKm(5000)).toBe(5);
      expect(kmToMeters(5)).toBe(5000);
      expect(metersToMiles(1609.344)).toBe(1);
      expect(milesToMeters(1)).toBe(1609);
    });

    it("formatteert afstanden correct", () => {
      expect(formatDistance(5000, "metric")).toBe("5 km");
      expect(formatDistance(8046.72, "imperial")).toBe("5 mi");
      expect(formatDistance(null, "metric")).toBe("—");
    });
  });

  describe("parseLocalizedNumber (komma-naar-punt & validatie)", () => {
    it("accepteert zowel komma's als punten en normaliseert naar getal", () => {
      expect(parseLocalizedNumber("82,5")).toBe(82.5);
      expect(parseLocalizedNumber("82.5")).toBe(82.5);
      expect(parseLocalizedNumber(" 75,0 ")).toBe(75);
      expect(parseLocalizedNumber(180)).toBe(180);
    });

    it("geeft null terug bij lege of ontbrekende invoer", () => {
      expect(parseLocalizedNumber("")).toBeNull();
      expect(parseLocalizedNumber("   ")).toBeNull();
      expect(parseLocalizedNumber(null)).toBeNull();
      expect(parseLocalizedNumber(undefined)).toBeNull();
    });

    it("gooit een duidelijke foutmelding bij negatieve getallen", () => {
      expect(() => parseLocalizedNumber("-82,5", "Gewicht")).toThrow(
        "Gewicht mag niet negatief zijn."
      );
      expect(() => parseLocalizedNumber(-5, "Lengte")).toThrow(
        "Lengte mag niet negatief zijn."
      );
    });

    it("gooit een foutmelding bij niet-numerieke tekst", () => {
      expect(() => parseLocalizedNumber("geen_getal", "Waarde")).toThrow(
        "Waarde is geen geldig getal"
      );
    });
  });

  describe("isValidBirthDate (geboortedatum validatie)", () => {
    it("valideert reële datums", () => {
      expect(isValidBirthDate("1995-06-15").valid).toBe(true);
      expect(isValidBirthDate("2000-02-29").valid).toBe(true); // Schrikkeljaar
      expect(isValidBirthDate("").valid).toBe(true); // Optioneel toegestaan
    });

    it("weigert ongeldige dagen (zoals 30 februari of 32 januari)", () => {
      expect(isValidBirthDate("2021-02-29").valid).toBe(false); // Geen schrikkeljaar
      expect(isValidBirthDate("1995-04-31").valid).toBe(false); // April heeft 30 dagen
      expect(isValidBirthDate("1995-13-10").valid).toBe(false); // Ongeldige maand
    });

    it("weigert datums in de toekomst", () => {
      const nextYear = new Date().getFullYear() + 2;
      expect(isValidBirthDate(`${nextYear}-01-01`).valid).toBe(false);
    });

    it("weigert onzinnige historische jaren vóór 1900", () => {
      expect(isValidBirthDate("1850-05-10").valid).toBe(false);
    });
  });
});
