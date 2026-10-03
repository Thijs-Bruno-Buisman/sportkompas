"use client";

import React, { useState, useMemo } from "react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { CheckCircle2, Flame, Heart, Sparkles, Mountain, Gauge } from "lucide-react";
import type { LiveCardioTrackerState } from "@/domain/cardio/liveTracker";
import type { CardioSession } from "@/types/database";
import {
  calculatePace,
  calculateCalories,
  calculateHeartRateZones,
  getHeartRateZoneForBpm,
  getActivityMetadata,
} from "@/domain/cardio/calculations";

interface FinishLiveCardioDialogProps {
  isOpen: boolean;
  onClose: () => void;
  trackerState: LiveCardioTrackerState;
  finalDurationSeconds: number;
  userWeightKg?: number | null;
  userAge?: number | null;
  isDemoMode?: boolean;
  onSave: (session: CardioSession) => Promise<void>;
}

export function FinishLiveCardioDialog({
  isOpen,
  onClose,
  trackerState,
  finalDurationSeconds,
  userWeightKg,
  userAge,
  isDemoMode = false,
  onSave,
}: FinishLiveCardioDialogProps) {
  const meta = getActivityMetadata(trackerState.activityType);

  const initialDistanceFormatted =
    meta.defaultDistanceUnit === "m" && trackerState.distanceMeters < 10000
      ? String(trackerState.distanceMeters)
      : (trackerState.distanceMeters / 1000).toFixed(2);

  const [distanceInput, setDistanceInput] = useState(initialDistanceFormatted);
  const [distanceUnit, setDistanceUnit] = useState<"km" | "m">(
    meta.defaultDistanceUnit === "m" && trackerState.distanceMeters < 10000 ? "m" : "km"
  );
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [rpe, setRpe] = useState<number | null>(7);
  const [elevationGain, setElevationGain] = useState("");
  const [cadence, setCadence] = useState("");
  const [notes, setNotes] = useState(trackerState.notes || "");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live berekeningen voor samenvatting
  const stats = useMemo(() => {
    const rawDist = Number(distanceInput.replace(",", "."));
    let distanceMeters = 0;
    if (!isNaN(rawDist) && rawDist > 0) {
      distanceMeters = distanceUnit === "km" ? Math.round(rawDist * 1000) : Math.round(rawDist);
    }

    const pace = calculatePace(distanceMeters, finalDurationSeconds, trackerState.activityType);
    const calorieCalc = calculateCalories({
      activityType: trackerState.activityType,
      durationSeconds: finalDurationSeconds,
      distanceMeters,
      userWeightKg,
    });

    const hr = avgHeartRate ? Number(avgHeartRate) : null;
    const hrZones = calculateHeartRateZones({ age: userAge });
    const zone = getHeartRateZoneForBpm(hr, hrZones);

    return {
      distanceMeters,
      pace,
      calories: calorieCalc.calories,
      usedWeightKg: calorieCalc.usedWeightKg,
      isDefaultWeight: calorieCalc.isDefaultWeight,
      zone,
    };
  }, [
    distanceInput,
    distanceUnit,
    finalDurationSeconds,
    trackerState.activityType,
    userWeightKg,
    userAge,
    avgHeartRate,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const parsedDist = Number(distanceInput.replace(",", "."));
    if (isNaN(parsedDist) || parsedDist < 0) {
      setErrorMessage("Voer een geldige positieve afstand in of vul 0 in.");
      return;
    }

    const distanceMeters =
      distanceUnit === "km" ? Math.round(parsedDist * 1000) : Math.round(parsedDist);

    const avgHr = avgHeartRate ? parseInt(avgHeartRate, 10) : null;
    const maxHr = maxHeartRate ? parseInt(maxHeartRate, 10) : null;
    const elev = elevationGain ? parseInt(elevationGain, 10) : null;
    const cad = cadence ? parseInt(cadence, 10) : null;

    const startDate = new Date(trackerState.startTimeMs);
    const calendarDate = startDate.toISOString().split("T")[0];

    const session: CardioSession = {
      id: trackerState.id,
      calendarDate,
      startTime: startDate.toISOString(),
      endTime: new Date().toISOString(),
      activityType: trackerState.activityType,
      distanceMeters,
      durationSeconds: Math.max(1, finalDurationSeconds),
      avgHeartRateBpm: avgHr,
      maxHeartRateBpm: maxHr,
      estimatedCaloriesBurned: stats.calories,
      elevationGainMeters: elev,
      cadenceRpm: cad,
      rpe,
      notes: notes.trim(),
      status: "afgerond",
      provenance: { source: isDemoMode ? "demo" : "user", isDemo: isDemoMode },
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await onSave(session);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij afronden van cardiosessie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalMinutes = Math.floor(finalDurationSeconds / 60);
  const remainingSeconds = finalDurationSeconds % 60;
  const durationText =
    totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}u ${totalMinutes % 60}m ${remainingSeconds}s`
      : `${totalMinutes}m ${remainingSeconds}s`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Cardiosessie Voltooien & Opslaan"
      description={`Geweldig getraind! Controleer je gegevens van deze ${meta.label.toLowerCase()} sessie.`}
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        {/* Prestatie highlight kaart */}
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-800 dark:text-emerald-300">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Sessie succesvol afgerond
            </span>
            <span>Tijd: {durationText}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                {meta.primaryMetricLabel}:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {meta.primaryMetric === "speed"
                  ? stats.pace.formattedSpeed
                  : meta.primaryMetric === "split500m" && stats.pace.formattedSplit500m
                  ? stats.pace.formattedSplit500m
                  : meta.primaryMetric === "swimPace100m" && stats.pace.formattedSwimPace100m
                  ? stats.pace.formattedSwimPace100m
                  : stats.pace.formattedPace}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Snelheid:
              </span>
              <span className="font-bold text-slate-900 dark:text-white">
                {stats.pace.formattedSpeed}
              </span>
            </div>

            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                Calorieverbruik:
              </span>
              <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {stats.calories} kcal
              </span>
            </div>
          </div>
        </div>

        {/* Definitieve Afstand */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="finish-distance" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Totale Afstand *
            </label>
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-100 dark:bg-slate-800">
              <button
                type="button"
                onClick={() => setDistanceUnit("km")}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                  distanceUnit === "km"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Kilometers (km)
              </button>
              <button
                type="button"
                onClick={() => setDistanceUnit("m")}
                className={`text-[11px] px-2 py-0.5 rounded font-medium transition-colors ${
                  distanceUnit === "m"
                    ? "bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                Meters (m)
              </button>
            </div>
          </div>
          <Input
            id="finish-distance"
            type="text"
            inputMode="decimal"
            placeholder={distanceUnit === "km" ? "5.2" : "5200"}
            value={distanceInput}
            onChange={(e) => setDistanceInput(e.target.value)}
            required
          />
        </div>

        {/* Hartslag (optioneel) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            id="finish-avg-hr"
            label="Gemiddelde hartslag (bpm)"
            helperText="Optioneel, bijv. 148"
          >
            <Input
              id="finish-avg-hr"
              type="number"
              inputMode="numeric"
              min="30"
              max="250"
              placeholder="145"
              value={avgHeartRate}
              onChange={(e) => setAvgHeartRate(e.target.value)}
            />
          </FormField>

          <FormField
            id="finish-max-hr"
            label="Maximale hartslag (bpm)"
            helperText="Optioneel, bijv. 172"
          >
            <Input
              id="finish-max-hr"
              type="number"
              inputMode="numeric"
              min="30"
              max="250"
              placeholder="170"
              value={maxHeartRate}
              onChange={(e) => setMaxHeartRate(e.target.value)}
            />
          </FormField>
        </div>

        {/* RPE Inspanningsschaal */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Gevoel / Inspanning (RPE)
            </label>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              {rpe ? `${rpe} / 10` : "Niet ingevuld"}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={rpe ?? 7}
            onChange={(e) => setRpe(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 mt-1">
            <span>1 - Zeer licht</span>
            <span>5 - Gematigd</span>
            <span>7 - Pittig</span>
            <span>10 - Maximaal</span>
          </div>
        </div>

        {/* Hoogtemeters & Cadans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            id="finish-elevation"
            label="Hoogtemeters (m)"
            helperText="Bijv. 85"
          >
            <div className="relative">
              <Input
                id="finish-elevation"
                type="number"
                inputMode="numeric"
                min="0"
                placeholder="0"
                value={elevationGain}
                onChange={(e) => setElevationGain(e.target.value)}
              />
              <Mountain className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </FormField>

          <FormField
            id="finish-cadence"
            label={meta.cadenceLabel ? `${meta.cadenceLabel} (${meta.cadenceUnit})` : "Cadans"}
            helperText={meta.cadenceUnit === "spm" ? "Stappen / slagen per minuut" : "Omwentelingen per minuut"}
          >
            <div className="relative">
              <Input
                id="finish-cadence"
                type="number"
                inputMode="numeric"
                min="0"
                max="300"
                placeholder={trackerState.activityType === "fietsen" ? "85" : "165"}
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
              />
              <Gauge className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </FormField>
        </div>

        {/* Rondes / Splits tabel (indien gelogd) */}
        {trackerState.laps.length > 0 && (
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-3 bg-slate-50 dark:bg-slate-800/40 space-y-1.5">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white">
              Geregistreerde Rondes / Splits ({trackerState.laps.length})
            </h4>
            <div className="text-xs divide-y divide-slate-200 dark:divide-slate-700/60 max-h-32 overflow-y-auto">
              {trackerState.laps.map((lap) => (
                <div key={lap.lapNumber} className="py-1.5 flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Ronde {lap.lapNumber}
                  </span>
                  <span className="text-slate-500">
                    {Math.floor(lap.lapDurationSeconds / 60)}m {lap.lapDurationSeconds % 60}s
                    {lap.splitPaceFormatted && ` (${lap.splitPaceFormatted})`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notities */}
        <FormField id="finish-notes" label="Notities & Ervaring">
          <textarea
            id="finish-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Goede cadans aangehouden, frisse buitenlucht..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </FormField>

        <DialogFooter className="gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Annuleren
          </Button>
          <Button type="submit" isLoading={isSubmitting} leftIcon={<CheckCircle2 className="w-4 h-4" />}>
            Sessie Definitief Opslaan
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
