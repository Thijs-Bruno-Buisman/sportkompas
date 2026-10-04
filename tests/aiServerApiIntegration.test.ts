import { describe, it, expect, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET, POST } from "@/app/api/ai/route";
import { aiRateLimiter } from "@/lib/ai/rateLimiter";

describe("AI Server API Integration (Stap 41 / Prompt 35)", () => {
  beforeEach(() => {
    aiRateLimiter.reset();
  });

  it("GET /api/ai retourneert de status en configuratie van het endpoint", async () => {
    const res = await GET();
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.status).toBe("ok");
    expect(typeof data.isConfigured).toBe("boolean");
    expect(data.modelName).toBeDefined();
  });

  it("POST /api/ai verwerkt een geldige AI taak en retourneert gestructureerde data met disclaimer", async () => {
    const request = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.168.1.100",
      },
      body: JSON.stringify({
        task: "overload_suggestions",
        context: {
          exerciseId: "squat-1",
          exerciseName: "Barbell Squat",
          currentWeightKg: 100,
        },
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(200);
    expect(res.headers.get("X-RateLimit-Remaining")).toBeDefined();

    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.task).toBe("overload_suggestions");
    expect(data.isEstimate).toBe(true);
    expect(data.disclaimer).toContain("geen medisch");
    expect(data.structuredData).toBeDefined();
    expect(data.structuredData.suggestedWeightKg).toBe(102.5);
  });

  it("POST /api/ai weigert een ongeldige payload met HTTP 422", async () => {
    const request = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": "192.168.1.101",
      },
      body: JSON.stringify({
        task: "onbekende_ongeldige_taak",
      }),
    });

    const res = await POST(request);
    expect(res.status).toBe(422);

    const data = await res.json();
    expect(data.error).toContain("validatie mislukt");
  });

  it("POST /api/ai blokkeert verzoeken wanneer het rate limit overschreden wordt (HTTP 429)", async () => {
    const testIp = "10.0.0.99";

    // Voer 15 toegestane verzoeken uit (ons ingestelde maximum per minuut)
    for (let i = 0; i < 15; i++) {
      const req = new NextRequest("http://localhost:3000/api/ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": testIp,
        },
        body: JSON.stringify({ task: "health_check" }),
      });
      const res = await POST(req);
      expect(res.status).toBe(200);
    }

    // Het 16e verzoek moet geblokkeerd worden met 429
    const blockedReq = new NextRequest("http://localhost:3000/api/ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": testIp,
      },
      body: JSON.stringify({ task: "health_check" }),
    });

    const blockedRes = await POST(blockedReq);
    expect(blockedRes.status).toBe(429);
    expect(blockedRes.headers.get("Retry-After")).toBeDefined();

    const data = await blockedRes.json();
    expect(data.error).toContain("Te veel AI-aanvragen");
    expect(data.resetInSeconds).toBeGreaterThan(0);
  });
});
