import {
  type AiRequestPayload,
  type AiResponsePayload,
  OverloadSuggestionSchema,
  NutritionAdviceSchema,
  WeeklyReviewSchema,
} from "./schemas";
import { type AiServerConfig, AI_DISCLAIMER_TEXT } from "./config";

/**
 * Genereert de basissysteemprompt met vaste SportKompas gedragsregels.
 */
export function buildSystemPrompt(task: string): string {
  let taskGuidance = "";
  if (task === "overload_suggestions") {
    taskGuidance = `
Als taak 'overload_suggestions' is, beantwoord dan bij voorkeur met een geldig JSON object conform dit schema:
{
  "exerciseId": string,
  "exerciseName": string,
  "currentWeightKg": number,
  "suggestedWeightKg": number,
  "targetReps": number,
  "rationale": string (inclusief '(schatting)'),
  "confidence": "hoog" | "gemiddeld" | "laag",
  "requiresConfirmation": true
}`;
  }

  return `Je bent de ingebouwde assistent van SportKompas, een persoonlijke en rustige fitness applicatie.
Belangrijke regels:
1. Reageer altijd in het Nederlands.
2. Geef uitsluitend onderbouwde fitness- en voedingssuggesties; stel NOOIT medische diagnoses en doe GEEN medische claims.
3. Label elke berekende of geschatte waarde expliciet met '(schatting)'.
4. Adviezen zijn altijd voorstellen die de gebruiker zelf handmatig moet bevestigen.
Taak: ${task}${taskGuidance}`;
}

/**
 * Lokale heuristische fallback provider (actief wanneer er geen API-sleutel is geconfigureerd).
 * Biedt betrouwbare, privacy-vriendelijke suggesties zonder externe cloud call.
 */
export function generateLocalHeuristicResponse(
  payload: AiRequestPayload,
  modelName = "lokaal-sportkompas"
): AiResponsePayload {
  const timestamp = new Date().toISOString();

  switch (payload.task) {
    case "health_check":
      return {
        success: true,
        task: "health_check",
        message: "AI Server Endpoint is operationeel (Lokale Heuristiek modus).",
        disclaimer: AI_DISCLAIMER_TEXT,
        isEstimate: false,
        modelUsed: modelName,
        timestamp,
      };

    case "overload_suggestions": {
      // Heuristiek op basis van de meegestuurde context en eventuele deterministische baseline
      const baseline = payload.context?.deterministicBaseline as Record<string, unknown> | undefined;
      const exerciseName =
        (payload.context?.exerciseName as string) ||
        (baseline?.exerciseName as string) ||
        "Geselecteerde oefening";
      const exerciseId =
        (payload.context?.exerciseId as string) ||
        (baseline?.exerciseId as string) ||
        "ex-1";
      const currentWeight =
        Number(payload.context?.currentWeightKg) ||
        Number(baseline?.currentWeightKg) ||
        60;
      const suggestedWeight =
        typeof baseline?.suggestedWeightKg === "number"
          ? baseline.suggestedWeightKg
          : Math.round((currentWeight + 2.5) * 10) / 10;
      const targetReps =
        typeof baseline?.suggestedRepsMin === "number"
          ? baseline.suggestedRepsMin
          : Number(payload.context?.targetRepsMin) || 8;

      let rationale =
        (baseline?.rationale as string) ||
        `Op basis van je recente prestaties en dubbele progressie is een aanpassing naar ${suggestedWeight} kg passend om progressieve overload te behouden.`;
      if (!rationale.includes("(schatting)")) {
        rationale = `${rationale} (schatting)`;
      }

      const confidence =
        baseline?.confidence === "hoog" || baseline?.confidence === "laag"
          ? baseline.confidence
          : "gemiddeld";

      const structured = OverloadSuggestionSchema.parse({
        exerciseId,
        exerciseName,
        currentWeightKg: currentWeight,
        suggestedWeightKg: suggestedWeight,
        targetReps,
        rationale,
        confidence,
        requiresConfirmation: true,
      });

      return {
        success: true,
        task: "overload_suggestions",
        message: `Voorstel voor ${exerciseName}: streef naar ${suggestedWeight} kg (schatting) bij ${targetReps} herhalingen.`,
        structuredData: structured,
        disclaimer: AI_DISCLAIMER_TEXT,
        isEstimate: true,
        modelUsed: modelName,
        timestamp,
      };
    }

    case "nutrition_advice": {
      const isTrainingDay = Boolean(payload.context?.isTrainingDay ?? true);
      const structured = NutritionAdviceSchema.parse({
        summary: isTrainingDay
          ? "Trainingsdag: focus op extra complexe koolhydraten en hydratatie."
          : "Rustdag: stabiele eiwitinname voor spierherstel.",
        isTrainingDay,
        calorieAdjustmentKcal: isTrainingDay ? 200 : 0,
        proteinTargetGrams: 160,
        carbsTargetGrams: isTrainingDay ? 280 : 220,
        recommendations: [
          "Neem een eiwitrijke maaltijd binnen 2 uur na je training.",
          "Drink minimaal 2,5 liter water verspreid over de dag.",
          "Kies voor trage koolhydraten (havermout, zilvervliesrijst, volkoren pasta).",
        ],
        rationale:
          "Op trainingsdagen verbruik je meer glycogeen; een lichte ophoging van ~200 kcal (schatting) bevordert herstel en energie.",
      });

      return {
        success: true,
        task: "nutrition_advice",
        message: structured.summary,
        structuredData: structured,
        disclaimer: AI_DISCLAIMER_TEXT,
        isEstimate: true,
        modelUsed: modelName,
        timestamp,
      };
    }

    case "weekly_review": {
      const structured = WeeklyReviewSchema.parse({
        headline: "Wekelijkse Voortgang & Herstelbalans",
        volumeAssessment: "Je trainingsvolume was deze week consistent verdeeld.",
        recoveryAssessment: "Voldoende rustdagen ingebouwd voor spiergroei.",
        nutritionAssessment: "Gemiddelde eiwitinname lag rond het streefniveau.",
        keyHighlights: [
          "Consistent trainingsritme vastgehouden",
          "Goede verhouding tussen intensieve sets en herstel",
        ],
        focusNextWeek: "Behoud dit ritme en let op voldoende hydratatie op zware trainingsdagen.",
      });

      return {
        success: true,
        task: "weekly_review",
        message: structured.headline,
        structuredData: structured,
        disclaimer: AI_DISCLAIMER_TEXT,
        isEstimate: true,
        modelUsed: modelName,
        timestamp,
      };
    }

    case "qa_chat": {
      const question = payload.userPrompt || "Algemene vraag";
      return {
        success: true,
        task: "qa_chat",
        message: `Je vroeg: "${question}". SportKompas AI adviseert om altijd te trainen met een focus op correcte techniek en progressieve overload. Zorg voor minimaal 48 uur herstel per spiergroep (schatting).`,
        disclaimer: AI_DISCLAIMER_TEXT,
        isEstimate: true,
        modelUsed: modelName,
        timestamp,
      };
    }
  }
}

