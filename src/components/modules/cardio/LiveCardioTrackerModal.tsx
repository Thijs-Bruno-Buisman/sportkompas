"use client";

import React, { useState, useEffect } from "react";
import {
  Footprints,
  Bike,
  Waves,
  Activity,
  Compass,
  Timer,
  Flame,
  Play,
  Pause,
  Flag,
  CheckCircle2,
  X,
  Minimize2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { Dialog } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { LiveCardioTrackerState } from "@/domain/cardio/liveTracker";
import type { CardioActivityType } from "@/types/database";
import {
  getLiveElapsedSeconds,
  formatLiveTimer,
  pauseLiveTracker,
  resumeLiveTracker,
  addLapSplit,
  updateLiveDistance,
  saveLiveTrackerToStorage,
} from "@/domain/cardio/liveTracker";
import {
  calculatePace,
  calculateCalories,
  getActivityMetadata,
} from "@/domain/cardio/calculations";

interface LiveCardioTrackerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trackerState: LiveCardioTrackerState;
  onUpdateState: (newState: LiveCardioTrackerState) => void;
  onFinishRequest: (finalSeconds: number) => void;
  onDiscardRequest: () => void;
  userWeightKg?: number | null;
}

export function LiveCardioTrackerModal({
  isOpen,
  onClose,
  trackerState,
  onUpdateState,
  onFinishRequest,
  onDiscardRequest,
  userWeightKg,
}: LiveCardioTrackerModalProps) {
  const [nowMs, setNowMs] = useState(Date.now());
  const [distanceKmInput, setDistanceKmInput] = useState(
    (trackerState.distanceMeters / 1000).toString()
  );
  const [isEditingDistance, setIsEditingDistance] = useState(false);

  // Synchroniseer seconden live via timer interval
  useEffect(() => {
    if (!isOpen) return;

    setNowMs(Date.now());

    if (!trackerState.isPaused) {
      const interval = setInterval(() => {
        setNowMs(Date.now());
      }, 500);
      return () => clearInterval(interval);
    }
  }, [isOpen, trackerState.isPaused]);

  // Houd distanceKmInput synchroon als distanceMeters extern wijzigt
  useEffect(() => {
    if (!isEditingDistance) {
      setDistanceKmInput((trackerState.distanceMeters / 1000).toString());
    }
  }, [trackerState.distanceMeters, isEditingDistance]);

  const elapsedSeconds = getLiveElapsedSeconds(trackerState, nowMs);
  const meta = getActivityMetadata(trackerState.activityType);
  const formattedTime = formatLiveTimer(elapsedSeconds);

  // Live berekende metrics
  const paceData = calculatePace(
    trackerState.distanceMeters,
    elapsedSeconds,
    trackerState.activityType
  );
  const calorieData = calculateCalories({
    activityType: trackerState.activityType,
    durationSeconds: elapsedSeconds,
    distanceMeters: trackerState.distanceMeters,
    userWeightKg,
  });

  let primaryPaceFormatted = paceData.formattedPace;
  if (meta.primaryMetric === "speed") {
    primaryPaceFormatted = paceData.formattedSpeed;
  } else if (meta.primaryMetric === "split500m" && paceData.formattedSplit500m) {
    primaryPaceFormatted = paceData.formattedSplit500m;
  } else if (meta.primaryMetric === "swimPace100m" && paceData.formattedSwimPace100m) {
    primaryPaceFormatted = paceData.formattedSwimPace100m;
  }

  const triggerVibration = () => {
    if (typeof window !== "undefined" && "navigator" in window && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {
        // Fallback
      }
    }
  };

  const handleTogglePause = () => {
    triggerVibration();
    const currentNow = Date.now();
    let updated: LiveCardioTrackerState;

    if (trackerState.isPaused) {
      updated = resumeLiveTracker(trackerState, currentNow);
    } else {
      updated = pauseLiveTracker(trackerState, currentNow);
    }

    onUpdateState(updated);
    saveLiveTrackerToStorage(updated);
  };

  const handleLapSplit = () => {
    triggerVibration();
    const currentNow = Date.now();
    const updated = addLapSplit(trackerState, currentNow);
    onUpdateState(updated);
    saveLiveTrackerToStorage(updated);
  };

  const handleQuickAddDistance = (metersToAdd: number) => {
    triggerVibration();
    const newDistance = trackerState.distanceMeters + metersToAdd;
    const updated = updateLiveDistance(trackerState, newDistance);
    onUpdateState(updated);
    saveLiveTrackerToStorage(updated);
  };

  const handleApplyDistance = () => {
    const parsed = Number(distanceKmInput.replace(",", "."));
    if (!isNaN(parsed) && parsed >= 0) {
      const meters = Math.round(parsed * 1000);
      const updated = updateLiveDistance(trackerState, meters);
      onUpdateState(updated);
      saveLiveTrackerToStorage(updated);
    }
    setIsEditingDistance(false);
  };

  const getActivityIcon = () => {
    switch (trackerState.activityType) {
      case "hardlopen":
        return <Footprints className="w-5 h-5 text-emerald-500" />;
      case "fietsen":
        return <Bike className="w-5 h-5 text-sky-500" />;
      case "zwemmen":
        return <Waves className="w-5 h-5 text-cyan-500" />;
      case "roeien":
        return <Activity className="w-5 h-5 text-amber-500" />;
      case "wandelen":
        return <Compass className="w-5 h-5 text-teal-500" />;
      case "crosstrainer":
        return <Timer className="w-5 h-5 text-indigo-500" />;
      default:
        return <Flame className="w-5 h-5 text-slate-500" />;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title=""
      description=""
    >
      <div className="space-y-5 -mt-3">
        {/* Top bar met activiteit en minimaliseren */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
              {getActivityIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                  {meta.label}
                </h3>
                <Badge
                  variant={trackerState.isPaused ? "outline" : "default"}
                  className={
                    trackerState.isPaused
                      ? "text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-xs"
                      : "bg-emerald-600 text-white text-xs animate-pulse"
                  }
                >
                  {trackerState.isPaused ? "Gepauzeerd" : "Live Tracker"}
                </Badge>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            title="Minimaliseren naar banner"
          >
            <Minimize2 className="w-4 h-4 mr-1" />
            Minimaliseer
          </Button>
        </div>

        {/* Grote Digitale Klok (Sportschool Ergonomie) */}
        <div className="p-6 rounded-2xl bg-slate-900 text-white shadow-inner flex flex-col items-center justify-center border border-slate-800">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 mb-1">
            Verstreken Tijd
          </span>
          <div className="text-5xl sm:text-6xl font-mono font-black tracking-tight text-white select-none">
            {formattedTime}
          </div>
          <span className="text-xs text-slate-400 mt-1">
            {trackerState.isPaused ? "Timer staat stil" : "Timer loopt live door"}
          </span>
        </div>

        {/* Live Statistieken Kaarten */}
        <div className="grid grid-cols-3 gap-2 text-center">
          {/* Afstand */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
              Afstand
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {(trackerState.distanceMeters / 1000).toFixed(2)}{" "}
              <span className="text-xs font-normal text-slate-400">km</span>
            </span>
          </div>

          {/* Tempo / Snelheid */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
              {meta.primaryMetricLabel}
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {primaryPaceFormatted}
            </span>
          </div>

          {/* Calorieën */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
              Calorieën
            </span>
            <span className="text-lg font-bold text-amber-600 dark:text-amber-400 flex items-center justify-center gap-0.5">
              <Flame className="w-4 h-4" />
              {calorieData.calories}
            </span>
          </div>
        </div>

        {/* Snelle Afstand Knoppen (+100m, +500m, +1km of handmatig) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Afstand aanpassen (loopband / roeier / teller)
            </span>
            <button
              type="button"
              onClick={() => setIsEditingDistance(!isEditingDistance)}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline text-xs"
            >
              {isEditingDistance ? "Annuleren" : "Exacte km invoeren"}
            </button>
          </div>

          {isEditingDistance ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                inputMode="decimal"
                value={distanceKmInput}
                onChange={(e) => setDistanceKmInput(e.target.value)}
                placeholder="5.2"
                className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
              />
              <span className="text-xs text-slate-400">km</span>
              <Button size="sm" onClick={handleApplyDistance}>
                Toepassen
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleQuickAddDistance(100)}
                className="py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +100m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDistance(250)}
                className="py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +250m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDistance(500)}
                className="py-2 px-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 transition-colors"
              >
                +500m
              </button>
              <button
                type="button"
                onClick={() => handleQuickAddDistance(1000)}
                className="py-2 px-2 text-xs font-semibold rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                +1.0 km
              </button>
            </div>
          )}
        </div>

        {/* Primaire Bediening Knoppen (minimaal 48x48px touch targets) */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Pauzeer / Hervat knop */}
          <Button
            size="lg"
            variant={trackerState.isPaused ? "primary" : "outline"}
            onClick={handleTogglePause}
            className={`min-h-[52px] text-base font-bold shadow-sm ${
              trackerState.isPaused
                ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                : "border-amber-500 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40"
            }`}
            leftIcon={
              trackerState.isPaused ? (
                <Play className="w-5 h-5 fill-current" />
              ) : (
                <Pause className="w-5 h-5 fill-current" />
              )
            }
          >
            {trackerState.isPaused ? "Hervatten" : "Pauzeren"}
          </Button>

          {/* Ronde / Split knop */}
          <Button
            size="lg"
            variant="outline"
            onClick={handleLapSplit}
            disabled={trackerState.isPaused}
            className="min-h-[52px] text-base font-semibold border-slate-300 dark:border-slate-700"
            leftIcon={<Flag className="w-5 h-5 text-sky-500" />}
          >
            Ronde ({trackerState.laps.length})
          </Button>
        </div>

        {/* Rondes & Tussentijden Lijst */}
        {trackerState.laps.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
              <span>Geregistreerde Rondes</span>
              <span className="text-slate-400">{trackerState.laps.length} geregistreerd</span>
            </div>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 dark:divide-slate-800">
              {[...trackerState.laps].reverse().map((lap) => (
                <div
                  key={lap.lapNumber}
                  className="pt-1.5 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-[11px]">
                      {lap.lapNumber}
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white font-mono">
                      {formatLiveTimer(lap.lapDurationSeconds)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-slate-500">
                    {lap.splitPaceFormatted && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        {lap.splitPaceFormatted}
                      </span>
                    )}
                    <span className="font-mono text-[11px]">
                      Totaal: {formatLiveTimer(lap.totalDurationSeconds)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Onderste Knoppen: Afronden en Afbreken */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          <Button
            type="button"
            variant="ghost"
            onClick={onDiscardRequest}
            className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs"
          >
            Sessie Afbreken
          </Button>

          <Button
            type="button"
            onClick={() => onFinishRequest(elapsedSeconds)}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            Sessie Afronden
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
