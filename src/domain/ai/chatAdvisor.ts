/**
 * Domeinlogica voor AI Contextuele Q&A Chat (Stap 45 / Prompt 39)
 * 100% UI-vrij conform AGENTS.md en SportKompas architectuur.
 *
 * Belangrijke principes:
 * 1. AI als Assistent (Regel 7):
 *    - Beantwoordt vragen met inachtneming van feitelijke gebruikersgegevens.
 *    - Nooit medische diagnoses of blessure-behandelingen; raadpleeg altijd een professional.
 *    - Schattingen altijd gelabeld met '(schatting)'.
 * 2. Echte Persistentie & Data-aggregatie (Regel 3):
 *    - Berekend op basis van werkelijke workouts, werksets, cardio en voeding uit de database.
 * 3. Graceful Fallback (Regel 8):
 *    - Werkt 100% lokaal zonder API-sleutel via contextuele trefwoord-analyse en deterministische antwoorden.
 */

import type {
  Profile,
  WorkoutSession,
  WorkoutSet,
  CardioSession,
  MealLog,
  RecoveryLog,
} from "@/types/database";
import type { DailyNutritionTargets } from "@/domain/nutrition/goals";

export interface ChatContextInput {
  profile?: Profile | null;
  workouts: WorkoutSession[];
  workoutSets: WorkoutSet[];
  cardioSessions: CardioSession[];
  mealLogs: MealLog[];
  recoveryLogs: RecoveryLog[];
  nutritionTargets?: DailyNutritionTargets;
  referenceDate: string; // YYYY-MM-DD
}

export interface ExercisePerformanceSummary {
  exerciseId: string;
  exerciseName: string;
  maxWeightKg: number;
  latestWeightKg: number;
  totalSets: number;
}

export interface PreparedChatContext {
  userName: string;
  primaryGoal: string;
  experienceLevel: string;
  daysAnalyzed: number;
  workoutsCount: number;
  totalTonnageKg: number;
  topExercises: ExercisePerformanceSummary[];
  cardioSessionsCount: number;
  cardioDistanceKm: number;
  estimatedCardioCalories: number;
  loggedNutritionDays: number;
  avgDailyCalories: number;
  avgDailyProteinGrams: number;
  targetDailyCalories: number;
  targetDailyProtein: number;
  restDaysCount: number;
  avgRecoveryScore: number | null;
}

export interface ChatMessage {
  id: string;
  sender: "gebruiker" | "assistent";
  text: string;
  source?: "gemini" | "lokale_heuristiek";
  isEstimate?: boolean;
  timestamp: string;
}

export const AI_CHAT_DISCLAIMER =
  "SportKompas AI geeft uitsluitend sport- en voedingsinzichten op basis van jouw gelogde data. De assistent stelt GEEN medische diagnoses. Raadpleeg bij aanhoudende pijn of fysieke klachten altijd een arts of fysiotherapeut.";

export const QUICK_PROMPT_CHIPS: { label: string; prompt: string }[] = [
  {
    label: "Trainingsvoortgang",
    prompt: "Hoe presteer ik op mijn krachttrainingen van de afgelopen 2 weken?",
  },
  {
    label: "Eiwit- & Calorie-inname",
    prompt: "Krijg ik voldoende eiwitten en calorieën binnen voor mijn trainingsdoel?",
  },
  {
    label: "Herstel & Rustdagen",
    prompt: "Heb ik een gezonde balans tussen trainingsarbeid en rustdagen?",
  },
  {
    label: "Progressieve Overload",
    prompt: "Welke oefening heeft de sterkste progressie en waar kan ik ophogen?",
  },
];

/**
 * Filtert en berekent een compacte context over de afgelopen 14 dagen voor de AI chat.
 */
