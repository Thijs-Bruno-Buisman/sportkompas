"use client";

import React, { useState } from "react";
import {
  FileSpreadsheet,
  Download,
  Dumbbell,
  Activity,
  Utensils,
  Scale,
  Calendar,
  CheckCircle2,
  Sliders,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useDatabase } from "@/lib/db";
import {
  exportWorkoutsToCsv,
  exportCardioToCsv,
  exportNutritionToCsv,
  exportMeasurementsToCsv,
  generateCsvFilename,
  downloadCsvString,
  type CsvDelimiter,
} from "@/domain/export/csvExport";

export type DateFilterPreset = "all" | "30days" | "90days" | "thisYear";

export function CsvExportSection() {
  const { db } = useDatabase();

  const [dateFilter, setDateFilter] = useState<DateFilterPreset>("all");
  const [formatPreset, setFormatPreset] = useState<"nl_excel" | "rfc4180">("nl_excel");
  const [isExporting, setIsExporting] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    title: string;
    message: string;
  } | null>(null);

  // Bepaal de optionele startdatum op basis van de gekozen filter preset
  const calculateStartDate = (): string | undefined => {
    const today = new Date();
    if (dateFilter === "30days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 30);
      return past.toISOString().substring(0, 10);
    }
    if (dateFilter === "90days") {
      const past = new Date(today);
      past.setDate(past.getDate() - 90);
      return past.toISOString().substring(0, 10);
    }
    if (dateFilter === "thisYear") {
      return `${today.getFullYear()}-01-01`;
    }
    return undefined;
  };

  const getCsvOptions = () => {
    const delimiter: CsvDelimiter = formatPreset === "nl_excel" ? ";" : ",";
    const decimalSeparator = formatPreset === "nl_excel" ? ("," as const) : ("." as const);
    const startDate = calculateStartDate();
    return {
      delimiter,
      decimalSeparator,
      includeBom: true,
      startDate,
    };
  };

  // 1. Exporteer Workouts
  const handleExportWorkouts = async () => {
    setIsExporting("workouts");
    setFeedback(null);
    try {
      const [sessions, sets, exercises] = await Promise.all([
        db.workoutSessions.toArray(),
        db.workoutSets.toArray(),
        db.exercises.toArray(),
      ]);

      const csv = exportWorkoutsToCsv(sessions, sets, exercises, getCsvOptions());
      const filename = generateCsvFilename("workouts");
      downloadCsvString(csv, filename);

      setFeedback({
        type: "success",
        title: "Krachttraining geëxporteerd",
        message: `Bestand ${filename} is succesvol gegenereerd en gedownload.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Export mislukt",
        message: `Kon krachttrainingen niet exporteren: ${msg}`,
      });
    } finally {
      setIsExporting(null);
    }
  };

  // 2. Exporteer Cardio
  const handleExportCardio = async () => {
    setIsExporting("cardio");
    setFeedback(null);
    try {
      const sessions = await db.cardioSessions.toArray();
      const csv = exportCardioToCsv(sessions, getCsvOptions());
      const filename = generateCsvFilename("cardio");
      downloadCsvString(csv, filename);

      setFeedback({
        type: "success",
        title: "Cardiosessies geëxporteerd",
        message: `Bestand ${filename} is succesvol gegenereerd en gedownload.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Export mislukt",
        message: `Kon cardio niet exporteren: ${msg}`,
      });
    } finally {
      setIsExporting(null);
    }
  };

  // 3. Exporteer Voeding
  const handleExportNutrition = async () => {
    setIsExporting("voeding");
    setFeedback(null);
    try {
      const mealLogs = await db.mealLogs.toArray();
      const csv = exportNutritionToCsv(mealLogs, getCsvOptions());
      const filename = generateCsvFilename("voeding");
      downloadCsvString(csv, filename);

      setFeedback({
        type: "success",
        title: "Voedingsdagboek geëxporteerd",
        message: `Bestand ${filename} is succesvol gegenereerd en gedownload.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Export mislukt",
        message: `Kon voeding niet exporteren: ${msg}`,
      });
    } finally {
      setIsExporting(null);
    }
  };

  // 4. Exporteer Metingen
  const handleExportMeasurements = async () => {
    setIsExporting("metingen");
    setFeedback(null);
    try {
      const measurements = await db.bodyMeasurements.toArray();
      const csv = exportMeasurementsToCsv(measurements, getCsvOptions());
      const filename = generateCsvFilename("metingen");
      downloadCsvString(csv, filename);

      setFeedback({
        type: "success",
        title: "Lichaamsmetingen geëxporteerd",
        message: `Bestand ${filename} is succesvol gegenereerd en gedownload.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Export mislukt",
        message: `Kon metingen niet exporteren: ${msg}`,
      });
    } finally {
      setIsExporting(null);
    }
  };

  // 5. Exporteer alles tegelijk
  const handleExportAll = async () => {
    setIsExporting("all");
    setFeedback(null);
    try {
      const [sessions, sets, exercises, cardio, mealLogs, measurements] =
        await Promise.all([
          db.workoutSessions.toArray(),
          db.workoutSets.toArray(),
          db.exercises.toArray(),
          db.cardioSessions.toArray(),
          db.mealLogs.toArray(),
          db.bodyMeasurements.toArray(),
        ]);

      const options = getCsvOptions();

      const workoutsCsv = exportWorkoutsToCsv(sessions, sets, exercises, options);
      const cardioCsv = exportCardioToCsv(cardio, options);
      const nutritionCsv = exportNutritionToCsv(mealLogs, options);
      const measurementsCsv = exportMeasurementsToCsv(measurements, options);

      // Download de vier bestanden opeenvolgend
      downloadCsvString(workoutsCsv, generateCsvFilename("workouts"));
      downloadCsvString(cardioCsv, generateCsvFilename("cardio"));
      downloadCsvString(nutritionCsv, generateCsvFilename("voeding"));
      downloadCsvString(measurementsCsv, generateCsvFilename("metingen"));

      setFeedback({
        type: "success",
        title: "Alle 4 spreadsheets geëxporteerd",
        message: "De CSV-bestanden voor Workouts, Cardio, Voeding en Metingen zijn gedownload.",
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Export mislukt",
        message: `Kon spreadsheets niet exporteren: ${msg}`,
      });
    } finally {
      setIsExporting(null);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Spreadsheet CSV Export (Excel &amp; Sheets)
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Download heldere, tabelgerichte CSV-bestanden met BOM en UTF-8 voor eigen data-analyse en visualisaties.
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && (
          <Alert
            variant={feedback.type === "success" ? "success" : "error"}
            title={feedback.title}
            onDismiss={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {/* Filter- en opmaakbalk */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
          {/* Periode filter */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Periode:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { id: "all", label: "Alles" },
                { id: "30days", label: "Laatste 30d" },
                { id: "90days", label: "Laatste 90d" },
                { id: "thisYear", label: "Dit jaar" },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setDateFilter(p.id as DateFilterPreset)}
                  className={`px-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    dateFilter === p.id
                      ? "bg-emerald-500 text-white border-emerald-600 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Formaat preset */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Opmaak / Scheidingsteken:
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                type="button"
                onClick={() => setFormatPreset("nl_excel")}
                className={`px-2.5 py-1.5 text-left text-xs font-medium rounded-lg border transition-colors flex items-center justify-between ${
                  formatPreset === "nl_excel"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <span>Excel NL (Puntkomma &apos;;&apos; &amp; decimale komma)</span>
                {formatPreset === "nl_excel" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setFormatPreset("rfc4180")}
                className={`px-2.5 py-1.5 text-left text-xs font-medium rounded-lg border transition-colors flex items-center justify-between ${
                  formatPreset === "rfc4180"
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700"
                    : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                <span>Internationaal RFC 4180 (Komma &apos;,&apos; &amp; decimale punt)</span>
                {formatPreset === "rfc4180" && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 ml-1.5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categorie Knoppen Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Workouts */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
                <Dumbbell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Krachttraining Sets
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Sets, gewichten, reps &amp; 1RM
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isExporting !== null}
              onClick={handleExportWorkouts}
              className="gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting === "workouts" ? "Export..." : "CSV"}
            </Button>
          </div>

          {/* Cardio */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Cardiosessies
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Afstand, tempo, hartslag &amp; kcal
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isExporting !== null}
              onClick={handleExportCardio}
              className="gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting === "cardio" ? "Export..." : "CSV"}
            </Button>
          </div>

          {/* Voeding */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                <Utensils className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Voedingsdagboek
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Maaltijden, grammen &amp; macro&apos;s
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isExporting !== null}
              onClick={handleExportNutrition}
              className="gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting === "voeding" ? "Export..." : "CSV"}
            </Button>
          </div>

          {/* Metingen */}
          <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 transition-colors">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                <Scale className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  Lichaamsmetingen
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Gewicht, vetpercentage &amp; omtrek
                </p>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={isExporting !== null}
              onClick={handleExportMeasurements}
              className="gap-1.5 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              {isExporting === "metingen" ? "Export..." : "CSV"}
            </Button>
          </div>
        </div>

        {/* Alles tegelijk exporteren */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <Button
            type="button"
            variant="secondary"
            disabled={isExporting !== null}
            onClick={handleExportAll}
            className="w-full sm:w-auto gap-2"
          >
            <Download className="w-4 h-4" />
            <span>
              {isExporting === "all" ? "Genereren..." : "Download Alle 4 Spreadsheets"}
            </span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
