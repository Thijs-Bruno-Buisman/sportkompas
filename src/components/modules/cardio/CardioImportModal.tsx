"use client";

import React, { useState, useRef, useCallback } from "react";
import {
  UploadCloud,
  FileCheck,
  AlertCircle,
  Footprints,
  Bike,
  Compass,
  Waves,
  Activity,
  Timer,
  Flame,
  Heart,
  Mountain,
  Check,
} from "lucide-react";
import { Dialog, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/Input";
import type { CardioSession, CardioActivityType } from "@/types/database";
import {
  parseCardioFile,
  type ParsedCardioImport,
} from "@/domain/cardio/importParser";
import { CARDIO_ACTIVITIES } from "@/domain/cardio/calculations";

interface CardioImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: CardioSession) => Promise<void>;
  userWeightKg?: number | null;
  isDemoMode?: boolean;
}

export function CardioImportModal({
  isOpen,
  onClose,
  onSave,
  userWeightKg,
  isDemoMode = false,
}: CardioImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCardioImport | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Bewerkbare velden na het parseren
  const [activityType, setActivityType] = useState<CardioActivityType>("hardlopen");
  const [calendarDate, setCalendarDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [distanceKm, setDistanceKm] = useState("");
  const [durationHours, setDurationHours] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [durationSeconds, setDurationSeconds] = useState("");
  const [calories, setCalories] = useState("");
  const [elevationGain, setElevationGain] = useState("");
  const [avgHeartRate, setAvgHeartRate] = useState("");
  const [maxHeartRate, setMaxHeartRate] = useState("");
  const [notes, setNotes] = useState("");

  const resetForm = useCallback(() => {
    setParsedData(null);
    setErrorMsg(null);
    setIsSaving(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const processFileContent = (content: string, filename: string) => {
    setErrorMsg(null);
    try {
      const parsed = parseCardioFile(content, userWeightKg);
      setParsedData(parsed);

      // Vul de bewerkbare state
      setActivityType(parsed.activityType);
      setCalendarDate(parsed.calendarDate);

      // Starttijd (hh:mm)
      try {
        const d = new Date(parsed.startTime);
        const hours = String(d.getHours()).padStart(2, "0");
        const mins = String(d.getMinutes()).padStart(2, "0");
        setStartTime(`${hours}:${mins}`);
      } catch {
        setStartTime("10:00");
      }

      setDistanceKm((parsed.distanceMeters / 1000).toFixed(2));

      const totalSec = parsed.durationSeconds;
      const h = Math.floor(totalSec / 3600);
      const m = Math.floor((totalSec % 3600) / 60);
      const s = totalSec % 60;
      setDurationHours(h > 0 ? String(h) : "0");
      setDurationMinutes(String(m));
      setDurationSeconds(String(s));

      setCalories(parsed.estimatedCaloriesBurned ? String(parsed.estimatedCaloriesBurned) : "");
      setElevationGain(parsed.elevationGainMeters ? String(parsed.elevationGainMeters) : "");
      setAvgHeartRate(parsed.avgHeartRateBpm ? String(parsed.avgHeartRateBpm) : "");
      setMaxHeartRate(parsed.maxHeartRateBpm ? String(parsed.maxHeartRateBpm) : "");
      setNotes(`${parsed.notes} (${filename})`);
    } catch (err) {
      setParsedData(null);
      setErrorMsg(
        err instanceof Error
          ? err.message
          : "Fout bij verwerken van bestand. Controleer of het een geldig GPX- of TCX-bestand is."
      );
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.onerror = () => {
      setErrorMsg("Kon het bestand niet lezen vanaf je apparaat.");
    };
    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      processFileContent(content, file.name);
    };
    reader.readAsText(file);
  };

  const handleSaveSession = async () => {
    if (!parsedData) return;
    setIsSaving(true);

    try {
      const distMeters = Math.round(parseFloat(distanceKm || "0") * 1000);
      const h = parseInt(durationHours || "0", 10) || 0;
      const m = parseInt(durationMinutes || "0", 10) || 0;
      const s = parseInt(durationSeconds || "0", 10) || 0;
      const totalDurationSec = h * 3600 + m * 60 + s;

      // Bouw starttijd ISO
      let fullStartIso = parsedData.startTime;
      if (calendarDate && startTime) {
        fullStartIso = new Date(`${calendarDate}T${startTime}:00`).toISOString();
      }

      const endIso =
        totalDurationSec > 0
          ? new Date(new Date(fullStartIso).getTime() + totalDurationSec * 1000).toISOString()
          : null;

      const newSession: CardioSession = {
        id: crypto.randomUUID(),
        calendarDate: calendarDate || parsedData.calendarDate,
        startTime: fullStartIso,
        endTime: endIso,
        activityType,
        distanceMeters: distMeters,
        durationSeconds: Math.max(1, totalDurationSec),
        avgHeartRateBpm: avgHeartRate ? parseInt(avgHeartRate, 10) : null,
        maxHeartRateBpm: maxHeartRate ? parseInt(maxHeartRate, 10) : null,
        estimatedCaloriesBurned: calories ? parseInt(calories, 10) : null,
        elevationGainMeters: elevationGain ? parseInt(elevationGain, 10) : null,
        rpe: null,
        notes: notes.trim(),
        status: "afgerond",
        provenance: {
          source: isDemoMode ? "demo" : "user",
          isDemo: isDemoMode,
        },
        updatedAt: new Date().toISOString(),
      };

      await onSave(newSession);
      handleClose();
    } catch (err) {
      console.error("Fout bij opslaan geïmporteerde cardiosessie:", err);
      setErrorMsg("Fout bij opslaan in lokale database.");
      setIsSaving(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      title="Cardio Bestand Importeren"
      description="Importeer een activiteit via GPX of TCX vanaf je Garmin, Strava, Polar of sporthorloge."
      maxWidth="lg"
    >
      <div className="space-y-4">
        {/* FOUTMELDING */}
        {errorMsg && (
          <Alert variant="error" className="text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-semibold text-red-900 dark:text-red-200">
                  Bestand kon niet worden geïmporteerd
                </p>
                <p className="text-red-800 dark:text-red-300 leading-relaxed">
                  {errorMsg}
                </p>
              </div>
            </div>
          </Alert>
        )}

        {/* 1. UPLOAD DROPZONE (Wanneer er nog geen data is geparsed) */}
        {!parsedData ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              isDragging
                ? "border-emerald-500 bg-emerald-500/10 scale-[1.01]"
                : "border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50"
            }`}
          >
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1 max-w-sm">
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Sleep je GPX- of TCX-bestand hierheen
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Of klik om een bestand vanaf je apparaat te selecteren (.gpx, .tcx)
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                GPX
              </Badge>
              <Badge variant="outline" className="text-[10px] uppercase font-mono">
                TCX
              </Badge>
              <span className="text-[11px] text-slate-400">100% lokaal verwerkt</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".gpx,.tcx,.fit"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        ) : (
          /* 2. VOORVERTONING & BEWERKINGSFORMULIER */
          <div className="space-y-4">
            {/* Statusbanner */}
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-200 font-medium">
                <FileCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Bestand succesvol herkend als{" "}
                  <strong className="uppercase font-mono">{parsedData.format}</strong> ({parsedData.trackpointsCount} GPS punten)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="text-xs h-7 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Ander bestand
              </Button>
            </div>

            {/* Sportkeuze knoppen */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Activiteitstype
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(
                  [
                    "hardlopen",
                    "fietsen",
                    "wandelen",
                    "roeien",
                    "zwemmen",
                    "crosstrainer",
                    "overig",
                  ] as CardioActivityType[]
                ).map((type) => {
                  const isSelected = activityType === type;
                  const meta = CARDIO_ACTIVITIES[type];
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setActivityType(type)}
                      className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs font-semibold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                      }`}
                    >
                      {type === "hardlopen" && <Footprints className="w-3.5 h-3.5 text-emerald-500" />}
                      {type === "fietsen" && <Bike className="w-3.5 h-3.5 text-emerald-500" />}
                      {type === "wandelen" && <Compass className="w-3.5 h-3.5 text-emerald-500" />}
                      {type === "zwemmen" && <Waves className="w-3.5 h-3.5 text-emerald-500" />}
                      {type === "roeien" && <Activity className="w-3.5 h-3.5 text-emerald-500" />}
                      {type !== "hardlopen" &&
                        type !== "fietsen" &&
                        type !== "wandelen" &&
                        type !== "zwemmen" &&
                        type !== "roeien" && (
                          <Activity className="w-3.5 h-3.5 text-emerald-500" />
                        )}
                      <span className="truncate">{meta?.label || type}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Datum & Tijd Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Datum (JJJJ-MM-DD)">
                <Input
                  type="date"
                  value={calendarDate}
                  onChange={(e) => setCalendarDate(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Starttijd">
                <Input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </FormField>
            </div>

            {/* Afstand & Duur Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormField label="Afstand (km)">
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="0.00"
                />
              </FormField>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Duur (uur / min / sec)
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  <Input
                    type="number"
                    min="0"
                    placeholder="Uur"
                    value={durationHours}
                    onChange={(e) => setDurationHours(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Min"
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(e.target.value)}
                  />
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    placeholder="Sec"
                    value={durationSeconds}
                    onChange={(e) => setDurationSeconds(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Extra Metrieken Grid: Calorieën, Hoogte, Hartslag */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <FormField label="Calorieën (kcal)">
                <Input
                  type="number"
                  min="0"
                  placeholder="kcal"
                  value={calories}
                  onChange={(e) => setCalories(e.target.value)}
                />
              </FormField>

              <FormField label="Hoogtemeters (m)">
                <Input
                  type="number"
                  min="0"
                  placeholder="m"
                  value={elevationGain}
                  onChange={(e) => setElevationGain(e.target.value)}
                />
              </FormField>

              <FormField label="Gem. Hartslag (bpm)">
                <Input
                  type="number"
                  min="30"
                  max="240"
                  placeholder="bpm"
                  value={avgHeartRate}
                  onChange={(e) => setAvgHeartRate(e.target.value)}
                />
              </FormField>

              <FormField label="Max. Hartslag (bpm)">
                <Input
                  type="number"
                  min="30"
                  max="240"
                  placeholder="bpm"
                  value={maxHeartRate}
                  onChange={(e) => setMaxHeartRate(e.target.value)}
                />
              </FormField>
            </div>

            {/* Notities */}
            <FormField label="Notities / Omschrijving">
              <Input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="bv. 'Mooie ochtendronde in het bos'"
              />
            </FormField>
          </div>
        )}
      </div>

      <DialogFooter className="mt-5">
        <Button variant="outline" onClick={handleClose} disabled={isSaving}>
          Annuleren
        </Button>
        {parsedData && (
          <Button
            onClick={handleSaveSession}
            disabled={isSaving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white"
            leftIcon={<Check className="w-4 h-4" />}
          >
            {isSaving ? "Opslaan..." : "Activiteit Opslaan in SportKompas"}
          </Button>
        )}
      </DialogFooter>
    </Dialog>
  );
}
