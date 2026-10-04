import { NextRequest, NextResponse } from "next/server";
import {
  buildStravaAuthorizeUrl,
  getMockStravaAthlete,
  getMockStravaActivities,
} from "@/domain/integrations/strava";

/**
 * Controleert of de benodigde Strava credentials server-side geconfigureerd zijn.
 * Rule 6: Nooit secrets blootstellen of in Git plaatsen.
 */
function getStravaServerConfig() {
  const clientId = process.env.STRAVA_CLIENT_ID?.trim() || "";
  const clientSecret = process.env.STRAVA_CLIENT_SECRET?.trim() || "";
  const isConfigured = clientId.length > 0 && clientSecret.length > 0;

  return {
    clientId: isConfigured ? clientId : null,
    clientSecret,
    isConfigured,
  };
}

/**
 * GET /api/integrations/strava
 * Vraagt koppelingsstatus of een autorisatie-URL op.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action") || "status";
  const config = getStravaServerConfig();

  if (action === "status") {
    return NextResponse.json({
      status: "ok",
      isConfigured: config.isConfigured,
      clientId: config.clientId,
      message: config.isConfigured
        ? "Strava API is geconfigureerd op de server."
        : "Strava API is nog niet geconfigureerd. Voeg STRAVA_CLIENT_ID en STRAVA_CLIENT_SECRET toe aan .env.local.",
    });
  }

  if (action === "auth-url") {
    if (!config.isConfigured || !config.clientId) {
      return NextResponse.json(
        {
          error: "Strava is nog niet geconfigureerd op de server.",
          isConfigured: false,
        },
        { status: 400 }
      );
    }

    const redirectUri =
      searchParams.get("redirect_uri") ||
      `${req.nextUrl.origin}/profiel`;
    const state = searchParams.get("state") || undefined;

    const authUrl = buildStravaAuthorizeUrl(
      config.clientId,
      redirectUri,
      state
    );

    return NextResponse.json({
      authUrl,
      isConfigured: true,
    });
  }

  return NextResponse.json(
    { error: `Onbekende actie: '${action}'.` },
    { status: 400 }
  );
}

/**
 * POST /api/integrations/strava
 * Handelt token exchanges, synchronisatieverzoeken en demo-modus af.
 */
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Ongeldige JSON in verzoek." },
      { status: 400 }
    );
  }

  const { action } = body;
  const config = getStravaServerConfig();

  // 1. Demo synchronisatie (werkt altijd, 100% offline-veilig conform Rule 8)
  if (action === "demo_sync") {
    return NextResponse.json({
      success: true,
      isDemo: true,
      athlete: getMockStravaAthlete(),
      activities: getMockStravaActivities(),
    });
  }

  // 2. OAuth Code Exchange
  if (action === "exchange_token") {
    const { code } = body;
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { error: "Autorisatiecode (code) is verplicht voor token exchange." },
        { status: 400 }
      );
    }

    if (!config.isConfigured || !config.clientId) {
      return NextResponse.json(
        {
          error:
            "Strava is nog niet geconfigureerd. Voeg STRAVA_CLIENT_ID en STRAVA_CLIENT_SECRET toe aan .env.local.",
          isConfigured: false,
        },
        { status: 400 }
      );
    }

    try {
      const response = await fetch("https://www.strava.com/oauth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: config.clientId,
          client_secret: config.clientSecret,
          code,
          grant_type: "authorization_code",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return NextResponse.json(
          {
            error:
              errorData.message ||
              "Fout bij het uitwisselen van de Strava autorisatiecode.",
            details: errorData,
          },
          { status: response.status }
        );
      }

      const tokenData = await response.json();
      return NextResponse.json({
        success: true,
        athlete: tokenData.athlete,
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_at,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: "Kon geen verbinding maken met Strava OAuth servers.",
          message: err.message,
        },
        { status: 502 }
      );
    }
  }

  // 3. Activiteiten ophalen (Sync)
  if (action === "sync") {
    const { accessToken, afterTimestamp } = body;
    if (!accessToken || typeof accessToken !== "string") {
      return NextResponse.json(
        { error: "Geldig access_token is verplicht om activiteiten op te halen." },
        { status: 401 }
      );
    }

    try {
      const url = new URL("https://www.strava.com/api/v3/athlete/activities");
      if (typeof afterTimestamp === "number" && afterTimestamp > 0) {
        url.searchParams.set("after", String(afterTimestamp));
      }
      url.searchParams.set("per_page", "30");

      const response = await fetch(url.toString(), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          return NextResponse.json(
            { error: "Strava access token is verlopen of ongeldig.", code: "UNAUTHORIZED" },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: `Strava API fout (status ${response.status}).` },
          { status: response.status }
        );
      }

      const activities = await response.json();
      return NextResponse.json({
        success: true,
        activities,
      });
    } catch (err: any) {
      return NextResponse.json(
        {
          error: "Kon activiteiten niet ophalen van de Strava API.",
          message: err.message,
        },
        { status: 502 }
      );
    }
  }

  return NextResponse.json(
    { error: `Onbekende actie: '${action}'.` },
    { status: 400 }
  );
}
