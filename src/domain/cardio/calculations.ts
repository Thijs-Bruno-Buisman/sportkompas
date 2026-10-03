import type {
  CardioActivityType,
  PaceCalculationResult,
  HeartRateZone,
  ActivityMetadata,
} from "./types";

/**
 * Metadata over ondersteunde cardio-activiteitstypen binnen SportKompas.
 */
export const CARDIO_ACTIVITIES: Record<CardioActivityType, ActivityMetadata> = {
  hardlopen: {
    id: "hardlopen",
    label: "Hardlopen",
    description: "Buiten, baan of loopband",
    iconName: "Footprints",
    defaultDistanceUnit: "km",
    primaryMetric: "pace",
    primaryMetricLabel: "Tempo",
    cadenceLabel: "Stapfrequentie",
    cadenceUnit: "spm",
    baseMet: 9.8,
  },
  fietsen: {
    id: "fietsen",
    label: "Wielrennen / Fietsen",
    description: "Buitenrit, racefiets of spinning",
    iconName: "Bike",
    defaultDistanceUnit: "km",
    primaryMetric: "speed",
    primaryMetricLabel: "Snelheid",
    cadenceLabel: "Trapfrequentie",
    cadenceUnit: "rpm",
    baseMet: 7.5,
  },
  roeien: {
    id: "roeien",
    label: "Roeien",
    description: "Concept2 ergometer of buitenwater",
    iconName: "Activity",
    defaultDistanceUnit: "m",
    primaryMetric: "split500m",
    primaryMetricLabel: "500m Split",
    cadenceLabel: "Haalfrequentie",
    cadenceUnit: "spm",
    baseMet: 7.0,
  },
  wandelen: {
    id: "wandelen",
    label: "Wandelen",
    description: "Stevige wandeling of hiking",
    iconName: "Compass",
    defaultDistanceUnit: "km",
    primaryMetric: "pace",
    primaryMetricLabel: "Tempo",
    cadenceLabel: "Stapfrequentie",
    cadenceUnit: "spm",
    baseMet: 3.8,
  },
  zwemmen: {
    id: "zwemmen",
    label: "Zwemmen",
    description: "Binnenzwembad of open water",
    iconName: "Waves",
    defaultDistanceUnit: "m",
    primaryMetric: "swimPace100m",
    primaryMetricLabel: "100m Tempo",
    cadenceLabel: "Slagfrequentie",
    cadenceUnit: "spm",
    baseMet: 7.0,
  },
  crosstrainer: {
    id: "crosstrainer",
    label: "Crosstrainer",
    description: "Elliptical of stepper in sportschool",
    iconName: "Timer",
    defaultDistanceUnit: "km",
    primaryMetric: "speed",
    primaryMetricLabel: "Snelheid",
    cadenceLabel: "Pasfrequentie",
    cadenceUnit: "spm",
    baseMet: 7.0,
  },
  overig: {
    id: "overig",
    label: "Overige duursport",
    description: "Skeeleren, schaatsen of boksen",
    iconName: "Flame",
    defaultDistanceUnit: "km",
    primaryMetric: "speed",
    primaryMetricLabel: "Snelheid",
    baseMet: 6.0,
  },
};

export function getActivityMetadata(type: CardioActivityType): ActivityMetadata {
  return CARDIO_ACTIVITIES[type] ?? CARDIO_ACTIVITIES.overig;
}

/**
 * Berekent tempo, gemiddelde snelheid en sportspecifieke splits (roeien 500m split, zwemmen 100m tempo).
 */
