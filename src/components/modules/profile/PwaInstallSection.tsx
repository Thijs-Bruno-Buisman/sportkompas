"use client";

import React, { useState } from "react";
import {
  Smartphone,
  Download,
  CheckCircle2,
  Share2,
  PlusSquare,
  Wifi,
  WifiOff,
  HardDrive,
  Laptop,
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
import { usePwa } from "@/lib/hooks/usePwa";
import { formatPwaStatus } from "@/domain/pwa/pwaManager";

export function PwaInstallSection() {
  const {
    isMounted,
    isStandalone,
    isOffline,
    isSupported,
    canInstall,
    platform,
    installApp,
  } = usePwa();

  const [isInstalling, setIsInstalling] = useState(false);

  if (!isMounted) return null;

  const statusInfo = formatPwaStatus(isStandalone, isOffline, isSupported);

  const handleInstallClick = async () => {
    setIsInstalling(true);
    try {
      await installApp();
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>App Installatie &amp; Offline PWA</span>
                <Badge
                  variant={
                    statusInfo.variant === "success"
                      ? "success"
                      : statusInfo.variant === "warning"
                      ? "warning"
                      : "default"
                  }
                >
                  {statusInfo.label}
                </Badge>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {statusInfo.description}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Standalone status indicator */}
        {isStandalone ? (
          <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-emerald-900 dark:text-emerald-200">
                SportKompas is geïnstalleerd als Standalone Applicatie
              </p>
              <p className="text-emerald-700 dark:text-emerald-400 leading-relaxed">
                Je opent SportKompas nu direct vanaf je startscherm of app-lijst, zonder storende browserbalken. De applicatie en alle data zijn 100% offline beschikbaar.
              </p>
            </div>
          </div>
        ) : canInstall ? (
          /* Direct installatieknop voor Chrome/Edge/Android */
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Direct toevoegen aan je apparaat
              </p>
              <p className="text-slate-500 dark:text-slate-400">
                Installeer met één klik voor snellere laadtijden en een fullscreen sportschoolervaring.
              </p>
            </div>
            <Button
              size="sm"
              variant="primary"
              disabled={isInstalling}
              onClick={handleInstallClick}
              className="gap-2 shrink-0 self-start sm:self-auto"
            >
              <Download className="w-4 h-4" />
              <span>{isInstalling ? "Installeren..." : "App Nu Installeren"}</span>
            </Button>
          </div>
        ) : platform === "ios" ? (
          /* iOS Safari specifieke instructie */
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200">
              <Smartphone className="w-4 h-4 text-emerald-500" />
              <span>Installeren op iOS (iPhone / iPad):</span>
            </div>
            <ol className="text-xs text-slate-600 dark:text-slate-400 space-y-1.5 list-decimal list-inside pl-1">
              <li>
                Tik onderaan in Safari op het <Share2 className="w-3.5 h-3.5 inline mx-1 text-slate-700 dark:text-slate-300" /> <strong>Deel-icoon</strong>.
              </li>
              <li>
                Scroll omlaag in het deelmenu en selecteer <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-slate-700 dark:text-slate-300" /> <strong>&apos;Zet op beginscherm&apos;</strong>.
              </li>
              <li>
                Tik rechtsboven op <strong>Voeg toe</strong>. SportKompas verschijnt direct als native app-icoon.
              </li>
            </ol>
          </div>
        ) : (
          /* Desktop / overige browser fallback */
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-start gap-3 text-xs">
            <Laptop className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-slate-800 dark:text-slate-200">
                Installeren via de browser
              </p>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                In Google Chrome, Microsoft Edge of Brave kun je op het installatie-icoon in de adresbalk klikken (of via Menu &gt; &apos;App installeren&apos;).
              </p>
            </div>
          </div>
        )}

        {/* Offline Features Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <HardDrive className="w-3.5 h-3.5 text-emerald-500" />
              <span>Lokale Persistentie</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-2xs leading-relaxed">
              Geen internet nodig in de sportschool of buiten tijdens hardlopen. Alle data wordt in IndexedDB opgeslagen.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {isOffline ? (
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
              ) : (
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
              )}
              <span>Netwerk Onafhankelijk</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-2xs leading-relaxed">
              Service Worker cachet de complete gebruikersinterface voor onmiddellijke opstarttijden.
            </p>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 mb-1">
              <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
              <span>Native Ergonomie</span>
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-2xs leading-relaxed">
              Grote touch-knoppen, geen per ongeluk verversen door swipe en een overzichtelijke fullscreen weergave.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
