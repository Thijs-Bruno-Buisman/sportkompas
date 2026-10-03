"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  Plus,
  Minus,
  X,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  Bell,
  Clock,
  Sparkles,
} from "lucide-react";
import {
  type RestTimerState,
  getRemainingSeconds,
  pauseRestTimer,
  resumeRestTimer,
  adjustRestTimer,
  formatTimerDisplay,
  playTimerCompletionSound,
  triggerTimerVibration,
  saveTimerStateToStorage,
  loadTimerPreferences,
  saveTimerPreferences,
  type RestTimerPreferences,
} from "@/domain/strength/restTimer";

export interface RestTimerBarProps {
  timerState: RestTimerState | null;
  onUpdateTimer: (updated: RestTimerState | null) => void;
}

export function RestTimerBar({
  timerState,
  onUpdateTimer,
}: RestTimerBarProps) {
  const [preferences, setPreferences] = useState<RestTimerPreferences>(
    loadTimerPreferences()
  );
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() =>
    getRemainingSeconds(timerState)
  );
  const [showSettings, setShowSettings] = useState(false);
  const [isCompletedAlert, setIsCompletedAlert] = useState(false);

  // Houd bij of we al een melding hebben getriggerd voor deze specifieke doeltijd
  const notifiedTargetRef = useRef<number | null>(null);

  // Synchroniseer seconden direct wanneer timerState verandert
  useEffect(() => {
    const remaining = getRemainingSeconds(timerState);
    setRemainingSeconds(remaining);

    if (!timerState) {
      setIsCompletedAlert(false);
      notifiedTargetRef.current = null;
    }
  }, [timerState]);

  // Geïsoleerde 1-seconde interval: re-rendert ALLEEN RestTimerBar, niet de parent!
  useEffect(() => {
    if (!timerState || timerState.isPaused || !timerState.targetEndTimeMs) {
      return;
    }

    const checkTimer = () => {
      const now = Date.now();
      const rem = getRemainingSeconds(timerState, now);
      setRemainingSeconds(rem);

      if (rem <= 0) {
        // Timer is zojuist afgelopen
        if (
          timerState.targetEndTimeMs &&
          notifiedTargetRef.current !== timerState.targetEndTimeMs
        ) {
          notifiedTargetRef.current = timerState.targetEndTimeMs;
          setIsCompletedAlert(true);

          if (preferences.soundEnabled) {
            playTimerCompletionSound();
          }
          if (preferences.vibrateEnabled) {
            triggerTimerVibration();
          }
        }
      }
    };

    // Voer direct één keer uit
    checkTimer();

    const interval = setInterval(checkTimer, 1000);

    // Luister ook naar tab focus / visibilitychange voor ogenblikkelijke herberekening na achtergrond
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkTimer();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
    };
  }, [timerState, preferences]);

  // Pauzeren / Hervatten
  const handleTogglePause = () => {
    if (!timerState) return;
    if (timerState.isPaused) {
      const resumed = resumeRestTimer(timerState);
      saveTimerStateToStorage(resumed);
      onUpdateTimer(resumed);
    } else {
      const paused = pauseRestTimer(timerState);
      saveTimerStateToStorage(paused);
      onUpdateTimer(paused);
    }
  };

  // +15s of -15s
  const handleAdjust = (delta: number) => {
    if (!timerState) return;
    const adjusted = adjustRestTimer(timerState, delta);
    saveTimerStateToStorage(adjusted);
    onUpdateTimer(adjusted);
    setRemainingSeconds(getRemainingSeconds(adjusted));
    setIsCompletedAlert(false);
  };

  // Overslaan / Sluiten
  const handleDismiss = () => {
    saveTimerStateToStorage(null);
    onUpdateTimer(null);
    setIsCompletedAlert(false);
  };

  // Voorkeuren aanpassen (opt-in geluid & trillen)
  const handleToggleSound = () => {
    const nextPrefs: RestTimerPreferences = {
      ...preferences,
      soundEnabled: !preferences.soundEnabled,
    };
    setPreferences(nextPrefs);
    saveTimerPreferences(nextPrefs);
    if (nextPrefs.soundEnabled) {
      // Test audio playback op gebruikersactie om audio context te ontgrendelen
      playTimerCompletionSound();
    }
  };

  const handleToggleVibrate = () => {
    const nextPrefs: RestTimerPreferences = {
      ...preferences,
      vibrateEnabled: !preferences.vibrateEnabled,
    };
    setPreferences(nextPrefs);
    saveTimerPreferences(nextPrefs);
    if (nextPrefs.vibrateEnabled) {
      triggerTimerVibration();
    }
  };

  if (!timerState) return null;

  const total = Math.max(1, timerState.totalDurationSeconds);
  const elapsed = Math.max(0, total - remainingSeconds);
  const progressPercent = Math.min(100, Math.max(0, (elapsed / total) * 100));

  return (
    <div
      role="region"
      aria-label="Rusttimer"
      className={`rounded-2xl border transition-all shadow-md overflow-hidden ${
        isCompletedAlert
          ? "bg-emerald-500 text-white border-emerald-600 animate-pulse"
          : timerState.isPaused
          ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100"
          : "bg-emerald-950/90 text-white border-emerald-500/50 backdrop-blur-sm"
      }`}
    >
      {/* Voortgangsbalk */}
      {!isCompletedAlert && (
        <div className="w-full bg-black/20 h-1.5 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear ${
              timerState.isPaused ? "bg-amber-400" : "bg-emerald-400"
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      <div className="p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Links: Tijdweergave en context */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
          <div className="flex items-center gap-2">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                isCompletedAlert
                  ? "bg-white text-emerald-600"
                  : timerState.isPaused
                  ? "bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              <Clock className="w-5 h-5 animate-spin" style={{ animationDuration: "8s" }} />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                  {formatTimerDisplay(remainingSeconds)}
                </span>
                {timerState.isPaused && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    Gepauzeerd
                  </span>
                )}
                {isCompletedAlert && (
                  <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-white text-emerald-700">
                    Rust voorbij!
                  </span>
                )}
              </div>
              <p className="text-xs opacity-80">
                {isCompletedAlert
                  ? "Klaar voor je volgende set!"
                  : timerState.exerciseName
                  ? `Rust na set voor ${timerState.exerciseName}`
                  : "Rust tussen sets"}
              </p>
            </div>
          </div>

          {/* Mobiele sluitknop */}
          <button
            type="button"
            onClick={handleDismiss}
            className="sm:hidden p-2 rounded-lg opacity-70 hover:opacity-100 hover:bg-black/10 min-h-[44px] min-w-[44px] flex items-center justify-center"
            title="Rusttimer overslaan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Midden/Rechts: Knoppen met grote touch targets (>= 48px) */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* -15s knop */}
          <button
            type="button"
            onClick={() => handleAdjust(-15)}
            className="min-h-[48px] px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 touch-manipulation"
            title="15 seconden minder rust"
          >
            <Minus className="w-3.5 h-3.5" />
            15s
          </button>

          {/* Pauzeer / Hervat knop */}
          <button
            type="button"
            onClick={handleTogglePause}
            className={`min-h-[48px] px-4 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all text-sm touch-manipulation ${
              timerState.isPaused
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30"
                : "border border-white/20 bg-white/10 hover:bg-white/20"
            }`}
            title={timerState.isPaused ? "Timer hervatten" : "Timer pauzeren"}
          >
            {timerState.isPaused ? (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Hervat</span>
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Pauze</span>
              </>
            )}
          </button>

          {/* +15s knop */}
          <button
            type="button"
            onClick={() => handleAdjust(15)}
            className="min-h-[48px] px-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-xs font-bold flex items-center gap-1 touch-manipulation"
            title="15 seconden extra rust"
          >
            <Plus className="w-3.5 h-3.5" />
            15s
          </button>

          {/* Instellingenknop (geluid & trillen) */}
          <button
            type="button"
            onClick={() => setShowSettings(!showSettings)}
            className={`min-h-[48px] min-w-[48px] p-2.5 rounded-xl border border-white/20 flex items-center justify-center transition-all ${
              preferences.soundEnabled || preferences.vibrateEnabled
                ? "bg-white/20 text-white"
                : "bg-white/5 opacity-70"
            }`}
            title="Geluid en trillen instellen"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Overslaan / Sluiten knop (Desktop) */}
          <button
            type="button"
            onClick={handleDismiss}
            className="hidden sm:flex min-h-[48px] min-w-[48px] p-2.5 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20 items-center justify-center transition-all opacity-80 hover:opacity-100"
            title="Rusttimer overslaan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Instellingenpaneel voor Geluid & Trillen */}
      {showSettings && (
        <div className="px-4 py-3 border-t border-white/10 bg-black/30 text-xs space-y-2">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleToggleSound}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold border transition-colors ${
                  preferences.soundEnabled
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "bg-white/10 text-white/70 border-white/10 hover:bg-white/20"
                }`}
              >
                {preferences.soundEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
                <span>Geluid: {preferences.soundEnabled ? "Aan" : "Uit"}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleVibrate}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg font-bold border transition-colors ${
                  preferences.vibrateEnabled
                    ? "bg-emerald-500 text-white border-emerald-400"
                    : "bg-white/10 text-white/70 border-white/10 hover:bg-white/20"
                }`}
              >
                {preferences.vibrateEnabled ? (
                  <Vibrate className="w-4 h-4" />
                ) : (
                  <VibrateOff className="w-4 h-4" />
                )}
                <span>Trillen: {preferences.vibrateEnabled ? "Aan" : "Uit"}</span>
              </button>
            </div>

            <p className="text-[11px] text-white/60 italic max-w-sm">
              Geluid en trillen werken zolang het tabblad open is. Web-apps kunnen geen geluid afspelen wanneer het besturingssysteem de browser volledig heeft afgesloten.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
