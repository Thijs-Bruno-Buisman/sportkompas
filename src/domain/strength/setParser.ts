/**
 * setParser.ts â€” Pure domeinfuncties voor het parsen, formatteren en
 * vergelijken van trainingssets (gewicht, reps, duur, RPE/RIR en assisted).
 *
 * 100% UI-vrij conform AGENTS.md regel 4.
 */

import type { WorkoutSet, ExerciseMeasurementType } from "@/types/database";

export interface ParsedSetInput {
  weightKg: number;
  reps: number;
  durationSeconds?: number | null;
  actualRpe?: number | null;
  actualRir?: number | null;
}

/**
 * Parseert numerieke invoer van een mobiel toetsenbord.
 * Accepteert zowel komma (,) als punt (.) als decimaal scheidingsteken (bv. "72,5" -> 72.5).
 * Voorkomt NaN, negatieve getallen en onrealistische uitschieters.
 */
export function parseDecimalInput(
  raw: string | number | null | undefined,
  max = 1000,
  min = 0
): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (isNaN(raw) || raw < min || raw > max) return null;
    return Math.round(raw * 100) / 100;
  }

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // Vervang komma door punt
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);

  if (isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  // Afronden op 2 decimalen (bv. 2.5 kg schijven)
  return Math.round(parsed * 100) / 100;
}

/**
 * Parseert herhalingen (gehele getallen, min 0, max 500).
 */
export function parseRepsInput(
  raw: string | number | null | undefined,
  max = 500,
  min = 0
): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < min || raw > max) return null;
    return Math.floor(raw);
  }

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // Reps zijn altijd integers
  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed) || parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

/**
 * Parseert tijdsduur (seconden of mm:ss formaat bv. "1:30" -> 90).
 */
export function parseDurationInput(
  raw: string | number | null | undefined,
  maxSeconds = 86400
): number | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "number") {
    if (!Number.isFinite(raw) || raw < 0 || raw > maxSeconds) return null;
    return Math.floor(raw);
  }

  const trimmed = raw.trim();
  if (trimmed === "") return null;

  // Als invoer mm:ss is (bv "01:30" of "2:15")
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length === 2) {
      const mins = parseInt(parts[0], 10);
      const secs = parseInt(parts[1], 10);
      if (!isNaN(mins) && !isNaN(secs) && mins >= 0 && secs >= 0 && secs < 60) {
        const total = mins * 60 + secs;
        return total <= maxSeconds ? total : null;
      }
    }
    return null;
  }

  const parsed = parseInt(trimmed, 10);
  if (isNaN(parsed) || parsed < 0 || parsed > maxSeconds) {
    return null;
  }
  return parsed;
}

/**
 * Formatteert seconden naar vriendelijke weergave (bv. 90 -> "1m 30s" of "01:30").
 */
