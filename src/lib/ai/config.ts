/**
 * Server-side AI configuratie en API-sleutel beheer.
 * Conform Rule 6 van AGENTS.md:
 * - API sleutels blijven UITSLUITEND server-side en NOOIT in Git.
 * - GEEN NEXT_PUBLIC prefix voor gevoelige sleutels.
 */

export interface AiServerConfig {
  apiKey: string | null;
  modelName: string;
  isConfigured: boolean;
}

export function getAiServerConfig(): AiServerConfig {
  // Alleen server-side benaderbaar via process.env
  const apiKey = process.env.AI_PROVIDER_API_KEY?.trim() || null;
  const modelName = process.env.AI_MODEL_NAME?.trim() || "gemini-1.5-flash";

  return {
    apiKey,
    modelName,
    isConfigured: Boolean(apiKey && apiKey.length > 0),
  };
}

export const AI_DISCLAIMER_TEXT =
  "Let op: AI-suggesties zijn uitsluitend bedoeld als trainings- en voedingsrichtlijn en vormen geen medisch of fysiotherapeutisch advies. Pas suggesties altijd aan op je eigen fysieke belastbaarheid.";
