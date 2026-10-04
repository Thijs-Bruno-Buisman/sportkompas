import { NextRequest, NextResponse } from "next/server";
import { AiRequestSchema } from "@/lib/ai/schemas";
import { getAiServerConfig } from "@/lib/ai/config";
import { aiRateLimiter } from "@/lib/ai/rateLimiter";
import { executeAiTask } from "@/lib/ai/provider";

/**
 * GET /api/ai
 * Controleert de status en configuratie van de AI server API.
 */
export async function GET() {
  const config = getAiServerConfig();

  return NextResponse.json({
    status: "ok",
    isConfigured: config.isConfigured,
    modelName: config.modelName,
    message: config.isConfigured
      ? `AI Assistent is geconfigureerd (${config.modelName}).`
      : "AI Assistent draait in lokale heuristiek modus (geen API-sleutel ingesteld).",
  });
}

/**
 * POST /api/ai
 * Behandelt AI-aanvragen voor overload suggesties, voedingsadviezen, reviews en Q&A.
 */
export async function POST(req: NextRequest) {
  // 1. Bepaal client identifier voor rate limiting
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  const clientId = ip || "anonymous-client";

  // 2. Controleer rate limiter
  const rateLimitResult = aiRateLimiter.check(clientId);
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      {
        error: "Te veel AI-aanvragen in korte tijd.",
        message: `Wacht alstublieft ${rateLimitResult.resetInSeconds} seconden voor je een nieuw verzoek stuurt.`,
        resetInSeconds: rateLimitResult.resetInSeconds,
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.resetInSeconds),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // 3. Valideer de inkomende JSON payload
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: "Ongeldige JSON in verzoek.",
      },
      { status: 400 }
    );
  }

  const parseResult = AiRequestSchema.safeParse(body);
  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");

    return NextResponse.json(
      {
        error: `Invoer validatie mislukt: ${errorDetails}`,
      },
      { status: 422 }
    );
  }

  // 4. Voer de AI taak uit via de provider
  const config = getAiServerConfig();
  const aiResponse = await executeAiTask(parseResult.data, config);

  return NextResponse.json(aiResponse, {
    status: 200,
    headers: {
      "X-RateLimit-Remaining": String(rateLimitResult.remaining),
    },
  });
}
