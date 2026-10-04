import { describe, it, expect } from "vitest";
import {
  checkIsStandalone,
  checkServiceWorkerSupport,
  getBrowserPlatform,
  formatPwaStatus,
} from "./pwaManager";

describe("Domain: pwaManager", () => {
  describe("checkIsStandalone", () => {
    it("herkent standalone op iOS Safari via navigator.standalone", () => {
      expect(checkIsStandalone(true)).toBe(true);
      expect(checkIsStandalone(false)).toBe(false);
    });

    it("herkent standalone via matchMedia query", () => {
      const mockMatchMediaStandalone = (q: string) => ({
        matches: q.includes("standalone"),
      });
      expect(checkIsStandalone(false, mockMatchMediaStandalone)).toBe(true);

      const mockMatchMediaBrowser = () => ({ matches: false });
      expect(checkIsStandalone(false, mockMatchMediaBrowser)).toBe(false);
    });
  });

  describe("checkServiceWorkerSupport", () => {
    it("detecteert service worker ondersteuning", () => {
      expect(checkServiceWorkerSupport({ serviceWorker: {} })).toBe(true);
      expect(checkServiceWorkerSupport({})).toBe(false);
      expect(checkServiceWorkerSupport(undefined)).toBe(false);
    });
  });

  describe("getBrowserPlatform", () => {
    it("herkent iOS apparaten", () => {
      const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
      expect(getBrowserPlatform(iphoneUA)).toBe("ios");
    });

    it("herkent Android apparaten", () => {
      const androidUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36";
      expect(getBrowserPlatform(androidUA)).toBe("android");
    });

    it("herkent Desktop browsers", () => {
      const winUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";
      expect(getBrowserPlatform(winUA)).toBe("desktop");
    });
  });

  describe("formatPwaStatus", () => {
    it("geeft offline status wanneer offline", () => {
      const status = formatPwaStatus(true, true, true);
      expect(status.label).toContain("Offline");
      expect(status.variant).toBe("warning");
    });

    it("geeft standalone status wanneer geïnstalleerd en online", () => {
      const status = formatPwaStatus(true, false, true);
      expect(status.label).toContain("Geïnstalleerd als App");
      expect(status.variant).toBe("success");
    });

    it("geeft installatie klaar status wanneer service worker actief is in browser", () => {
      const status = formatPwaStatus(false, false, true);
      expect(status.label).toContain("Klaar voor Installatie");
      expect(status.variant).toBe("info");
    });
  });
});
