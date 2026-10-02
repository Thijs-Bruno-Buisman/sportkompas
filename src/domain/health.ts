/**
 * Berekening van Body Mass Index (BMI).
 * Formule: gewicht (kg) / (lengte (m))^2
 */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new Error("Gewicht en lengte moeten positieve getallen zijn.");
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Math.round(bmi * 10) / 10;
}

/**
 * Schatting van 1RM (One Rep Max) via de Epley-formule.
 * Formule: gewicht * (1 + herhalingen / 30)
 */
export function estimate1RmEpley(weightKg: number, reps: number): number {
  if (weightKg < 0 || reps <= 0) {
    throw new Error("Gewicht moet >= 0 zijn en reps moeten > 0 zijn.");
  }
  if (reps === 1) {
    return weightKg;
  }
  const estimate = weightKg * (1 + reps / 30);
  return Math.round(estimate * 10) / 10;
}

