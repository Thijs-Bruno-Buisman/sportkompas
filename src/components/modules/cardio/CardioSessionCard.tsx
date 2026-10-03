"use client";

import React, { useState } from "react";
import {
  Footprints,
  Bike,
  Waves,
  Activity,
  Compass,
  Timer,
  Flame,
  Heart,
  Pencil,
  Trash2,
  Mountain,
  Gauge,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { AlertTriangle } from "lucide-react";
import type { CardioSession, CardioActivityType } from "@/types/database";
import {
  calculatePace,
  calculateHeartRateZones,
  getHeartRateZoneForBpm,
  getActivityMetadata,
} from "@/domain/cardio/calculations";

interface CardioSessionCardProps {
  session: CardioSession;
  userAge?: number | null;
  onEdit: (session: CardioSession) => void;
  onDelete: (sessionId: string) => Promise<void>;
}

export function CardioSessionCard({
  session,
  userAge,
  onEdit,
  onDelete,
}: CardioSessionCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const meta = getActivityMetadata(session.activityType);
  const paceData = calculatePace(
    session.distanceMeters,
    session.durationSeconds,
    session.activityType
  );

  const hrZones = calculateHeartRateZones({ age: userAge });
  const activeZone = getHeartRateZoneForBpm(session.avgHeartRateBpm, hrZones);

  // Formatteer afstand
  const distanceFormatted =
    meta.defaultDistanceUnit === "m" && session.distanceMeters < 10000
      ? `${session.distanceMeters} m`
      : `${(session.distanceMeters / 1000).toFixed(2)} km`;

  // Formatteer duur
  const totalMinutes = Math.floor(session.durationSeconds / 60);
  const remainingSeconds = session.durationSeconds % 60;
  const durationFormatted =
    totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}u ${totalMinutes % 60}m`
      : remainingSeconds > 0
      ? `${totalMinutes}m ${remainingSeconds}s`
      : `${totalMinutes} min`;

  // Bepaal primair tempoformaat
  let primaryPaceFormatted = paceData.formattedPace;
  if (meta.primaryMetric === "speed") {
    primaryPaceFormatted = paceData.formattedSpeed;
  } else if (meta.primaryMetric === "split500m" && paceData.formattedSplit500m) {
    primaryPaceFormatted = paceData.formattedSplit500m;
  } else if (meta.primaryMetric === "swimPace100m" && paceData.formattedSwimPace100m) {
    primaryPaceFormatted = paceData.formattedSwimPace100m;
  }

  const getActivityIcon = (type: CardioActivityType) => {
    switch (type) {
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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(session.id);
      setShowConfirmDelete(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card className="p-4 sm:p-5 hover:border-slate-300 dark:hover:border-slate-700 transition-all bg-white dark:bg-slate-900 shadow-sm border border-slate-200 dark:border-slate-800">
        <div className="flex flex-col gap-3.5">
          {/* Bovenste rij: Sport, datum, badges en actieknoppen */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                {getActivityIcon(session.activityType)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-base text-slate-900 dark:text-white capitalize">
                    {meta.label}
                  </h3>
                  <Badge variant="outline" className="text-xs">
                    {distanceFormatted}
                  </Badge>
                  {session.provenance?.source === "demo" && (
                    <Badge variant="outline" className="text-[11px] text-amber-500 border-amber-300">
                      Demodata
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {session.calendarDate}
                  {session.startTime && (
                    <> &bull; {new Date(session.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
                  )}
                </p>
              </div>
            </div>

            {/* Actieknoppen */}
            <div className="flex items-center gap-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(session)}
                title="Sessie bewerken"
                className="text-slate-500 hover:text-slate-900 dark:hover:text-white h-8 w-8 p-0"
              >
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmDelete(true)}
                title="Sessie verwijderen"
                className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Kernstatistieken grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-sm">
            {/* Duur */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                Duur
              </span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {durationFormatted}
              </span>
            </div>

            {/* Tempo / Snelheid */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                {meta.primaryMetricLabel}
              </span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {primaryPaceFormatted}
              </span>
            </div>

            {/* Calorieën */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                Calorieverbruik
              </span>
              <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {session.estimatedCaloriesBurned ?? "--"} kcal
              </span>
            </div>

            {/* Hartslag & Zone */}
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 block">
                Hartslag
              </span>
              {session.avgHeartRateBpm ? (
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    {session.avgHeartRateBpm}
                  </span>
                  {activeZone && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${activeZone.color}`}>
                      {activeZone.shortName}
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Niet gemeten</span>
              )}
            </div>
          </div>

          {/* Extra details (optioneel): RPE, Hoogte, Cadans */}
          {(session.rpe || session.elevationGainMeters || session.cadenceRpm) && (
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 flex-wrap pt-0.5">
              {session.rpe && (
                <span className="inline-flex items-center gap-1">
                  <span className="font-medium text-slate-700 dark:text-slate-300">RPE:</span>
                  {session.rpe}/10
                </span>
              )}
              {session.elevationGainMeters && (
                <span className="inline-flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-slate-400" />
                  +{session.elevationGainMeters} m hoogte
                </span>
              )}
              {session.cadenceRpm && (
                <span className="inline-flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-slate-400" />
                  {session.cadenceRpm} {meta.cadenceUnit ?? "rpm"}
                </span>
              )}
            </div>
          )}

          {/* Notities */}
          {session.notes && (
            <div className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800/80">
              &ldquo;{session.notes}&rdquo;
            </div>
          )}
        </div>
      </Card>

      {/* Dialoogvenster voor verwijderen */}
      <Dialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        title="Cardiosessie verwijderen?"
        description={`Weet je zeker dat je deze ${meta.label.toLowerCase()} sessie wilt verwijderen?`}
      >
        <div className="space-y-4 py-2">
          <div className="flex items-start gap-3 p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-800 dark:text-rose-200 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Deze actie kan niet ongedaan worden gemaakt.</p>
              <p className="text-xs text-rose-700 dark:text-rose-300">
                De geregistreerde kilometers, duur en calorieën van deze cardiosessie worden definitief verwijderd uit je lokale database.
              </p>
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div><strong>Sport:</strong> {meta.label}</div>
            <div><strong>Datum:</strong> {session.calendarDate}</div>
            <div><strong>Afstand:</strong> {distanceFormatted}</div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setShowConfirmDelete(false)}
            disabled={isDeleting}
          >
            Annuleren
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            isLoading={isDeleting}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Verwijderen
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