export function buildChatContext(input: ChatContextInput): PreparedChatContext {
  const {
    profile,
    workouts,
    workoutSets,
    cardioSessions,
    mealLogs,
    recoveryLogs,
    nutritionTargets,
    referenceDate,
  } = input;

  // 14 dagen tijdsvenster berekenen
  const refDateObj = new Date(referenceDate);
  const cutoffDateObj = new Date(refDateObj);
  cutoffDateObj.setDate(cutoffDateObj.getDate() - 14);
  const cutoffDateStr = cutoffDateObj.toISOString().split("T")[0];

  const inRangeWorkouts = workouts.filter(
    (w) => w.calendarDate >= cutoffDateStr && w.calendarDate <= referenceDate && w.status === "afgerond"
  );
  const inRangeWorkoutIds = new Set(inRangeWorkouts.map((w) => w.id));

  const inRangeSets = workoutSets.filter(
    (s) => inRangeWorkoutIds.has(s.sessionId) && s.completed && s.setType !== "warmup"
  );

  const inRangeCardio = cardioSessions.filter(
    (c) => c.calendarDate >= cutoffDateStr && c.calendarDate <= referenceDate && c.status !== "geannuleerd"
  );

  const inRangeMeals = mealLogs.filter(
    (m) => m.calendarDate >= cutoffDateStr && m.calendarDate <= referenceDate
  );

  const inRangeRecovery = recoveryLogs.filter(
    (r) => r.calendarDate >= cutoffDateStr && r.calendarDate <= referenceDate
  );

  // 1. Tonnage en Oefeningsstatistieken
  let totalTonnageKg = 0;
  const exerciseMap = new Map<string, { name: string; weights: number[]; sets: number }>();

  // Map session snapshot exercise names
  const exerciseNameMap = new Map<string, string>();
  for (const s of inRangeWorkouts) {
    if (s.snapshot?.exercises) {
      for (const ex of s.snapshot.exercises) {
        if (ex.exerciseId && ex.exerciseName) {
          exerciseNameMap.set(ex.exerciseId, ex.exerciseName);
        }
      }
    }
  }

  for (const set of inRangeSets) {
    const w = set.weightKg || 0;
    const r = set.reps || 0;
    totalTonnageKg += w * r;

    const exId = set.exerciseId;
    const exName = exerciseNameMap.get(exId) || "Oefening";
    if (!exerciseMap.has(exId)) {
      exerciseMap.set(exId, { name: exName, weights: [], sets: 0 });
    }
    const entry = exerciseMap.get(exId)!;
    entry.sets += 1;
    if (w > 0) entry.weights.push(w);
  }

  const topExercises: ExercisePerformanceSummary[] = Array.from(exerciseMap.entries())
    .map(([exerciseId, data]) => {
      const maxWeight = data.weights.length > 0 ? Math.max(...data.weights) : 0;
      const latestWeight = data.weights.length > 0 ? data.weights[data.weights.length - 1] : 0;
      return {
        exerciseId,
        exerciseName: data.name,
        maxWeightKg: maxWeight,
        latestWeightKg: latestWeight,
        totalSets: data.sets,
      };
    })
    .sort((a, b) => b.totalSets - a.totalSets)
    .slice(0, 5);

  // 2. Cardio totalen
  let cardioDistanceMeters = 0;
  let estimatedCardioCalories = 0;
  for (const c of inRangeCardio) {
    cardioDistanceMeters += c.distanceMeters || 0;
    estimatedCardioCalories += c.estimatedCaloriesBurned || 0;
  }

  // 3. Voeding gemiddelden
  const loggedDays = new Set(inRangeMeals.map((m) => m.calendarDate));
  let totalCalories = 0;
  let totalProtein = 0;
  for (const meal of inRangeMeals) {
    totalCalories += meal.totalCalories || 0;
    totalProtein += meal.totalProteinGrams || 0;
  }
  const loggedCount = loggedDays.size;
  const avgDailyCalories = loggedCount > 0 ? Math.round(totalCalories / loggedCount) : 0;
  const avgDailyProteinGrams = loggedCount > 0 ? Math.round(totalProtein / loggedCount) : 0;

  // 4. Rustdagen & Herstel
  const activeDates = new Set<string>();
  inRangeWorkouts.forEach((w) => activeDates.add(w.calendarDate));
  inRangeCardio.forEach((c) => activeDates.add(c.calendarDate));
  const restDaysCount = Math.max(0, 14 - activeDates.size);

  const recoveryScores = inRangeRecovery
    .map((r) => {
      let points = 0;
      let count = 0;
      if (typeof r.sleepQualityRating === "number") {
        points += (r.sleepQualityRating / 5) * 100;
        count++;
      }
      if (typeof r.sorenessRating === "number") {
        points += ((6 - r.sorenessRating) / 5) * 100;
        count++;
      }
      if (typeof r.stressRating === "number") {
        points += ((6 - r.stressRating) / 5) * 100;
        count++;
      }
      return count > 0 ? Math.round(points / count) : null;
    })
    .filter((s): s is number => typeof s === "number");

  const avgRecoveryScore =
    recoveryScores.length > 0
      ? Math.round(recoveryScores.reduce((a, b) => a + b, 0) / recoveryScores.length)
      : null;

  return {
    userName: profile?.name || "Sporter",
    primaryGoal: profile?.primaryGoal || "fit_blijven",
    experienceLevel: profile?.experienceLevel || "gemiddeld",
    daysAnalyzed: 14,
    workoutsCount: inRangeWorkouts.length,
    totalTonnageKg: Math.round(totalTonnageKg),
    topExercises,
    cardioSessionsCount: inRangeCardio.length,
    cardioDistanceKm: Math.round((cardioDistanceMeters / 1000) * 10) / 10,
    estimatedCardioCalories: Math.round(estimatedCardioCalories),
    loggedNutritionDays: loggedCount,
    avgDailyCalories,
    avgDailyProteinGrams,
    targetDailyCalories: nutritionTargets?.calories || 2200,
    targetDailyProtein: nutritionTargets?.proteinGrams || 150,
    restDaysCount,
    avgRecoveryScore,
  };
}

