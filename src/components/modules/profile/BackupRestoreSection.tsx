"use client";

import React, { useState, useRef } from "react";
import {
  Download,
  Upload,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  RefreshCw,
  Info,
  Calendar,
  Layers,
  Database,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { useDatabase } from "@/lib/db";
import {
  exportDatabaseToJson,
  validateBackupFile,
  importDatabaseFromJson,
  type BackupPreview,
  type SportKompasBackupPayload,
} from "@/domain/backup/backup";

interface BackupRestoreSectionProps {
  lastBackupAt?: string | null;
  onDataRestored?: () => void;
}

export function BackupRestoreSection({
  lastBackupAt,
  onDataRestored,
}: BackupRestoreSectionProps) {
  const { db, refreshData } = useDatabase();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title?: string;
    message: string;
  } | null>(null);

  // Import preview dialog state
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [pendingPayload, setPendingPayload] = useState<SportKompasBackupPayload | null>(null);
  const [importMode, setImportMode] = useState<"replace" | "merge">("replace");
  const [confirmReplace, setConfirmReplace] = useState(false);

  // 1. EXPORTEER VOLLEDIGE JSON BACK-UP
  const handleExport = async () => {
    setIsExporting(true);
    setFeedback(null);
    try {
      const { jsonString, filename, sizeBytes } = await exportDatabaseToJson(db);

      // Downloadbestand via client browser URL
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);

      const sizeKb = Math.round(sizeBytes / 1024 * 10) / 10;
      setFeedback({
        type: "success",
        title: "Back-up succesvol gedownload",
        message: `Je complete database is geëxporteerd naar "${filename}" (${sizeKb} KB). Bewaar dit bestand op een veilige plek zoals je cloudopslag of een USB-stick.`,
      });
    } catch (err: unknown) {
      console.error("Fout bij exporteren:", err);
      setFeedback({
        type: "error",
        title: "Export mislukt",
        message: "Er is een onverwachte fout opgetreden bij het exporteren van de database.",
      });
    } finally {
      setIsExporting(false);
    }
  };

  // 2. BESTANDSSELECTIE VOOR IMPORT
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input zodat hetzelfde bestand opnieuw gekozen kan worden
    e.target.value = "";
    setFeedback(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const validation = validateBackupFile(text);

      if (!validation.isValid || !validation.payload || !validation.preview) {
        setFeedback({
          type: "error",
          title: "Ongeldig back-upbestand",
          message:
            validation.errorMessage ||
            "Het geselecteerde bestand kon niet worden gevalideerd als een geldig SportKompas back-upbestand.",
        });
        return;
      }

      setPendingPayload(validation.payload);
      setPreview(validation.preview);
      setImportMode("replace");
      setConfirmReplace(false);
    };

    reader.onerror = () => {
      setFeedback({
        type: "error",
        title: "Leesfout",
        message: "Kon het geselecteerde bestand niet inlezen.",
      });
    };

    reader.readAsText(file);
  };

  // 3. BEVESTIG EN VOER IMPORT UIT
  const handleConfirmImport = async () => {
    if (!pendingPayload) return;

    if (importMode === "replace" && !confirmReplace) {
      setFeedback({
        type: "error",
        message: "Vink de bevestiging aan om je huidige database te vervangen.",
      });
      return;
    }

    setIsImporting(true);
    try {
      const result = await importDatabaseFromJson(db, pendingPayload, importMode);

      if (!result.success) {
        setFeedback({
          type: "error",
          title: "Import mislukt",
          message: result.error || "Onbekende fout tijdens importeren.",
        });
        return;
      }

      setPreview(null);
      setPendingPayload(null);
      refreshData();
      onDataRestored?.();

      setFeedback({
        type: "success",
        title: "Herstel succesvol voltooid!",
        message: `In totaal ${result.recordsImported} records succesvol ${
          importMode === "replace" ? "hersteld" : "samengevoegd"
        } in je lokale database.`,
      });
    } catch (err: unknown) {
      console.error("Fout bij importeren:", err);
      setFeedback({
        type: "error",
        title: "Fout bij herstel",
        message: "Er is een onverwachte fout opgetreden tijdens het importeren.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-white">
                <Database className="w-5 h-5 text-emerald-500" />
                <span>Lokale Opslag &amp; Data-soevereiniteit</span>
              </CardTitle>
              <CardDescription className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Jij bent 100% eigenaar van je data. Exporteer of herstel je complete administratie met één klik.
              </CardDescription>
            </div>
            {lastBackupAt ? (
              <Badge variant="default" className="text-[11px] self-start sm:self-auto">
                Laatste herstel: {new Date(lastBackupAt).toLocaleDateString("nl-NL")}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[11px] self-start sm:self-auto">
                Nog geen back-up geregistreerd
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Privacy & Offline-first indicator */}
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-900 dark:text-white">
                100% Lokaal &amp; Privacy-vriendelijk (IndexedDB)
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Al je workouts, cardio-routes, maaltijden en lichaamsmetingen worden uitsluitend in je eigen browser opgeslagen. Geen verborgen cloud tracking, geen advertenties.
              </p>
            </div>
          </div>

          {/* Feedback Melding */}
          {feedback && (
            <Alert
              variant={
                feedback.type === "success"
                  ? "success"
                  : feedback.type === "error"
                  ? "error"
                  : "info"
              }
              title={feedback.title}
              onDismiss={() => setFeedback(null)}
            >
              {feedback.message}
            </Alert>
          )}

          {/* Verborgen bestandskiezer voor import */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Actieknoppen */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
              onClick={handleExport}
              className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
            >
              Exporteer Back-up (JSON)
            </Button>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer"
            >
              Importeer Back-up (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4. IMPORT PREVIEW & BEVESTIGINGS DIALOOG */}
      {preview && (
        <Dialog
          isOpen={Boolean(preview)}
          onClose={() => {
            setPreview(null);
            setPendingPayload(null);
          }}
          title="Back-up Herstellen &amp; Importeren"
          description="Controleer de inhoud van het geselecteerde bestand alvorens door te gaan."
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs">
            {/* Compatibiliteitswaarschuwing */}
            {preview.compatibilityWarning && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>{preview.compatibilityWarning}</p>
              </div>
            )}

            {/* Bestand metadata */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <span className="text-slate-400 block text-[11px]">Applicatie</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">
                  {preview.metadata.appName}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Geëxporteerd op</span>
                <span className="font-semibold text-slate-800 dark:text-slate-100">
                  {new Date(preview.metadata.exportedAt).toLocaleDateString("nl-NL", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Totaal Records</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {preview.totalRecords} records
                </span>
              </div>
            </div>

            {/* Tabeloverzicht */}
            <div className="space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Overzicht van records per categorie:
              </span>
              <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
                {preview.tables
                  .filter((t) => t.count > 0)
                  .map((table) => (
                    <div
                      key={table.tableName}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      <span className="text-slate-700 dark:text-slate-300 font-medium">
                        {table.displayName}
                      </span>
                      <Badge variant="default" className="text-[10px]">
                        {table.count}
                      </Badge>
                    </div>
                  ))}
              </div>
            </div>

            {/* Import Mode Keuze */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="font-semibold text-slate-900 dark:text-white block">
                Selecteer herstelmodus:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setImportMode("replace")}
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    importMode === "replace"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Vervangen (Volledig)</span>
                    {importMode === "replace" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    Wist huidige database en herstelt de back-up identiek.
                  </span>
                </label>

                <label
                  onClick={() => setImportMode("merge")}
                  className={`p-3 rounded-xl border cursor-pointer flex flex-col gap-1 transition-all ${
                    importMode === "merge"
                      ? "border-emerald-500 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 font-semibold"
                      : "border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-600 dark:text-slate-400"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>Samenvoegen (Mergen)</span>
                    {importMode === "merge" && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    )}
                  </div>
                  <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">
                    Voegt records toe zonder bestaande logs te wissen.
                  </span>
                </label>
              </div>
            </div>

            {/* Bevestigingsvinkje bij vervangen */}
            {importMode === "replace" && (
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmReplace}
                  onChange={(e) => setConfirmReplace(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs">
                  Ik begrijp dat de huidige gegevens in de actieve database worden vervangen door de inhoud van deze back-up.
                </span>
              </label>
            )}

            {/* Knoppen */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setPreview(null);
                  setPendingPayload(null);
                }}
              >
                Annuleren
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                isLoading={isImporting}
                disabled={importMode === "replace" && !confirmReplace}
                onClick={handleConfirmImport}
              >
                Start Herstel
              </Button>
            </div>
          </div>
        </Dialog>
      )}
    </>
  );
}
