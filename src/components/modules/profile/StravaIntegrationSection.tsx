"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Unlink,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Dialog } from "@/components/ui/Dialog";
import { useDatabase } from "@/lib/db";
import {
  type StravaActivity,
  type StravaAthlete,
  convertStravaActivityToCardioSession,
  filterNewStravaActivities,
  getMockStravaAthlete,
  getMockStravaActivities,
} from "@/domain/integrations/strava";
import type { CardioSession, AppSettings } from "@/types/database";

interface StravaIntegrationSectionProps {
  settings?: AppSettings | null;
  onSettingsUpdated?: () => void;
}

export function StravaIntegrationSection({
  settings,
  onSettingsUpdated,
}: StravaIntegrationSectionProps) {
  const { repositories } = useDatabase();

  const [isConfigured, setIsConfigured] = useState<boolean | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);

  const [syncLoading, setSyncLoading] = useState(false);
  const [feedback, setFeedbackMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Sync / Preview Dialog state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewActivities, setPreviewActivities] = useState<StravaActivity[]>([]);
  const [duplicateIds, setDuplicateIds] = useState<Set<number>>(new Set());
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [syncAthlete, setSyncAthlete] = useState<StravaAthlete | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 1. Controleer server-side configuratiestatus bij laden
  useEffect(() => {
    let isMounted = true;
    async function checkStatus() {
      try {
        const res = await fetch("/api/integrations/strava?action=status");
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsConfigured(Boolean(data.isConfigured));
            setClientId(data.clientId || null);
          }
        } else {
          if (isMounted) setIsConfigured(false);
        }
      } catch {
        if (isMounted) setIsConfigured(false);
      } finally {
        if (isMounted) setIsLoadingStatus(false);
      }
    }

    checkStatus();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Start OAuth autorisatiestroom
  const handleConnectStrava = async () => {
    if (!isConfigured) {
      setShowInstructions(true);
      return;
    }

    try {
      setSyncLoading(true);
      const res = await fetch("/api/integrations/strava?action=auth-url");
      const data = await res.json();
      if (res.ok && data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        setFeedbackMessage({
          type: "error",
          text: data.error || "Kon geen Strava autorisatie-URL genereren.",
        });
      }
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Fout bij verbinden met Strava.",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // 3. Start synchronisatie (Demo of Live)
  const handleStartSync = async (isDemoMode: boolean = false) => {
    try {
      setSyncLoading(true);
      setFeedbackMessage(null);

      let fetchedActivities: StravaActivity[] = [];
      let athlete: StravaAthlete | null = null;

      if (isDemoMode || !isConfigured) {
        // Gebruik demo mock data conform Rule 8
        const mockRes = await fetch("/api/integrations/strava", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "demo_sync" }),
        });
        const mockData = await mockRes.json();
        fetchedActivities = mockData.activities || getMockStravaActivities();
        athlete = mockData.athlete || getMockStravaAthlete();
      } else {
        // Live sync indien geconfigureerd
        const syncRes = await fetch("/api/integrations/strava", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "sync",
            accessToken: "session_token_placeholder",
          }),
        });
        const syncData = await syncRes.json();
        if (!syncRes.ok) {
          throw new Error(syncData.error || "Kon activiteiten niet ophalen.");
        }
        fetchedActivities = syncData.activities;
      }

      // Haal bestaande sessies op voor deduplicatie
      const existingSessions = await repositories.cardio.getAll();
      const { newActivities, duplicateActivities } = filterNewStravaActivities(
        fetchedActivities,
        existingSessions
      );

      const duplicates = new Set(duplicateActivities.map((a) => a.id));
      const initialSelected = new Set(newActivities.map((a) => a.id));

      setPreviewActivities(fetchedActivities);
      setDuplicateIds(duplicates);
      setSelectedIds(initialSelected);
      setSyncAthlete(athlete);
      setIsPreviewOpen(true);
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text:
          err.message ||
          "Synchronisatie mislukt. Controleer je internetverbinding of API credentials.",
      });
    } finally {
      setSyncLoading(false);
    }
  };

  // 4. Bevestig en importeer geselecteerde activiteiten
  const handleConfirmImport = async () => {
    if (selectedIds.size === 0) return;

    try {
      setIsImporting(true);
      const toImport = previewActivities.filter((a) => selectedIds.has(a.id));

      let importedCount = 0;
      for (const act of toImport) {
        const session: CardioSession = convertStravaActivityToCardioSession(
          act,
          75,
          !isConfigured
        );
        await repositories.cardio.save(session);
        importedCount++;
      }

      // Werk instellingen bij met koppeling en lastSync
      const nowIso = new Date().toISOString();
      await repositories.settings.updateStravaConnection(
        true,
        syncAthlete?.id ?? settings?.stravaAthleteId ?? 10842199,
        syncAthlete
          ? `${syncAthlete.firstname || ""} ${syncAthlete.lastname || ""}`.trim()
          : settings?.stravaAthleteName || "Alex van Dijk"
      );
      await repositories.settings.updateStravaLastSync(nowIso);

      if (onSettingsUpdated) {
        onSettingsUpdated();
      }

      setIsPreviewOpen(false);
      setFeedbackMessage({
        type: "success",
        text: `${importedCount} ${
          importedCount === 1 ? "activiteit" : "activiteiten"
        } succesvol gesynchroniseerd en opgeslagen in Cardio!`,
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Fout bij opslaan van cardio-activiteiten.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  // 5. Ontkoppel Strava
  const handleDisconnect = async () => {
    try {
      await repositories.settings.updateStravaConnection(false, null, null);
      if (onSettingsUpdated) {
        onSettingsUpdated();
      }
      setFeedbackMessage({
        type: "info",
        text: "Strava-koppeling succesvol ontkoppeld. Je reeds geïmporteerde cardio-sessies blijven veilig bewaard.",
      });
    } catch (err: any) {
      setFeedbackMessage({
        type: "error",
        text: err.message || "Fout bij ontkoppelen.",
      });
    }
  };

  const isConnected = Boolean(settings?.stravaConnected);
  const lastSyncFormatted = settings?.stravaLastSyncAt
    ? new Date(settings.stravaLastSyncAt).toLocaleString("nl-NL", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  Strava Koppeling
                  {isConnected ? (
                    <Badge variant="success">Verbonden met Strava</Badge>
                  ) : (
                    <Badge variant="outline">Nog niet verbonden</Badge>
                  )}
                </CardTitle>
                <CardDescription>
                  Synchroniseer automatisch je hardloop-, fiets- en wandelactiviteiten vanaf Strava.
                </CardDescription>
              </div>
            </div>

            {/* Status indicator / Snelle acties */}
            <div className="flex items-center gap-2">
              {isConnected && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleStartSync(false)}
                  disabled={syncLoading}
                  leftIcon={<RefreshCw className={`w-4 h-4 ${syncLoading ? "animate-spin" : ""}`} />}
                >
                  Synchroniseren
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {feedback && (
            <Alert
              variant={feedback.type === "error" ? "error" : feedback.type === "success" ? "success" : "info"}
              onDismiss={() => setFeedbackMessage(null)}
            >
              {feedback.text}
            </Alert>
          )}

          {/* Verbonden Weergave */}
          {isConnected ? (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Gekoppeld als: {settings?.stravaAthleteName || "Strava Atleet"}
                    {settings?.stravaAthleteId && (
                      <span className="text-xs text-slate-400 font-normal">
                        (ID: {settings.stravaAthleteId})
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {lastSyncFormatted
                      ? `Laatst gesynchroniseerd: ${lastSyncFormatted}`
                      : "Nog geen recente synchronisatie uitgevoerd."}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleStartSync(true)}
                    disabled={syncLoading}
                    leftIcon={<Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                  >
                    Test Demo Sync
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
                    onClick={handleDisconnect}
                    leftIcon={<Unlink className="w-3.5 h-3.5" />}
                  >
                    Ontkoppelen
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            /* Niet Verbonden Weergave */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    Haal je trainingen automatisch binnen
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl">
                    Verbind SportKompas met je Strava-account om hardloop- en fietsritten rechtstreeks
                    als voltooide cardio-sessies in te laden met afstanden, hartslagen en hoogtemeters.
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleStartSync(true)}
                    disabled={syncLoading}
                    leftIcon={<Sparkles className="w-4 h-4 text-emerald-500" />}
                  >
                    Test met Demodata
                  </Button>

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={handleConnectStrava}
                    disabled={syncLoading}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    Koppel met Strava
                  </Button>
                </div>
              </div>

              {/* Uitleg over lokale configuratie conform Rule 8 */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="w-full p-3 text-left bg-slate-50/50 dark:bg-slate-900/20 hover:bg-slate-100/50 dark:hover:bg-slate-800/40 flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-500" />
                    Hoe configureer ik mijn eigen Strava API-sleutels?
                  </span>
                  {showInstructions ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showInstructions && (
                  <div className="p-4 bg-white dark:bg-slate-950 text-xs text-slate-600 dark:text-slate-400 space-y-2 border-t border-slate-200 dark:border-slate-800 leading-relaxed">
                    <p>
                      Omdat SportKompas 100% lokaal en privacy-vriendelijk werkt zonder centrale cloud-tussenpersoon,
                      beheer je je eigen gratis Strava API-verbinding:
                    </p>
                    <ol className="list-decimal list-inside space-y-1.5 pl-1">
                      <li>
                        Ga naar{" "}
                        <a
                          href="https://www.strava.com/settings/api"
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-500 underline hover:text-emerald-600"
                        >
                          strava.com/settings/api
                        </a>{" "}
                        en maak een gratis app aan (bijv. <em>SportKompas Lokaal</em>).
                      </li>
                      <li>
                        Vul bij <strong>Authorization Callback Domain</strong> in:{" "}
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono">
                          localhost
                        </code>{" "}
                        of je eigen hostnaam.
                      </li>
                      <li>
                        Kopieer je <strong>Client ID</strong> en <strong>Client Secret</strong> naar{" "}
                        <code className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-mono">
                          .env.local
                        </code>
                        :
                        <pre className="mt-1.5 p-2 rounded bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto">
                          STRAVA_CLIENT_ID=123456{"\n"}
                          STRAVA_CLIENT_SECRET=abcdef123456789...
                        </pre>
                      </li>
                      <li>Herstart de ontwikkelserver en klik opnieuw op &quot;Koppel met Strava&quot;.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Synchronisatie Voorvertoning Modal */}
      <Dialog
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title="Strava Activiteiten Synchroniseren"
        description="Selecteer welke activiteiten je wilt importeren in je lokale Cardio overzicht."
        maxWidth="lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800">
            <div>
              Gevonden: <strong>{previewActivities.length}</strong> activiteiten
              {duplicateIds.size > 0 && (
                <span className="text-amber-600 dark:text-amber-400 ml-2">
                  ({duplicateIds.size} reeds geïmporteerd)
                </span>
              )}
            </div>
            <button
              type="button"
              className="text-emerald-500 hover:text-emerald-600 underline font-medium"
              onClick={() => {
                const newIds = previewActivities
                  .filter((a) => !duplicateIds.has(a.id))
                  .map((a) => a.id);
                if (selectedIds.size === newIds.length) {
                  setSelectedIds(new Set());
                } else {
                  setSelectedIds(new Set(newIds));
                }
              }}
            >
              {selectedIds.size > 0 ? "Deselecteer alles" : "Selecteer alle nieuwe"}
            </button>
          </div>

          {/* Activiteiten lijst */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {previewActivities.length === 0 ? (
              <div className="p-6 text-center text-sm text-slate-500">
                Geen recente activiteiten aangetroffen op Strava.
              </div>
            ) : (
              previewActivities.map((act) => {
                const isDup = duplicateIds.has(act.id);
                const isSelected = selectedIds.has(act.id);
                const distanceKm = (act.distance / 1000).toFixed(2);
                const durationMin = Math.round(act.moving_time / 60);
                const dateFormatted = new Date(
                  act.start_date_local || act.start_date
                ).toLocaleDateString("nl-NL", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                });

                return (
                  <div
                    key={act.id}
                    onClick={() => {
                      if (isDup) return;
                      const next = new Set(selectedIds);
                      if (next.has(act.id)) next.delete(act.id);
                      else next.add(act.id);
                      setSelectedIds(next);
                    }}
                    className={`p-3 rounded-xl border transition-colors flex items-center justify-between gap-3 text-sm cursor-pointer ${
                      isDup
                        ? "opacity-50 bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 cursor-not-allowed"
                        : isSelected
                        ? "bg-emerald-500/10 border-emerald-500/50"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Checkbox indicator */}
                      <div
                        className={`w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors ${
                          isDup
                            ? "border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800 text-slate-400"
                            : isSelected
                            ? "bg-emerald-500 border-emerald-500 text-white"
                            : "border-slate-300 dark:border-slate-700"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>

                      <div>
                        <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                          {act.name}
                          <Badge variant="outline" className="text-[10px] py-0">
                            {act.type}
                          </Badge>
                          {isDup && (
                            <Badge variant="default" className="text-[10px] py-0 text-amber-500">
                              Al in Cardio
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-3 mt-0.5">
                          <span>{dateFormatted}</span>
                          <span>•</span>
                          <span>{distanceKm} km</span>
                          <span>•</span>
                          <span>{durationMin} min</span>
                          {act.average_heartrate && (
                            <>
                              <span>•</span>
                              <span>{Math.round(act.average_heartrate)} bpm</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      {act.calories ? (
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          {Math.round(act.calories)} kcal
                        </span>
                      ) : null}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Knoppenbalk */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPreviewOpen(false)}
              disabled={isImporting}
            >
              Annuleren
            </Button>

            <Button
              type="button"
              variant="primary"
              onClick={handleConfirmImport}
              disabled={selectedIds.size === 0 || isImporting}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isImporting
                ? "Bezig met importeren..."
                : `Importeer ${selectedIds.size} ${
                    selectedIds.size === 1 ? "Sessie" : "Sessies"
                  }`}
            </Button>
          </div>
        </div>
      </Dialog>
    </>
  );
}
