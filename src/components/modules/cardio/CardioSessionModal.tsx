"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Footprints,
  Bike,
  Waves,
  Activity,
  Compass,
  Timer,
  Flame,
  Heart,
  Gauge,
  Mountain,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { CardioSession, CardioActivityType } from "@/types/database";
import {
  calculatePace,
  calculateCalories,
  calculateHeartRateZones,
  getHeartRateZoneForBpm,
  getActivityMetadata,
  CARDIO_ACTIVITIES,
} from "@/domain/cardio/calculations";

interface CardioSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: CardioSession) => Promise<void>;
  sessionToEdit?: CardioSession | null;
  userWeightKg?: number | null;
  userAge?: number | null;
  isDemoMode?: boolean;
}

export function CardioSessionModal({
  isOpen,
  onClose,
  onSave,
  sessionToEdit,
  userWeightKg,
  userAge,
  isDemoMode = false,
}: CardioSessionModalProps) {
  // Formulier state
  const [activityType, setActivityType] = useState<CardioActivityType>("hardlopen");
  const [calendarDate, setCalendarDate] = useState("");
  const [timeStr, setTimeStr] = useState("");
  const [distanceInput, setDistanceInput] = useState("");
  const [distanceUnit, setDistanceUnit] = useState<"km" | "m">("km");
  const [durationMin, setDurationMin] = useState("");
  const [durationSec, setDurationSec] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [rpe, setRpe] = useState<number | null>(7);
  const [elevationGain, setElevationGain] = useState("");
  const [cadence, setCadence] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialiseer formulier bij openen of bewerken
  useEffect(() => {
    if (isOpen) {
      if (sessionToEdit) {
        setActivityType(sessionToEdit.activityType);
        setCalendarDate(sessionToEdit.calendarDate);

        if (sessionToEdit.startTime) {
          const dateObj = new Date(sessionToEdit.startTime);
          const hh = String(dateObj.getHours()).padStart(2, "0");
          const mm = String(dateObj.getMinutes()).padStart(2, "0");
          setTimeStr(`${hh}:${mm}`);
        } else {
          setTimeStr("12:00");
        }

        const meta = getActivityMetadata(sessionToEdit.activityType);
        if (meta.defaultDistanceUnit === "m" && sessionToEdit.distanceMeters < 10000) {
          setDistanceUnit("m");
          setDistanceInput(String(sessionToEdit.distanceMeters));
        } else {
          setDistanceUnit("km");
          setDistanceInput(String(sessionToEdit.distanceMeters / 1000));
        }

        const totalSec = sessionToEdit.durationSeconds;
        setDurationMin(String(Math.floor(totalSec / 60)));
        const remSec = totalSec % 60;
        setDurationSec(remSec > 0 ? String(remSec) : "");

        setAvgHeartRate(sessionToEdit.avgHeartRateBpm ? String(sessionToEdit.avgHeartRateBpm) : "");
        setMaxHeartRate(sessionToEdit.maxHeartRateBpm ? String(sessionToEdit.maxHeartRateBpm) : "");
        setRpe(sessionToEdit.rpe ?? 7);
        setElevationGain(
          sessionToEdit.elevationGainMeters !== null && sessionToEdit.elevationGainMeters !== undefined
            ? String(sessionToEdit.elevationGainMeters)
            : ""
        );
        setCadence(
          sessionToEdit.cadenceRpm !== null && sessionToEdit.cadenceRpm !== undefined
            ? String(sessionToEdit.cadenceRpm)
            : ""
        );
        setNotes(sessionToEdit.notes ?? "");
      } else {
        // Nieuwe sessie: defaults
        const now = new Date();
        setActivityType("hardlopen");
        setCalendarDate(now.toISOString().split("T")[0]);
        const hh = String(now.getHours()).padStart(2, "0");
        const mm = String(now.getMinutes()).padStart(2, "0");
        setTimeStr(`${hh}:${mm}`);
        setDistanceInput("");
        setDistanceUnit("km");
        setDurationMin("");
        setDurationSec("");
        setAvgHeartRate("");
        setMaxHeartRate("");
        setRpe(7);
        setElevationGain("");
        setCadence("");
        setNotes("");
      }
      setErrorMessage("");
    }
  }, [isOpen, sessionToEdit]);

  // Schakel eenheid automatisch om indien sport wordt aangepast
  const handleActivitySelect = (type: CardioActivityType) => {
    setActivityType(type);
    const meta = getActivityMetadata(type);
    // Als de gebruiker nog niets heeft ingevuld, pas standaard unit aan
    if (!distanceInput) {
      setDistanceUnit(meta.defaultDistanceUnit);
    }
  };

  // Live berekening van afgeleide statistieken tijdens het typen
  const calculatedStats = useMemo(() => {
    const rawDist = Number(distanceInput.replace(",", "."));
    const rawMin = Number(durationMin) || 0;
    const rawSec = Number(durationSec) || 0;

    const totalSeconds = rawMin * 60 + rawSec;
    let distanceMeters = 0;

    if (!isNaN(rawDist) && rawDist > 0) {
      distanceMeters = distanceUnit === "km" ? Math.round(rawDist * 1000) : Math.round(rawDist);
    }

    const pace = calculatePace(distanceMeters, totalSeconds, activityType);
    const calorieCalc = calculateCalories({
      activityType,
      durationSeconds: totalSeconds,
      distanceMeters,
      userWeightKg,
    });

    const hr = avgHeartRate ? Number(avgHeartRate) : null;
    const hrZones = calculateHeartRateZones({ age: userAge });
    const zone = getHeartRateZoneForBpm(hr, hrZones);

    return {
      distanceMeters,
      totalSeconds,
      pace,
      calories: calorieCalc.calories,
      usedWeightKg: calorieCalc.usedWeightKg,
      isDefaultWeight: calorieCalc.isDefaultWeight,
      zone,
    };
  }, [
    distanceInput,
    distanceUnit,
    durationMin,
    durationSec,
    activityType,
    userWeightKg,
    userAge,
    avgHeartRate,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");

    const parsedDist = Number(distanceInput.replace(",", "."));
    if (!distanceInput || isNaN(parsedDist) || parsedDist <= 0) {
      setErrorMessage("Voer een geldige positieve afstand in.");
      return;
    }

    const parsedMin = Number(durationMin);
    const parsedSec = Number(durationSec) || 0;
    if (isNaN(parsedMin) || parsedMin < 0 || (parsedMin === 0 && parsedSec <= 0)) {
      setErrorMessage("Voer een geldige tijdsduur in (minuten en optionele seconden).");
      return;
    }

    const totalSeconds = parsedMin * 60 + parsedSec;
    const distanceMeters =
      distanceUnit === "km" ? Math.round(parsedDist * 1000) : Math.round(parsedDist);

    if (!calendarDate) {
      setErrorMessage("Selecteer een datum voor de sessie.");
      return;
    }

    // Creëer UTC startTime string
    let startTimeIso = new Date().toISOString();
    try {
      const combinedDate = new Date(`${calendarDate}T${timeStr || "12:00"}:00`);
      if (!isNaN(combinedDate.getTime())) {
        startTimeIso = combinedDate.toISOString();
      }
    } catch {
      // Fallback naar huidige tijd
    }

    const avgHr = avgHeartRate ? parseInt(avgHeartRate, 10) : null;
    const maxHr = maxHeartRate ? parseInt(maxHeartRate, 10) : null;
    const elev = elevationGain ? parseInt(elevationGain, 10) : null;
    const cad = cadence ? parseInt(cadence, 10) : null;

    if (avgHr && (avgHr < 30 || avgHr > 250)) {
      setErrorMessage("Gemiddelde hartslag moet tussen 30 en 250 bpm liggen.");
      return;
    }
    if (maxHr && (maxHr < 30 || maxHr > 250)) {
      setErrorMessage("Maximale hartslag moet tussen 30 en 250 bpm liggen.");
      return;
    }

    const sessionData: CardioSession = {
      id: sessionToEdit ? sessionToEdit.id : crypto.randomUUID(),
      calendarDate,
      startTime: startTimeIso,
      endTime: null,
      activityType,
      distanceMeters,
      durationSeconds: totalSeconds,
      avgHeartRateBpm: avgHr,
      maxHeartRateBpm: maxHr,
      estimatedCaloriesBurned: calculatedStats.calories,
      elevationGainMeters: elev,
      cadenceRpm: cad,
      rpe,
      notes: notes.trim(),
      status: "afgerond",
      provenance: sessionToEdit?.provenance ?? {
        source: isDemoMode ? "demo" : "user",
        isDemo: isDemoMode,
      },
      updatedAt: new Date().toISOString(),
    };

    setIsSubmitting(true);
    try {
      await onSave(sessionData);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || "Fout bij opslaan van de cardiosessie.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activityOptions: Array<{ id: CardioActivityType; label: string; icon: React.ReactNode }> = [
    { id: "hardlopen", label: "Hardlopen", icon: <Footprints className="w-4 h-4 text-emerald-500" /> },
    { id: "fietsen", label: "Fietsen", icon: <Bike className="w-4 h-4 text-sky-500" /> },
    { id: "roeien", label: "Roeien", icon: <Activity className="w-4 h-4 text-amber-500" /> },
    { id: "wandelen", label: "Wandelen", icon: <Compass className="w-4 h-4 text-teal-500" /> },
    { id: "zwemmen", label: "Zwemmen", icon: <Waves className="w-4 h-4 text-cyan-500" /> },
    { id: "crosstrainer", label: "Crosstrainer", icon: <Timer className="w-4 h-4 text-indigo-500" /> },
    { id: "overig", label: "Overig", icon: <Flame className="w-4 h-4 text-slate-500" /> },
  ];

  const currentMeta = getActivityMetadata(activityType);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={sessionToEdit ? "Cardiosessie Bewerken" : "Cardiosessie Registreren"}
      description="Voer de gegevens in van je voltooide duurtraining. Tempo en calorieën worden direct accuraat berekend."
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
        {errorMessage && (
          <Alert variant="error" onDismiss={() => setErrorMessage("")}>
            {errorMessage}
          </Alert>
        )}

        {/* Sportselectie chips */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Sport / Duuractiviteit *
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {activityOptions.map((opt) => {
              const isSelected = activityType === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleActivitySelect(opt.id)}
                  className={`flex items-center gap-2 p-2 rounded-xl text-xs font-medium border text-left transition-all ${
                    isSelected
                      ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-semibold ring-1 ring-emerald-500"
                      : "bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Datum en Tijd */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField id="cardio-date" label="Datum *" required>
            <Input
              id="cardio-date"
              type="date"
              value={calendarDate}
              onChange={(e) => setCalendarDate(e.target.value)}
              required
            />
          </FormField>

          <FormField id="cardio-time" label="Starttijd">
            <Input
              id="cardio-time"
              type="time"
              value={timeStr}
              onChange={(e) => setTimeStr(e.target.value)}
            />
          </FormField>
        </div>

        {/* Afstand & Duur */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Afstand met eenheid toggle */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="cardio-distance" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Afstand *
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
              id="cardio-distance"
              type="text"
              inputMode="decimal"
              placeholder={distanceUnit === "km" ? "5.2" : "5000"}
              value={distanceInput}
              onChange={(e) => setDistanceInput(e.target.value)}
              required
            />
          </div>

          {/* Duur: Minuten + Seconden */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Duur (min : sec) *
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Input
                  id="cardio-duration-min"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="1440"
                  placeholder="28"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  min
                </span>
              </div>
              <div className="relative w-24">
                <Input
                  id="cardio-duration-sec"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  max="59"
                  placeholder="00"
                  value={durationSec}
                  onChange={(e) => setDurationSec(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">
                  sec
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Berekeningsstrook */}
        {calculatedStats.distanceMeters > 0 && calculatedStats.totalSeconds > 0 && (
          <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Direct berekende prestatiewaarden</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  {currentMeta.primaryMetricLabel}:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {currentMeta.primaryMetric === "speed"
                    ? calculatedStats.pace.formattedSpeed
                    : currentMeta.primaryMetric === "split500m" && calculatedStats.pace.formattedSplit500m
                    ? calculatedStats.pace.formattedSplit500m
                    : currentMeta.primaryMetric === "swimPace100m" && calculatedStats.pace.formattedSwimPace100m
                    ? calculatedStats.pace.formattedSwimPace100m
                    : calculatedStats.pace.formattedPace}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Gemiddelde snelheid:
                </span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {calculatedStats.pace.formattedSpeed}
                </span>
              </div>

              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">
                  Geschat verbruik:
                </span>
                <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {calculatedStats.calories} kcal
                </span>
                <span className="text-[10px] text-slate-400 block">
                  {calculatedStats.isDefaultWeight
                    ? "(o.b.v. 75 kg standaard)"
                    : `(o.b.v. profiel ${calculatedStats.usedWeightKg} kg)`}
                </span>
              </div>
            </div>

            {calculatedStats.zone && (
              <div className="pt-1 border-t border-emerald-200/60 dark:border-emerald-800/40 text-[11px] flex items-center gap-2">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                <span className="text-slate-600 dark:text-slate-300">
                  Hartslagzone: <strong className="text-slate-900 dark:text-white">{calculatedStats.zone.name}</strong> ({calculatedStats.zone.percentageRange})
                </span>
              </div>
            )}
          </div>
        )}

        {/* Hartslag (gemiddeld & max) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            id="cardio-avg-hr"
            label="Gemiddelde hartslag (bpm)"
            helperText="Optioneel, bijv. 148"
          >
            <Input
              id="cardio-avg-hr"
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
            id="cardio-max-hr"
            label="Maximale hartslag (bpm)"
            helperText="Optioneel, bijv. 172"
          >
            <Input
              id="cardio-max-hr"
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

        {/* Gevoel / RPE slider */}
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

        {/* Optionele extra's: Hoogtemeters & Cadans */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            id="cardio-elevation"
            label="Hoogtemeters (m)"
            helperText="Bijv. 120 bij heuvels"
          >
            <div className="relative">
              <Input
                id="cardio-elevation"
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
            id="cardio-cadence"
            label={currentMeta.cadenceLabel ? `${currentMeta.cadenceLabel} (${currentMeta.cadenceUnit})` : "Cadans"}
            helperText={currentMeta.cadenceUnit === "spm" ? "Stappen per minuut" : "Omwentelingen per minuut"}
          >
            <div className="relative">
              <Input
                id="cardio-cadence"
                type="number"
                inputMode="numeric"
                min="0"
                max="300"
                placeholder={activityType === "fietsen" ? "85" : "165"}
                value={cadence}
                onChange={(e) => setCadence(e.target.value)}
              />
              <Gauge className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            </div>
          </FormField>
        </div>

        {/* Notities */}
        <FormField
          id="cardio-notes"
          label="Notities & Ervaring"
          helperText="Weersomstandigheden, parcours, schoenen of hoe het voelde"
        >
          <textarea
            id="cardio-notes"
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Lekker gelopen in het bos, wind mee op de terugweg..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </FormField>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Annuleren
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            {sessionToEdit ? "Wijzigingen Opslaan" : "Sessie Opslaan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
