export interface RateLimiterOptions {
  windowMs: number; // Tijdvenster in milliseconden (bijv. 60.000 voor 1 minuut)
  maxRequests: number; // Maximaal aantal verzoeken per tijdvenster
}

interface ClientRecord {
  timestamps: number[];
}

/**
 * In-memory sliding window rate limiter voor server-side API endpoints.
 */
export class InMemoryRateLimiter {
  private clients = new Map<string, ClientRecord>();
  private windowMs: number;
  private maxRequests: number;

  constructor(options: RateLimiterOptions = { windowMs: 60_000, maxRequests: 10 }) {
    this.windowMs = options.windowMs;
    this.maxRequests = options.maxRequests;
  }

  /**
   * Controleert of een client nog binnen het limiet valt en registreert het verzoek.
   */
  public check(clientId: string): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.clients.get(clientId);
    if (!record) {
      record = { timestamps: [] };
      this.clients.set(clientId, record);
    }

    // Filter verouderde timestamps buiten het huidige venster
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetInSeconds = Math.max(1, Math.ceil((oldestInWindow + this.windowMs - now) / 1000));
      return {
        allowed: false,
        remaining: 0,
        resetInSeconds,
      };
    }

    // Registreer dit verzoek
    record.timestamps.push(now);
    const remaining = this.maxRequests - record.timestamps.length;
    const resetInSeconds = Math.ceil(this.windowMs / 1000);

    return {
      allowed: true,
      remaining,
      resetInSeconds,
    };
  }

  /**
   * Reset alle records (handig voor tests of beheer).
   */
  public reset(): void {
    this.clients.clear();
  }
}

// Singleton instantie voor de AI endpoints: 15 verzoeken per 60 seconden per client
export const aiRateLimiter = new InMemoryRateLimiter({
  windowMs: 60_000,
  maxRequests: 15,
});
