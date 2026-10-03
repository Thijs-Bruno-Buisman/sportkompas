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
  Maximize2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  type LiveCardioTrackerState,
  getLiveElapsedSeconds,
  formatLiveTimer,
} from "@/domain/cardio/liveTracker";
import { getActivityMetadata } from "@/domain/cardio/calculations";

interface ActiveCardioBannerProps {
  trackerState: LiveCardioTrackerState;
  onOpenTracker: () => void;
  onTogglePause: () => void;
  onFinish: () => void;
}

export function ActiveCardioBanner({
  trackerState,
  onOpenTracker,
  onTogglePause,
  onFinish,
}: ActiveCardioBannerProps) {
  const [elapsedSeconds, setElapsedSeconds] = useState(
    getLiveElapsedSeconds(trackerState, Date.now())
  );

  useEffect(() => {
    const updateTime = () => {
      setElapsedSeconds(getLiveElapsedSeconds(trackerState, Date.now()));
    };

    updateTime();

    if (!trackerState.isPaused) {
      const interval = setInterval(updateTime, 1000);
      return () => clearInterval(interval);
    }
  }, [trackerState]);

  const meta = getActivityMetadata(trackerState.activityType);
  const timeFormatted = formatLiveTimer(elapsedSeconds);

  const distanceFormatted =
    meta.defaultDistanceUnit === "m" && trackerState.distanceMeters < 10000
      ? `${trackerState.distanceMeters} m`
      : `${(trackerState.distanceMeters / 1000).toFixed(2)} km`;

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
    <div className="p-4 rounded-2xl border border-emerald-500/40 bg-linear-to-r from-emerald-50/80 to-card dark:from-emerald-950/40 dark:to-card shadow-sm ring-1 ring-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
      <div className="flex items-center gap-3.5">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          {getActivityIcon()}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base text-slate-900 dark:text-white capitalize">
              {meta.label} Live
            </span>
            <Badge
              variant={trackerState.isPaused ? "outline" : "default"}
              className={
                trackerState.isPaused
                  ? "text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/40 text-xs"
                  : "bg-emerald-600 text-white text-xs animate-pulse"
              }
            >
              {trackerState.isPaused ? "Gepauzeerd" : "Bezig"}
            </Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <strong className="text-slate-900 dark:text-white font-mono text-sm">{timeFormatted}</strong>
            {trackerState.distanceMeters > 0 && ` &bull; ${distanceFormatted}`}
            {trackerState.laps.length > 0 && ` &bull; ${trackerState.laps.length} rondes`}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center">
        <Button
          variant="outline"
          size="sm"
          onClick={onTogglePause}
          leftIcon={
            trackerState.isPaused ? (
              <Play className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <Pause className="w-3.5 h-3.5 text-amber-600" />
            )
          }
        >
          {trackerState.isPaused ? "Hervatten" : "Pauzeren"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenTracker}
          leftIcon={<Maximize2 className="w-3.5 h-3.5" />}
        >
          Openen
        </Button>

        <Button
          size="sm"
          onClick={onFinish}
          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
        >
          Afronden
        </Button>
      </div>
    </div>
  );
}
