export type BrowserPlatform = "ios" | "android" | "desktop" | "other";

/**
 * Detecteert of de webapplicatie draait in standalone modus (als geïnstalleerde PWA).
 */
export function checkIsStandalone(
  navigatorStandalone?: boolean,
  matchMediaFn?: (query: string) => { matches: boolean }
): boolean {
  // iOS Safari standalone detectie
  if (navigatorStandalone === true) {
    return true;
  }

  // W3C display-mode media query (Chrome, Edge, Firefox, Android, Desktop PWA)
  if (typeof matchMediaFn === "function") {
    try {
      if (matchMediaFn("(display-mode: standalone)").matches) return true;
      if (matchMediaFn("(display-mode: fullscreen)").matches) return true;
      if (matchMediaFn("(display-mode: minimal-ui)").matches) return true;
    } catch {
      // Fallback
    }
  }

  return false;
}

/**
 * Controleert of Service Workers ondersteund worden in de huidige runtime.
 */
export function checkServiceWorkerSupport(navigatorObj?: {
  serviceWorker?: unknown;
}): boolean {
  if (!navigatorObj) return false;
  return "serviceWorker" in navigatorObj && Boolean(navigatorObj.serviceWorker);
}

/**
 * Detecteert het platform van de gebruiker op basis van de user agent string.
 */
export function getBrowserPlatform(userAgent: string): BrowserPlatform {
  if (!userAgent || typeof userAgent !== "string") return "other";
  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) {
    return "ios";
  }
  if (/android/.test(ua)) {
    return "android";
  }
  if (/windows|macintosh|linux/.test(ua) && !/mobile/.test(ua)) {
    return "desktop";
  }

  return "other";
}

/**
 * Genereert een Nederlandse statusomschrijving voor de PWA-installatie en offline capaciteit.
 */
export function formatPwaStatus(
  isStandalone: boolean,
  isOffline: boolean,
  hasServiceWorker: boolean
): {
  label: string;
  description: string;
  variant: "success" | "warning" | "info";
} {
  if (isOffline) {
    return {
      label: "Offline Modus Actief",
      description: "Je bent momenteel offline. SportKompas blijft 100% operationeel via lokale opslag en de gecachede app-shell.",
      variant: "warning",
    };
  }

  if (isStandalone) {
    return {
      label: "Geïnstalleerd als App",
      description: "SportKompas draait als standalone applicatie op je apparaat met volledige offline ondersteuning.",
      variant: "success",
    };
  }

  if (hasServiceWorker) {
    return {
      label: "Klaar voor Installatie & Offline",
      description: "De offline service worker is actief. Je kunt de app toevoegen aan je startscherm of installeren.",
      variant: "info",
    };
  }

  return {
    label: "Webversie Actief",
    description: "SportKompas draait in je webbrowser. Alle data wordt veilig en lokaal opgeslagen in IndexedDB.",
    variant: "info",
  };
}
