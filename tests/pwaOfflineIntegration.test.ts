import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import manifest from "@/app/manifest";
import {
  checkIsStandalone,
  checkServiceWorkerSupport,
  getBrowserPlatform,
  formatPwaStatus,
} from "@/domain/pwa/pwaManager";

describe("PWA & Offline Integration (Stap 40 / Prompt 34)", () => {
  it("genereert een conform Web App Manifest volgens W3C standaarden", () => {
    const manifestData = manifest();

    expect(manifestData.name).toBe("SportKompas — Persoonlijke Sport & Gezondheid");
    expect(manifestData.short_name).toBe("SportKompas");
    expect(manifestData.display).toBe("standalone");
    expect(manifestData.start_url).toBe("/");
    expect(manifestData.background_color).toBe("#090d16");
    expect(manifestData.theme_color).toBe("#10b981");
    expect(manifestData.lang).toBe("nl");
    expect(manifestData.orientation).toBe("portrait-primary");

    // Controleer de iconen
    expect(manifestData.icons).toBeDefined();
    expect(manifestData.icons?.length).toBeGreaterThanOrEqual(3);

    const sizes = manifestData.icons?.map((i) => i.sizes);
    expect(sizes).toContain("192x192");
    expect(sizes).toContain("512x512");

    const maskableIcon = manifestData.icons?.find((i) => i.purpose === "maskable");
    expect(maskableIcon).toBeDefined();
  });

  it("verifieert dat de Service Worker (public/sw.js) en SVG iconen fysiek op schijf staan", () => {
    const publicDir = path.join(process.cwd(), "public");

    // 1. Service Worker bestand
    const swPath = path.join(publicDir, "sw.js");
    expect(fs.existsSync(swPath)).toBe(true);
    const swContent = fs.readFileSync(swPath, "utf-8");
    expect(swContent).toContain("sportkompas-shell-v1");
    expect(swContent).toContain('"/training"');
    expect(swContent).toContain('"/cardio"');
    expect(swContent).toContain('"/voeding"');
    expect(swContent).toContain('"/profiel"');
    expect(swContent).toContain("addEventListener(\"install\"");
    expect(swContent).toContain("addEventListener(\"activate\"");
    expect(swContent).toContain("addEventListener(\"fetch\"");

    // 2. Iconen
    const icon192Path = path.join(publicDir, "icons", "icon-192.svg");
    const icon512Path = path.join(publicDir, "icons", "icon-512.svg");
    const iconMaskablePath = path.join(publicDir, "icons", "icon-maskable.svg");

    expect(fs.existsSync(icon192Path)).toBe(true);
    expect(fs.existsSync(icon512Path)).toBe(true);
    expect(fs.existsSync(iconMaskablePath)).toBe(true);

    expect(fs.statSync(icon192Path).size).toBeGreaterThan(0);
    expect(fs.statSync(icon512Path).size).toBeGreaterThan(0);
    expect(fs.statSync(iconMaskablePath).size).toBeGreaterThan(0);
  });

  it("handhaaft correcte platform- en offline statusdetectie", () => {
    // 1. Offline status weergave
    const offlineStatus = formatPwaStatus(true, true, true);
    expect(offlineStatus.variant).toBe("warning");
    expect(offlineStatus.label).toContain("Offline Modus Actief");
    expect(offlineStatus.description).toContain("100% operationeel");

    // 2. Standalone status weergave
    const standaloneStatus = formatPwaStatus(true, false, true);
    expect(standaloneStatus.variant).toBe("success");
    expect(standaloneStatus.label).toContain("Geïnstalleerd als App");

    // 3. Platform detectie
    expect(getBrowserPlatform("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)")).toBe("ios");
    expect(getBrowserPlatform("Mozilla/5.0 (Linux; Android 13; SM-S908B)")).toBe("android");
    expect(getBrowserPlatform("Mozilla/5.0 (Windows NT 10.0; Win64; x64)")).toBe("desktop");

    // 4. Standalone detectie via media query
    const matchMediaMock = (q: string) => ({
      matches: q === "(display-mode: standalone)",
    });
    expect(checkIsStandalone(false, matchMediaMock)).toBe(true);
    expect(checkServiceWorkerSupport({ serviceWorker: {} })).toBe(true);
  });
});
