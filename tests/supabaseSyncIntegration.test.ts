import { describe, it, expect } from "vitest";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { syncLocalDataWithSupabase } from "@/lib/supabase/sync";
import type { User } from "@supabase/supabase-js";

describe("Supabase Cloud Sync & Auth Integratie", () => {
  it("exporteert isSupabaseConfigured als boolean", () => {
    expect(typeof isSupabaseConfigured).toBe("boolean");
  });

  it("handelt sync af wanneer er geen geldige gebruiker is", async () => {
    // @ts-expect-error opzettelijk null testen
    const result = await syncLocalDataWithSupabase(null);
    expect(result.success).toBe(false);
    expect(result.error).toContain("Niet ingelogd");
  });

  it("faalt veilig en gecontroleerd zonder ongevalideerde crash bij dummy user", async () => {
    const dummyUser: User = {
      id: "mock-user-12345",
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    };

    // Indien offline of bij ongeldige netwerkverbinding vangt syncLocalDataWithSupabase fouten af
    const result = await syncLocalDataWithSupabase(dummyUser);
    expect(typeof result.success).toBe("boolean");
    if (!result.success) {
      expect(typeof result.error).toBe("string");
    }
  });
});

