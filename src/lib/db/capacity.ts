export interface StorageEstimateInfo {
  supported: boolean;
  usageBytes: number;
  quotaBytes: number;
  usageMb: number;
  quotaMb: number;
  percentUsed: number;
  isLowCapacity: boolean; // Waarschuwing als > 80% gebruikt
}

/**
 * Controleert de actuele IndexedDB opslagcapaciteit van de browser.
 * Volledig veilig tegen SSR / niet-ondersteunde omgevingen.
 */
export async function checkStorageCapacity(): Promise<StorageEstimateInfo> {
  if (
    typeof navigator === "undefined" ||
    !navigator.storage ||
    typeof navigator.storage.estimate !== "function"
  ) {
    return {
      supported: false,
      usageBytes: 0,
      quotaBytes: 0,
      usageMb: 0,
      quotaMb: 0,
      percentUsed: 0,
      isLowCapacity: false,
    };
  }

  try {
    const estimate = await navigator.storage.estimate();
    const usageBytes = estimate.usage ?? 0;
    const quotaBytes = estimate.quota ?? 1;

    const usageMb = Math.round((usageBytes / (1024 * 1024)) * 10) / 10;
    const quotaMb = Math.round((quotaBytes / (1024 * 1024)) * 10) / 10;
    const percentUsed =
      quotaBytes > 0 ? Math.round((usageBytes / quotaBytes) * 100) : 0;

    return {
      supported: true,
      usageBytes,
      quotaBytes,
      usageMb,
      quotaMb,
      percentUsed,
      isLowCapacity: percentUsed >= 80,
    };
  } catch (error) {
    console.warn("Kon opslagcapaciteit niet opvragen:", error);
    return {
      supported: false,
      usageBytes: 0,
      quotaBytes: 0,
      usageMb: 0,
      quotaMb: 0,
      percentUsed: 0,
      isLowCapacity: false,
    };
  }
}