export function calculatePace(
  distanceMeters: number,
  durationSeconds: number,
  _activityType?: CardioActivityType
): PaceCalculationResult {
  if (distanceMeters <= 0 || durationSeconds <= 0) {
    return {
      paceSecondsPerKm: 0,
      formattedPace: "--:-- /km",
      speedKmH: 0,
      formattedSpeed: "0.0 km/u",
      split500mSeconds: 0,
      formattedSplit500m: "--:-- /500m",
      swimPace100mSeconds: 0,
      formattedSwimPace100m: "--:-- /100m",
    };
  }

  const distanceKm = distanceMeters / 1000;
  const durationHours = durationSeconds / 3600;

  // Snelheid in km/u
  const rawSpeed = distanceKm / durationHours;
  const speedKmH = Math.round(rawSpeed * 10) / 10;
  const formattedSpeed = `${speedKmH.toFixed(1)} km/u`;

  // Tempo in seconden per kilometer
  const paceSecondsPerKm = Math.round(durationSeconds / distanceKm);
  const paceMin = Math.floor(paceSecondsPerKm / 60);
  const paceSec = paceSecondsPerKm % 60;
  const formattedPace = `${paceMin}:${paceSec.toString().padStart(2, "0")} /km`;

  // 500m split voor roeien
  const split500mSeconds = Math.round((durationSeconds / distanceMeters) * 500);
  const splitMin = Math.floor(split500mSeconds / 60);
  const splitSec = split500mSeconds % 60;
  const formattedSplit500m = `${splitMin}:${splitSec.toString().padStart(2, "0")} /500m`;

  // 100m tempo voor zwemmen
  const swimPace100mSeconds = Math.round((durationSeconds / distanceMeters) * 100);
  const swimMin = Math.floor(swimPace100mSeconds / 60);
  const swimSec = swimPace100mSeconds % 60;
  const formattedSwimPace100m = `${swimMin}:${swimSec.toString().padStart(2, "0")} /100m`;

  return {
    paceSecondsPerKm,
    formattedPace,
    speedKmH,
    formattedSpeed,
    split500mSeconds,
    formattedSplit500m,
    swimPace100mSeconds,
    formattedSwimPace100m,
  };
}

/**
 * Bepaalt de MET-waarde (Metabolic Equivalent of Task) op basis van activiteit en optionele snelheid.
 * Gebaseerd op het gevalideerde Compendium of Physical Activities (Ainsworth et al.).
 */
export function getMetValue(
  activityType: CardioActivityType,
  speedKmH?: number
): number {
  if (speedKmH === undefined || speedKmH <= 0) {
    return getActivityMetadata(activityType).baseMet;
  }

  switch (activityType) {
    case "hardlopen":
      if (speedKmH < 8.0) return 8.0; // Rustig joggen (<8 km/u)
      if (speedKmH < 9.7) return 9.0; // ~9 km/u (6:40 /km)
      if (speedKmH < 11.3) return 10.5; // ~10.5 km/u (5:40 /km)
      if (speedKmH < 13.0) return 11.8; // ~12 km/u (5:00 /km)
      if (speedKmH < 14.5) return 12.8; // ~14 km/u (4:17 /km)
      return 14.5; // >14.5 km/u (wedstrijdtempo)

    case "fietsen":
      if (speedKmH < 15.0) return 5.8; // Rustig stadsfietsen
      if (speedKmH < 20.0) return 6.8; // Recreatief toeren (15-19 km/u)
      if (speedKmH < 25.0) return 8.5; // Stevig doortrappen (20-24 km/u)
      if (speedKmH < 30.0) return 10.5; // Wielrennen vlot (25-29 km/u)
      return 12.0; // Wielrennen hard (>=30 km/u)

    case "wandelen":
      if (speedKmH < 4.0) return 3.0; // Slenteren / rustig
      if (speedKmH < 5.5) return 3.8; // Normaal wandeltempo (~5 km/u)
      if (speedKmH < 6.5) return 4.8; // Stevig doorwandelen
      return 6.0; // Snelwandelen / heuvelop

    case "roeien":
      if (speedKmH < 8.0) return 7.0; // Gematigd (ca. >2:15 /500m)
      if (speedKmH < 11.0) return 8.5; // Stevig (ca. 1:55-2:15 /500m)
      return 10.5; // Zeer zwaar (<1:55 /500m)

    case "zwemmen":
      if (speedKmH < 2.0) return 6.0; // Rustige schoolslag / recreatief
      if (speedKmH < 3.2) return 8.0; // Gematigde borstcrawl
      return 10.0; // Intensieve zwemslag / sprint

    case "crosstrainer":
      if (speedKmH < 8.0) return 6.0;
      if (speedKmH < 12.0) return 7.5;
      return 9.0;

    default:
      return 6.0;
  }
}

/**
 * Berekent geschat calorieverbruik via de MET-formule:
 * Calorieën = MET * gewicht (kg) * duur (uren).
 * Indien er geen gebruikersgewicht beschikbaar is, wordt 75 kg als veilige referentie gebruikt
 * en expliciet als 'isDefaultWeight: true' gemarkeerd.
 */