export function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  if (remSecs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${remSecs}s`;
}

/**
 * Parseert RPE (Rating of Perceived Exertion: 1 tot 10, stappen van 0.5).
 */
export function parseRpeInput(raw: string | number | null | undefined): number | null {
  const val = parseDecimalInput(raw, 10, 1);
  if (val === null) return null;
  // Rond af op halve punten (bv. 8.5)
  return Math.round(val * 2) / 2;
}

/**
 * Parseert RIR (Reps in Reserve: 0 tot 10, gehele getallen).
 */
export function parseRirInput(raw: string | number | null | undefined): number | null {
  return parseRepsInput(raw, 10, 0);
}

/**
 * KopiÃ«ren van vorige set waarden conform vereiste Prompt 10:
 * "Laat vorige set kopiÃ«ren en sets toevoegen/verwijderen toe. Stel vorige waarden voor
 * zonder ze automatisch als gedaan te markeren."
 */
export function duplicateSetValues(
  previousSet: WorkoutSet,
  newSetNumber: number,
  newId?: string
): WorkoutSet {
  return {
    id: newId || crypto.randomUUID(),
    sessionId: previousSet.sessionId,
    exerciseId: previousSet.exerciseId,
    setNumber: newSetNumber,
    setType: previousSet.setType,
    weightKg: previousSet.weightKg,
    reps: previousSet.reps,
    durationSeconds: previousSet.durationSeconds ?? null,
    targetRpe: previousSet.targetRpe,
    actualRpe: null, // Vorige waarden voorstellen zonder werkelijke invulling
    targetRir: previousSet.targetRir ?? null,
    actualRir: null,
    isAssisted: previousSet.isAssisted ?? false,
    restTimeSeconds: previousSet.restTimeSeconds,
    completed: false, // NOOIT automatisch als gedaan markeren!
    completedAt: null,
    loggedAt: new Date().toISOString(),
  };
}

/**
 * Vergelijkt twee prestaties voor progressie (Progressieve Overload / PR / eerdere prestaties).
 * HOUDT EXPLICIET REKENING MET ASSISTED OEFENINGEN:
 * "Maak assisted-gewicht herkenbaar zodat lager assistance niet als minder prestatie wordt gezien."
 *
 * Bij assisted oefeningen (bv. machine pull-ups):
 * - Minder tegengewicht = ZWAARDER = BETERE PRESTATIE (bv. 20 kg hulp is beter dan 30 kg hulp).
 * Bij reguliere gewichtsoefeningen:
 * - Meer gewicht = ZWAARDER = BETERE PRESTATIE.
 */
export function compareSetPerformance(
  a: { weightKg: number; reps: number; isAssisted?: boolean },
  b: { weightKg: number; reps: number; isAssisted?: boolean }
): number {
  const isAssisted = a.isAssisted || b.isAssisted;

  if (isAssisted) {
    // Bij gelijke reps: lager gewicht wint
    if (a.reps === b.reps) {
      return b.weightKg - a.weightKg; // als b > a, dan a is beter (positieve score)
    }
    // Als a minder gewicht heeft Ã©n minimaal evenveel reps, is a superieur
    if (a.weightKg < b.weightKg && a.reps >= b.reps) return 1;
    if (b.weightKg < a.weightKg && b.reps >= a.reps) return -1;

    // Geschat netto lichaamsgewicht aandeel (indicatief, uitgaande van 80kg referentie)
    const effectiveA = Math.max(1, 80 - a.weightKg) * a.reps;
    const effectiveB = Math.max(1, 80 - b.weightKg) * b.reps;
    return effectiveA - effectiveB;
  }

  // Reguliere gewichtsoefening: volume tonnage of 1RM
  const volA = a.weightKg * a.reps;
  const volB = b.weightKg * b.reps;

  if (volA !== volB) {
    return volA - volB;
  }
  return a.reps - b.reps;
}

/**
 * Helper die het label voor het gewichtsveld bepaalt op basis van het meettype.
 */
export function getWeightFieldLabel(
  measurementType?: ExerciseMeasurementType,
  isAssisted?: boolean
): { label: string; placeholder: string; unit: string; helperText?: string } {
  if (isAssisted || measurementType === "assisted") {
    return {
      label: "Tegengewicht (hulp)",
      placeholder: "-kg",
      unit: "kg",
      helperText: "Assistentie: minder kg is een zwaardere prestatie!",
    };
  }

  if (measurementType === "extra_gewicht") {
    return {
      label: "Extra gewicht",
      placeholder: "+kg",
      unit: "kg",
      helperText: "Gewicht bovenop je eigen lichaamsgewicht",
    };
  }

  if (measurementType === "lichaamsgewicht") {
    return {
      label: "Extra gewicht (+/-)",
      placeholder: "0",
      unit: "kg",
      helperText: "0 kg = puur eigen lichaamsgewicht",
    };
  }

  if (measurementType === "tijd") {
    return {
      label: "Toegevoegd gewicht",
      placeholder: "0",
      unit: "kg",
      helperText: "Optioneel extra gewicht (bv. halterschijf op rug)",
    };
  }

  return {
    label: "Gewicht",
    placeholder: "0",
    unit: "kg",
  };
}

