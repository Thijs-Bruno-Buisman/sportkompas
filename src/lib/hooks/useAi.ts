"use client";

import { useState, useCallback, useEffect } from "react";
import type {
  AiRequestPayload,
  AiResponsePayload,
  AiTaskType,
} from "@/lib/ai/schemas";

export interface AiApiStatus {
  isConfigured: boolean;
  modelName: string;
  statusText: string;
}

export function useAi() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<AiApiStatus | null>(null);

  // Check configuratie bij mount
  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ai");
      if (res.ok) {
        const data = await res.json();
        setStatus({
          isConfigured: Boolean(data.isConfigured),
          modelName: data.modelName || "gemini-1.5-flash",
          statusText: data.message || "Actief",
        });
      }
    } catch {
      // Offline of API niet bereikbaar
      setStatus({
        isConfigured: false,
        modelName: "lokaal-fallback",
        statusText: "Lokale modus (offline)",
      });
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  /**
   * Voert een AI taak uit via het server-side endpoint.
   */
  const requestAiTask = useCallback(
    async (
      task: AiTaskType,
      context: Record<string, unknown> = {},
      userPrompt?: string
    ): Promise<AiResponsePayload | null> => {
      setIsLoading(true);
      setError(null);

      const payload: AiRequestPayload = {
        task,
        context,
        userPrompt,
      };

      try {
        const res = await fetch("/api/ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          if (res.status === 429) {
            const errData = await res.json().catch(() => ({}));
            const waitSec = errData.resetInSeconds || 30;
            const msg = `Rate limit bereikt. Wacht ${waitSec} seconden voor een nieuw verzoek.`;
            setError(msg);
            return null;
          }

          const errData = await res.json().catch(() => ({}));
          const msg = errData.error || `Server fout (${res.status})`;
          setError(msg);
          return null;
        }

        const data: AiResponsePayload = await res.json();
        return data;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(`Netwerkfout bij AI aanvraag: ${msg}`);
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return {
    isLoading,
    error,
    status,
    checkStatus,
    requestAiTask,
  };
}
