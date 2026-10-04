"use client";

import { useEffect } from "react";
import { usePwa } from "@/lib/hooks/usePwa";
import { WifiOff } from "lucide-react";

export function PwaRegister() {
  const { isOffline, isMounted } = usePwa();

  useEffect(() => {
    // Registreer service worker uitsluitend in de browser in productie/standaardomgeving
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            // Update check
            reg.onupdatefound = () => {
              const installingWorker = reg.installing;
              if (installingWorker) {
                installingWorker.onstatechange = () => {
                  if (
                    installingWorker.state === "installed" &&
                    navigator.serviceWorker.controller
                  ) {
                    // Nieuwe versie klaar op achtergrond
                    console.log("[SportKompas PWA] Nieuwe versie beschikbaar.");
                  }
                };
              }
            };
          })
          .catch((err) => {
            // Service worker kan falen in strikte sandboxes of lokale tests, stil afvangen
            console.info("[SportKompas PWA] Service worker registratie overgeslagen:", err);
          });
      });
    }
  }, []);

  if (!isMounted || !isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-slate-950 px-3 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 shadow-md">
      <WifiOff className="w-3.5 h-3.5" />
      <span>Offline modus actief — SportKompas werkt 100% lokaal door</span>
    </div>
  );
}