/**
 * Lokale deterministische Q&A reactiegenerator (100% offline fallback conform Regel 8).
 * Analyseert de vraag van de gebruiker en formuleert een context-bewust antwoord.
 */
export function generateLocalChatResponse(
  userQuestion: string,
  context: PreparedChatContext
): string {
  const q = userQuestion.toLowerCase().trim();

  // 1. Veiligheid: blessures en pijn
  if (
    q.includes("pijn") ||
    q.includes("blessure") ||
    q.includes("ontsteking") ||
    q.includes("last van") ||
    q.includes("zeer") ||
    q.includes("schouder") && q.includes("kraakt")
  ) {
    return (
      `Bij scherpe pijn of fysiek ongemak adviseert SportKompas om de betreffende oefening direct te staken. ` +
      `Neem voldoende rust en overbelast het gewricht of de pees niet. ` +
      `SportKompas stelt geen medische diagnoses; raadpleeg bij aanhoudende klachten altijd een gekwalificeerde arts of sportfysiotherapeut.`
    );
  }

  // 2. Voeding & Eiwitinname
  if (
    q.includes("eiwit") ||
    q.includes("voeding") ||
    q.includes("calorie") ||
    q.includes("macro") ||
    q.includes("eten") ||
    q.includes("koolhydraat")
  ) {
    if (context.loggedNutritionDays === 0) {
      return (
        `Hoi ${context.userName}, je hebt de afgelopen 14 dagen nog geen maaltijden gelogd in SportKompas. ` +
        `Je huidige dagelijkse streefdoel is ${context.targetDailyCalories} kcal en ${context.targetDailyProtein}g eiwit (schatting). ` +
        `Probeer komende week minimaal 3 dagen je ontbijt, lunch en diner vast te leggen voor gerichte feedback.`
      );
    }

    const proteinDiff = context.avgDailyProteinGrams - context.targetDailyProtein;
    let proteinAssessment = "";
    if (proteinDiff >= -10) {
      proteinAssessment = `Je zit uitstekend op koers met gemiddeld ~${context.avgDailyProteinGrams}g eiwit per dag (doel: ${context.targetDailyProtein}g) (schatting). Dit ondersteunt spierherstel en spiereiwitsynthese optimaal.`;
    } else {
      proteinAssessment = `Je gemiddelde eiwitinname ligt momenteel rond ~${context.avgDailyProteinGrams}g per dag (schatting), terwijl je streefdoel ${context.targetDailyProtein}g is. Een toevoeging van bijvoorbeeld kwark, eieren of peulvruchten kan helpen dit gat te dichten.`;
    }

    return (
      `Over de ${context.loggedNutritionDays} gelogde dag(en) in de afgelopen 2 weken consumeerde je gemiddeld ~${context.avgDailyCalories} kcal per dag ` +
      `(streefdoel: ${context.targetDailyCalories} kcal) (schatting). ` +
      `${proteinAssessment}`
    );
  }

  // 3. Progressieve Overload, Krachttraining & Oefeningen
  if (
    q.includes("progressie") ||
    q.includes("overload") ||
    q.includes("gewicht") ||
    q.includes("verhogen") ||
    q.includes("zwaarder") ||
    q.includes("oefening") ||
    q.includes("krachttraining") ||
    q.includes("deadlift") ||
    q.includes("squat") ||
    q.includes("bench") ||
    q.includes("presteer") ||
    q.includes("prestatie") ||
    q.includes("kracht")
  ) {
    if (context.topExercises.length === 0) {
      return (
        `Hoi ${context.userName}, er zijn de afgelopen 14 dagen geen voltooide werksets geregistreerd. ` +
        `Zodra je trainingen afrondt, analyseert SportKompas automatisch je werkgewichten en herhalingen voor progressieve overload suggesties.`
      );
    }

    const topEx = context.topExercises[0];
    const exList = context.topExercises
      .map((e) => `${e.exerciseName} (${e.maxWeightKg} kg, ${e.totalSets} werksets)`)
      .join(", ");

    return (
      `In de afgelopen 2 weken heb je ${context.workoutsCount} training(en) afgerond met een totale tonnage van ${context.totalTonnageKg.toLocaleString(
        "nl-NL"
      )} kg. ` +
      `Meest actieve oefeningen: ${exList}. ` +
      `Bij ${topEx.exerciseName} piekte je op ${topEx.maxWeightKg} kg. ` +
      `Wanneer je bij alle voorgeschreven werksets de bovengrens van je herhalingen met goede vorm haalt, adviseert SportKompas een voorzichtige verhoging van +1.0 tot +2.5 kg (schatting).`
    );
  }

  // 4. Herstel, Rust & Slaap
  if (
    q.includes("rust") ||
    q.includes("herstel") ||
    q.includes("slaap") ||
    q.includes("balans") ||
    q.includes("moe") ||
    q.includes("overtraind")
  ) {
    const recoveryScoreText =
      context.avgRecoveryScore !== null
        ? ` Je gemiddelde herstelscore was ${context.avgRecoveryScore}% (schatting).`
        : "";

    if (context.restDaysCount >= 4 && context.restDaysCount <= 8) {
      return (
        `Met ${context.restDaysCount} rustdagen op 14 dagen heb je een gezonde fysiologische balans behouden tussen trainingsprikkels en weefselherstel.${recoveryScoreText} ` +
        `Blijf focussen op 7 tot 9 uur slaap en minstens 2 liter water per dag.`
      );
    } else if (context.restDaysCount < 4) {
      return (
        `Je hebt intensief getraind met slechts ${context.restDaysCount} rustdag(en) in de afgelopen 2 weken.${recoveryScoreText} ` +
        `Let goed op signalen van vermoeidheid of stijfheid. Plan minimaal 2 volledige rustdagen per week in om het centrale zenuwstelsel te laten ontspannen (schatting).`
      );
    } else {
      return (
        `Je hebt de afgelopen 2 weken ${context.restDaysCount} rustdagen gehad en ${context.workoutsCount} krachttraining(en) gedaan.${recoveryScoreText} ` +
        `Je lichaam is goed uitgerust; een uitstekend moment om de trainingsfrequentie weer rustig op te bouwen.`
      );
    }
  }

  // 5. Cardio & Conditie
  if (
    q.includes("cardio") ||
    q.includes("conditie") ||
    q.includes("lopen") ||
    q.includes("hardlopen") ||
    q.includes("fietsen") ||
    q.includes("wandelen")
  ) {
    if (context.cardioSessionsCount > 0) {
      return (
        `Je voltooide ${context.cardioSessionsCount} cardiosessie(s) over de afgelopen 14 dagen, goed voor in totaal ${context.cardioDistanceKm} km ` +
        `en een geschat verbruik van ~${context.estimatedCardioCalories} kcal (schatting). ` +
        `Een uitstekende stimulans voor je aerobe capaciteit en cardiovasculaire gezondheid.`
      );
    } else {
      return (
        `Er zijn de afgelopen 14 dagen geen cardiosessies geregistreerd. ` +
        `Zelfs 20 tot 30 minuten rustig wandelen of fietsen op rustdagen kan actief herstel bevorderen zonder spieropbouw in de weg te zitten (schatting).`
      );
    }
  }

  // 6. Algemeen overzicht
  return (
    `Hoi ${context.userName}, op basis van je gelogde gegevens van de afgelopen 14 dagen (doel: ${context.primaryGoal}): ` +
    `Je voltooide ${context.workoutsCount} krachttraining(en) met een tonnage van ${context.totalTonnageKg.toLocaleString(
      "nl-NL"
    )} kg, ${context.cardioSessionsCount} cardiosessie(s) (${context.cardioDistanceKm} km), en hield ${context.restDaysCount} rustdagen. ` +
    `Stel gerust een specifieke vraag over je trainingsgewicht, eiwitinname of herstelbalans!`
  );
}
