import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import "fake-indexeddb/auto";
import Dexie from "dexie";
import { GET } from "@/app/api/integrations/openfoodfacts/route";
import { NextRequest } from "next/server";
import {
  getMockOpenFoodFactsProducts,
  convertExternalToFoodItem,
  fetchProductWithLocalCache,
} from "@/domain/nutrition/openFoodFacts";
import { createRepositories } from "@/lib/db";
import { SportKompasDatabase } from "@/lib/db/dexie";
import type { FoodItem } from "@/types/database";

describe("Stap 48 — Open Food Facts Externe Integratietest", () => {
  let db: SportKompasDatabase;
  let repos: ReturnType<typeof createRepositories>;

  beforeEach(async () => {
    const dbName = `test_off_${crypto.randomUUID()}`;
    await Dexie.delete(dbName);
    db = new SportKompasDatabase(dbName);
    repos = createRepositories(db);
    await db.open();
  });

  afterEach(async () => {
    if (db.isOpen()) {
      db.close();
    }
    await Dexie.delete(db.name);
  });

  it("retourneert status ok en publieke beschikbaarheid via /api/integrations/openfoodfacts", async () => {
    const req = new NextRequest("http://localhost:3000/api/integrations/openfoodfacts?action=status");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.service).toBe("Open Food Facts");
    expect(body.isAvailable).toBe(true);
  });

  it("levert demo mock-producten op basis van barcode via action=demo", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/integrations/openfoodfacts?action=demo&barcode=8710400041234"
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isDemo).toBe(true);
    expect(body.product.name).toBe("Arla Skyr Naturel");
    expect(body.product.caloriesPer100g).toBe(63);
    expect(body.product.proteinGramsPer100g).toBe(11.0);
  });

  it("weigert ongeldige streepjescodes met 400 en duidelijke foutmelding", async () => {
    const req = new NextRequest(
      "http://localhost:3000/api/integrations/openfoodfacts?barcode=ongeldig"
    );
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toContain("Ongeldige streepjescode");
  });

  it("handhaaft offline-first architectuur: slaat product op in IndexedDB en benut lokale cache", async () => {
    const mockProducts = getMockOpenFoodFactsProducts();
    const skyr = mockProducts[0];

    // Stap 1: Sla op in de lokale IndexedDB voedingsdatabase via saveExternalFoodItem
    const savedFoodItem = await repos.nutrition.saveExternalFoodItem(skyr);

    expect(savedFoodItem.id).toBeDefined();
    expect(savedFoodItem.barcode).toBe(skyr.barcode);

    // Stap 2: Controleer opzoeken via barcode in lokale database
    const localLookup = await repos.nutrition.getFoodByBarcode(skyr.barcode);
    expect(localLookup).toBeDefined();
    expect(localLookup?.name).toBe("Arla Skyr Naturel");

    // Stap 3: fetchProductWithLocalCache moet nu 100% lokaal slagen zonder enige netwerkaanroep
    const mockFetch = vi.fn();
    const result = await fetchProductWithLocalCache(
      skyr.barcode,
      (code) => repos.nutrition.getFoodByBarcode(code),
      { fetchFn: mockFetch }
    );

    expect(result.isFromLocalCache).toBe(true);
    expect(result.product).toBeDefined();
    expect((result.product as FoodItem).name).toBe("Arla Skyr Naturel");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("zoekt via de proxy en handelt lege zoekresultaten netjes af", async () => {
    const req = new NextRequest("http://localhost:3000/api/integrations/openfoodfacts?query=%20%20");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.products).toEqual([]);
  });
});
