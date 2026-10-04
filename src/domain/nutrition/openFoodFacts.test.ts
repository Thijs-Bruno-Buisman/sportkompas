import { describe, it, expect, vi } from "vitest";
import {
  mapOpenFoodFactsCategory,
  parseOpenFoodFactsProduct,
  convertExternalToFoodItem,
  fetchProductByBarcode,
  searchOpenFoodFacts,
  getMockOpenFoodFactsProducts,
  fetchProductWithLocalCache,
} from "./openFoodFacts";

describe("Open Food Facts Domain & Parsing (Prompt 25 / Stap 30)", () => {
  describe("mapOpenFoodFactsCategory", () => {
    it("mapt zuivel-gerelateerde tags correct", () => {
      expect(mapOpenFoodFactsCategory(["en:dairies", "en:milks"])).toBe("zuivel");
      expect(mapOpenFoodFactsCategory(["fr:yaourts"])).toBe("zuivel");
      expect(mapOpenFoodFactsCategory(["nl:halfvolle kwark"])).toBe("zuivel");
    });

    it("mapt vlees en vis tags correct", () => {
      expect(mapOpenFoodFactsCategory(["en:meats", "en:chickens"])).toBe("vlees_vis_ei");
      expect(mapOpenFoodFactsCategory(["en:fishes", "en:salmons"])).toBe("vlees_vis_ei");
    });

    it("mapt granen en brood correct", () => {
      expect(mapOpenFoodFactsCategory(["en:plant-based-foods", "en:cereals-and-their-products", "en:breads"])).toBe("granen_brood");
    });

    it("geeft 'overig' terug bij onbekende of lege tags", () => {
      expect(mapOpenFoodFactsCategory([])).toBe("overig");
      expect(mapOpenFoodFactsCategory(undefined)).toBe("overig");
      expect(mapOpenFoodFactsCategory(["random-unknown-tag"])).toBe("overig");
    });
  });

  describe("parseOpenFoodFactsProduct", () => {
    it("parseert een compleet Nederlands product succesvol", () => {
      const rawApiProduct = {
        code: "8710400012345",
        product_name_nl: "Griekse Stijl Yoghurt",
        product_name: "Greek Style Yogurt",
        brands: "Campina, FrieslandCampina",
        categories_tags: ["en:dairies", "en:fermented-foods", "en:yogurts"],
        serving_quantity: 150,
        nutriments: {
          "energy-kcal_100g": 115,
          proteins_100g: 7.5,
          carbohydrates_100g: 4.2,
          fat_100g: 7.8,
          fiber_100g: 0,
        },
      };

      const parsed = parseOpenFoodFactsProduct(rawApiProduct);
      expect(parsed).not.toBeNull();
      expect(parsed?.barcode).toBe("8710400012345");
      expect(parsed?.name).toBe("Griekse Stijl Yoghurt");
      expect(parsed?.brand).toBe("Campina");
      expect(parsed?.category).toBe("zuivel");
      expect(parsed?.caloriesPer100g).toBe(115);
      expect(parsed?.proteinGramsPer100g).toBe(7.5);
      expect(parsed?.carbsGramsPer100g).toBe(4.2);
      expect(parsed?.fatGramsPer100g).toBe(7.8);
      expect(parsed?.fiberGramsPer100g).toBe(0);
      expect(parsed?.defaultPortionGrams).toBe(150);
      expect(parsed?.source).toBe("openfoodfacts");
    });

    it("converteert kJ naar kcal indien energy-kcal_100g ontbreekt", () => {
      const rawApiProduct = {
        code: "5411188110835",
        product_name: "Amandelmelk Ongezoet",
        brands: "Alpro",
        categories_tags: ["en:plant-based-beverages", "en:almond-milks"],
        serving_size: "200 ml",
        nutriments: {
          energy_100g: 58, // in kJ
          proteins_100g: 0.4,
          carbohydrates_100g: 0.2,
          fat_100g: 1.1,
          fiber_100g: 0.3,
        },
      };

      const parsed = parseOpenFoodFactsProduct(rawApiProduct);
      expect(parsed).not.toBeNull();
      // 58 kJ / 4.184 = 13.86 kcal -> afgerond 14 kcal
      expect(parsed?.caloriesPer100g).toBe(14);
      expect(parsed?.defaultPortionGrams).toBe(200);
      expect(parsed?.category).toBe("dranken");
    });

    it("retourneert null bij lege of ongeldige productgegevens", () => {
      expect(parseOpenFoodFactsProduct(null)).toBeNull();
      expect(parseOpenFoodFactsProduct({})).toBeNull();
      expect(parseOpenFoodFactsProduct({ product_name: "" })).toBeNull();
    });
  });

  describe("convertExternalToFoodItem", () => {
    it("converteert parsed product naar correct FoodItem formaat met external provenance", () => {
      const parsed = {
        barcode: "8712345678901",
        name: "Pindakaas 100% Noten",
        brand: "Calvé",
        category: "noten_zaden" as const,
        caloriesPer100g: 630,
        proteinGramsPer100g: 26,
        carbsGramsPer100g: 11,
        fatGramsPer100g: 52,
        fiberGramsPer100g: 8.5,
        defaultPortionGrams: 30,
        source: "openfoodfacts" as const,
      };

      const foodItem = convertExternalToFoodItem(parsed);
      expect(foodItem.name).toBe("Pindakaas 100% Noten");
      expect(foodItem.brand).toBe("Calvé");
      expect(foodItem.category).toBe("noten_zaden");
      expect(foodItem.barcode).toBe("8712345678901");
      expect(foodItem.caloriesPer100g).toBe(630);
      expect(foodItem.isCustom).toBe(true);
      expect(foodItem.provenance).toEqual({ source: "external" });
    });
  });

  describe("fetchProductByBarcode met mock fetch", () => {
    it("negeert ongeldige barcodes zonder netwerkaanroep", async () => {
      const mockFetch = vi.fn();
      const res = await fetchProductByBarcode("abc", { fetchFn: mockFetch });
      expect(res).toBeNull();
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("haalt product succesvol op bij status 1", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            code: "8710400012345",
            product_name: "Magere Kwark",
            nutriments: {
              "energy-kcal_100g": 52,
              proteins_100g: 9.8,
              carbohydrates_100g: 3.5,
              fat_100g: 0.1,
            },
          },
        }),
      });

      const res = await fetchProductByBarcode("8710400012345", { fetchFn: mockFetch });
      expect(res).not.toBeNull();
      expect(res?.name).toBe("Magere Kwark");
      expect(res?.proteinGramsPer100g).toBe(9.8);
    });

    it("geeft null terug als status 0 is (niet gevonden)", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 0,
          status_verbose: "product not found",
        }),
      });

      const res = await fetchProductByBarcode("9999999999999", { fetchFn: mockFetch });
      expect(res).toBeNull();
    });
  });

  describe("searchOpenFoodFacts met mock fetch", () => {
    it("zoekt producten op basis van een tekststring", async () => {
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          products: [
            {
              code: "11111111",
              product_name: "Havervlokken Bio",
              nutriments: { "energy-kcal_100g": 365, proteins_100g: 13 },
            },
            {
              code: "22222222",
              product_name: "Havermout Fijn",
              nutriments: { "energy-kcal_100g": 370, proteins_100g: 12 },
            },
          ],
        }),
      });

      const results = await searchOpenFoodFacts("haver", { fetchFn: mockFetch });
      expect(results.length).toBe(2);
      expect(results[0].name).toBe("Havervlokken Bio");
      expect(results[1].name).toBe("Havermout Fijn");
    });

    it("geeft een lege array terug bij een lege zoekopdracht", async () => {
      const mockFetch = vi.fn();
      const results = await searchOpenFoodFacts("   ", { fetchFn: mockFetch });
      expect(results).toEqual([]);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe("getMockOpenFoodFactsProducts", () => {
    it("levert realistische Nederlandse mock-producten met geldige barcodes", () => {
      const mocks = getMockOpenFoodFactsProducts();
      expect(mocks.length).toBeGreaterThanOrEqual(4);

      mocks.forEach((m) => {
        expect(m.barcode).toMatch(/^\d{13}$/);
        expect(m.name.length).toBeGreaterThan(0);
        expect(m.caloriesPer100g).toBeGreaterThan(0);
        expect(m.source).toBe("openfoodfacts");
      });
    });
  });

  describe("fetchProductWithLocalCache", () => {
    it("geeft direct het lokale product terug indien aanwezig in de cache (100% offline)", async () => {
      const mockLocalGet = vi.fn().mockResolvedValue({
        id: "local-food-1",
        name: "Gecachte Kwark",
        barcode: "8710400012345",
        caloriesPer100g: 65,
        proteinGramsPer100g: 11,
      });

      const mockFetch = vi.fn();
      const result = await fetchProductWithLocalCache("8710400012345", mockLocalGet, {
        fetchFn: mockFetch,
      });

      expect(result.isFromLocalCache).toBe(true);
      expect(result.product).toBeDefined();
      expect((result.product as any).name).toBe("Gecachte Kwark");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("haalt product extern op indien niet aanwezig in de lokale cache", async () => {
      const mockLocalGet = vi.fn().mockResolvedValue(undefined);
      const mockFetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          status: 1,
          product: {
            code: "8710400012345",
            product_name: "Verse Zuivel Online",
            nutriments: { "energy-kcal_100g": 50, proteins_100g: 4 },
          },
        }),
      });

      const result = await fetchProductWithLocalCache("8710400012345", mockLocalGet, {
        fetchFn: mockFetch,
      });

      expect(result.isFromLocalCache).toBe(false);
      expect(result.product).toBeDefined();
      expect(result.product?.name).toBe("Verse Zuivel Online");
      expect(mockFetch).toHaveBeenCalled();
    });
  });
});
