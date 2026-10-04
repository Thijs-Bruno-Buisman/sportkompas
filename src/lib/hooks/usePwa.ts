"use client";

import { useState, useEffect, useCallback } from "react";
import {
  checkIsStandalone,
  checkServiceWorkerSupport,
  getBrowserPlatform,
  type BrowserPlatform,
} from "@/domain/pwa/pwaManager";

// Type voor het niet-standaard beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export function usePwa() {
  const [isStandalone, setIsStandalone] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<BrowserPlatform>("other");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);

    if (typeof window === "undefined") return;

    // Platform detectie
    setPlatform(getBrowserPlatform(navigator.userAgent));

    // Service Worker support
    setIsSupported(checkServiceWorkerSupport(navigator));

    // Standalone check
    const isStandaloneMode = checkIsStandalone(
      (navigator as unknown as { standalone?: boolean }).standalone,
      (q) => window.matchMedia(q)
    );
    setIsStandalone(isStandaloneMode);

    // Online / Offline status
    setIsOffline(!navigator.onLine);

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // BeforeInstallPrompt voor Chrome/Edge/Android
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // App installed event
    const handleAppInstalled = () => {
      setIsStandalone(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const installApp = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;

    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setDeferredPrompt(null);
        return true;
      }
    } catch (err) {
      console.error("Installatie prompt mislukt:", err);
    }
    return false;
  }, [deferredPrompt]);

  return {
    isMounted,
    isStandalone,
    isOffline,
    isSupported,
    canInstall: Boolean(deferredPrompt),
    platform,
    installApp,
  };
}
