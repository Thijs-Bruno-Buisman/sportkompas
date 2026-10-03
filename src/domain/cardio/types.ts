import type { CardioActivityType } from "@/types/database";

export type { CardioActivityType };

export interface PaceCalculationResult {
  paceSecondsPerKm: number;
  formattedPace: string; // e.g. "5:30 /km"
  speedKmH: number; // e.g. 10.9
  formattedSpeed: string; // e.g. "10.9 km/u"
  split500mSeconds?: number;
  formattedSplit500m?: string; // e.g. "2:15 /500m"
  swimPace100mSeconds?: number;
  formattedSwimPace100m?: string; // e.g. "1:45 /100m"
}

export interface HeartRateZone {
  zone: 1 | 2 | 3 | 4 | 5;
  name: string;
  shortName: string;
  minBpm: number;
  maxBpm: number;
  percentageRange: string;
  color: string; // Tailwind color class or hex
  description: string;
}

export interface ActivityMetadata {
  id: CardioActivityType;
  label: string;
  description: string;
  iconName: string;
  defaultDistanceUnit: "km" | "m";
  primaryMetric: "pace" | "speed" | "split500m" | "swimPace100m";
  primaryMetricLabel: string;
  cadenceLabel?: string;
  cadenceUnit?: string;
  baseMet: number;
}
