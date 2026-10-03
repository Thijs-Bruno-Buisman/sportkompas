"use client";

import React from "react";
import {
  Footprints,
  Bike,
  Waves,
  Activity,
  Compass,
  Timer,
  Flame,
  Clock,
  Sparkles,
  Info,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import type { CardioSession, CardioActivityType } from "@/types/database";
import type { CardioSummaryStats } from "@/lib/db/repositories/cardio.repository";
import {
  calculatePace,
  getActivityMetadata,
} from "@/domain/cardio/calculations";

interface CardioStatsTabProps {
  stats: CardioSummaryStats;
  sessions: CardioSession[];
  userWeightKg?: number | null;
}

export function CardioStatsTab({
  stats,
  sessions,
  userWeightKg,
}: CardioStatsTabProps) {
  const totalKm = (stats.totalDistanceMeters / 1000).toFixed(1);
  const totalHours = (stats.totalDurationSeconds / 3600).toFixed(1);
  const totalCaloriesFormatted = stats.totalCalories.toLocaleString("nl-NL");

  const getActivityIcon = (type: CardioActivityType) => {
    switch (type) {
      case "hardlopen":
        return <Footprints className="w-4 h-4 text-emerald-500" />;
      case "fietsen":
        return <Bike className="w-4 h-4 text-sky-500" />;
      case "zwemmen":
        return <Waves className="w-4 h-4 text-cyan-500" />;
      case "roeien":
        return <Activity className="w-4 h-4 text-amber-500" />;
      case "wandelen":
        return <Compass className="w-4 h-4 text-teal-500" />;
      case "crosstrainer":
        return <Timer className="w-4 h-4 text-indigo-500" />;
      default:
        return <Flame className="w-4 h-4 text-slate-500" />;
    }
  };

  const activeActivities = Object.entries(stats.byActivity).filter(
    ([, data]) => data.count > 0
  ) as Array<
    [CardioActivityType, { count: number; distanceMeters: number; durationSeconds: number; calories: number }]
  >;

  return (
    <div className="space-y-6">
      {/* 4 Hoofdstatistieken kaarten */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Totale Afstand
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalKm} <span className="text-sm font-normal text-slate-400">km</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Over alle duursporten
          </p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Tijd in Beweging
          </span>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {totalHours} <span className="text-sm font-normal text-slate-400">uur</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {Math.round(stats.totalDurationSeconds / 60)} minuten totaal
          </p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Calorieverbruik
          </span>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
            <Flame className="w-5 h-5" />
            {totalCaloriesFormatted} <span className="text-sm font-normal text-slate-400">kcal</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Gevalideerde MET-berekening
          </p>
        </Card>

        <Card className="p-4 border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Geregistreerde Sessies
          </span>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {stats.totalSessions}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            In lokale IndexedDB
          </p>
        </Card>
      </div>

      {/* Uitsplitsing per sport / activiteit */}
      <Card className="p-5 border-slate-200 dark:border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Prestaties per Duursport
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Uitsplitsing van kilometers, uren en gemiddelde snelheden.
            </p>
          </div>
        </div>

        {activeActivities.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeActivities.map(([activity, data]) => {
              const meta = getActivityMetadata(activity);
              const km = (data.distanceMeters / 1000).toFixed(1);
              const hours = (data.durationSeconds / 3600).toFixed(1);
              const pace = calculatePace(data.distanceMeters, data.durationSeconds, activity);

              let paceFormatted = pace.formattedPace;
              if (meta.primaryMetric === "speed") {
                paceFormatted = pace.formattedSpeed;
              } else if (meta.primaryMetric === "split500m" && pace.formattedSplit500m) {
                paceFormatted = pace.formattedSplit500m;
              } else if (meta.primaryMetric === "swimPace100m" && pace.formattedSwimPace100m) {
                paceFormatted = pace.formattedSwimPace100m;
              }

              return (
                <div key={activity} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                      {getActivityIcon(activity)}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                        {meta.label}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {data.count} {data.count === 1 ? "sessie" : "sessies"} &bull; {hours} uur
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Afstand</span>
                      <span className="font-semibold text-slate-900 dark:text-white">
                        {meta.defaultDistanceUnit === "m" && data.distanceMeters < 10000
                          ? `${data.distanceMeters} m`
                          : `${km} km`}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">{meta.primaryMetricLabel}</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {paceFormatted}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[11px]">Calorieën</span>
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {data.calories.toLocaleString("nl-NL")} kcal
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 text-sm text-slate-400">
            Nog geen activiteitsgegevens beschikbaar om uit te splitsen.
          </div>
        )}
      </Card>

      {/* Wetenschappelijke transparantie & berekeningsverantwoording */}
      <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs text-slate-600 dark:text-slate-400">
        <Info className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-800 dark:text-slate-200">
            Transparantie van formules en berekeningen
          </p>
          <p>
            Calorieverbranding wordt berekend met het gevalideerde <em>Compendium of Physical Activities (Ainsworth et al.)</em> op basis van MET-factoren die automatisch schalen met jouw tempo en activiteit.
            {userWeightKg && userWeightKg > 0 ? (
              <> Berekening gebruikt jouw profielgewicht van <strong>{userWeightKg} kg</strong>.</>
            ) : (
              <> Er is nog geen persoonlijk gewicht ingesteld in je profiel; als veilige standaard wordt <strong>75 kg</strong> gehanteerd.</>
            )}
          </p>
          <p>
            Hartslagzones (Zone 1 t/m Zone 5) worden berekend via de <em>Gellish-formule</em> (HRmax = 207 - 0,7 &times; leeftijd).
          </p>
        </div>
      </div>
    </div>
  );
}
