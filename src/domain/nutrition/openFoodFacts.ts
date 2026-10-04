import type { FoodItem, FoodCategory } from "@/types/database";

export interface ParsedExternalFood {
  barcode: string;
  name: string;
  brand: string | null;
  category: FoodCategory;
  caloriesPer100g: number;
  proteinGramsPer100g: number;
  carbsGramsPer100g: number;
  fatGramsPer100g: number;
  fiberGramsPer100g: number;
  defaultPortionGrams: number;
  imageUrl?: string | null;
  source: "openfoodfacts";
}

export interface FetchOptions {
  fetchFn?: typeof fetch;
  timeoutMs?: number;
  signal?: AbortSignal;
}

/**
 * Mapt Open Food Facts category-tags (Engels/Frans/NL) naar onze canonieke FoodCategory.
 */
export function mapOpenFoodFactsCategory(tags?: string[]): FoodCategory {
  if (!tags || tags.length === 0) return "overig";

  const lower = tags.map((t) => t.toLowerCase());

  const matches = (keywords: string[]) =>
    lower.some((tag) => keywords.some((k) => tag.includes(k)));

  if (matches(["beverage", "drink", "boisson", "water", "eau", "juice", "jus", "tea", "thé", "coffee", "drank", "koffie", "soda"])) {
    if (!matches(["cheese", "fromage", "kwark", "yaourt", "yogurt", "butter"])) {
      return "dranken";
    }
  }
  if (matches(["dairy", "lait", "milk", "cheese", "fromage", "yogurt", "yaourt", "zuivel", "kwark"])) {
    return "zuivel";
  }
  if (matches(["meat", "viande", "beef", "chicken", "poulet", "fish", "poisson", "egg", "oeuf", "vlees", "vis"])) {
    return "vlees_vis_ei";
  }
  if (matches(["fruit", "vegetable", "legume", "salad", "groente"])) {
    return "groente_fruit";
  }
  if (matches(["bread", "pain", "cereal", "grain", "pasta", "pate", "rice", "riz", "haver", "brood"])) {
    return "granen_brood";
  }
  if (matches(["nut", "noix", "seed", "graine", "almond", "amande", "noten", "zaden", "pinda"])) {
    return "noten_zaden";
  }
  if (matches(["bean", "lentil", "chickpea", "peulvrucht", "linze", "boon"])) {
    return "peulvruchten";
  }
  if (matches(["oil", "huile", "fat", "sauce", "dressing", "boter", "olie"])) {
    return "oliën_sauzen";
  }
  if (matches(["supplement", "vitamin", "protein", "whey", "sport"])) {
    return "supplementen";
  }
  if (matches(["snack", "biscuit", "cookie", "chocolate", "chocolat", "candy", "bonbon", "chips", "zoet", "snoep"])) {
    return "snacks_zoet";
  }

  return "overig";
}

/**
 * Parseert een Open Food Facts product JSON-object naar een ParsedExternalFood record.
 */
export function parseOpenFoodFactsProduct(data: any): ParsedExternalFood | null {
  if (!data || typeof data !== "object") return null;

  const rawName =
    data.product_name_nl ||
    data.product_name ||
    data.generic_name_nl ||
    data.generic_name ||
    "";

  const cleanName = typeof rawName === "string" ? rawName.trim() : "";
  if (!cleanName) return null;

  const rawBrand = data.brands || null;
  const brand =
    typeof rawBrand === "string" && rawBrand.trim().length > 0
      ? rawBrand.split(",")[0].trim()
      : null;

  const barcode = String(data.code || data._id || "").trim();

  // Nutriënten extractie
  const n = data.nutriments || {};

  // Calorieën: voorkeur voor kcal; fallback naar kJ / 4.184
  let cal = parseFloat(n["energy-kcal_100g"] ?? n["energy-kcal"] ?? n["energy-kcal_value"]);
  if (isNaN(cal) || cal <= 0) {
    const kj = parseFloat(n["energy_100g"] ?? n["energy"] ?? n["energy-kj_100g"] ?? n["energy-kj"]);
    if (!isNaN(kj) && kj > 0) {
      cal = Math.round(kj / 4.184);
    } else {
      cal = 0;
    }
  }

  const pro = parseFloat(n["proteins_100g"] ?? n["proteins"] ?? 0) || 0;
  const carb = parseFloat(n["carbohydrates_100g"] ?? n["carbohydrates"] ?? 0) || 0;
  const fat = parseFloat(n["fat_100g"] ?? n["fat"] ?? 0) || 0;
  const fib = parseFloat(n["fiber_100g"] ?? n["fiber"] ?? 0) || 0;

  // Portiegrootte schatten
  let portion = 100;
  if (typeof data.serving_quantity === "number" && data.serving_quantity > 0) {
    portion = Math.round(data.serving_quantity);
  } else if (typeof data.serving_size === "string") {
    const match = data.serving_size.match(/(\d+(?:[.,]\d+)?)\s*(?:g|gram|ml)/i);
    if (match) {
      const parsedG = parseFloat(match[1].replace(",", "."));
      if (!isNaN(parsedG) && parsedG > 0) {
        portion = Math.round(parsedG);
      }
    }
  }

  const category = mapOpenFoodFactsCategory(data.categories_tags);
  const imageUrl = data.image_front_small_url || data.image_url || null;

  return {
    barcode,
    name: cleanName,
    brand,
    category,
    caloriesPer100g: Math.round(Math.max(0, cal)),
    proteinGramsPer100g: Math.round(Math.max(0, pro) * 10) / 10,
    carbsGramsPer100g: Math.round(Math.max(0, carb) * 10) / 10,
    fatGramsPer100g: Math.round(Math.max(0, fat) * 10) / 10,
    fiberGramsPer100g: Math.round(Math.max(0, fib) * 10) / 10,
    defaultPortionGrams: Math.max(1, portion),
    imageUrl,
    source: "openfoodfacts",
  };
}

