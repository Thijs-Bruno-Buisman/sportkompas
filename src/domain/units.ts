/**
 * Domein utilities voor eenheden, invoervalidatie en conversies.
 * SportKompas slaat ALTIJD canonieke eenheden op:
 * - Gewichten in kilogrammen (kg)
 * - Afstanden in meters (m)
 * - Tijd in seconden (s)
 *
 * Wijziging van weergavevoorkeur (kg vs lb, km vs mi) beïnvloedt uitsluitend de presentatie.
 */

export type UnitPreference = "metric" | "imperial";

// 1 lb = 0.45359237 kg
const KG_PER_LB = 0.45359237;
// 1 mijl = 1609.344 meter
const METERS_PER_MILE = 1609.344;

/**
 * Converteert kilogram naar pounds (lbs).
 */
export function kgToLbs(kg: number): number {
  if (kg < 0) throw new Error("Gewicht kan niet negatief zijn.");
  const lbs = kg / KG_PER_LB;
  return Math.round(lbs * 10) / 10;
}

/**
 * Converteert pounds (lbs) naar kilogram.
 */
export function lbsToKg(lbs: number): number {
  if (lbs < 0) throw new Error("Gewicht kan niet negatief zijn.");
  const kg = lbs * KG_PER_LB;
  return Math.round(kg * 10) / 10;
}

/**
 * Converteert meters naar kilometers.
 */
export function metersToKm(meters: number): number {
  if (meters < 0) throw new Error("Afstand kan niet negatief zijn.");
  const km = meters / 1000;
  return Math.round(km * 100) / 100;
}

/**
 * Converteert kilometers naar meters.
 */
export function kmToMeters(km: number): number {
  if (km < 0) throw new Error("Afstand kan niet negatief zijn.");
  return Math.round(km * 1000);
}

/**
 * Converteert meters naar miles.
 */
export function metersToMiles(meters: number): number {
  if (meters < 0) throw new Error("Afstand kan niet negatief zijn.");
  const miles = meters / METERS_PER_MILE;
  return Math.round(miles * 100) / 100;
}

/**
 * Converteert miles naar meters.
 */
export function milesToMeters(miles: number): number {
  if (miles < 0) throw new Error("Afstand kan niet negatief zijn.");
  return Math.round(miles * METERS_PER_MILE);
}

/**
 * Converteert meters naar centimeters (voor lengte en lichaamsmaten).
 */
export function metersToCm(meters: number): number {
  if (meters < 0) throw new Error("Lengte kan niet negatief zijn.");
  return Math.round(meters * 100);
}

/**
 * Converteert centimeters naar meters.
 */
export function cmToMeters(cm: number): number {
  if (cm < 0) throw new Error("Lengte kan niet negatief zijn.");
  return Math.round((cm / 100) * 100) / 100;
}

/**
 * Parseert invoer van de gebruiker met ondersteuning voor zowel komma's als punten.
 * Normaliseert bv. "82,5" naar 82.5.
 * Geeft null terug als de invoer leeg is.
 * Gooit een fout als het getal negatief of NaN is.
 */
export function parseLocalizedNumber(
  input: string | number | null | undefined,
  fieldName = "Waarde"
): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === "number") {
    if (isNaN(input)) throw new Error(`${fieldName} is geen geldig getal.`);
    if (input < 0) throw new Error(`${fieldName} mag niet negatief zijn.`);
    return input;
  }

  const trimmed = input.trim();
  if (trimmed === "") return null;

  // Vervang komma door punt
  const normalized = trimmed.replace(",", ".");
  const num = Number(normalized);

  if (isNaN(num)) {
    throw new Error(`${fieldName} is geen geldig getal: '${input}'.`);
  }
  if (num < 0) {
    throw new Error(`${fieldName} mag niet negatief zijn.`);
  }

  return num;
}

/**
 * Valideert een kalenderdatum in YYYY-MM-DD formaat.
 * Controleert schrikkeljaren, aantal dagen in maand en weigert datums in de toekomst (bij geboortedatums).
 */
export function isValidBirthDate(dateStr: string): {
  valid: boolean;
  error?: string;
} {
  if (!dateStr || dateStr.trim() === "") {
    return { valid: true }; // Optioneel
  }

  const parts = dateStr.split("-");
  if (parts.length !== 3) {
    return { valid: false, error: "Datum moet YYYY-MM-DD zijn." };
  }

  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { valid: false, error: "Datum bevat ongeldige cijfers." };
  }

  if (year < 1900 || year > new Date().getFullYear()) {
    return { valid: false, error: "Geboortejaar moet tussen 1900 en het huidige jaar liggen." };
  }

  if (month < 1 || month > 12) {
    return { valid: false, error: "Maand moet tussen 1 en 12 liggen." };
  }

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) {
    return { valid: false, error: `Ongeldige dag voor maand ${month} (maximaal ${daysInMonth} dagen).` };
  }

  const dateObj = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (dateObj > today) {
    return { valid: false, error: "Geboortedatum kan niet in de toekomst liggen." };
  }

  return { valid: true };
}

/**
 * Formatteert gewicht naar display-string op basis van de eenhedenvoorkeur.
 */
export function formatWeight(
  weightKg: number | null | undefined,
  preference: UnitPreference = "metric"
): string {
  if (weightKg === null || weightKg === undefined) return "—";
  if (preference === "imperial") {
    return `${kgToLbs(weightKg)} lbs`;
  }
  return `${weightKg} kg`;
}

/**
 * Formatteert afstand naar display-string op basis van de eenhedenvoorkeur.
 */
export function formatDistance(
  meters: number | null | undefined,
  preference: UnitPreference = "metric"
): string {
  if (meters === null || meters === undefined) return "—";
  if (preference === "imperial") {
    return `${metersToMiles(meters)} mi`;
  }
  return `${metersToKm(meters)} km`;
}