/**
 * Roept de Google Gemini API server-side aan met fallback naar lokale heuristiek indien offline of bij fout.
 */
export async function executeAiTask(
  payload: AiRequestPayload,
  config: AiServerConfig
): Promise<AiResponsePayload> {
  // Als er geen API key is geconfigureerd, gebruik de lokale veilige heuristiek
  if (!config.isConfigured || !config.apiKey) {
    return generateLocalHeuristicResponse(payload, "lokaal-sportkompas");
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      config.modelName
    )}:generateContent?key=${encodeURIComponent(config.apiKey)}`;

    const promptText = `${buildSystemPrompt(payload.task)}

Contextgegevens:
${JSON.stringify(payload.context, null, 2)}

Gebruikersvraag / Prompt:
${payload.userPrompt || "Genereer een analyse conform je taak."}`;

    const requestBody = {
      contents: [
        {
          parts: [{ text: promptText }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 1000,
      },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.warn(`[SportKompas AI] Gemini API fout (${response.status}), fallback naar lokale heuristiek.`);
      return generateLocalHeuristicResponse(payload, `${config.modelName}-fallback`);
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let structuredData: unknown = undefined;
    if (payload.task === "overload_suggestions") {
      try {
        const jsonMatch = candidateText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          structuredData = OverloadSuggestionSchema.parse(parsed);
        }
      } catch {
        // Fallback naar gestructureerde data via lokale heuristiek als Gemini vrije tekst retourneerde
        const fallback = generateLocalHeuristicResponse(payload, config.modelName);
        structuredData = fallback.structuredData;
      }
    }

    return {
      success: true,
      task: payload.task,
      message: candidateText.trim() || `Advies voor ${payload.task} gegenereerd.`,
      structuredData,
      disclaimer: AI_DISCLAIMER_TEXT,
      isEstimate: true,
      modelUsed: config.modelName,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    console.warn("[SportKompas AI] Netwerkfout bij API call, fallback naar lokale heuristiek:", err);
    return generateLocalHeuristicResponse(payload, "lokaal-sportkompas-fallback");
  }
}
