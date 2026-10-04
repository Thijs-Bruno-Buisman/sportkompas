"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  Wrench,
  CheckCircle2,
  Database,
  Layers,
  FileCheck,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useDatabase } from "@/lib/db";
import {
  runDatabaseIntegrityCheck,
  repairOrphanedWorkoutSets,
  type DatabaseIntegrityReport,
} from "@/domain/integrity/integrityCheck";

export function DatabaseIntegritySection() {
  const { db } = useDatabase();

  const [report, setReport] = useState<DatabaseIntegrityReport | null>(null);
  const [isRunningCheck, setIsRunningCheck] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [showTableDetails, setShowTableDetails] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
    title: string;
    message: string;
  } | null>(null);

  const handleRunCheck = useCallback(async () => {
    setIsRunningCheck(true);
    setFeedback(null);
    try {
      const result = await runDatabaseIntegrityCheck(db);
      setReport(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Integriteitscontrole mislukt",
        message: `Er trad een onverwachte fout op bij het controleren van de database: ${msg}`,
      });
    } finally {
      setIsRunningCheck(false);
    }
  }, [db]);

  // Voer een initiële check uit bij het laden van het scherm
  useEffect(() => {
    handleRunCheck();
  }, [handleRunCheck]);

  // Veilige reparatie uitvoeren
  const handleRepair = async () => {
    setIsRepairing(true);
    setFeedback(null);
    try {
      const result = await repairOrphanedWorkoutSets(db);
      // Voer opnieuw de check uit om het rapport te vernieuwen
      const newReport = await runDatabaseIntegrityCheck(db);
      setReport(newReport);

      setFeedback({
        type: "success",
        title: "Herstel succesvol voltooid",
        message: `${result.repairedCount} wees-record(s) zijn veilig opgeschoond. De database is opnieuw gevalideerd.`,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setFeedback({
        type: "error",
        title: "Herstel mislukt",
        message: `Kon de database niet repareren: ${msg}`,
      });
    } finally {
      setIsRepairing(false);
    }
  };

  const getStatusColor = (status: DatabaseIntegrityReport["status"]) => {
    switch (status) {
      case "gezond":
        return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800";
      case "aandacht":
        return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800";
      case "beschadigd":
        return "text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800";
    }
  };

  const hasOrphanSets =
    report?.issues.some(
      (i) => i.table === "workoutSets" && i.message.includes("Wees-set")
    ) ?? false;

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Database Integriteit &amp; Migraties</span>
                {report && (
                  <Badge
                    variant={
                      report.status === "gezond"
                        ? "success"
                        : report.status === "aandacht"
                        ? "warning"
                        : "danger"
                    }
                  >
                    {report.status === "gezond"
                      ? "100% Gezond"
                      : report.status === "aandacht"
                      ? "Aandachtspunten"
                      : "Fouten gevonden"}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                Continue validatie van referentiële integriteit, Dexie schema-versies en dataconsequentie.
              </CardDescription>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            disabled={isRunningCheck}
            onClick={handleRunCheck}
            className="gap-1.5 shrink-0 self-start sm:self-auto"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRunningCheck ? "animate-spin" : ""}`}
            />
            <span>{isRunningCheck ? "Scannen..." : "Controle Uitvoeren"}</span>
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {feedback && (
          <Alert
            variant={feedback.type}
            title={feedback.title}
            onDismiss={() => setFeedback(null)}
          >
            {feedback.message}
          </Alert>
        )}

        {report && (
          <>
            {/* Samenvattende statistieken */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* Gezondheidsscore */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Gezondheidsscore
                </p>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span
                    className={`text-xl font-bold ${
                      report.healthScore >= 95
                        ? "text-emerald-600 dark:text-emerald-400"
                        : report.healthScore >= 80
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-rose-600 dark:text-rose-400"
                    }`}
                  >
                    {report.healthScore}%
                  </span>
                  <span className="text-2xs text-slate-400">/ 100</span>
                </div>
              </div>

              {/* Schemaversie */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Schema Versie
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Database className="w-4 h-4 text-emerald-500" />
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    v{report.schemaVersion}
                  </span>
                </div>
              </div>

              {/* Tabellen */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Dexie Tabellen
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Layers className="w-4 h-4 text-sky-500" />
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {report.totalTables} / 16
                  </span>
                </div>
              </div>

              {/* Totaal records */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Totaal Records
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <FileCheck className="w-4 h-4 text-emerald-500" />
                  <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                    {report.totalRecords.toLocaleString("nl-NL")}
                  </span>
                </div>
              </div>
            </div>

            {/* Problemen / Aandachtspunten lijst indien aanwezig */}
            {report.issues.length > 0 && (
              <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200 font-semibold text-xs">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>
                      Gevonden aandachtspunten ({report.issues.length})
                    </span>
                  </div>
                  {hasOrphanSets && (
                    <Button
                      size="sm"
                      variant="primary"
                      disabled={isRepairing}
                      onClick={handleRepair}
                      className="gap-1.5 text-xs py-1 h-7"
                    >
                      <Wrench className="w-3 h-3" />
                      <span>{isRepairing ? "Bezig..." : "Wees-sets Herstellen"}</span>
                    </Button>
                  )}
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {report.issues.map((issue, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 p-2 rounded-lg bg-white dark:bg-slate-900 border border-amber-200/60 dark:border-amber-900/40 text-xs"
                    >
                      {issue.severity === "error" ? (
                        <AlertCircle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1.5">
                          [{issue.table}]
                        </span>
                        <span className="text-slate-600 dark:text-slate-400">
                          {issue.message}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Uitklapbaar tabeloverzicht */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowTableDetails((prev) => !prev)}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>
                  {showTableDetails
                    ? "Verberg tabeloverzicht"
                    : "Bekijk recordtelling en integriteit per tabel"}
                </span>
              </button>

              {showTableDetails && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {report.tableStats.map((t) => (
                    <div
                      key={t.tableName}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs"
                    >
                      <div className="truncate mr-2">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {t.displayName}
                        </p>
                        <p className="text-2xs text-slate-400">
                          {t.recordCount} record{t.recordCount === 1 ? "" : "s"}
                        </p>
                      </div>
                      <Badge
                        variant={
                          t.status === "gezond"
                            ? "success"
                            : t.status === "waarschuwing"
                            ? "warning"
                            : "danger"
                        }
                        className="text-2xs px-1.5 py-0.5 shrink-0"
                      >
                        {t.status === "gezond" ? "Gezond" : `${t.issueCount} issue(s)`}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
