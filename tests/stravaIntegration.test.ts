import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { GET, POST } from "@/app/api/integrations/strava/route";
import { NextRequest } from "next/server";
import {
  getMockStravaActivities,
  convertStravaActivityToCardioSession,
  filterNewStravaActivities,
} from "@/domain/integrations/strava";
import { createRepositories } from "@/lib/db";
import { SportKompasDatabase } from "@/lib/db/dexie";
import type { CardioSession } from "@/types/database";

describe("Stap 47 — Strava Externe Koppeling Integratietest", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;
  const originalEnv = process.env;

  beforeEach(async () => {
    process.env = { ...originalEnv };
    delete process.env.STRAVA_CLIENT_ID;
    delete process.env.STRAVA_CLIENT_SECRET;

    const dbName = `test_strava_${crypto.randomUUID()}`;
    await Dexie.delete(dbName);
    db = new SportKompasDatabase(dbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    process.env = originalEnv;
    if (db.isOpen()) {
      db.close();
    }
    await Dexie.delete(db.name);
  });

  it("handhaaft Rule 8: toont 'Nog niet verbonden' en geeft veilige status wanneer credentials ontbreken", async () => {
    const req = new NextRequest("http://localhost:3000/api/integrations/strava?action=status");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.isConfigured).toBe(false);
    expect(body.clientId).toBeNull();
    expect(body.message).toContain("nog niet geconfigureerd");
  });

  it("blokkeert auth-url aanvraag met 400 wanneer server-side credentials niet geconfigureerd zijn", async () => {
    const req = new NextRequest("http://localhost:3000/api/integrations/strava?action=auth-url");
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.isConfigured).toBe(false);
    expect(body.error).toContain("nog niet geconfigureerd");
  });

  it("genereert geldige autorisatie-URL wanneer STRAVA_CLIENT_ID en SECRET aanwezig zijn", async () => {
    process.env.STRAVA_CLIENT_ID = "998877";
    process.env.STRAVA_CLIENT_SECRET = "super_secret_strava_token";

    const req = new NextRequest(
      "http://localhost:3000/api/integrations/strava?action=auth-url&redirect_uri=http://localhost:3000/profiel&state=test_state"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.isConfigured).toBe(true);
    expect(body.authUrl).toContain("https://www.strava.com/oauth/authorize");
    expect(body.authUrl).toContain("client_id=998877");
    expect(body.authUrl).toContain("scope=read%2Cactivity%3Aread_all");
    expect(body.authUrl).toContain("state=test_state");
  });

  it("levert demo-activiteiten en atleet via demo_sync action zonder netwerkafhankelijkheid", async () => {
    const req = new NextRequest("http://localhost:3000/api/integrations/strava", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "demo_sync" }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isDemo).toBe(true);
    expect(body.athlete).toBeDefined();
    expect(body.athlete.firstname).toBe("Alex");
    expect(Array.isArray(body.activities)).toBe(true);
    expect(body.activities.length).toBeGreaterThanOrEqual(3);
  });

  it("converteert Strava activiteiten, slaat ze persistent op in IndexedDB en voorkomt duplicaten", async () => {
    const mockActivities = getMockStravaActivities();
    expect(mockActivities.length).toBeGreaterThan(0);

    const firstAct = mockActivities[0];
    const session: CardioSession = convertStravaActivityToCardioSession(firstAct, 75, false);

    expect(session.provenance.source).toBe("strava");
    expect(session.notes).toContain(`(Strava #${firstAct.id})`);

    // Sla op in Cardio repository
    await repos.cardio.save(session);

    // Controleer ophalen
    const retrieved = await repos.cardio.getById(session.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.distanceMeters).toBe(firstAct.distance);
    expect(retrieved?.durationSeconds).toBe(firstAct.moving_time);

    // Controleer deduplicatie
    const allSessions = await repos.cardio.getAll();
    const { newActivities, duplicateActivities } = filterNewStravaActivities(
      mockActivities,
      allSessions
    );

    expect(duplicateActivities.length).toBe(1);
    expect(duplicateActivities[0].id).toBe(firstAct.id);
    expect(newActivities.length).toBe(mockActivities.length - 1);
  });

  it("beheert Strava verbindingsstatus en lastSync datum in AppSettings", async () => {
    // Initiële status
    const initialSettings = await repos.settings.getSettings();
    expect(initialSettings.stravaConnected ?? false).toBe(false);

    // Koppel Strava
    await repos.settings.updateStravaConnection(true, 10842199, "Alex van Dijk");
    let updated = await repos.settings.getSettings();
    expect(updated.stravaConnected).toBe(true);
    expect(updated.stravaAthleteId).toBe(10842199);
    expect(updated.stravaAthleteName).toBe("Alex van Dijk");

    // Update last sync
    const syncTime = "2026-10-04T15:30:00.000Z";
    await repos.settings.updateStravaLastSync(syncTime);
    updated = await repos.settings.getSettings();
    expect(updated.stravaLastSyncAt).toBe(syncTime);

    // Ontkoppel Strava
    await repos.settings.updateStravaConnection(false, null, null);
    updated = await repos.settings.getSettings();
    expect(updated.stravaConnected).toBe(false);
    expect(updated.stravaAthleteId).toBeNull();
    expect(updated.stravaLastSyncAt).toBeNull();
  });
});
