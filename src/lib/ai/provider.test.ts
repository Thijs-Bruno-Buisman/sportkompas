import { describe, it, expect } from "vitest";
import {
  buildSystemPrompt,
  generateLocalHeuristicResponse,
  executeAiTask,
} from "./provider";
import type { AiRequestPayload } from "./schemas";
import { AI_DISCLAIMER_TEXT } from "./config";

describe("AI Provider Logic", () => {
  it("genereert een systeemprompt met vaste SportKompas regels", () => {
    const prompt = buildSystemPrompt("overload_suggestions");
    expect(prompt).toContain("Nederlands");
    expect(prompt).toContain("GEEN medische claims");
    expect(prompt).toContain("'(schatting)'");
  });

  it("levert correcte gestructureerde overload suggesties in lokale modus", () => {
    const payload: AiRequestPayload = {
      task: "overload_suggestions",
      context: {
        exerciseId: "bench-press",
        exerciseName: "Barbell Bench Press",
        currentWeightKg: 80,
      },
    };

    const response = generateLocalHeuristicResponse(payload);
    expect(response.success).toBe(true);
    expect(response.isEstimate).toBe(true);
    expect(response.disclaimer).toBe(AI_DISCLAIMER_TEXT);
    expect(response.structuredData).toBeDefined();

    const data = response.structuredData as {
      suggestedWeightKg: number;
      requiresConfirmation: boolean;
    };
    expect(data.suggestedWeightKg).toBe(82.5);
    expect(data.requiresConfirmation).toBe(true);
  });

  it("levert correcte gestructureerde voedingsadviezen in lokale modus", () => {
    const payload: AiRequestPayload = {
      task: "nutrition_advice",
      context: {
        isTrainingDay: true,
      },
    };

    const response = generateLocalHeuristicResponse(payload);
    expect(response.success).toBe(true);
    expect(response.structuredData).toBeDefined();

    const data = response.structuredData as {
      isTrainingDay: boolean;
      calorieAdjustmentKcal: number;
    };
    expect(data.isTrainingDay).toBe(true);
    expect(data.calorieAdjustmentKcal).toBe(200);
  });

  it("valt netjes terug op lokale heuristiek wanneer AI niet geconfigureerd is", async () => {
    const payload: AiRequestPayload = {
      task: "weekly_review",
      context: {},
    };

    const config = {
      apiKey: null,
      modelName: "gemini-1.5-flash",
      isConfigured: false,
    };

    const response = await executeAiTask(payload, config);
    expect(response.success).toBe(true);
    expect(response.modelUsed).toBe("lokaal-sportkompas");
    expect(response.disclaimer).toBe(AI_DISCLAIMER_TEXT);
  });
});
