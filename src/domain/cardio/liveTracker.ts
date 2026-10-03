import type { CardioActivityType } from "./types";
import { calculatePace } from "./calculations";

export interface CardioLap {
  lapNumber: number;
  lapDurationSeconds: number; // Duur van deze specifieke ronde
  totalDurationSeconds: number; // Totale cumulatieve tijd op moment van ronde
  lapDistanceMeters?: number; // Afstand in deze ronde
  totalDistanceMeters?: number; // Totale afstand op moment van ronde
  splitPaceFormatted?: string; // Berekend tempo van deze ronde
}

export interface LiveCardioTrackerState {
  id: string; // Session UUID
  activityType: CardioActivityType;
  startTimeMs: number; // UTC timestamp (Date.now()) wanneer tracker gestart is
  accumulatedSeconds: number; // Reeds verlopen seconden voorafgaand aan huidige actieve interval
  lastResumedAtMs: number | null; // Wanneer laatste hervatting plaatsvond
  isPaused: boolean; // Of de tracker momenteel gepauzeerd is
  pausedAtMs: number | null; // Wanneer de tracker gepauzeerd werd
  distanceMeters: number; // Huidige afstand (in meters)
  laps: CardioLap[]; // Tussentijden / rondes
  notes: string;
}

export const LIVE_CARDIO_STORAGE_KEY = "sportkompas_active_live_cardio_v1";

/**
 * Start een nieuwe live cardiosessie met een stabiele unieke sessie-ID en begintijdstempel.
 */
export function startLiveTracker(
  activityType: CardioActivityType = "hardlopen",
  nowMs: number = Date.now(),
  customId?: string
): LiveCardioTrackerState {
  return {
    id: customId ?? (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `cardio-${nowMs}`),
    activityType,
    startTimeMs: nowMs,
    accumulatedSeconds: 0,
    lastResumedAtMs: nowMs,
    isPaused: false,
    pausedAtMs: null,
    distanceMeters: 0,
    laps: [],
    notes: "",
  };
}

/**
 * Berekent de werkelijk verlopen seconden op basis van wall-clock timestamps.
 * Volledig immuun voor tab-drifting, achtergrondpauzes of vertragingen van setInterval.
 */
export function getLiveElapsedSeconds(
  state: LiveCardioTrackerState | null | undefined,
  nowMs: number = Date.now()
): number {
  if (!state) return 0;

  if (state.isPaused || state.lastResumedAtMs === null) {
    return Math.max(0, state.accumulatedSeconds);
  }

  const activeSegmentMs = Math.max(0, nowMs - state.lastResumedAtMs);
  const activeSegmentSec = Math.floor(activeSegmentMs / 1000);

  return Math.max(0, state.accumulatedSeconds + activeSegmentSec);
}

/**
 * Pauzeert de actieve sessie en bevriest de opgebouwde seconden.
 */
export function pauseLiveTracker(
  state: LiveCardioTrackerState,
  nowMs: number = Date.now()
): LiveCardioTrackerState {
  if (state.isPaused || state.lastResumedAtMs === null) {
    return state;
  }

  const activeSegmentMs = Math.max(0, nowMs - state.lastResumedAtMs);
  const activeSegmentSec = Math.floor(activeSegmentMs / 1000);

  return {
    ...state,
    accumulatedSeconds: Math.max(0, state.accumulatedSeconds + activeSegmentSec),
    isPaused: true,
    pausedAtMs: nowMs,
    lastResumedAtMs: null,
  };
}

/**
 * Hervat een gepauzeerde sessie.
 */
export function resumeLiveTracker(
  state: LiveCardioTrackerState,
  nowMs: number = Date.now()
): LiveCardioTrackerState {
  if (!state.isPaused) {
    return state;
  }

  return {
    ...state,
    isPaused: false,
    pausedAtMs: null,
    lastResumedAtMs: nowMs,
  };
}

/**
 * Registreert een ronde / tussentijd (lap / split).
 */