/**
 * Converteert een ParsedExternalFood naar een nieuw FoodItem record voor lokale opslag.
 */
export function convertExternalToFoodItem(
  parsed: ParsedExternalFood
): Omit<FoodItem, "id" | "createdAt"> {
  return {
    name: parsed.name,
    brand: parsed.brand,
    category: parsed.category,
    barcode: parsed.barcode || null,
    caloriesPer100g: parsed.caloriesPer100g,
    proteinGramsPer100g: parsed.proteinGramsPer100g,
    carbsGramsPer100g: parsed.carbsGramsPer100g,
    fatGramsPer100g: parsed.fatGramsPer100g,
    fiberGramsPer100g: parsed.fiberGramsPer100g,
    defaultPortionGrams: parsed.defaultPortionGrams || 100,
    isCustom: true,
    isFavorite: false,
    provenance: { source: "external" },
  };
}

/**
 * Zoekt een specifiek product op via de Open Food Facts API op basis van streepjescode (EAN-13, EAN-8, UPC).
 */
export async function fetchProductByBarcode(
  barcode: string,
  options: FetchOptions = {}
): Promise<ParsedExternalFood | null> {
  const cleanBarcode = barcode.trim();
  if (!cleanBarcode || !/^\d{6,14}$/.test(cleanBarcode)) {
    return null;
  }

  const fetcher = options.fetchFn || (typeof window !== "undefined" ? window.fetch.bind(window) : fetch);
  const timeoutMs = options.timeoutMs ?? 6000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(
      cleanBarcode
    )}.json?fields=code,product_name,product_name_nl,generic_name,generic_name_nl,brands,nutriments,categories_tags,serving_quantity,serving_size,image_front_small_url`;

    const res = await fetcher(url, {
      signal: options.signal || controller.signal,
      headers: {
        "User-Agent": "SportKompas - FitnessApp - Android/iOS/Web",
      },
    });

    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Open Food Facts API fout: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (json.status === 1 && json.product) {
      return parseOpenFoodFactsProduct(json.product);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Zoekt producten op Open Food Facts op basis van een tekstuele zoekterm.
 */
export async function searchOpenFoodFacts(
  query: string,
  options: FetchOptions & { limit?: number } = {}
): Promise<ParsedExternalFood[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return [];

  const fetcher = options.fetchFn || (typeof window !== "undefined" ? window.fetch.bind(window) : fetch);
  const limit = options.limit || 15;
  const timeoutMs = options.timeoutMs ?? 6000;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const url = `https://nl.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
      cleanQuery
    )}&search_simple=1&action=process&json=1&page_size=${limit}&fields=code,product_name,product_name_nl,generic_name,generic_name_nl,brands,nutriments,categories_tags,serving_quantity,serving_size,image_front_small_url`;

    const res = await fetcher(url, {
      signal: options.signal || controller.signal,
      headers: {
        "User-Agent": "SportKompas - FitnessApp - Android/iOS/Web",
      },
    });

    if (!res.ok) {
      throw new Error(`Open Food Facts zoekfout: HTTP ${res.status}`);
    }

    const json = await res.json();
    if (!json || !Array.isArray(json.products)) {
      return [];
    }

    const results: ParsedExternalFood[] = [];
    for (const prod of json.products) {
      const parsed = parseOpenFoodFactsProduct(prod);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  } finally {
    clearTimeout(timeoutId);
  }
}
