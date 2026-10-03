/**
 * SportKompas — Rusttimer Domeinlogica (Prompt 11)
 *
 * Beheert rusttijden tijdens krachttraining met robuuste timestamp-gebaseerde
 * berekeningen. Garandeert correcte resterende tijd na achtergrondgebruik,
 * tab-switches en schermherladingen.
 */

export interface RestTimerState {
  targetEndTimeMs: number | null; // UTC timestamp in milliseconden wanneer timer afloopt
  totalDurationSeconds: number; // Totale oorspronkelijke duur in seconden
  isPaused: boolean; // Of de timer momenteel gepauzeerd is
  remainingWhenPaused: number | null; // Resterende seconden bevroren tijdens pauze
  exerciseName?: string; // Optionele naam van de oefening waarvoor gerust wordt
  autoStartOnComplete: boolean; // Voorkeur: automatisch starten na afvinken set
  soundEnabled: boolean; // Opt-in audio melding
  vibrateEnabled: boolean; // Opt-in tril melding
}

export const REST_TIMER_STORAGE_KEY = "sportkompas_active_rest_timer_v1";
export const REST_TIMER_PREFS_KEY = "sportkompas_rest_timer_preferences_v1";

export interface RestTimerPreferences {
  autoStartOnComplete: boolean;
  soundEnabled: boolean;
  vibrateEnabled: boolean;
  defaultDurationSeconds: number;
}

export const DEFAULT_REST_TIMER_PREFS: RestTimerPreferences = {
  autoStartOnComplete: true,
  soundEnabled: false, // Opt-in conform specificatie
  vibrateEnabled: true, // Opt-in met stille fallback
  defaultDurationSeconds: 90,
};

/**
 * Berekent resterende seconden op basis van de absolute doeltijdstempel.
 * Nooit negatief.
 */
export function getRemainingSeconds(
  state: RestTimerState | null,
  nowMs: number = Date.now()
): number {
  if (!state) return 0;
  if (state.isPaused) {
    return Math.max(0, state.remainingWhenPaused ?? 0);
  }
  if (!state.targetEndTimeMs) return 0;

  const diffMs = state.targetEndTimeMs - nowMs;
  return Math.max(0, Math.ceil(diffMs / 1000));
}

/**
 * Start een nieuwe rusttimer met een opgegeven duur in seconden.
 */
export function startRestTimer(
  durationSeconds: number,
  exerciseName?: string,
  options?: Partial<RestTimerPreferences>,
  nowMs: number = Date.now()
): RestTimerState {
  const safeDuration = Math.max(1, Math.min(1800, durationSeconds));
  return {
    targetEndTimeMs: nowMs + safeDuration * 1000,
    totalDurationSeconds: safeDuration,
    isPaused: false,
    remainingWhenPaused: null,
    exerciseName,
    autoStartOnComplete: options?.autoStartOnComplete ?? true,
    soundEnabled: options?.soundEnabled ?? false,
    vibrateEnabled: options?.vibrateEnabled ?? true,
  };
}

/**
 * Pauzeert een lopende rusttimer en bevriest de resterende tijd.
 */
export function pauseRestTimer(
  state: RestTimerState,
  nowMs: number = Date.now()
): RestTimerState {
  if (state.isPaused) return state;

  const remaining = getRemainingSeconds(state, nowMs);
  return {
    ...state,
    isPaused: true,
    remainingWhenPaused: remaining,
    targetEndTimeMs: null,
  };
}

/**
 * Hervat een gepauzeerde rusttimer vanaf de bevroren resterende tijd.
 */
export function resumeRestTimer(
  state: RestTimerState,
  nowMs: number = Date.now()
): RestTimerState {
  if (!state.isPaused) return state;

  const remaining = state.remainingWhenPaused ?? 0;
  if (remaining <= 0) {
    return {
      ...state,
      isPaused: false,
      remainingWhenPaused: 0,
      targetEndTimeMs: nowMs,
    };
  }

  return {
    ...state,
    isPaused: false,
    remainingWhenPaused: null,
    targetEndTimeMs: nowMs + remaining * 1000,
  };
}

/**
 * Pas de timer aan met + of - seconden (bv. +15s of -15s).
 */
export function adjustRestTimer(
  state: RestTimerState,
  deltaSeconds: number,
  nowMs: number = Date.now()
): RestTimerState {
  if (state.isPaused) {
    const current = state.remainingWhenPaused ?? 0;
    const next = Math.max(0, current + deltaSeconds);
    return {
      ...state,
      remainingWhenPaused: next,
    };
  }

  const currentRemaining = getRemainingSeconds(state, nowMs);
  const nextRemaining = Math.max(0, currentRemaining + deltaSeconds);

  return {
    ...state,
    targetEndTimeMs: nowMs + nextRemaining * 1000,
  };
}

/**
 * Formatteert resterende seconden naar mm:ss (bv. "01:30" of "00:15").
 */
export function formatTimerDisplay(seconds: number): string {
  const safe = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

/**
 * Speelt een vriendelijke synthetische pieptoon af via de Web Audio API.
 * Bevat een stille fallback wanneer audio niet is toegestaan of geblokkeerd wordt.
 */
export function playTimerCompletionSound(): void {
  if (typeof window === "undefined") return;

  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }

    const now = ctx.currentTime;

    // Speel een dubbele chime (880 Hz -> 1174.66 Hz, A5 naar D6)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1174.66, now + 0.15);
    gain2.gain.setValueAtTime(0.2, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.5);
  } catch {
    // Stille fallback: geen crash indien audio door browserbeleid is geblokkeerd
  }
}

/**
 * Trilt het toestel via de HTML5 Vibration API indien ondersteund en toegestaan.
 */
export function triggerTimerVibration(): void {
  if (typeof window === "undefined" || typeof navigator === "undefined") return;

  try {
    if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
      navigator.vibrate([200, 100, 200, 100, 300]);
    }
  } catch {
    // Stille fallback
  }
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      return window.localStorage;
    }
    if (typeof localStorage !== "undefined") {
      return localStorage;
    }
  } catch {}
  return null;
}

/**
 * Bewaart timer status in localStorage voor persistentie bij tab-switches of refreshes.
 */
export function saveTimerStateToStorage(state: RestTimerState | null): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    if (!state) {
      storage.removeItem(REST_TIMER_STORAGE_KEY);
    } else {
      storage.setItem(REST_TIMER_STORAGE_KEY, JSON.stringify(state));
    }
  } catch {}
}

/**
 * Laadt opgeslagen timer status uit localStorage.
 */
export function loadTimerStateFromStorage(): RestTimerState | null {
  const storage = getStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(REST_TIMER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as RestTimerState;
    if (!parsed || typeof parsed.totalDurationSeconds !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Laadt opgeslagen voorkeuren uit localStorage.
 */
export function loadTimerPreferences(): RestTimerPreferences {
  const storage = getStorage();
  if (!storage) return DEFAULT_REST_TIMER_PREFS;
  try {
    const raw = storage.getItem(REST_TIMER_PREFS_KEY);
    if (!raw) return DEFAULT_REST_TIMER_PREFS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_REST_TIMER_PREFS, ...parsed };
  } catch {
    return DEFAULT_REST_TIMER_PREFS;
  }
}

/**
 * Bewaart voorkeuren in localStorage.
 */
export function saveTimerPreferences(prefs: RestTimerPreferences): void {
  const storage = getStorage();
  if (!storage) return;
  try {
    storage.setItem(REST_TIMER_PREFS_KEY, JSON.stringify(prefs));
  } catch {}
}
