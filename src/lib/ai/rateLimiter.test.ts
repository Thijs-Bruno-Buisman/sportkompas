import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryRateLimiter } from "./rateLimiter";

describe("Server AI Rate Limiter", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter({ windowMs: 1000, maxRequests: 3 });
  });

  it("staat verzoeken binnen de limiet toe en telt af", () => {
    const res1 = limiter.check("client-1");
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check("client-1");
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check("client-1");
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);

    // 4e verzoek moet geblokkeerd worden
    const res4 = limiter.check("client-1");
    expect(res4.allowed).toBe(false);
    expect(res4.remaining).toBe(0);
    expect(res4.resetInSeconds).toBeGreaterThan(0);
  });

  it("behandelt verschillende clients onafhankelijk van elkaar", () => {
    limiter.check("client-a");
    limiter.check("client-a");
    limiter.check("client-a");

    expect(limiter.check("client-a").allowed).toBe(false);

    // client-b heeft nog zijn volledige tegoed
    const resB = limiter.check("client-b");
    expect(resB.allowed).toBe(true);
    expect(resB.remaining).toBe(2);
  });

  it("reset correct bij reset()", () => {
    limiter.check("client-x");
    limiter.check("client-x");
    limiter.check("client-x");
    expect(limiter.check("client-x").allowed).toBe(false);

    limiter.reset();

    const afterReset = limiter.check("client-x");
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(2);
  });
});