export function addLapSplit(
  state: LiveCardioTrackerState,
  nowMs: number = Date.now()
): LiveCardioTrackerState {
  const currentTotalSeconds = getLiveElapsedSeconds(state, nowMs);
  const previousLapTotalSeconds =
    state.laps.length > 0 ? state.laps[state.laps.length - 1].totalDurationSeconds : 0;
  const previousLapTotalDistance =
    state.laps.length > 0 ? (state.laps[state.laps.length - 1].totalDistanceMeters ?? 0) : 0;

  const lapDurationSeconds = Math.max(1, currentTotalSeconds - previousLapTotalSeconds);
  const lapDistanceMeters = Math.max(0, state.distanceMeters - previousLapTotalDistance);

  const paceResult = calculatePace(lapDistanceMeters, lapDurationSeconds, state.activityType);
  let splitPaceFormatted = paceResult.formattedPace;
  if (state.activityType === "fietsen" || state.activityType === "crosstrainer") {
    splitPaceFormatted = paceResult.formattedSpeed;
  } else if (state.activityType === "roeien" && paceResult.formattedSplit500m) {
    splitPaceFormatted = paceResult.formattedSplit500m;
  } else if (state.activityType === "zwemmen" && paceResult.formattedSwimPace100m) {
    splitPaceFormatted = paceResult.formattedSwimPace100m;
  }

  const newLap: CardioLap = {
    lapNumber: state.laps.length + 1,
    lapDurationSeconds,
    totalDurationSeconds: currentTotalSeconds,
    lapDistanceMeters: state.distanceMeters > 0 ? lapDistanceMeters : undefined,
    totalDistanceMeters: state.distanceMeters > 0 ? state.distanceMeters : undefined,
    splitPaceFormatted: state.distanceMeters > 0 ? splitPaceFormatted : undefined,
  };

  return {
    ...state,
    laps: [...state.laps, newLap],
  };
}

/**
 * Werkt de huidige afstand bij (bijv. via handmatige invoer of GPS stappen).
 */
export function updateLiveDistance(
  state: LiveCardioTrackerState,
  distanceMeters: number
): LiveCardioTrackerState {
  return {
    ...state,
    distanceMeters: Math.max(0, Math.round(distanceMeters)),
  };
}

/**
 * Formatteert seconden naar ergonomische timertekst (MM:SS of HH:MM:SS).
 */
export function formatLiveTimer(totalSeconds: number): string {
  const safeSec = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

let memoryStorage: Record<string, string> = {};

function getStorage(): {
  getItem: (key: string) => string | null;
  setItem: (key: string, val: string) => void;
  removeItem: (key: string) => void;
} {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {}

  return {
    getItem: (key: string) => memoryStorage[key] ?? null,
    setItem: (key: string, val: string) => {
      memoryStorage[key] = val;
    },
    removeItem: (key: string) => {
      delete memoryStorage[key];
    },
  };
}

/**
 * Slaat de actieve live state op in localStorage voor herstel bij pagina-reload.
 */
export function saveLiveTrackerToStorage(state: LiveCardioTrackerState): void {
  const storage = getStorage();
  try {
    storage.setItem(LIVE_CARDIO_STORAGE_KEY, JSON.stringify(state));
  } catch (err) {
    console.error("Fout bij opslaan live cardio tracker in localStorage:", err);
  }
}

/**
 * Haalt de actieve live state op uit localStorage.
 */
export function loadLiveTrackerFromStorage(): LiveCardioTrackerState | null {
  const storage = getStorage();
  try {
    const raw = storage.getItem(LIVE_CARDIO_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LiveCardioTrackerState;
  } catch (err) {
    console.error("Fout bij laden live cardio tracker uit localStorage:", err);
    return null;
  }
}

/**
 * Verwijdert de actieve live state uit localStorage.
 */
export function clearLiveTrackerFromStorage(): void {
  const storage = getStorage();
  try {
    storage.removeItem(LIVE_CARDIO_STORAGE_KEY);
  } catch (err) {
    console.error("Fout bij wissen live cardio tracker uit localStorage:", err);
  }
}