export function calculateCalories(options: {
  activityType: CardioActivityType;
  durationSeconds: number;
  distanceMeters?: number;
  userWeightKg?: number | null;
}): {
  calories: number;
  met: number;
  usedWeightKg: number;
  isDefaultWeight: boolean;
} {
  const { activityType, durationSeconds, distanceMeters, userWeightKg } = options;

  if (durationSeconds <= 0) {
    return {
      calories: 0,
      met: getActivityMetadata(activityType).baseMet,
      usedWeightKg: userWeightKg && userWeightKg > 0 ? userWeightKg : 75,
      isDefaultWeight: !userWeightKg || userWeightKg <= 0,
    };
  }

  let speedKmH: number | undefined;
  if (distanceMeters && distanceMeters > 0) {
    const hours = durationSeconds / 3600;
    speedKmH = (distanceMeters / 1000) / hours;
  }

  const met = getMetValue(activityType, speedKmH);
  const isDefaultWeight = !userWeightKg || userWeightKg <= 0;
  const usedWeightKg = isDefaultWeight ? 75 : userWeightKg!;

  const durationHours = durationSeconds / 3600;
  const rawCalories = met * usedWeightKg * durationHours;
  const calories = Math.max(0, Math.round(rawCalories));

  return {
    calories,
    met,
    usedWeightKg,
    isDefaultWeight,
  };
}

/**
 * Berekent de 5 fysiologische hartslagzones op basis van maximale hartslag of leeftijd.
 * Maakt gebruik van de wetenschappelijk beproefde Gellish-formule: HRmax = 207 - (0.7 * leeftijd).
 */
export function calculateHeartRateZones(options: {
  age?: number | null;
  maxHeartRateBpm?: number | null;
  restingHeartRateBpm?: number | null;
}): HeartRateZone[] {
  let maxHr = 185; // Standaard veilige fallback

  if (options.maxHeartRateBpm && options.maxHeartRateBpm > 60) {
    maxHr = Math.min(230, Math.max(100, Math.round(options.maxHeartRateBpm)));
  } else if (options.age && options.age > 0) {
    // Gellish et al. (2007)
    maxHr = Math.round(207 - 0.7 * options.age);
  }

  return [
    {
      zone: 1,
      name: "Zone 1 - Actief Herstel",
      shortName: "Z1 Herstel",
      minBpm: Math.round(maxHr * 0.5),
      maxBpm: Math.round(maxHr * 0.6) - 1,
      percentageRange: "50-60%",
      color: "text-slate-500 bg-slate-100 dark:bg-slate-800 dark:text-slate-300",
      description: "Zeer lichte inspanning; bevordert doorbloeding en herstel.",
    },
    {
      zone: 2,
      name: "Zone 2 - Duurbasis",
      shortName: "Z2 Duurbasis",
      minBpm: Math.round(maxHr * 0.6),
      maxBpm: Math.round(maxHr * 0.7) - 1,
      percentageRange: "60-70%",
      color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 dark:text-sky-400",
      description: "Optimale vetverbranding en opbouw van aerobe mitochondriale basis.",
    },
    {
      zone: 3,
      name: "Zone 3 - Aerobe Conditie",
      shortName: "Z3 Aerobic",
      minBpm: Math.round(maxHr * 0.7),
      maxBpm: Math.round(maxHr * 0.8) - 1,
      percentageRange: "70-80%",
      color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-400",
      description: "Matige tot stevige inspanning; verbetert algemeen uithoudingsvermogen.",
    },
    {
      zone: 4,
      name: "Zone 4 - Lactaatdrempel",
      shortName: "Z4 Drempel",
      minBpm: Math.round(maxHr * 0.8),
      maxBpm: Math.round(maxHr * 0.9) - 1,
      percentageRange: "80-90%",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-400",
      description: "Zware inspanning rond de anaerobe drempel; verhoogt tempohardheid.",
    },
    {
      zone: 5,
      name: "Zone 5 - Maximaal",
      shortName: "Z5 Maximaal",
      minBpm: Math.round(maxHr * 0.9),
      maxBpm: maxHr,
      percentageRange: "90-100%",
      color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-400",
      description: "Korte piekinspanningen; vergroot anaerobe capaciteit en VO2max.",
    },
  ];
}

/**
 * Bepaalt in welke hartslagzone een gemiddelde hartslag (bpm) valt.
 */
export function getHeartRateZoneForBpm(
  bpm: number | null | undefined,
  zones: HeartRateZone[]
): HeartRateZone | null {
  if (!bpm || bpm <= 0 || !zones.length) return null;

  // Indien bpm onder de min van Z1 valt, markeer als Z1
  if (bpm < zones[0].minBpm) return zones[0];

  for (const zone of zones) {
    if (bpm >= zone.minBpm && bpm <= zone.maxBpm) {
      return zone;
    }
  }

  // Indien bpm hoger is dan max van Z5
  return zones[zones.length - 1];
}
