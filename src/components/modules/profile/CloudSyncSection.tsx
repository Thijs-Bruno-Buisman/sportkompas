"use client";

import React, { useState } from "react";
import { Cloud, CloudOff, RefreshCw, LogIn, LogOut, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { useAuth } from "@/lib/supabase/AuthContext";
import { syncLocalDataWithSupabase } from "@/lib/supabase/sync";
import { AuthModal } from "@/components/modules/auth/AuthModal";

export function CloudSyncSection() {
  const { user, isConfigured, signOut } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const handleSync = async () => {
    if (!user) return;
    setIsSyncing(true);
    setSyncStatus(null);

    const result = await syncLocalDataWithSupabase(user);
    setIsSyncing(false);

    if (result.success) {
      const now = new Date().toLocaleTimeString("nl-NL", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      setLastSyncTime(now);
      setSyncStatus({
        type: "success",
        message: `Synchronisatie voltooid om ${now}. Al je workouts en gegevens staan veilig in de cloud!`,
      });
    } else {
      setSyncStatus({
        type: "error",
        message: result.error || "Synchronisatie is mislukt. Controleer je internetverbinding.",
      });
    }
  };

  return (
    <>
      <Card className="border-emerald-500/30 bg-emerald-500/[0.02]">
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-emerald-500" />
                <span>Supabase Cloud Synchronisatie</span>
              </CardTitle>
              <CardDescription>
                Synchroniseer je workouts, schema&apos;s en voeding tussen al je apparaten (mobiel, tablet en pc).
              </CardDescription>
            </div>
            <Badge variant={user ? "success" : isConfigured ? "default" : "warning"}>
              {user ? "Ingelogd" : isConfigured ? "Niet ingelogd" : "Niet geconfigureerd"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {syncStatus && (
            <Alert
              variant={syncStatus.type === "success" ? "success" : "error"}
              onDismiss={() => setSyncStatus(null)}
            >
              {syncStatus.message}
            </Alert>
          )}

          {user ? (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Actief Cloud Account</p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-white truncate max-w-[240px] sm:max-w-xs">
                      {user.email}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={signOut}
                    leftIcon={<LogOut className="w-3.5 h-3.5" />}
                  >
                    Uitloggen
                  </Button>
                </div>
              </div>

              {lastSyncTime && (
                <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Laatste synchronisatie: vandaag om {lastSyncTime}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSync}
                  isLoading={isSyncing}
                  leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`} />}
                >
                  {isSyncing ? "Bezig met synchroniseren..." : "Nu Synchroniseren naar Cloud"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
                <p>
                  SportKompas is 100% <strong>offline-first</strong>: al je data werkt altijd supersnel en lokaal in je browser.
                </p>
                <p>
                  Met een gratis Cloud Account worden je gegevens versleuteld opgeslagen in jouw persoonlijke database, zodat je naadloos kunt wisselen tussen je telefoon in de gym en je laptop thuis.
                </p>
              </div>

              <div className="pt-2">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => setIsAuthModalOpen(true)}
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Inloggen of Registreren
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}

